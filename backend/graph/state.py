"""LangGraph state definition — single source of truth for the pipeline."""

from typing import TypedDict, Any
from schemas.hypothesis import ParsedHypothesis, SearchQueries
from schemas.search import SearchResult
from schemas.novelty import NoveltyClassification, CompressedContext
from schemas.protocol import Protocol, GroundingScore
from schemas.materials import Material, Equipment, Budget
from schemas.timeline import Timeline
from schemas.validation import Validation
from schemas.complete_plan import CompletePlan


class AgentState(TypedDict, total=False):
    # Input
    hypothesis: str

    # Parse outputs
    parsed_hypothesis: ParsedHypothesis
    search_queries: SearchQueries

    # Feedback retrieval
    prior_feedback: list[dict[str, Any]]

    # Retrieve outputs
    raw_search_results: list[SearchResult]

    # QC outputs
    compressed_context: CompressedContext
    compressed_context_text: str
    novelty: NoveltyClassification

    # Protocol outputs
    protocol: Protocol
    protocol_grounding: list[GroundingScore]

    # Materials outputs
    materials: list[Material]
    equipment: list[Equipment]
    budget: Budget

    # Timeline outputs
    timeline: Timeline
    validation: Validation

    # Final output
    final_plan: CompletePlan

    # Pipeline metadata
    errors: list[str]
    current_stage: str
    stage_durations: dict[str, float]
