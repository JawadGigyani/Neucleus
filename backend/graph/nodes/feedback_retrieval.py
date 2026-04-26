"""Feedback retrieval node: queries SQLite for prior expert corrections."""

import time
from graph.state import AgentState
from db.feedback_store import get_relevant_feedback


def format_feedback_for_prompt(feedback_entries: list[dict]) -> str:
    if not feedback_entries:
        return ""

    lines = [
        "PRIOR EXPERT CORRECTIONS (from reviews of similar experiments):",
        "Apply these corrections where directly relevant. Mark applied corrections with [FEEDBACK_APPLIED] tag.",
        "",
    ]

    for entry in feedback_entries:
        for section, data in entry.get("sections", {}).items():
            rating = data.get("rating", "?")
            lines.append(f"[{section.title()} - from \"{entry['experiment_type']}\" review, rated {rating}/5]")
            for correction in data.get("corrections", []):
                old = correction.get("original_value", "")
                new = correction.get("corrected_value", "")
                reason = correction.get("reason", "")
                lines.append(f"- Changed: \"{old}\" → \"{new}\". Reason: \"{reason}\"")
            if data.get("annotations"):
                lines.append(f"- Expert note: {data['annotations']}")
            lines.append("")

    return "\n".join(lines)


async def feedback_retrieval_node(state: AgentState) -> dict:
    start = time.time()

    parsed = state.get("parsed_hypothesis")
    if not parsed:
        return {
            "prior_feedback": [],
            "current_stage": "feedback_retrieval_complete",
            "stage_durations": {**state.get("stage_durations", {}), "feedback_retrieval": time.time() - start},
        }

    domain = parsed.domain
    key_terms = parsed.key_terms

    try:
        feedback_entries = await get_relevant_feedback(domain, key_terms, limit=3)
        duration = time.time() - start

        if feedback_entries:
            print(f"[FeedbackRetrieval] Found {len(feedback_entries)} relevant feedback entries in {duration:.1f}s")
        else:
            print(f"[FeedbackRetrieval] No prior feedback found for domain '{domain}'")

        return {
            "prior_feedback": feedback_entries,
            "current_stage": "feedback_retrieval_complete",
            "stage_durations": {**state.get("stage_durations", {}), "feedback_retrieval": duration},
        }

    except Exception as e:
        print(f"[FeedbackRetrieval] Error: {e}")
        return {
            "prior_feedback": [],
            "current_stage": "feedback_retrieval_complete",
            "stage_durations": {**state.get("stage_durations", {}), "feedback_retrieval": time.time() - start},
        }
