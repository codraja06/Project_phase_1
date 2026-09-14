# AI Model Weights Directory

This directory stores the trained Ultralytics YOLO model file `best.pt`.

## Model Specification

- **Architecture**: Ultralytics YOLOv8 (yolov8n / yolov8s)
- **Target Categories**:
  - `0`: pothole
  - `1`: road_damage
  - `2`: garbage
  - `3`: drainage
  - `4`: broken_streetlight

## How to Configure

1. Place your trained model file at `ai-service/models/best.pt`.
2. Set the `MODEL_PATH` environment variable in `ai-service/.env` or system environment if located elsewhere.

If `best.pt` is missing, the AI service will safely return an explicit setup error:
`"AI model weights are not configured. Please provide MODEL_PATH/best.pt."`

To train your own model on RDD2022 or custom civic issue datasets, see the `ai-service/training` scripts.
