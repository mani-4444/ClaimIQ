from typing import List, Tuple
from app.db.repositories.cost_repo import CostRepository
from app.schemas.damage import DamageZone
from app.schemas.cost import CostBreakdown
from app.utils.logger import logger


class CostService:
    """Estimate repair costs based on detected damage zones and severity."""

    SEVERITY_MAP = {
        "minor": "minor_cost",
        "moderate": "moderate_cost",
        "severe": "severe_cost",
    }

    def __init__(self, cost_repo: CostRepository):
        self.cost_repo = cost_repo

    async def estimate_cost(
        self, damage_zones: List[DamageZone]
    ) -> Tuple[List[CostBreakdown], int]:
        """
        Calculate repair cost for each damaged zone.
        Cost = (Base Cost + Labor Cost) × Regional Multiplier
        """
        breakdowns: List[CostBreakdown] = []
        total = 0

        for zone in damage_zones:
            cost_entry = await self.cost_repo.get_by_zone_or_default(zone.zone)

            severity_col = self.SEVERITY_MAP.get(zone.severity, "moderate_cost")
            base_cost = cost_entry[severity_col]
            labor = cost_entry.get("labor_cost", 2000)
            multiplier = cost_entry.get("regional_multiplier", 1.0)

            zone_total = int((base_cost + labor) * multiplier)

            breakdowns.append(
                CostBreakdown(
                    zone=zone.zone,
                    severity=zone.severity,
                    base_cost=base_cost,
                    labor_cost=labor,
                    regional_multiplier=multiplier,
                    total=zone_total,
                )
            )

            total += zone_total

        logger.info(f"Cost estimated: {len(breakdowns)} zones, total ₹{total}")
        return breakdowns, total
