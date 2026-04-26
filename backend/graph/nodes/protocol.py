"""Protocol node: generates detailed experiment protocol using DeepSeek V3.2."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from graph.nodes.feedback_retrieval import format_feedback_for_prompt
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import PROTOCOL_SYSTEM
from lib.json_utils import extract_json, normalize_protocol
from lib.retry import invoke_with_retry
from schemas.protocol import Protocol

MAX_RETRIES = 3


async def protocol_node(state: AgentState) -> dict:
    start = time.time()
    hypothesis = state["hypothesis"]
    parsed = state.get("parsed_hypothesis")
    context_text = state.get("compressed_context_text", "")
    novelty = state.get("novelty")
    prior_feedback = state.get("prior_feedback", [])

    feedback_context = format_feedback_for_prompt(prior_feedback) if prior_feedback else ""
    system_prompt = PROTOCOL_SYSTEM.format(feedback_context=feedback_context)

    parsed_info = ""
    if parsed:
        parsed_info = (
            f"\nExtracted entities:\n"
            f"- Intervention: {parsed.intervention}\n"
            f"- Outcome: {parsed.outcome}\n"
            f"- Mechanism: {parsed.mechanism}\n"
            f"- Model system: {parsed.model_system}\n"
            f"- Control: {parsed.control}\n"
            f"- Threshold: {parsed.threshold}\n"
        )

    novelty_info = ""
    if novelty:
        novelty_info = f"\nNovelty signal: {novelty.novelty_signal.value}\n"
        for ref in novelty.references:
            novelty_info += f"- Related work: {ref.title} ({ref.year}) — {ref.relevance}\n"

    user_msg = (
        f"HYPOTHESIS:\n{hypothesis}\n"
        f"{parsed_info}\n"
        f"{novelty_info}\n"
        f"RESEARCH CONTEXT:\n{context_text}\n\n"
        "Generate a complete, detailed, executable experiment protocol.\n"
        "Return JSON with keys: title, objective, overview, steps, estimated_total_time, safety_considerations, protocol_references, uncertainties"
    )

    llm = get_llm("protocol", temperature=0.3)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 2 else get_fallback_llm("protocol", temperature=0.3)

            if last_error:
                messages.append(HumanMessage(
                    content=f"Previous response had error: {last_error}\nFix and return valid JSON."
                ))

            raw_content = await invoke_with_retry(current_llm, messages, max_retries=3, initial_delay=5.0)
            content = extract_json(raw_content)
            parsed_json = json.loads(content)
            parsed_json = normalize_protocol(parsed_json)
            result = Protocol(**parsed_json)

            duration = time.time() - start
            print(f"[Protocol] Generated {len(result.steps)} steps in {duration:.1f}s")

            return {
                "protocol": result,
                "current_stage": "protocol_complete",
                "stage_durations": {**state.get("stage_durations", {}), "protocol": duration},
            }

        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            print(f"[Protocol] Attempt {attempt + 1} JSON error: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"[Protocol] Attempt {attempt + 1} error: {e}")

    duration = time.time() - start
    return {
        "errors": state.get("errors", []) + [f"Protocol generation failed: {last_error}"],
        "current_stage": "protocol_failed",
        "stage_durations": {**state.get("stage_durations", {}), "protocol": duration},
    }
