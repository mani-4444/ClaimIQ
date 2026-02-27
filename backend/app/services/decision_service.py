from typing import List
from app.schemas.decision import DecisionResult
from app.utils.constants import (
    DECISION_AUTO_APPROVE_FRAUD_MAX,
    DECISION_AUTO_APPROVE_COST_MAX,
    DECISION_REJECT_FRAUD_MIN,
    DECISION_HIGH_COST_THRESHOLD,
)


class DecisionService:
    """Rule-based decision engine for claim approval."""

    def make_decision(
        self,
        fraud_score: int,
        cost_total: int,
        fraud_flags: List[str],
        avg_confidence: float | None = None,
    ) -> DecisionResult:
        """
        Decision rules:
        - Auto Approve: fraud < 30 AND cost <= ₹15,000
        - Reject: fraud > 80 OR duplicate image detected
        - Manual Review: everything else
        """
        has_duplicate = any("Duplicate" in f for f in fraud_flags)

        # REJECT
        if fraud_score > DECISION_REJECT_FRAUD_MIN or has_duplicate:
            return DecisionResult(
                decision="rejected",
                confidence=min(0.95, fraud_score / 100),
                risk_level="critical" if has_duplicate else "high",
            )

        # HUMAN ESCALATION (responsible AI gate)
        if fraud_score > 60 or (avg_confidence is not None and avg_confidence < 0.5):
            confidence = round(1.0 - (fraud_score / 100), 2)
            return DecisionResult(
                decision="manual_review",
                confidence=max(0.3, confidence),
                risk_level="high",
            )

        # MANUAL REVIEW (high fraud or high cost)
        if fraud_score >= DECISION_AUTO_APPROVE_FRAUD_MAX or cost_total > DECISION_HIGH_COST_THRESHOLD:
            confidence = round(1.0 - (fraud_score / 100), 2)
            return DecisionResult(
                decision="manual_review",
                confidence=confidence,
                risk_level="high" if fraud_score >= 50 else "medium",
            )

        # AUTO APPROVE
        if fraud_score < DECISION_AUTO_APPROVE_FRAUD_MAX and cost_total <= DECISION_AUTO_APPROVE_COST_MAX:
            return DecisionResult(
                decision="pre_approved",
                confidence=round(1.0 - (fraud_score / 100), 2),
                risk_level="low",
            )

        # DEFAULT: Manual review (cost > auto-approve threshold but fraud low)
        return DecisionResult(
            decision="manual_review",
            confidence=0.75,
            risk_level="medium",
        )
