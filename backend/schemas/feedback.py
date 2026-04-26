from pydantic import BaseModel, Field
from datetime import datetime


class Correction(BaseModel):
    field_path: str = Field(..., description="e.g. steps[3].description or materials[2].catalog_number")
    original_value: str
    corrected_value: str
    reason: str | None = None


class SectionReview(BaseModel):
    section: str = Field(..., pattern=r"^(protocol|materials|budget|timeline|validation)$")
    rating: int = Field(..., ge=1, le=5)
    corrections: list[Correction] = Field(default_factory=list)
    annotations: str | None = None


class FeedbackSubmission(BaseModel):
    plan_id: str
    domain: str
    experiment_type: str
    key_terms: list[str]
    overall_rating: float = Field(..., ge=1.0, le=5.0)
    section_reviews: list[SectionReview]


class StoredFeedback(BaseModel):
    id: str
    plan_id: str
    domain: str
    experiment_type: str
    key_terms: list[str]
    overall_rating: float
    section_reviews: list[SectionReview]
    created_at: datetime
