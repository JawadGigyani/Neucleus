from enum import Enum
from pydantic import BaseModel, Field


class NoveltySignal(str, Enum):
    NOT_FOUND = "NOT_FOUND"
    SIMILAR_WORK_EXISTS = "SIMILAR_WORK_EXISTS"
    EXACT_MATCH_FOUND = "EXACT_MATCH_FOUND"


class NoveltyReference(BaseModel):
    title: str
    authors: str | None = None
    year: int | None = None
    journal: str | None = None
    url: str
    relevance: str = Field(..., min_length=20, description="Why this reference is relevant")
    source: str = Field(..., description="Which database: OpenAlex, SemanticScholar, etc.")


class NoveltyClassification(BaseModel):
    novelty_signal: NoveltySignal
    references: list[NoveltyReference] = Field(..., min_length=1, max_length=3)
    reasoning: str = Field(..., min_length=50, description="Chain-of-thought explanation")


class CompressedContext(BaseModel):
    academic_literature: list[str] = Field(default_factory=list)
    protocols_and_methods: list[str] = Field(default_factory=list)
    product_and_reagent_info: list[str] = Field(default_factory=list)


class QCOutput(BaseModel):
    compressed_context: CompressedContext
    novelty: NoveltyClassification
