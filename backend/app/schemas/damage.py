from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DamageZone(BaseModel):
    zone: str = Field(..., description="Front / Rear / Left Side / Right Side")
    severity: str = Field(..., description="minor / moderate / severe / critical")
    damage_type: Optional[str] = Field(
        None,
        description="Normalized damage type used for pricing (e.g., dent, scratch)",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    area_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    bounding_box: List[float] = Field(..., min_length=4, max_length=4)
    yolo_classes: Optional[List[str]] = None
    detections_count: Optional[int] = None
