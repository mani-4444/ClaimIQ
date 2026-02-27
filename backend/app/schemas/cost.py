from pydantic import BaseModel, Field
from typing import List, Optional


class CostBreakdown(BaseModel):
    zone: str
    severity: str
    damage_type: Optional[str] = None
    quantity: int = 1
    unit_repair_cost: Optional[int] = None
    base_cost: int
    labor_cost: int
    regional_multiplier: float = 1.0
    total: int


class CostEstimation(BaseModel):
    breakdown: List[CostBreakdown]
    total: int
