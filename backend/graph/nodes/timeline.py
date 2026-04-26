"""Timeline node: generates phased timeline and validation criteria."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from graph.nodes.feedback_retrieval import format_feedback_for_prompt
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import TIMELINE_SYSTEM
from lib.json_utils import extract_json, normalize_timeline
from lib.retry import invoke_with_retry
from schemas.timeline import Timeline
from schemas.validation import Validation

MAX_RETRIES = 3


async def timeline_node(state: AgentState) -> dict:
    start = time.time()
    hypothesis = state["hypothesis"]
    protocol = state.get("protocol")
    materials = state.get("materials", [])
    budget = state.get("budget")
    prior_feedback = state.get("prior_feedback", [])

    feedback_context = format_feedback_for_prompt(prior_feedback) if prior_feedback else ""
    system_prompt = TIMELINE_SYSTEM.format(feedback_context=feedback_context)

    protocol_summary = ""
    if protocol:
        protocol_summary = f"Protocol: {protocol.title}\nSteps: {len(protocol.steps)}\nEstimated time: {protocol.estimated_total_time}\n"
        for s in protocol.steps:
            protocol_summary += f"  Step {s.step_number}: {s.title} ({s.duration})\n"

    materials_summary = f"Materials: {len(materials)} items\n"
    budget_summary = ""
    if budget:
        budget_summary = f"Budget total: {budget.summary.total_estimate}\n"

    user_msg = (
        f"HYPOTHESIS:\n{hypothesis}\n\n"
        f"{protocol_summary}\n"
        f"{materials_summary}\n"
        f"{budget_summary}\n"
        "Generate a realistic phased timeline and validation criteria.\n"
        "Return JSON with keys: timeline (object with total_duration and phases), validation"
    )

    llm = get_llm("timeline", temperature=0.3)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 2 else get_fallback_llm("timeline", temperature=0.3)

            if last_error:
                messages.append(HumanMessage(
                    content=f"Previous response had error: {last_error}\nFix and return valid JSON."
                ))

            raw_content = await invoke_with_retry(current_llm, messages, max_retries=3, initial_delay=5.0)
            content = extract_json(raw_content)
            parsed = json.loads(content)
            parsed = normalize_timeline(parsed)

            timeline_data = parsed.get("timeline", parsed)
            validation_data = parsed.get("validation", {})

            timeline = Timeline(**timeline_data) if isinstance(timeline_data, dict) else Timeline(**parsed)
            validation = Validation(**validation_data) if validation_data else None

            duration = time.time() - start
            print(f"[Timeline] {len(timeline.phases)} phases, total: {timeline.total_duration} in {duration:.1f}s")

            return {
                "timeline": timeline,
                "validation": validation,
                "current_stage": "timeline_complete",
                "stage_durations": {**state.get("stage_durations", {}), "timeline": duration},
            }

        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            print(f"[Timeline] Attempt {attempt + 1} JSON error: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"[Timeline] Attempt {attempt + 1} error: {e}")

    duration = time.time() - start
    return {
        "errors": state.get("errors", []) + [f"Timeline generation failed: {last_error}"],
        "current_stage": "timeline_failed",
        "stage_durations": {**state.get("stage_durations", {}), "timeline": duration},
    }
