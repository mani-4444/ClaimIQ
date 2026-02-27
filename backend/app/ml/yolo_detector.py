import io
import httpx
from PIL import Image
from ultralytics import YOLO
from typing import List, Dict, Tuple, Optional
from app.config import resolve_yolo_model_path
from app.utils.logger import logger
from app.utils.constants import MAX_IMAGE_DIMENSION


class YOLODetector:
    """Wrapper around YOLOv8 model for vehicle damage zone detection."""

    # Map YOLO class names to our 4 vehicle zones
    CLASS_TO_ZONE = {
        # Front zone
        "front_bumper": "Front",
        "hood": "Front",
        "headlight": "Front",
        "grille": "Front",
        "windshield": "Front",
        "front": "Front",
        # Rear zone
        "rear_bumper": "Rear",
        "trunk": "Rear",
        "taillight": "Rear",
        "rear_windshield": "Rear",
        "rear": "Rear",
        # Left Side zone
        "left_door": "Left Side",
        "left_fender": "Left Side",
        "left_mirror": "Left Side",
        "left_quarter_panel": "Left Side",
        "left_side": "Left Side",
        # Right Side zone
        "right_door": "Right Side",
        "right_fender": "Right Side",
        "right_mirror": "Right Side",
        "right_quarter_panel": "Right Side",
        "right_side": "Right Side",
        # Generic damage classes (fallback mapping by bbox position)
        "damage": None,
        "dent": None,
        "scratch": None,
        "crack": None,
    }

    def __init__(self):
        model_path = resolve_yolo_model_path()
        self.model_path = model_path
        self.model = YOLO(model_path)
        logger.info(f"YOLO model loaded from {model_path}")

    async def detect(self, image_url: str) -> List[Dict]:
        """Download image and run YOLO detection, returning zone-level results."""
        detections, _ = await self.detect_with_annotated_image(image_url)
        return detections

    async def detect_with_annotated_image(
        self, image_url: str
    ) -> Tuple[List[Dict], Optional[bytes]]:
        """Run detection and return both detections and a YOLO-annotated JPEG image."""
        logger.info(f"Running YOLO inference with model: {self.model_path}")
        # Download image
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()

        image = Image.open(io.BytesIO(resp.content)).convert("RGB")

        # Resize if too large
        if max(image.size) > MAX_IMAGE_DIMENSION:
            ratio = MAX_IMAGE_DIMENSION / max(image.size)
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size)

        img_area = image.width * image.height

        # Run inference
        results = self.model.predict(source=image, conf=0.25, iou=0.45, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox_area = (x2 - x1) * (y2 - y1)
                class_name = result.names[int(box.cls[0])]
                confidence = float(box.conf[0])
                area_ratio = bbox_area / img_area if img_area > 0 else 0

                # Map class to zone
                zone = self.CLASS_TO_ZONE.get(class_name.lower())
                if zone is None:
                    # Fallback: infer zone from bbox position
                    zone = self._infer_zone_from_bbox(
                        x1, y1, x2, y2, image.width, image.height
                    )

                detections.append({
                    "zone": zone,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                    "area_ratio": area_ratio,
                })

        annotated_bytes: Optional[bytes] = None
        try:
            if results:
                plotted = results[0].plot()  # BGR ndarray
                if plotted is not None:
                    plotted_image = Image.fromarray(plotted[:, :, ::-1])
                    buf = io.BytesIO()
                    plotted_image.save(buf, format="JPEG", quality=90)
                    annotated_bytes = buf.getvalue()
        except Exception as e:
            logger.warning(f"Failed to render YOLO annotated image for {image_url}: {e}")

        logger.info(f"YOLO inference complete: {len(detections)} detections")
        return detections, annotated_bytes

    def _infer_zone_from_bbox(
        self, x1: float, y1: float, x2: float, y2: float, img_w: int, img_h: int
    ) -> str:
        """Fallback: infer vehicle zone from bounding box position in image."""
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        rel_x = cx / img_w
        rel_y = cy / img_h

        # Simple heuristic: divide image into regions
        if rel_y < 0.5:
            # Upper half — more likely front or rear depending on x
            if rel_x < 0.35:
                return "Left Side"
            elif rel_x > 0.65:
                return "Right Side"
            else:
                return "Front"
        else:
            if rel_x < 0.35:
                return "Left Side"
            elif rel_x > 0.65:
                return "Right Side"
            else:
                return "Rear"
