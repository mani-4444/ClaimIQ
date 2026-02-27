from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.damage import DamageZone
from app.schemas.cost import CostBreakdown


class ClaimCreateRequest(BaseModel):
    policy_number: str = Field(..., min_length=5, max_length=50)
    user_description: Optional[str] = Field(None, max_length=1000)
    incident_date: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)


class ClaimResponse(BaseModel):
    id: str
    user_id: str
    image_urls: List[str]
    user_description: Optional[str] = None
    policy_number: str
    status: str
    damage_zones: Optional[List[DamageZone]] = None
    ai_explanation: Optional[str] = None
    cost_breakdown: Optional[List[CostBreakdown]] = None
    cost_total: Optional[int] = None
    fraud_score: Optional[int] = None
    fraud_flags: Optional[List[str]] = None
    decision: Optional[str] = None
    decision_confidence: Optional[float] = None
    risk_level: Optional[str] = None
    created_at: str
    processed_at: Optional[str] = None


class ClaimProcessResponse(ClaimResponse):
    processing_time_ms: int
