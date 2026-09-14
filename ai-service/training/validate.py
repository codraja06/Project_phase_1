import os
from ultralytics import YOLO

def main():
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "best.pt")
    if not os.path.exists(model_path):
        print(f"Model path {model_path} does not exist. Please train model or provide weights.")
        return

    model = YOLO(model_path)
    yaml_path = os.path.join(os.path.dirname(__file__), "data.yaml")

    print(f"Validating YOLO model on dataset: {yaml_path}")
    metrics = model.val(data=yaml_path)

    print(f"mAP50-95: {metrics.box.map}")
    print(f"mAP50: {metrics.box.map50}")

if __name__ == "__main__":
    main()
