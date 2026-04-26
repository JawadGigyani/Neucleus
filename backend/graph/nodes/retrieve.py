"""Retrieve node: parallel API calls to academic databases and web search."""

import time
import asyncio
from graph.state import AgentState
from schemas.search import SearchResult
from lib.openalex import search_openalex
from lib.crossref import search_crossref
from lib.tavily_client import search_tavily_batch


async def retrieve_node(state: AgentState) -> dict:
    start = time.time()
    queries = state.get("search_queries")
    if not queries:
        return {
            "errors": state.get("errors", []) + ["No search queries available"],
            "current_stage": "retrieve_failed",
            "stage_durations": {**state.get("stage_durations", {}), "retrieve": time.time() - start},
        }

    academic_q = queries.academic_queries
    protocol_q = queries.protocol_queries
    supplier_q = queries.supplier_queries
    reference_q = queries.reference_queries

    primary_academic = academic_q[0] if academic_q else state.get("hypothesis", "")

    openalex_task = search_openalex(primary_academic, per_page=10)
    crossref_task = search_crossref(primary_academic, rows=5)

    all_tavily_queries = protocol_q + supplier_q + reference_q
    if len(academic_q) > 1:
        all_tavily_queries += academic_q[1:3]
    tavily_task = search_tavily_batch(all_tavily_queries, max_results=5)

    results = await asyncio.gather(
        openalex_task,
        crossref_task,
        tavily_task,
        return_exceptions=True,
    )

    all_results: list[SearchResult] = []
    seen_titles: set[str] = set()

    for result_or_err in results:
        if isinstance(result_or_err, Exception):
            print(f"[Retrieve] Source error: {result_or_err}")
            continue
        for r in result_or_err:
            title_key = r.title.lower().strip()[:80]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                all_results.append(r)

    if not all_results:
        return {
            "raw_search_results": [],
            "errors": state.get("errors", []) + ["ALL retrieval sources failed — no results"],
            "current_stage": "retrieve_failed",
            "stage_durations": {**state.get("stage_durations", {}), "retrieve": time.time() - start},
        }

    duration = time.time() - start
    print(f"[Retrieve] Got {len(all_results)} unique results in {duration:.1f}s")

    return {
        "raw_search_results": all_results,
        "current_stage": "retrieve_complete",
        "stage_durations": {**state.get("stage_durations", {}), "retrieve": duration},
    }
