import os
import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any
from app.config import settings

MODELS_CONFIG = {
    "pothole": "models/pothole_roaddamage/best.pt",
    "road_damage": "models/pothole_roaddamage/best_road.pt",
    "garbage_overflow": "models/garbage_overflow/best.pt",
    "dead_animal_broken_tree": "models/dead_animal_broken_tree/best.pt"
}

class CivicIssueDetector:
    def __init__(self):
        self.models = {}
        self._load_models()

    def _load_models(self):
        try:
            from ultralytics import YOLO
            for model_name, relative_path in MODELS_CONFIG.items():
                model_path = os.path.abspath(relative_path)
                if os.path.exists(model_path):
                    try:
                        self.models[model_name] = YOLO(model_path)
                        print(f"[YOLO AI Detector Loaded]: {model_name} model successfully loaded from {model_path}")
                    except Exception as e:
                        print(f"[YOLO Loading Error]: Failed to load {model_name} model: {e}")
                else:
                    print(f"[YOLO Missing]: Model {model_name} not found at {model_path}")
        except ImportError:
            print("[YOLO Error]: ultralytics not installed.")

    def is_ready(self) -> bool:
        return len(self.models) > 0

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        if not self.is_ready():
            raise RuntimeError("No AI model weights are configured.")

        # Load image with PIL & convert to RGB numpy array
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        all_detections = []

        for model_name, model in self.models.items():
            try:
                results = model.predict(
                    source=image_np,
                    conf=settings.CONF_THRESHOLD,
                    verbose=False
                )
                
                if len(results) > 0:
                    boxes = results[0].boxes
                    for box in boxes:
                        xyxy = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                        confidence = round(float(box.conf[0].cpu().numpy()), 2)
                        cls_idx = int(box.cls[0].cpu().numpy())

                        class_name = None
                        if hasattr(model, 'names') and cls_idx in model.names:
                            class_name = model.names[cls_idx].lower().replace(" ", "_")
                        
                        # Fallback or sanitization if names are generic
                        if not class_name or class_name.startswith("class_") or class_name.isnumeric():
                            if model_name == "pothole":
                                class_name = "pothole"
                            elif model_name == "road_damage":
                                class_name = "road_damage"
                            elif model_name == "garbage_overflow":
                                class_name = "garbage_overflow"
                            elif model_name == "dead_animal_broken_tree":
                                class_name = "dead_animal" if cls_idx == 0 else "broken_tree"
                            else:
                                class_name = f"{model_name}_{cls_idx}"

                        all_detections.append({
                            "category": class_name,
                            "confidence": confidence,
                            "bbox": {
                                "x1": round(x1, 2),
                                "y1": round(y1, 2),
                                "x2": round(x2, 2),
                                "y2": round(y2, 2)
                            },
                            "model": model_name
                        })
            except Exception as e:
                print(f"[Inference Error] Failed to run {model_name}: {str(e)}")
                # Continue with other models

        return all_detections

detector_instance = CivicIssueDetector()
