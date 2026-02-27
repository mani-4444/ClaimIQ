from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger


class AnalyticsRepository:
    """Queries the claims table for real aggregate metrics."""

    def __init__(self):
        self.client = get_supabase_client()
        self.table = "claims"

    async def get_total_claims(self) -> int:
        response = (
            self.client.table(self.table)
            .select("id", count="exact")
            .execute()
        )
        return response.count or 0

    async def get_decision_counts(self) -> dict[str, int]:
        """Return count per decision value."""
        counts = {"pre_approved": 0, "manual_review": 0, "rejected": 0}
        for decision in counts:
            response = (
                self.client.table(self.table)
                .select("id", count="exact")
                .eq("decision", decision)
                .execute()
            )
            counts[decision] = response.count or 0
        return counts

    async def get_high_fraud_count(self, threshold: int = 80) -> int:
        response = (
            self.client.table(self.table)
            .select("id", count="exact")
            .gt("fraud_score", threshold)
            .execute()
        )
        return response.count or 0

    async def get_avg_claim_cost(self) -> float:
        """Compute average cost_total from all claims with a non-null cost."""
        response = (
            self.client.table(self.table)
            .select("cost_total")
            .gt("cost_total", 0)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return 0.0
        total = sum(r["cost_total"] for r in rows)
        return round(total / len(rows), 2)

    async def get_summary(self) -> dict:
        """Aggregate all analytics metrics in one call."""
        total = await self.get_total_claims()
        decisions = await self.get_decision_counts()
        high_fraud = await self.get_high_fraud_count()
        avg_cost = await self.get_avg_claim_cost()

        return {
            "total_claims": total,
            "approved_claims": decisions["pre_approved"],
            "rejected_claims": decisions["rejected"],
            "manual_review_claims": decisions["manual_review"],
            "high_fraud_cases": high_fraud,
            "avg_claim_cost": avg_cost,
        }
