import os
import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any
from app.config import settings

# Standard Civic Issue Category Map
CLASS_MAP = {
    0: "pothole",
    1: "road_damage",
    2: "garbage",
    3: "drainage",
    4: "broken_streetlight"
}

class CivicIssueDetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.abspath(settings.MODEL_PATH)
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            self.model = None
            return

        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            print(f"[YOLO AI Detector Loaded]: Model successfully loaded from {self.model_path}")
        except Exception as e:
            print(f"[YOLO Loading Error]: Failed to load model weights: {e}")
            self.model = None

    def is_ready(self) -> bool:
        return self.model is not None and os.path.exists(self.model_path)

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        if not self.is_ready():
            raise RuntimeError("AI model weights are not configured. Please provide MODEL_PATH/best.pt.")

        # Load image with PIL & convert to RGB numpy array
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        # Run YOLO object detection inference
        results = self.model.predict(
            source=image_np,
            conf=settings.CONF_THRESHOLD,
            verbose=False
        )

        detections = []

        if len(results) > 0:
            boxes = results[0].boxes
            for box in boxes:
                # Extract bounding box coordinates [x1, y1, x2, y2]
                xyxy = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])

                # Confidence and Class index
                confidence = round(float(box.conf[0].cpu().numpy()), 2)
                cls_idx = int(box.cls[0].cpu().numpy())

                # Resolve class name from mapping or model names
                class_name = CLASS_MAP.get(cls_idx)
                if not class_name and hasattr(self.model, 'names') and cls_idx in self.model.names:
                    class_name = self.model.names[cls_idx]
                if not class_name:
                    class_name = f"issue_{cls_idx}"

                detections.append({
                    "className": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2)
                    }
                })

        return detections

detector_instance = CivicIssueDetector()
