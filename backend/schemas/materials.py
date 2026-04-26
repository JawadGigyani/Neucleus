from pydantic import BaseModel, Field


class Material(BaseModel):
    category: str
    name: str
    catalog_number: str = Field(..., description="Real catalog number or VERIFY_REQUIRED")
    supplier: str
    quantity: str
    unit_cost: str
    total_cost: str
    cost_confidence: str = Field(..., pattern=r"^(verified|estimated)$")
    source_url: str | None = None
    alternatives: list[str] = Field(default_factory=list)
    notes: str | None = None
    verification_status: str = Field(
        default="UNVERIFIED",
        pattern=r"^(VERIFIED|PARTIALLY_VERIFIED|UNVERIFIED|CORRECTED)$",
    )
    verification_url: str | None = None


class Equipment(BaseModel):
    name: str
    model: str | None = None
    supplier: str | None = None
    estimated_cost: str
    notes: str | None = None


class BudgetLineItem(BaseModel):
    category: str
    items: list[str]
    subtotal: str


class BudgetSummary(BaseModel):
    materials_and_reagents: str
    equipment: str
    consumables: str
    personnel_2_researchers_3_months: str
    overhead_15pct: str
    contingency_10pct: str
    total_estimate: str
    verified_percentage: float = Field(default=0.0)


class Budget(BaseModel):
    line_items: list[BudgetLineItem] = Field(default_factory=list)
    summary: BudgetSummary


class MaterialsOutput(BaseModel):
    materials: list[Material] = Field(..., min_length=1)
    equipment: list[Equipment] = Field(default_factory=list)
    budget: Budget
