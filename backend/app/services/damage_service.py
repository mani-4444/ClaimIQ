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
        zone_metrics: dict[str, dict[str, List[float]]] = {}
        overlay_images: dict[str, bytes] = {}

        for url in image_urls:
            try:
                detections, annotated_bytes = await self.detector.detect_with_annotated_image(url)

                if annotated_bytes:
                    overlay_images[url] = annotated_bytes

                for det in detections:
                    zone = det["zone"]
                    zone_metrics.setdefault(zone, {"conf": [], "area": [], "bbox": []})
                    zone_metrics[zone]["conf"].append(float(det["confidence"]))
                    zone_metrics[zone]["area"].append(float(det.get("area_ratio", 0)))
                    zone_metrics[zone]["bbox"].append(det["bbox"])
            except Exception as e:
                logger.error(f"Damage detection failed for {url}: {e}")

        aggregated = self._aggregate_zone_metrics(zone_metrics)
        logger.info(f"Detected {len(aggregated)} damaged zones from {len(image_urls)} images")
        return aggregated, overlay_images

    def _classify_severity(self, confidence: float, area_ratio: float) -> str:
        """Classify severity based on detection confidence and damage area."""
        if area_ratio >= 0.22 or (confidence >= 0.85 and area_ratio >= 0.08):
            return "severe"
        elif area_ratio >= 0.1 or confidence >= 0.65:
            return "moderate"
        return "minor"

    def _aggregate_zone_metrics(
        self, zone_metrics: dict[str, dict[str, List[float]]]
    ) -> List[DamageZone]:
        """Aggregate multiple detections per zone into a stable confidence/severity."""
        aggregated: List[DamageZone] = []

        for zone, metrics in zone_metrics.items():
            conf_list = metrics.get("conf", [])
            area_list = metrics.get("area", [])
            bbox_list = metrics.get("bbox", [])

            if not conf_list:
                continue

            mean_conf = sum(conf_list) / len(conf_list)
            max_conf = max(conf_list)
            zone_conf = (0.7 * max_conf) + (0.3 * mean_conf)
            zone_area = min(sum(area_list), 1.0) if area_list else 0.0
            severity = self._classify_severity(zone_conf, zone_area)

            best_bbox_idx = conf_list.index(max_conf)
            best_bbox = bbox_list[best_bbox_idx] if bbox_list else [0.0, 0.0, 0.0, 0.0]

            aggregated.append(
                DamageZone(
                    zone=zone,
                    severity=severity,
                    confidence=round(zone_conf, 3),
                    bounding_box=best_bbox,
                )
            )

        return sorted(aggregated, key=lambda d: d.confidence, reverse=True)

    def _deduplicate(self, damages: List[DamageZone]) -> List[DamageZone]:
        """Keep highest confidence detection per zone."""
        best: dict[str, DamageZone] = {}
        for d in damages:
            if d.zone not in best or d.confidence > best[d.zone].confidence:
                best[d.zone] = d
        return list(best.values())
