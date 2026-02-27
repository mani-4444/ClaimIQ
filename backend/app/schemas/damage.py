from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DamageZone(BaseModel):
    zone: str = Field(..., description="Front / Rear / Left Side / Right Side")
    severity: str = Field(..., description="minor / moderate / severe")
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: List[float] = Field(..., min_length=4, max_length=4)
