from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str = Field(..., description="API that produced this: OpenAlex, SemanticScholar, CrossRef, Tavily")
    score: float | None = None
    year: int | None = None
    cited_by_count: int | None = None
    doi: str | None = None
    authors: str | None = None
    journal: str | None = None
