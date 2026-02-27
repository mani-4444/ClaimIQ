from __future__ import annotations

from datetime import date, datetime
from typing import Any, List, Optional

from app.utils.scoring import compute_overall_severity_score


class AdvancedFeaturesService:
    REPAIR_DAY_MAP = {
        "dent": (1, 3),
        "scratch": (1, 2),
        "crack": (2, 4),
        "glass_damage": (2, 3),
        "bumper_damage": (3, 5),
        "bumper_replace": (4, 6),
        "paint_damage": (1, 2),
        "unknown": (2, 4),
    }

    GARAGES = [
        {
            "garage_id": "G001",
            "name": "AutoCare Prime",
            "location": "Bengaluru",
            "specialization": ["dent", "scratch", "paint_damage"],
            "rating": 4.8,
            "avg_turnaround_days": 2,
        },
        {
            "garage_id": "G002",
            "name": "Glass & Body Works",
            "location": "Mumbai",
            "specialization": ["glass_damage", "crack", "bumper_damage"],
            "rating": 4.6,
            "avg_turnaround_days": 3,
        },
        {
            "garage_id": "G003",
            "name": "Rapid Claim Garage",
            "location": "Delhi",
            "specialization": ["dent", "crack", "bumper_replace"],
            "rating": 4.5,
            "avg_turnaround_days": 2,
        },
        {
            "garage_id": "G004",
            "name": "City Motor Clinic",
            "location": "Pune",
            "specialization": ["scratch", "paint_damage", "dent"],
            "rating": 4.4,
            "avg_turnaround_days": 2,
        },
    ]

    @staticmethod
    def _safe_int(value: Any, default: int) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _safe_float(value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _parse_date(value: Optional[str]) -> Optional[date]:
        if not value:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        return None

    def recommend_repair_action(self, damage_zones: List[dict], cost_total: int) -> dict:
        severity_score = compute_overall_severity_score(damage_zones) if damage_zones else 0
        repair_cost = max(0, int(cost_total or 0))

        if severity_score > 90 and repair_cost > 120000:
            return {
                "action": "Total Loss",
                "severity_score": severity_score,
                "repair_cost": repair_cost,
                "replace_cost": repair_cost,
                "reason": "Damage and cost cross total-loss threshold.",
            }

        replace_cost = int(repair_cost * (0.95 if severity_score >= 70 else 1.15))

        if severity_score > 75:
            action = "Replace"
        elif severity_score > 40:
            action = "Repair"
        else:
            action = "Minor Cosmetic Repair"

        if replace_cost < repair_cost * 1.2:
            action = "Replace"

        return {
            "action": action,
            "severity_score": severity_score,
            "repair_cost": repair_cost,
            "replace_cost": replace_cost,
            "reason": "Based on severity and repair-vs-replace economic threshold.",
        }

    def estimate_repair_time(self, damage_zones: List[dict]) -> dict:
        if not damage_zones:
            return {"min_days": 1, "max_days": 2, "label": "1–2 Days"}

        min_days = 0
        max_days = 0
        for z in damage_zones:
            damage_type = str(z.get("damage_type") or "unknown").lower()
            severity = str(z.get("severity") or "moderate").lower()
            qty = max(1, int(z.get("detections_count") or 1))

            base_min, base_max = self.REPAIR_DAY_MAP.get(damage_type, self.REPAIR_DAY_MAP["unknown"])
            sev_multiplier = 1.0
            if severity == "severe":
                sev_multiplier = 1.4
            elif severity == "critical":
                sev_multiplier = 1.7
            elif severity == "minor":
                sev_multiplier = 0.8

            min_days += max(1, int(base_min * sev_multiplier)) * min(qty, 2)
            max_days += max(1, int(base_max * sev_multiplier)) * min(qty, 2)

        min_days = max(1, int(min_days * 0.5))
        max_days = max(min_days, int(max_days * 0.7))
        return {
            "min_days": min_days,
            "max_days": max_days,
            "label": f"{min_days}–{max_days} Days",
        }

    def compute_coverage_summary(self, claim: dict, cost_total: int) -> dict:
        deductible = self._safe_int(claim.get("deductible"), 2000)
        coverage_limit = self._safe_int(claim.get("coverage_limit"), 50000)
        depreciation_pct = self._safe_float(claim.get("depreciation_pct"), 10.0)
        policy_valid_till = claim.get("policy_valid_till")

        policy_date = self._parse_date(policy_valid_till)
        is_policy_active = True if policy_date is None else policy_date >= date.today()

        gross_total = max(0, int(cost_total or 0))
        depreciated_total = max(0, int(round(gross_total * (1 - depreciation_pct / 100))))
        eligible = max(0, depreciated_total - deductible)
        insurance_pays = min(eligible, coverage_limit) if is_policy_active else 0
        customer_pays = max(0, gross_total - insurance_pays)

        return {
            "gross_total": gross_total,
            "depreciation_pct": depreciation_pct,
            "depreciated_total": depreciated_total,
            "deductible": deductible,
            "coverage_limit": coverage_limit,
            "insurance_pays": insurance_pays,
            "customer_pays": customer_pays,
            "policy_active": is_policy_active,
            "policy_valid_till": policy_valid_till,
        }

    def recommend_garages(self, damage_zones: List[dict], location: Optional[str]) -> List[dict]:
        detected_types = {
            str(z.get("damage_type") or "unknown").lower() for z in (damage_zones or [])
        }
        preferred_location = (location or "").strip().lower()

        candidates = []
        for garage in self.GARAGES:
            specs = {s.lower() for s in garage["specialization"]}
            match_count = len(detected_types.intersection(specs))
            location_match = 1 if preferred_location and preferred_location in garage["location"].lower() else 0
            score = (match_count * 2) + location_match + garage["rating"]
            candidates.append((score, garage))

        candidates.sort(key=lambda x: (x[0], x[1]["rating"], -x[1]["avg_turnaround_days"]), reverse=True)
        return [g for _, g in candidates[:3]]

    @staticmethod
    def should_escalate(fraud_score: int, avg_confidence: float) -> tuple[bool, Optional[str]]:
        if fraud_score > 60:
            return True, "Fraud score above threshold"
        if avg_confidence < 0.5:
            return True, "Low model confidence"
        return False, None
