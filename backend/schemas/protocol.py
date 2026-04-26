from pydantic import BaseModel, Field


class ProtocolStep(BaseModel):
    step_number: int
    title: str
    description: str = Field(..., min_length=30)
    duration: str
    critical_notes: str | list[str] | None = None
    safety_warnings: str | list[str] | None = None
    source: str = Field(..., description="Source citation for this step")


class GroundingScore(BaseModel):
    step_number: int
    grounding_score: str = Field(..., pattern=r"^(HIGH|MEDIUM|LOW)$")
    matched_source: str | None = Field(None, description="Title + URL of matching source")
    unverified_claims: list[str] = Field(default_factory=list)


class ProtocolReference(BaseModel):
    title: str
    url: str
    note: str | None = None


class Protocol(BaseModel):
    title: str
    objective: str = Field(..., min_length=50)
    overview: str = Field(..., min_length=50)
    steps: list[ProtocolStep] = Field(..., min_length=6)
    estimated_total_time: str
    safety_considerations: list[str] = Field(default_factory=list)
    protocol_references: list[ProtocolReference] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)
