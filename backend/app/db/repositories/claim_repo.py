from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger
import json


class ClaimRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "claims"

    async def create(
        self,
        user_id: str,
        image_urls: List[str],
        policy_number: str,
        vehicle_company: Optional[str] = None,
        vehicle_model: Optional[str] = None,
        user_description: Optional[str] = None,
        incident_date: Optional[str] = None,
        location: Optional[str] = None,
        coverage_limit: Optional[int] = None,
        deductible: Optional[int] = None,
        depreciation_pct: Optional[float] = None,
        policy_valid_till: Optional[str] = None,
    ) -> dict:
        data = {
            "user_id": user_id,
            "image_urls": image_urls,
            "policy_number": policy_number,
            "user_description": user_description,
            "incident_date": incident_date,
            "location": location,
            "status": "uploaded",
            "decision": "pending",
        }

        if vehicle_company:
            data["vehicle_company"] = vehicle_company
        if vehicle_model:
            data["vehicle_model"] = vehicle_model
        if coverage_limit is not None:
            data["coverage_limit"] = coverage_limit
        if deductible is not None:
            data["deductible"] = deductible
        if depreciation_pct is not None:
            data["depreciation_pct"] = depreciation_pct
        if policy_valid_till:
            data["policy_valid_till"] = policy_valid_till

        try:
            response = self.client.table(self.table).insert(data).execute()
        except Exception as e:
            error_text = str(e).lower()
            missing_vehicle_column = (
                ("vehicle_company" in error_text)
                or ("vehicle_model" in error_text)
                or (
                    "column" in error_text
                    and (
                        "does not exist" in error_text
                        or "could not find" in error_text
                        or "schema cache" in error_text
                    )
                )
            )

            if (
                (
                    "vehicle_company" in data
                    or "vehicle_model" in data
                    or "coverage_limit" in data
                    or "deductible" in data
                    or "depreciation_pct" in data
                    or "policy_valid_till" in data
                )
                and missing_vehicle_column
            ):
                logger.warning(
                    "claims table missing optional extended columns; retrying create without optional fields"
                )
                data.pop("vehicle_company", None)
                data.pop("vehicle_model", None)
                data.pop("coverage_limit", None)
                data.pop("deductible", None)
                data.pop("depreciation_pct", None)
                data.pop("policy_valid_till", None)
                response = self.client.table(self.table).insert(data).execute()
            else:
                raise

        logger.info(f"Claim created: {response.data[0]['id']} for user {user_id}")
        return response.data[0]

    async def get_by_id(self, claim_id: str, user_id: Optional[str] = None) -> dict | None:
        query = self.client.table(self.table).select("*").eq("id", claim_id)
        if user_id:
            query = query.eq("user_id", user_id)
        response = query.maybe_single().execute()
        return response.data

    async def list_by_user(self, user_id: str) -> List[dict]:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    async def update_status(self, claim_id: str, status: str) -> None:
        self.client.table(self.table).update({"status": status}).eq("id", claim_id).execute()

    async def update_processed(
        self,
        claim_id: str,
        image_urls: List[str],
        damage_json: list,
        ai_explanation: str,
        cost_breakdown: list,
        cost_total: int,
        fraud_score: int,
        fraud_flags: List[str],
        decision: str,
        decision_confidence: float,
        risk_level: str,
    ) -> None:
        # Serialize pydantic models to dicts
        damage_data = [
            d.model_dump() if hasattr(d, "model_dump") else d for d in damage_json
        ]
        cost_data = [
            c.model_dump() if hasattr(c, "model_dump") else c for c in cost_breakdown
        ]

        update_data = {
            "image_urls": image_urls,
            "damage_json": json.dumps(damage_data),
            "ai_explanation": ai_explanation,
            "cost_breakdown": json.dumps(cost_data),
            "cost_total": cost_total,
            "fraud_score": fraud_score,
            "fraud_flags": fraud_flags,
            "decision": decision,
            "decision_confidence": decision_confidence,
            "risk_level": risk_level,
            "status": "processed",
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }

        self.client.table(self.table).update(update_data).eq("id", claim_id).execute()
        logger.info(f"Claim {claim_id} processed: decision={decision}")

    async def count_recent_claims(self, user_id: str, months: int = 6) -> int:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=months * 30)).isoformat()
        response = (
            self.client.table(self.table)
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", cutoff)
            .execute()
        )
        return response.count or 0

    async def delete(self, claim_id: str, user_id: str) -> bool:
        response = (
            self.client.table(self.table)
            .delete()
            .eq("id", claim_id)
            .eq("user_id", user_id)
            .execute()
        )
        return len(response.data) > 0
