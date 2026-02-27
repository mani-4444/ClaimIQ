import time
from typing import List
from app.services.damage_service import DamageService
from app.services.cost_service import CostService
from app.services.fraud_service import FraudService
from app.services.decision_service import DecisionService
from app.services.vision_llm_service import VisionLLMService
from app.db.repositories.claim_repo import ClaimRepository
from app.schemas.claim import ClaimProcessResponse
from app.utils.logger import logger


class ClaimService:
    """Orchestrates the full claim processing pipeline."""

    def __init__(
        self,
        damage_service: DamageService,
        cost_service: CostService,
        fraud_service: FraudService,
        decision_service: DecisionService,
        vision_llm_service: VisionLLMService,
        claim_repo: ClaimRepository,
    ):
        self.damage_service = damage_service
        self.cost_service = cost_service
        self.fraud_service = fraud_service
        self.decision_service = decision_service
        self.vision_llm_service = vision_llm_service
        self.claim_repo = claim_repo

    async def process_claim(self, claim_id: str, user_id: str) -> ClaimProcessResponse:
        """
        Full claim processing pipeline:
        1. Damage Detection (YOLO) — identify zones + severity
        2. Vision LLM Explanation — natural language assessment
        3. Cost Estimation — itemized cost per zone
        4. Fraud Detection — CLIP similarity + frequency + inconsistency
        5. Decision Engine — approve / review / reject
        6. Persist all results
        """
        start_time = time.time()

        # Update status to processing
        await self.claim_repo.update_status(claim_id, "processing")

        try:
            # 1. Fetch claim data
            claim = await self.claim_repo.get_by_id(claim_id, user_id)
            if not claim:
                raise ValueError(f"Claim {claim_id} not found")

            if claim["status"] == "processed":
                raise ValueError(f"Claim {claim_id} has already been processed")

            image_urls = claim["image_urls"]

            # 2. Damage Detection
            logger.info(f"[{claim_id[:8]}] Running damage detection...")
            damage_zones = await self.damage_service.detect_damage(image_urls)

            # 3. Vision LLM Explanation
            logger.info(f"[{claim_id[:8]}] Generating AI explanation...")
            ai_explanation = await self.vision_llm_service.explain_damage(
                image_urls=image_urls,
                damage_zones=damage_zones,
                user_description=claim.get("user_description"),
            )

            # 4. Cost Estimation
            logger.info(f"[{claim_id[:8]}] Calculating costs...")
            cost_breakdown, cost_total = await self.cost_service.estimate_cost(
                damage_zones
            )

            # 5. Fraud Detection
            logger.info(f"[{claim_id[:8]}] Running fraud analysis...")
            fraud_result = await self.fraud_service.analyze(
                claim_id=claim_id,
                user_id=user_id,
                image_urls=image_urls,
                damage_zones=damage_zones,
                user_description=claim.get("user_description"),
            )

            # 6. Decision Engine
            logger.info(f"[{claim_id[:8]}] Making decision...")
            decision_result = self.decision_service.make_decision(
                fraud_score=fraud_result.fraud_score,
                cost_total=cost_total,
                fraud_flags=fraud_result.flags,
            )

            # 7. Persist results
            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.claim_repo.update_processed(
                claim_id=claim_id,
                damage_json=damage_zones,
                ai_explanation=ai_explanation,
                cost_breakdown=cost_breakdown,
                cost_total=cost_total,
                fraud_score=fraud_result.fraud_score,
                fraud_flags=fraud_result.flags,
                decision=decision_result.decision,
                decision_confidence=decision_result.confidence,
                risk_level=decision_result.risk_level,
            )

            logger.info(
                f"[{claim_id[:8]}] Processing complete in {processing_time_ms}ms — "
                f"decision: {decision_result.decision}"
            )

            # Build response
            cost_breakdown_dicts = [c.model_dump() for c in cost_breakdown]
            damage_zone_dicts = [d.model_dump() for d in damage_zones]

            return ClaimProcessResponse(
                id=claim_id,
                user_id=user_id,
                image_urls=image_urls,
                user_description=claim.get("user_description"),
                policy_number=claim["policy_number"],
                status="processed",
                damage_zones=damage_zone_dicts,
                ai_explanation=ai_explanation,
                cost_breakdown=cost_breakdown_dicts,
                cost_total=cost_total,
                fraud_score=fraud_result.fraud_score,
                fraud_flags=fraud_result.flags,
                decision=decision_result.decision,
                decision_confidence=decision_result.confidence,
                risk_level=decision_result.risk_level,
                created_at=str(claim["created_at"]),
                processed_at=str(claim.get("processed_at", "")),
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            logger.error(f"[{claim_id[:8]}] Processing failed: {e}")
            await self.claim_repo.update_status(claim_id, "error")
            raise
