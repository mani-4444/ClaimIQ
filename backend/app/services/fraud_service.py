from typing import List, Optional
import io
import httpx
from PIL import Image, ExifTags
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

        # --- Signal 1: Image Similarity (CLIP / hash fallback) ---
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

        # Fallback duplicate detection using perceptual hash against user's past claims
        try:
            hash_similarity = await self._hash_duplicate_similarity(
                user_id=user_id,
                current_claim_id=claim_id,
                image_urls=image_urls,
            )
            if hash_similarity >= 0.9:
                reuse_score = max(reuse_score, 0.8)
                flags.append(
                    f"Hash-based duplicate likelihood detected (similarity: {hash_similarity:.2f})"
                )
        except Exception as e:
            logger.warning(f"Hash duplicate check failed: {e}")

        # --- Signal 1b: AI-generated / manipulated image signal ---
        try:
            ai_gen_score = await self._estimate_ai_gen_score(image_urls)
            if ai_gen_score > 0.7:
                flags.append("Potential synthetic/manipulated image signal detected")
        except Exception as e:
            logger.warning(f"AI-gen metadata check failed: {e}")

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
        return FraudAnalysis(
            fraud_score=score,
            flags=flags,
            reuse_score=round(reuse_score, 3),
            ai_gen_score=round(ai_gen_score, 3),
            metadata_anomaly=round(metadata_anomaly, 3),
        )

    @staticmethod
    def _dhash(image: Image.Image, hash_size: int = 8) -> int:
        gray = image.convert("L").resize((hash_size + 1, hash_size))
        pixels = list(gray.getdata())
        value = 0
        for row in range(hash_size):
            for col in range(hash_size):
                left = pixels[row * (hash_size + 1) + col]
                right = pixels[row * (hash_size + 1) + col + 1]
                value = (value << 1) | (1 if left > right else 0)
        return value

    @staticmethod
    def _hamming_distance(a: int, b: int) -> int:
        return (a ^ b).bit_count()

    async def _download_image(self, url: str) -> Optional[Image.Image]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content))

    async def _hash_duplicate_similarity(
        self,
        user_id: str,
        current_claim_id: str,
        image_urls: List[str],
    ) -> float:
        current_hashes: List[int] = []
        for url in image_urls:
            try:
                image = await self._download_image(url)
                if image:
                    current_hashes.append(self._dhash(image))
            except Exception:
                continue

        if not current_hashes:
            return 0.0

        past_claims = await self.claim_repo.list_by_user(user_id)
        best_similarity = 0.0

        for claim in past_claims:
            if str(claim.get("id")) == str(current_claim_id):
                continue
            for past_url in claim.get("image_urls", []):
                try:
                    past_image = await self._download_image(past_url)
                    if not past_image:
                        continue
                    past_hash = self._dhash(past_image)
                    for curr_hash in current_hashes:
                        distance = self._hamming_distance(curr_hash, past_hash)
                        similarity = 1.0 - (distance / 64.0)
                        best_similarity = max(best_similarity, similarity)
                except Exception:
                    continue

        return float(best_similarity)

    async def _estimate_ai_gen_score(self, image_urls: List[str]) -> float:
        suspicious_count = 0.0
        total = 0

        software_tag_names = {"Software", "ProcessingSoftware", "HostComputer"}

        for url in image_urls:
            try:
                image = await self._download_image(url)
                if image is None:
                    continue
                total += 1

                exif = image.getexif() if hasattr(image, "getexif") else None
                if not exif or len(exif) == 0:
                    suspicious_count += 0.4
                    continue

                software_text = ""
                for k, v in exif.items():
                    tag_name = ExifTags.TAGS.get(k, str(k))
                    if tag_name in software_tag_names:
                        software_text += f" {v}".lower()

                suspicious_keywords = [
                    "photoshop",
                    "gimp",
                    "canva",
                    "midjourney",
                    "stable diffusion",
                    "dall-e",
                    "adobe",
                ]
                if any(keyword in software_text for keyword in suspicious_keywords):
                    suspicious_count += 0.8
            except Exception:
                continue

        if total == 0:
            return 0.0

        return min(1.0, suspicious_count / total)

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
