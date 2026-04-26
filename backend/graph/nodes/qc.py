"""QC node: compresses search results and classifies novelty."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import QC_SYSTEM
from lib.json_utils import extract_json, normalize_novelty
from lib.retry import invoke_with_retry
from schemas.novelty import QCOutput, CompressedContext, NoveltyClassification, NoveltySignal, NoveltyReference

MAX_RETRIES = 3


def format_search_results_for_context(state: AgentState) -> str:
    results = state.get("raw_search_results", [])
    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}] {r.title}")
        lines.append(f"    Source: {r.source} | URL: {r.url}")
        if r.authors:
            lines.append(f"    Authors: {r.authors}")
        if r.year:
            lines.append(f"    Year: {r.year}")
        if r.journal:
            lines.append(f"    Journal: {r.journal}")
        if r.cited_by_count:
            lines.append(f"    Citations: {r.cited_by_count}")
        lines.append(f"    Snippet: {r.snippet[:300]}")
        lines.append("")
    return "\n".join(lines)


async def qc_node(state: AgentState) -> dict:
    start = time.time()
    hypothesis = state["hypothesis"]
    results_text = format_search_results_for_context(state)
    result_count = len(state.get("raw_search_results", []))

    llm = get_llm("qc", temperature=0.2)
    user_msg = (
        f"HYPOTHESIS:\n{hypothesis}\n\n"
        f"SEARCH RESULTS ({result_count} items):\n{results_text}\n\n"
        "Perform TASK 1 (context compression) and TASK 2 (novelty classification).\n"
        "Return a single JSON object with keys: compressed_context, novelty"
    )

    messages = [
        SystemMessage(content=QC_SYSTEM),
        HumanMessage(content=user_msg),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 2 else get_fallback_llm("qc", temperature=0.2)

            if last_error:
                messages.append(HumanMessage(
                    content=f"Previous response had error: {last_error}\nReturn valid JSON with keys: compressed_context, novelty"
                ))

            raw_content = await invoke_with_retry(current_llm, messages, max_retries=3, initial_delay=5.0)
            content = extract_json(raw_content)
            parsed = json.loads(content)
            parsed = normalize_novelty(parsed)
            result = QCOutput(**parsed)

            # Build compressed context text for downstream nodes
            ctx = result.compressed_context
            context_text_parts = []
            for section_name, items in [
                ("Academic Literature", ctx.academic_literature),
                ("Protocols and Methods", ctx.protocols_and_methods),
                ("Product and Reagent Information", ctx.product_and_reagent_info),
            ]:
                if items:
                    context_text_parts.append(f"## {section_name}")
                    for item in items:
                        context_text_parts.append(f"- {item}")
                    context_text_parts.append("")

            compressed_text = "\n".join(context_text_parts)

            duration = time.time() - start
            print(f"[QC] Novelty: {result.novelty.novelty_signal.value}, {len(result.novelty.references)} refs, {duration:.1f}s")

            return {
                "compressed_context": result.compressed_context,
                "compressed_context_text": compressed_text,
                "novelty": result.novelty,
                "current_stage": "qc_complete",
                "stage_durations": {**state.get("stage_durations", {}), "qc": duration},
            }

        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            print(f"[QC] Attempt {attempt + 1} JSON error: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"[QC] Attempt {attempt + 1} error: {e}")

    # Fallback: minimal novelty result
    duration = time.time() - start
    print(f"[QC] All attempts failed, using fallback. Last error: {last_error}")
    return {
        "compressed_context": CompressedContext(),
        "compressed_context_text": "",
        "novelty": NoveltyClassification(
            novelty_signal=NoveltySignal.NOT_FOUND,
            references=[NoveltyReference(
                title="Classification failed",
                url="",
                relevance="QC node failed after all retries",
                source="fallback",
            )],
            reasoning=f"QC classification failed after {MAX_RETRIES} attempts. Error: {last_error}",
        ),
        "errors": state.get("errors", []) + [f"QC failed: {last_error}"],
        "current_stage": "qc_failed",
        "stage_durations": {**state.get("stage_durations", {}), "qc": duration},
    }
