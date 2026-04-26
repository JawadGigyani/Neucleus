"""Parse node: extracts structured entities and generates search queries from a hypothesis."""

import time
import json
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from lib.llm import get_llm, get_fallback_llm
from lib.prompts import PARSE_SYSTEM
from lib.json_utils import extract_json
from schemas.hypothesis import ParseOutput


MAX_RETRIES = 3


async def parse_node(state: AgentState) -> dict:
    start = time.time()
    hypothesis = state["hypothesis"]

    llm = get_llm("parse", temperature=0.1)
    messages = [
        SystemMessage(content=PARSE_SYSTEM),
        HumanMessage(content=f"Parse this scientific hypothesis and generate search queries:\n\n{hypothesis}"),
    ]

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            current_llm = llm if attempt < 2 else get_fallback_llm("parse", temperature=0.1)

            if last_error:
                messages.append(HumanMessage(
                    content=f"Your previous response had a validation error: {last_error}\nPlease fix and return valid JSON."
                ))

            response = await current_llm.ainvoke(messages)
            content = extract_json(response.content)
            parsed = json.loads(content)
            result = ParseOutput(**parsed)

            duration = time.time() - start
            return {
                "parsed_hypothesis": result.parsed_hypothesis,
                "search_queries": result.search_queries,
                "current_stage": "parse_complete",
                "stage_durations": {**state.get("stage_durations", {}), "parse": duration},
            }

        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            print(f"[Parse] Attempt {attempt + 1} JSON error: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"[Parse] Attempt {attempt + 1} error: {e}")

    duration = time.time() - start
    return {
        "errors": state.get("errors", []) + [f"Parse failed after {MAX_RETRIES} attempts: {last_error}"],
        "current_stage": "parse_failed",
        "stage_durations": {**state.get("stage_durations", {}), "parse": duration},
    }
