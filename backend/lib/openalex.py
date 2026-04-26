"""OpenAlex API client with abstract reconstruction."""

import httpx
from schemas.search import SearchResult

OPENALEX_ENDPOINT = "https://api.openalex.org/works"


def reconstruct_abstract(inverted_index: dict) -> str:
    if not inverted_index:
        return ""
    word_positions: list[tuple[int, str]] = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    return " ".join(w for _, w in word_positions)


async def search_openalex(query: str, per_page: int = 10) -> list[SearchResult]:
    params = {
        "search": query,
        "per_page": per_page,
        "select": "id,title,abstract_inverted_index,publication_year,cited_by_count,doi,primary_location,authorships",
        "mailto": "jawadkhangigyani@gmail.com",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPENALEX_ENDPOINT, params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for work in data.get("results", []):
            abstract = reconstruct_abstract(work.get("abstract_inverted_index", {}))
            title = work.get("title", "")
            if not title:
                continue

            authors_list = work.get("authorships", [])
            authors = ", ".join(
                a.get("author", {}).get("display_name", "")
                for a in authors_list[:3]
            )
            if len(authors_list) > 3:
                authors += " et al."

            journal = None
            loc = work.get("primary_location") or {}
            source = loc.get("source") or {}
            journal = source.get("display_name")

            doi = work.get("doi", "")
            url = doi if doi else work.get("id", "")

            results.append(SearchResult(
                title=title,
                url=url,
                snippet=abstract[:500] if abstract else title,
                source="OpenAlex",
                year=work.get("publication_year"),
                cited_by_count=work.get("cited_by_count"),
                doi=doi,
                authors=authors,
                journal=journal,
            ))
        return results

    except Exception as e:
        print(f"[OpenAlex] Error for query '{query[:50]}...': {e}")
        return []
