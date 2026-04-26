from pydantic import BaseModel, Field


class Validation(BaseModel):
    primary_endpoint: str = Field(..., min_length=20)
    success_criteria: list[str] = Field(..., min_length=2)
    failure_indicators: list[str] = Field(..., min_length=1)
    statistical_analysis: str = Field(..., min_length=20)
    replication_plan: str = Field(..., min_length=20)
    data_analysis_plan: str = Field(default="")
    go_no_go_criteria: str = Field(default="")
