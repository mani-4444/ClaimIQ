from pydantic import BaseModel, Field
from typing import List


class CostBreakdown(BaseModel):
    zone: str
    severity: str
    base_cost: int
    labor_cost: int
    regional_multiplier: float = 1.0
    total: int


class CostEstimation(BaseModel):
    breakdown: List[CostBreakdown]
    total: int
