from typing import List
from app.ml.yolo_detector import YOLODetector
from app.schemas.damage import DamageZone
from app.utils.logger import logger


class DamageService:
    """Detect damage zones and severity from vehicle images."""

    def __init__(self, detector: YOLODetector):
        self.detector = detector

    async def detect_damage(self, image_urls: List[str]) -> List[DamageZone]:
        """Run YOLO detection on all uploaded images and return zone-level results."""
        damages, _ = await self.detect_damage_with_overlays(image_urls)
        return damages

    async def detect_damage_with_overlays(
        self, image_urls: List[str]
    ) -> tuple[List[DamageZone], dict[str, bytes]]:
        """Run YOLO detection and return zone results + annotated image bytes per source URL."""
        all_damages: List[DamageZone] = []
        overlay_images: dict[str, bytes] = {}

        for url in image_urls:
            try:
                detections, annotated_bytes = await self.detector.detect_with_annotated_image(url)

                if annotated_bytes:
                    overlay_images[url] = annotated_bytes

                for det in detections:
                    severity = self._classify_severity(
                        det["confidence"], det.get("area_ratio", 0)
                    )
                    damage_zone = DamageZone(
                        zone=det["zone"],
                        severity=severity,
                        confidence=round(det["confidence"], 3),
                        bounding_box=det["bbox"],
                    )
                    all_damages.append(damage_zone)
            except Exception as e:
                logger.error(f"Damage detection failed for {url}: {e}")

        # Deduplicate: keep highest confidence detection per zone
        unique = self._deduplicate(all_damages)
        logger.info(f"Detected {len(unique)} damaged zones from {len(image_urls)} images")
        return unique, overlay_images

    def _classify_severity(self, confidence: float, area_ratio: float) -> str:
        """Classify severity based on detection confidence and damage area."""
        if area_ratio > 0.3 or confidence > 0.9:
            return "severe"
        elif area_ratio > 0.15 or confidence > 0.7:
            return "moderate"
        return "minor"

    def _deduplicate(self, damages: List[DamageZone]) -> List[DamageZone]:
        """Keep highest confidence detection per zone."""
        best: dict[str, DamageZone] = {}
        for d in damages:
            if d.zone not in best or d.confidence > best[d.zone].confidence:
                best[d.zone] = d
        return list(best.values())
