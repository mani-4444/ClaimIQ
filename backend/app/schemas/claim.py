from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.damage import DamageZone
from app.schemas.cost import CostBreakdown


class ClaimCreateRequest(BaseModel):
    policy_number: str = Field(..., min_length=5, max_length=50)
    vehicle_company: Optional[str] = Field(None, max_length=80)
    vehicle_model: Optional[str] = Field(None, max_length=80)
    user_description: Optional[str] = Field(None, max_length=1000)
    incident_date: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    coverage_limit: Optional[int] = None
    deductible: Optional[int] = None
    depreciation_pct: Optional[float] = None
    policy_valid_till: Optional[str] = None


class ClaimResponse(BaseModel):
    id: str
    user_id: str
    image_urls: List[str]
    user_description: Optional[str] = None
    policy_number: str
    vehicle_company: Optional[str] = None
    vehicle_model: Optional[str] = None
    status: str
    damage_zones: Optional[List[DamageZone]] = None
    damage_severity_score: Optional[int] = None
    ai_explanation: Optional[str] = None
    cost_breakdown: Optional[List[CostBreakdown]] = None
    cost_total: Optional[int] = None
    fraud_score: Optional[int] = None
    fraud_flags: Optional[List[str]] = None
    decision: Optional[str] = None
    decision_confidence: Optional[float] = None
    risk_level: Optional[str] = None
    repair_replace_recommendation: Optional[dict] = None
    manual_review_required: Optional[bool] = None
    manual_review_reason: Optional[str] = None
    repair_time_estimate: Optional[dict] = None
    coverage_summary: Optional[dict] = None
    garage_recommendations: Optional[List[dict]] = None
    fraud_signal_breakdown: Optional[dict] = None
    created_at: str
    processed_at: Optional[str] = None


class ClaimProcessResponse(ClaimResponse):
    processing_time_ms: int
