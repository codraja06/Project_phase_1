import os
import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any
from app.config import settings

# Base directory for ai-service (contains models/, app/, etc.)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODELS_CONFIG = {
    "pothole": "models/pothole_roaddamage/best.pt",
    "road_damage": "models/pothole_roaddamage/best_road.pt",
    "garbage_overflow": "models/garbage_overflow/best.pt",
    "dead_animal_broken_tree": "models/dead_animal_broken_tree/best.pt"
}

# Classes that represent normal, non-hazard street conditions to filter out
NON_HAZARD_CLASSES = {
    "healthy_trash_can",
    "trash_can_closed",
    "trash_can_open",
    "empty_bin",
    "full_bin",
}

# Mapping raw model classes to standardized application categories
CLASS_MAPPING = {
    "pothole": "pothole",
    "road_damage": "road_damage",
    "crack": "road_damage",
    "trash_over_flow": "garbage_overflow",
    "overflowing_bin": "garbage_overflow",
    "garbage_overflow": "garbage_overflow",
    "broken_trash_can": "garbage",
    "garbage": "garbage",
    "dead_animal": "dead_animal",
    "broken_tree": "broken_tree",
    "broken_streetlight": "broken_streetlight",
    "drainage": "drainage_problem",
    "drainage_problem": "drainage_problem",
    "water_leakage": "water_leakage",
}


def calculate_iou(box1: Dict[str, float], box2: Dict[str, float]) -> float:
    """Calculates Intersection over Union (IoU) between two bounding boxes."""
    x_left = max(box1["x1"], box2["x1"])
    y_top = max(box1["y1"], box2["y1"])
    x_right = min(box1["x2"], box2["x2"])
    y_bottom = min(box1["y2"], box2["y2"])

    if x_right <= x_left or y_bottom <= y_top:
        return 0.0

    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    box1_area = (box1["x2"] - box1["x1"]) * (box1["y2"] - box1["y1"])
    box2_area = (box2["x2"] - box2["x1"]) * (box2["y2"] - box2["y1"])
    union_area = box1_area + box2_area - intersection_area

    return intersection_area / union_area if union_area > 0 else 0.0


def apply_nms(detections: List[Dict[str, Any]], iou_threshold: float = 0.45) -> List[Dict[str, Any]]:
    """Suppresses duplicate and overlapping bounding boxes across models."""
    if not detections:
        return []

    # Sort detections by confidence descending
    sorted_detections = sorted(detections, key=lambda d: d.get("confidence", 0), reverse=True)
    kept_detections: List[Dict[str, Any]] = []

    for det in sorted_detections:
        should_keep = True
        for kept in kept_detections:
            iou = calculate_iou(det["bbox"], kept["bbox"])
            if iou > iou_threshold:
                should_keep = False
                break
        if should_keep:
            kept_detections.append(det)

    return kept_detections


class CivicIssueDetector:
    def __init__(self):
        self.models = {}
        self._load_models()

    def _resolve_path(self, relative_path: str) -> str:
        """Resolves model path whether running from ai-service or repository root."""
        # 1. Try relative to ai-service base directory
        candidate = os.path.join(BASE_DIR, relative_path)
        if os.path.exists(candidate):
            return os.path.abspath(candidate)

        # 2. Try relative to current working directory
        candidate = os.path.abspath(relative_path)
        if os.path.exists(candidate):
            return candidate

        # 3. Try with ai-service prefix if started from root
        candidate = os.path.abspath(os.path.join("ai-service", relative_path))
        if os.path.exists(candidate):
            return candidate

        return os.path.abspath(candidate)

    def _load_models(self):
        try:
            from ultralytics import YOLO
            for model_name, relative_path in MODELS_CONFIG.items():
                model_path = self._resolve_path(relative_path)
                if os.path.exists(model_path):
                    try:
                        self.models[model_name] = YOLO(model_path)
                        print(f"[YOLO AI Detector Loaded]: {model_name} model successfully loaded from {model_path}")
                    except Exception as e:
                        print(f"[YOLO Loading Error]: Failed to load {model_name} model: {e}")
                else:
                    print(f"[YOLO Missing]: Model {model_name} not found at {model_path}")

            # Fallback to single MODEL_PATH if configured and exists
            if not self.models and os.path.exists(settings.MODEL_PATH):
                try:
                    self.models["default"] = YOLO(settings.MODEL_PATH)
                    print(f"[YOLO AI Detector Loaded]: Default model loaded from {settings.MODEL_PATH}")
                except Exception as e:
                    print(f"[YOLO Loading Error]: Failed to load default model: {e}")
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

        raw_detections = []

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

                        raw_class = None
                        if hasattr(model, 'names') and cls_idx in model.names:
                            raw_class = str(model.names[cls_idx]).strip().lower().replace(" ", "_")

                        if not raw_class or raw_class.startswith("class_") or raw_class.isnumeric():
                            raw_class = model_name

                        # Filter out non-hazard conditions (healthy trash can, closed bin, empty bin, etc.)
                        if raw_class in NON_HAZARD_CLASSES:
                            continue

                        # Normalize to standardized application category
                        category = CLASS_MAPPING.get(raw_class, raw_class)

                        raw_detections.append({
                            "category": category,
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

        # Deduplicate overlapping detections across models and sort by confidence descending
        final_detections = apply_nms(raw_detections, iou_threshold=0.45)

        return final_detections


detector_instance = CivicIssueDetector()
