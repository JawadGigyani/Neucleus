"""Verify protocol node: checks each step against source context for grounding."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import VERIFY_PROTOCOL_SYSTEM
from lib.json_utils import extract_json
from schemas.protocol import GroundingScore

MAX_RETRIES = 2


async def verify_protocol_node(state: AgentState) -> dict:
    start = time.time()
    protocol = state.get("protocol")
    context_text = state.get("compressed_context_text", "")

    if not protocol:
        return {
            "protocol_grounding": [],
            "current_stage": "verify_protocol_complete",
            "stage_durations": {**state.get("stage_durations", {}), "verify_protocol": time.time() - start},
        }

    steps_text = ""
    for step in protocol.steps:
        steps_text += (
            f"Step {step.step_number}: {step.title}\n"
            f"  Description: {step.description}\n"
            f"  Source cited: {step.source}\n\n"
        )

    user_msg = (
        f"PROTOCOL STEPS:\n{steps_text}\n"
        f"SOURCE CONTEXT:\n{context_text}\n\n"
        "Verify each step. Return a JSON array of grounding assessments."
    )

    llm = get_llm("verify_protocol", temperature=0.1)
    messages = [
        SystemMessage(content=VERIFY_PROTOCOL_SYSTEM),
        HumanMessage(content=user_msg),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 1 else get_fallback_llm("verify_protocol", temperature=0.1)

            response = await current_llm.ainvoke(messages)
            content = extract_json(response.content)
            parsed = json.loads(content)
            if not isinstance(parsed, list):
                parsed = parsed.get("grounding_scores", parsed.get("scores", [parsed]))

            results = [GroundingScore(**item) for item in parsed]

            duration = time.time() - start
            high = sum(1 for r in results if r.grounding_score == "HIGH")
            print(f"[VerifyProtocol] {high}/{len(results)} steps HIGH grounding in {duration:.1f}s")

            return {
                "protocol_grounding": results,
                "current_stage": "verify_protocol_complete",
                "stage_durations": {**state.get("stage_durations", {}), "verify_protocol": duration},
            }

        except Exception as e:
            last_error = str(e)
            print(f"[VerifyProtocol] Attempt {attempt + 1} error: {e}")

    # Fallback: assign MEDIUM to all steps
    duration = time.time() - start
    fallback_scores = [
        GroundingScore(
            step_number=step.step_number,
            grounding_score="MEDIUM",
            matched_source=None,
            unverified_claims=["Verification failed — manual review required"],
        )
        for step in protocol.steps
    ]
    return {
        "protocol_grounding": fallback_scores,
        "errors": state.get("errors", []) + [f"Protocol verification failed: {last_error}"],
        "current_stage": "verify_protocol_complete",
        "stage_durations": {**state.get("stage_durations", {}), "verify_protocol": duration},
    }
