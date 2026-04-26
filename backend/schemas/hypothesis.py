from pydantic import BaseModel, Field


class ParsedHypothesis(BaseModel):
    intervention: str | None = Field(None, description="The intervention being tested")
    outcome: str | None = Field(None, description="The outcome being measured")
    mechanism: str | None = Field(None, description="The proposed mechanism of action")
    model_system: str | None = Field(None, description="The experimental model system")
    control: str | None = Field(None, description="The control condition")
    threshold: str | None = Field(None, description="The measurable threshold for success")
    key_terms: list[str] = Field(..., min_length=3, max_length=8, description="Key search terms")
    domain: str = Field(..., description="Primary scientific discipline")


class SearchQueries(BaseModel):
    academic_queries: list[str] = Field(..., min_length=3, description="Queries for academic databases")
    protocol_queries: list[str] = Field(..., min_length=3, description="Queries with site: operators for protocol repos")
    supplier_queries: list[str] = Field(..., min_length=3, description="Queries with site: operators for suppliers")
    reference_queries: list[str] = Field(..., min_length=1, description="Queries for cell lines, standards, references")


class ParseOutput(BaseModel):
    parsed_hypothesis: ParsedHypothesis
    search_queries: SearchQueries
