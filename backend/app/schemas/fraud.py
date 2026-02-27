from pydantic import BaseModel, Field
from typing import List


class FraudAnalysis(BaseModel):
    fraud_score: int = Field(..., ge=0, le=100)
    flags: List[str] = Field(default_factory=list)
