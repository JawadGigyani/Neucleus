"""Tavily Search API client with parallel execution."""

import os
import asyncio
import httpx
from schemas.search import SearchResult

TAVILY_ENDPOINT = "https://api.tavily.com/search"


async def search_tavily(query: str, max_results: int = 5) -> list[SearchResult]:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return []

    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": "advanced",
        "include_answer": False,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(TAVILY_ENDPOINT, json=payload)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for r in data.get("results", []):
            results.append(SearchResult(
                title=r.get("title", ""),
                url=r.get("url", ""),
                snippet=r.get("content", r.get("snippet", "")),
                source="Tavily",
                score=r.get("score"),
            ))
        return results

    except Exception as e:
        print(f"[Tavily] Error for query '{query[:50]}...': {e}")
        return []


async def search_tavily_batch(queries: list[str], max_results: int = 5) -> list[SearchResult]:
    tasks = [search_tavily(q, max_results) for q in queries]
    results_lists = await asyncio.gather(*tasks, return_exceptions=True)

    all_results: list[SearchResult] = []
    seen_urls: set[str] = set()

    for result_or_err in results_lists:
        if isinstance(result_or_err, Exception):
            print(f"[Tavily] Batch query error: {result_or_err}")
            continue
        for r in result_or_err:
            normalized = r.url.rstrip("/").split("?")[0]
            if normalized not in seen_urls:
                seen_urls.add(normalized)
                all_results.append(r)

    return all_results
