"""Semantic Scholar API client with graceful rate-limit handling."""

import os
import httpx
from schemas.search import SearchResult

S2_ENDPOINT = "https://api.semanticscholar.org/graph/v1/paper/search"


async def search_semantic_scholar(query: str, limit: int = 10) -> list[SearchResult]:
    headers = {}
    api_key = os.getenv("S2_API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    params = {
        "query": query,
        "limit": limit,
        "fields": "title,abstract,year,authors,citationCount,url,externalIds,journal",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(S2_ENDPOINT, params=params, headers=headers)

            if resp.status_code == 429:
                print("[S2] Rate limited, skipping")
                return []

            resp.raise_for_status()
            data = resp.json()

        results = []
        for paper in data.get("data", []):
            title = paper.get("title", "")
            if not title:
                continue

            authors_list = paper.get("authors", [])
            authors = ", ".join(a.get("name", "") for a in authors_list[:3])
            if len(authors_list) > 3:
                authors += " et al."

            external = paper.get("externalIds") or {}
            doi = external.get("DOI", "")
            url = paper.get("url", "")
            if doi:
                url = f"https://doi.org/{doi}"

            journal_info = paper.get("journal") or {}

            results.append(SearchResult(
                title=title,
                url=url,
                snippet=paper.get("abstract", "") or title,
                source="SemanticScholar",
                year=paper.get("year"),
                cited_by_count=paper.get("citationCount"),
                doi=doi,
                authors=authors,
                journal=journal_info.get("name"),
            ))
        return results

    except Exception as e:
        print(f"[S2] Error for query '{query[:50]}...': {e}")
        return []
