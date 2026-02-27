from typing import List, Optional
from app.ml.clip_embedder import CLIPEmbedder
from app.db.repositories.claim_repo import ClaimRepository
from app.db.repositories.fraud_repo import FraudRepository
from app.schemas.damage import DamageZone
from app.schemas.fraud import FraudAnalysis
from app.utils.constants import (
    FRAUD_SIMILARITY_THRESHOLD,
    FRAUD_FREQUENCY_LIMIT,
    FRAUD_FREQUENCY_MONTHS,
)
from app.utils.logger import logger
from app.utils.scoring import compute_fraud_score, fraud_risk_band


class FraudService:
    """Multi-signal fraud scoring for insurance claims."""

    def __init__(
        self,
        clip_embedder: CLIPEmbedder,
        claim_repo: ClaimRepository,
        fraud_repo: FraudRepository,
    ):
        self.clip_embedder = clip_embedder
        self.claim_repo = claim_repo
        self.fraud_repo = fraud_repo

    async def analyze(
        self,
        claim_id: str,
        user_id: str,
        image_urls: List[str],
        damage_zones: List[DamageZone],
        user_description: Optional[str] = None,
    ) -> FraudAnalysis:
        """
        Multi-signal fraud analysis:
        1. Image similarity (CLIP embeddings) — duplicate detection
        2. Claim frequency analysis
        3. Damage-description inconsistency
        """
        reuse_score = 0.0
        ai_gen_score = 0.0
        metadata_anomaly = 0.0
        flags: List[str] = []

        # --- Signal 1: Image Similarity (CLIP) ---
        if self.clip_embedder.is_available:
            for url in image_urls:
                try:
                    embedding = await self.clip_embedder.get_embedding(url)

                    match = await self.fraud_repo.find_similar_embedding(
                        embedding,
                        threshold=FRAUD_SIMILARITY_THRESHOLD,
                        exclude_claim_id=claim_id,
                    )

                    if match:
                        reuse_score = max(reuse_score, float(match["similarity"]))
                        flags.append(
                            f"Duplicate image detected "
                            f"(similarity: {match['similarity']:.2f}, "
                            f"matched claim: {match['claim_id'][:8]}...)"
                        )

                    # Store embedding for future comparisons
                    await self.fraud_repo.store_embedding(
                        claim_id=claim_id,
                        embedding=embedding,
                        similarity_score=match["similarity"] if match else 0.0,
                        matched_claim_id=match["claim_id"] if match else None,
                    )
                except Exception as e:
                    logger.warning(f"CLIP fraud check failed for {url}: {e}")
        else:
            logger.info("CLIP not available, skipping image similarity check")

        # --- Signal 2: Claim Frequency ---
        try:
            recent_count = await self.claim_repo.count_recent_claims(
                user_id=user_id, months=FRAUD_FREQUENCY_MONTHS
            )

            if recent_count > FRAUD_FREQUENCY_LIMIT:
                overflow = recent_count - FRAUD_FREQUENCY_LIMIT
                frequency_anomaly = min(overflow / 3.0, 1.0)
                metadata_anomaly = max(metadata_anomaly, frequency_anomaly)
                flags.append(
                    f"High claim frequency: {recent_count} claims "
                    f"in {FRAUD_FREQUENCY_MONTHS} months"
                )
        except Exception as e:
            logger.warning(f"Claim frequency check failed: {e}")

        # --- Signal 3: Damage-Description Inconsistency ---
        if user_description and damage_zones:
            inconsistency = self._check_inconsistency(damage_zones, user_description)
            if inconsistency:
                metadata_anomaly = max(metadata_anomaly, 1.0)
                flags.append(inconsistency)

        score = compute_fraud_score(
            reuse_score=reuse_score,
            ai_gen_score=ai_gen_score,
            metadata_anomaly=metadata_anomaly,
        )
        risk = fraud_risk_band(score)
        flags.append(
            "Fraud components — "
            f"reuse={reuse_score:.2f}, ai_gen={ai_gen_score:.2f}, metadata={metadata_anomaly:.2f}, "
            f"risk={risk}"
        )

        logger.info(
            f"Fraud analysis for claim {claim_id}: score={score}, risk={risk}, flags={len(flags)}"
        )
        return FraudAnalysis(fraud_score=score, flags=flags)

    def _check_inconsistency(
        self, damage_zones: List[DamageZone], description: str
    ) -> Optional[str]:
        """Check if user description contradicts detected severity."""
        desc_lower = description.lower()

        has_severe = any(z.severity == "severe" for z in damage_zones)
        user_says_minor = any(
            word in desc_lower
            for word in ["minor", "small", "scratch", "little", "slight", "tiny"]
        )

        if has_severe and user_says_minor:
            return (
                "Inconsistency: User describes minor damage "
                "but AI detected severe damage"
            )

        return None
