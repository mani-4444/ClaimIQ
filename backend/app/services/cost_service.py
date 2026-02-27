from typing import List, Tuple
from app.db.repositories.cost_repo import CostRepository
from app.schemas.damage import DamageZone
from app.schemas.cost import CostBreakdown
from app.utils.logger import logger


class CostService:
    """Estimate repair costs from detected damage categories and quantities."""

    SEVERITY_MAP = {
        "minor": "minor_cost",
        "moderate": "moderate_cost",
        "severe": "severe_cost",
    }
    SEVERITY_RANK = {"minor": 1, "moderate": 2, "severe": 3}

    def __init__(self, cost_repo: CostRepository):
        self.cost_repo = cost_repo

    async def estimate_cost(
        self,
        damage_zones: List[DamageZone],
        vehicle_company: str | None = None,
        vehicle_model: str | None = None,
    ) -> Tuple[List[CostBreakdown], int]:
        """Calculate cost by summing each detected damage category from pricing data."""
        breakdowns: List[CostBreakdown] = []
        total = 0

        grouped_by_damage_type: dict[str, List[DamageZone]] = {}
        for zone in damage_zones:
            damage_type = (getattr(zone, "damage_type", None) or "unknown").strip().lower()
            grouped_by_damage_type.setdefault(damage_type, []).append(zone)

        for damage_type, zones in grouped_by_damage_type.items():
            primary_zone = zones[0]
            severity = max(
                (z.severity for z in zones),
                key=lambda s: self.SEVERITY_RANK.get(str(s).lower(), 2),
            )
            quantity = sum(
                max(1, int(getattr(z, "detections_count", 1) or 1)) for z in zones
            )

            cost_entry = await self.cost_repo.get_by_zone_or_default(primary_zone.zone)
            damage_type_cost = await self.cost_repo.get_by_damage_type(
                damage_type,
                vehicle_company=vehicle_company,
                vehicle_model=vehicle_model,
            )

            if damage_type_cost is not None:
                unit_repair_cost = int(damage_type_cost)
                logger.info(
                    "Using mapped pricing for "
                    f"damage_type='{damage_type}', company='{vehicle_company}', model='{vehicle_model}': "
                    f"₹{unit_repair_cost} x {quantity}"
                )
            else:
                severity_col = self.SEVERITY_MAP.get(str(severity).lower(), "moderate_cost")
                base_cost = int(cost_entry[severity_col])
                labor = cost_entry.get("labor_cost", 2000)
                multiplier = cost_entry.get("regional_multiplier", 1.0)
                unit_repair_cost = int((base_cost + labor) * multiplier)

            zone_total = int(unit_repair_cost * quantity)

            breakdowns.append(
                CostBreakdown(
                    zone=damage_type,
                    severity=str(severity).lower(),
                    damage_type=damage_type,
                    quantity=quantity,
                    unit_repair_cost=unit_repair_cost,
                    base_cost=unit_repair_cost,
                    labor_cost=0,
                    regional_multiplier=1.0,
                    total=zone_total,
                )
            )

            total += zone_total

        logger.info(f"Cost estimated: {len(breakdowns)} zones, total ₹{total}")
        return breakdowns, total
