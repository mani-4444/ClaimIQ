from pydantic import BaseModel, Field
from typing import List


class FraudAnalysis(BaseModel):
    fraud_score: int = Field(..., ge=0, le=100)
    flags: List[str] = Field(default_factory=list)
    reuse_score: float = Field(0.0, ge=0.0, le=1.0)
    ai_gen_score: float = Field(0.0, ge=0.0, le=1.0)
    metadata_anomaly: float = Field(0.0, ge=0.0, le=1.0)
