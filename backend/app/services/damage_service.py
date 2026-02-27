from typing import Any, List
from app.ml.yolo_detector import YOLODetector
from app.schemas.damage import DamageZone
from app.utils.logger import logger


class DamageService:
    """Detect damage zones and severity from vehicle images."""

    CLASS_TO_DAMAGE_TYPE = {
        "scratch": "scratch",
        "dent": "dent",
        "crack": "crack",
        "windshield": "broken glass",
        "rear_windshield": "broken glass",
        "headlight": "broken headlight/taillight",
        "taillight": "broken headlight/taillight",
        "front_bumper": "bumper damage",
        "rear_bumper": "bumper damage",
        "bumper": "bumper damage",
    }

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
                    zone_metrics.setdefault(
                        zone, {"conf": [], "area": [], "bbox": [], "class": []}
                    )
                    zone_metrics[zone]["conf"].append(float(det["confidence"]))
                    zone_metrics[zone]["area"].append(float(det.get("area_ratio", 0)))
                    zone_metrics[zone]["bbox"].append(det["bbox"])
                    zone_metrics[zone]["class"].append(str(det.get("class_name", "")))
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
        self, zone_metrics: dict[str, dict[str, List[Any]]]
    ) -> List[DamageZone]:
        """Aggregate detections into stable per-zone, per-damage-type entries."""
        aggregated: List[DamageZone] = []

        for zone, metrics in zone_metrics.items():
            conf_list = metrics.get("conf", [])
            area_list = metrics.get("area", [])
            bbox_list = metrics.get("bbox", [])
            class_list = metrics.get("class", [])

            if not conf_list:
                continue

            grouped_indices: dict[str, List[int]] = {}
            for idx, raw_name in enumerate(class_list):
                mapped_type = self._map_class_to_damage_type(raw_name)
                if mapped_type:
                    grouped_indices.setdefault(mapped_type, []).append(idx)

            if not grouped_indices:
                fallback_type = self._infer_damage_type(class_list)
                if fallback_type:
                    grouped_indices[fallback_type] = list(range(len(conf_list)))

            for damage_type, indices in grouped_indices.items():
                if not indices:
                    continue

                type_conf = [conf_list[i] for i in indices if i < len(conf_list)]
                type_area = [area_list[i] for i in indices if i < len(area_list)]

                if not type_conf:
                    continue

                mean_conf = sum(type_conf) / len(type_conf)
                max_conf = max(type_conf)
                zone_conf = (0.7 * max_conf) + (0.3 * mean_conf)
                zone_area = min(sum(type_area), 1.0) if type_area else 0.0
                severity = self._classify_severity(zone_conf, zone_area)

                best_local_idx = type_conf.index(max_conf)
                best_global_idx = indices[best_local_idx]
                best_bbox = (
                    bbox_list[best_global_idx]
                    if best_global_idx < len(bbox_list)
                    else [0.0, 0.0, 0.0, 0.0]
                )

                unique_classes = sorted(
                    {
                        class_list[i].strip().lower().replace("-", "_")
                        for i in indices
                        if i < len(class_list)
                        and isinstance(class_list[i], str)
                        and class_list[i].strip()
                    }
                )

                aggregated.append(
                    DamageZone(
                        zone=zone,
                        severity=severity,
                        damage_type=damage_type,
                        confidence=round(zone_conf, 3),
                        bounding_box=best_bbox,
                        yolo_classes=unique_classes,
                        detections_count=len(indices),
                    )
                )

        return sorted(aggregated, key=lambda d: d.confidence, reverse=True)

    def _map_class_to_damage_type(self, raw_name: str | None) -> str | None:
        if not raw_name:
            return None

        class_name = raw_name.strip().lower().replace("-", "_")
        if not class_name:
            return None

        mapped = self.CLASS_TO_DAMAGE_TYPE.get(class_name)
        if mapped:
            return mapped

        if "scratch" in class_name:
            return "scratch"
        if "dent" in class_name:
            return "dent"
        if "crack" in class_name:
            return "crack"
        if "glass" in class_name or "windshield" in class_name:
            return "broken glass"
        if "headlight" in class_name or "taillight" in class_name:
            return "broken headlight/taillight"
        if "bumper" in class_name:
            return "bumper damage"

        return None

    def _infer_damage_type(self, class_names: List[str]) -> str | None:
        if not class_names:
            return None

        counts: dict[str, int] = {}
        for raw_name in class_names:
            mapped = self._map_class_to_damage_type(raw_name)

            if mapped:
                counts[mapped] = counts.get(mapped, 0) + 1

        if not counts:
            for raw_name in class_names:
                class_name = raw_name.strip().lower().replace("-", "_")
                if class_name:
                    return class_name.replace("_", " ")
            return None
        return max(counts.items(), key=lambda item: item[1])[0]

    def _deduplicate(self, damages: List[DamageZone]) -> List[DamageZone]:
        """Keep highest confidence detection per zone."""
        best: dict[str, DamageZone] = {}
        for d in damages:
            if d.zone not in best or d.confidence > best[d.zone].confidence:
                best[d.zone] = d
        return list(best.values())
