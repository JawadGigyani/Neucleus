"""Materials node: generates materials list, equipment, and budget."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from graph.nodes.feedback_retrieval import format_feedback_for_prompt
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import MATERIALS_SYSTEM
from lib.json_utils import extract_json, normalize_materials
from lib.retry import invoke_with_retry
from schemas.materials import MaterialsOutput

MAX_RETRIES = 3


async def materials_node(state: AgentState) -> dict:
    start = time.time()
    hypothesis = state["hypothesis"]
    parsed = state.get("parsed_hypothesis")
    context_text = state.get("compressed_context_text", "")
    protocol = state.get("protocol")
    prior_feedback = state.get("prior_feedback", [])

    feedback_context = format_feedback_for_prompt(prior_feedback) if prior_feedback else ""
    system_prompt = MATERIALS_SYSTEM.format(feedback_context=feedback_context)

    protocol_text = ""
    if protocol:
        for step in protocol.steps:
            protocol_text += f"Step {step.step_number}: {step.title} — {step.description[:200]}\n"

    parsed_info = ""
    if parsed:
        parsed_info = f"Domain: {parsed.domain}, Model: {parsed.model_system}, Intervention: {parsed.intervention}"

    user_msg = (
        f"HYPOTHESIS:\n{hypothesis}\n\n"
        f"PARSED: {parsed_info}\n\n"
        f"PROTOCOL STEPS:\n{protocol_text}\n\n"
        f"RESEARCH CONTEXT:\n{context_text}\n\n"
        "Generate a complete materials list, equipment list, and budget.\n"
        "Return JSON with keys: materials, equipment, budget"
    )

    llm = get_llm("materials", temperature=0.3)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 2 else get_fallback_llm("materials", temperature=0.3)

            if last_error:
                messages.append(HumanMessage(
                    content=f"Previous response had error: {last_error}\nFix and return valid JSON."
                ))

            raw_content = await invoke_with_retry(current_llm, messages, max_retries=3, initial_delay=5.0)
            content = extract_json(raw_content)
            parsed_json = json.loads(content)
            parsed_json = normalize_materials(parsed_json)
            result = MaterialsOutput(**parsed_json)

            duration = time.time() - start
            print(f"[Materials] {len(result.materials)} items, {len(result.equipment)} equipment in {duration:.1f}s")

            return {
                "materials": result.materials,
                "equipment": result.equipment,
                "budget": result.budget,
                "current_stage": "materials_complete",
                "stage_durations": {**state.get("stage_durations", {}), "materials": duration},
            }

        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            print(f"[Materials] Attempt {attempt + 1} JSON error: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"[Materials] Attempt {attempt + 1} error: {e}")

    duration = time.time() - start
    return {
        "errors": state.get("errors", []) + [f"Materials generation failed: {last_error}"],
        "current_stage": "materials_failed",
        "stage_durations": {**state.get("stage_durations", {}), "materials": duration},
    }
