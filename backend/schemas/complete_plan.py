from pydantic import BaseModel, Field
from .hypothesis import ParsedHypothesis
from .novelty import NoveltyClassification
from .protocol import Protocol, GroundingScore
from .materials import Material, Equipment, Budget
from .timeline import Timeline
from .validation import Validation


class GroundingSummary(BaseModel):
    protocol_grounding_pct: float = 0.0
    materials_verified_pct: float = 0.0
    budget_verified_pct: float = 0.0
    overall_grounding_pct: float = 0.0


class PlanMetadata(BaseModel):
    hypothesis: str
    parsed: ParsedHypothesis
    novelty: NoveltyClassification
    generated_at: str
    generation_time_seconds: float
    grounding_summary: GroundingSummary
    models_used: dict[str, str] = Field(default_factory=dict)
    feedback_applied: list[str] = Field(
        default_factory=list,
        description="List of feedback IDs that were applied during generation",
    )


class CompletePlan(BaseModel):
    metadata: PlanMetadata
    protocol: Protocol | None = None
    protocol_grounding: list[GroundingScore] = Field(default_factory=list)
    materials: list[Material] = Field(default_factory=list)
    equipment: list[Equipment] = Field(default_factory=list)
    budget: Budget | None = None
    timeline: Timeline | None = None
    validation: Validation | None = None
