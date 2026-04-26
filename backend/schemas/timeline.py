from pydantic import BaseModel, Field


class Phase(BaseModel):
    phase: int
    name: str
    duration: str
    start_week: int
    end_week: int
    tasks: list[str] = Field(..., min_length=2)
    dependencies: list[int] = Field(default_factory=list)
    deliverables: list[str] = Field(default_factory=list)
    milestone: str
    risks: list[str] = Field(default_factory=list)


class Timeline(BaseModel):
    total_duration: str
    phases: list[Phase] = Field(..., min_length=3)
