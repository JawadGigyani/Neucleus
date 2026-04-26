"""CrossRef API client for DOI resolution and metadata."""

import re
import httpx
from schemas.search import SearchResult

CROSSREF_ENDPOINT = "https://api.crossref.org/works"


def strip_jats_xml(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


async def search_crossref(query: str, rows: int = 5) -> list[SearchResult]:
    params = {
        "query": query,
        "rows": rows,
        "mailto": "jawadkhangigyani@gmail.com",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(CROSSREF_ENDPOINT, params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        items = data.get("message", {}).get("items", [])
        for item in items:
            title_list = item.get("title", [])
            title = title_list[0] if title_list else ""
            if not title:
                continue

            abstract = strip_jats_xml(item.get("abstract", ""))

            author_list = item.get("author", [])
            authors = ", ".join(
                f"{a.get('given', '')} {a.get('family', '')}".strip()
                for a in author_list[:3]
            )
            if len(author_list) > 3:
                authors += " et al."

            date_parts = item.get("published", {}).get("date-parts", [[]])
            year = date_parts[0][0] if date_parts and date_parts[0] else None

            container = item.get("container-title", [])
            journal = container[0] if container else None

            results.append(SearchResult(
                title=title,
                url=item.get("URL", ""),
                snippet=abstract[:500] if abstract else title,
                source="CrossRef",
                year=year,
                cited_by_count=item.get("is-referenced-by-count"),
                doi=item.get("DOI", ""),
                authors=authors,
                journal=journal,
            ))
        return results

    except Exception as e:
        print(f"[CrossRef] Error for query '{query[:50]}...': {e}")
        return []
