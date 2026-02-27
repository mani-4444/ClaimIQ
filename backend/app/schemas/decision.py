from pydantic import BaseModel, Field


class DecisionResult(BaseModel):
    decision: str  # pre_approved / manual_review / rejected
    confidence: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # low / medium / high / critical
