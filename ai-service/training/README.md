# AI Model Training Guide — CivicDetect Phase 1

This directory contains scripts and configuration files for training the YOLO object detection model used by the AI microservice.

---

## Overview

The AI service (`ai-service/app/detector.py`) loads a trained YOLO model from `ai-service/models/best.pt`. This guide explains how to train that model using the **RDD2022 (Road Damage Dataset 2022)** or a custom-annotated civic issue dataset.

> **Phase 1 Note:** For the initial demo, training primarily on **pothole** and **road_damage** classes is acceptable. The other categories (garbage, drainage, broken_streetlight) can be added in Phase 2 with additional data collection.

---

## Prerequisites

```bash
# Activate the AI service virtual environment
cd ai-service
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/macOS

pip install -r requirements.txt
```

---

## Step 1 — Obtain the Dataset

### Option A: RDD2022 (Recommended for Road Damage)

1. Download from the official IEEE DataPort or Kaggle:
   - Kaggle: https://www.kaggle.com/datasets/bafanametni/road-damage-dataset-2022
   - IEEE DataPort: https://ieee-dataport.org/competitions/road-damage-detection-and-classification

2. The dataset contains images with COCO-style annotations. You need to convert them to YOLO format.

3. After downloading, organize as:
   ```
   ai-service/training/data/
   ├── images/
   │   ├── train/   ← training images (.jpg)
   │   └── val/     ← validation images (.jpg)
   └── labels/
       ├── train/   ← YOLO .txt label files
       └── val/     ← YOLO .txt label files
   ```

### Option B: Custom Annotated Dataset

If you have your own civic issue images:
1. Annotate using [Roboflow](https://roboflow.com) (free tier) or [Label Studio](https://labelstud.io).
2. Export in **YOLOv8 format**.
3. Place in the `data/` folder as above.

### Option C: Roboflow Public Datasets

Search Roboflow Universe for "pothole" or "road damage" datasets that are pre-annotated and exportable in YOLO format:
- https://universe.roboflow.com/search?q=pothole
- https://universe.roboflow.com/search?q=road-damage

---

## Step 2 — Configure `dataset.yaml`

Edit `ai-service/training/dataset.yaml` to point to your data paths and confirm the class names match what your dataset uses.

---

## Step 3 — Run Training

```bash
cd ai-service/training
python train.py
```

Or use the ultralytics CLI directly:
```bash
yolo detect train data=dataset.yaml model=yolov8n.pt epochs=100 imgsz=640 batch=16
```

**Recommended hardware:** GPU with at least 4GB VRAM. For CPU-only training, reduce batch to 4–8 and expect ~10× slower training.

---

## Step 4 — Locate and Deploy Best Weights

After training, find the best model weights:
```
runs/detect/trainX/weights/best.pt
```

Copy to:
```bash
cp runs/detect/train/weights/best.pt ../models/best.pt
```

---

## Step 5 — Validate the Model

```python
# Quick validation test
from ultralytics import YOLO
model = YOLO("../models/best.pt")
results = model.val(data="dataset.yaml")
print(f"mAP50: {results.box.map50:.3f}")
print(f"mAP50-95: {results.box.map:.3f}")
```

---

## Step 6 — Test the Full AI Pipeline

With `best.pt` in place, start the AI service and test:

```bash
cd ai-service
uvicorn app.main:app --reload --port 8000
```

Then visit `http://localhost:8000/health` — it should show `"modelConfigured": true`.

Test detection with curl:
```bash
curl -X POST http://localhost:8000/predict \
  -F "image=@/path/to/test_pothole.jpg" \
  | python -m json.tool
```

---

## Class Mapping

The detector maps YOLO class indices to civic issue categories:

| Index | Class Name |
|-------|-----------|
| 0 | pothole |
| 1 | road_damage |
| 2 | garbage |
| 3 | drainage |
| 4 | broken_streetlight |

> **Important:** If you use the RDD2022 dataset, its class names differ (D00, D10, D20, D40). You must either remap them in `detector.py` or retrain with custom class names. See `detector.py`'s `CLASS_MAP` dictionary.

---

## Expected Performance (YOLOv8n on RDD2022)

| Metric | Approximate Value |
|--------|------------------|
| mAP50 | 0.55–0.70 |
| Inference time | 20–50ms per image (GPU) |
| Model size | ~6MB |

These values are rough estimates. Actual performance depends on dataset quality, size, and augmentation settings.
