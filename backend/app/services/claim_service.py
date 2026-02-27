import time
from typing import List
from app.services.damage_service import DamageService
from app.services.cost_service import CostService
from app.services.fraud_service import FraudService
from app.services.decision_service import DecisionService
from app.services.vision_llm_service import VisionLLMService
from app.services.storage_service import StorageService
from app.services.advanced_features_service import AdvancedFeaturesService
from app.db.repositories.claim_repo import ClaimRepository
from app.schemas.claim import ClaimProcessResponse
from app.utils.logger import logger
from app.utils.scoring import compute_overall_severity_score


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
        self.advanced_features_service = AdvancedFeaturesService()

    @staticmethod
    def _compute_damage_severity_score(damage_zones: List[dict]) -> int | None:
        if not damage_zones:
            return None
        return compute_overall_severity_score(damage_zones)

    async def process_claim(
        self,
        claim_id: str,
        user_id: str,
        vehicle_company: str | None = None,
        vehicle_model: str | None = None,
    ) -> ClaimProcessResponse:
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
            effective_vehicle_company = vehicle_company or claim.get("vehicle_company")
            effective_vehicle_model = vehicle_model or claim.get("vehicle_model")

            # 2. Damage Detection
            logger.info(f"[{claim_id[:8]}] Running damage detection...")
            damage_zones, overlay_images = await self.damage_service.detect_damage_with_overlays(image_urls)

            processed_image_urls = image_urls.copy()
            if overlay_images:
                storage_service = StorageService()
                processed_image_urls = []

                for idx, original_url in enumerate(image_urls):
                    overlay = overlay_images.get(original_url)
                    if not overlay:
                        processed_image_urls.append(original_url)
                        continue

                    try:
                        overlay_url = await storage_service.upload_processed_image(
                            image_bytes=overlay,
                            user_id=user_id,
                            claim_id=claim_id,
                            index=idx,
                        )
                        processed_image_urls.append(overlay_url)
                    except Exception as e:
                        logger.error(
                            f"[{claim_id[:8]}] Failed to upload processed image {idx + 1}: {e}"
                        )
                        processed_image_urls.append(original_url)
            else:
                logger.warning(
                    f"[{claim_id[:8]}] No YOLO overlay images generated; keeping original image URLs"
                )

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
                damage_zones,
                vehicle_company=effective_vehicle_company,
                vehicle_model=effective_vehicle_model,
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

            avg_confidence = 0.0
            if damage_zones:
                avg_confidence = sum(float(d.confidence) for d in damage_zones) / len(damage_zones)

            # 6. Decision Engine
            logger.info(f"[{claim_id[:8]}] Making decision...")
            decision_result = self.decision_service.make_decision(
                fraud_score=fraud_result.fraud_score,
                cost_total=cost_total,
                fraud_flags=fraud_result.flags,
                avg_confidence=avg_confidence,
            )

            damage_zone_dicts = [d.model_dump() for d in damage_zones]
            repair_replace_recommendation = self.advanced_features_service.recommend_repair_action(
                damage_zone_dicts,
                cost_total,
            )
            repair_time_estimate = self.advanced_features_service.estimate_repair_time(
                damage_zone_dicts
            )
            coverage_summary = self.advanced_features_service.compute_coverage_summary(
                claim,
                cost_total,
            )
            garage_recommendations = self.advanced_features_service.recommend_garages(
                damage_zone_dicts,
                claim.get("location"),
            )
            manual_review_required, manual_review_reason = self.advanced_features_service.should_escalate(
                fraud_result.fraud_score,
                avg_confidence,
            )

            # 7. Persist results
            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.claim_repo.update_processed(
                claim_id=claim_id,
                image_urls=processed_image_urls,
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
            damage_severity_score = self._compute_damage_severity_score(damage_zone_dicts)

            return ClaimProcessResponse(
                id=claim_id,
                user_id=user_id,
                image_urls=processed_image_urls,
                user_description=claim.get("user_description"),
                policy_number=claim["policy_number"],
                vehicle_company=effective_vehicle_company,
                vehicle_model=effective_vehicle_model,
                status="processed",
                damage_zones=damage_zone_dicts,
                damage_severity_score=damage_severity_score,
                ai_explanation=ai_explanation,
                cost_breakdown=cost_breakdown_dicts,
                cost_total=cost_total,
                fraud_score=fraud_result.fraud_score,
                fraud_flags=fraud_result.flags,
                decision=decision_result.decision,
                decision_confidence=decision_result.confidence,
                risk_level=decision_result.risk_level,
                repair_replace_recommendation=repair_replace_recommendation,
                manual_review_required=manual_review_required,
                manual_review_reason=manual_review_reason,
                repair_time_estimate=repair_time_estimate,
                coverage_summary=coverage_summary,
                garage_recommendations=garage_recommendations,
                fraud_signal_breakdown={
                    "reuse_score": fraud_result.reuse_score,
                    "ai_gen_score": fraud_result.ai_gen_score,
                    "metadata_anomaly": fraud_result.metadata_anomaly,
                    "avg_confidence": round(avg_confidence, 3),
                },
                created_at=str(claim["created_at"]),
                processed_at=str(claim.get("processed_at", "")),
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            logger.error(f"[{claim_id[:8]}] Processing failed: {e}")
            await self.claim_repo.update_status(claim_id, "error")
            raise
