import os
import sys
from ultralytics import YOLO

def main():
    if len(sys.argv) < 2:
        print("Usage: python predict.py <path_to_image>")
        return

    image_path = sys.argv[1]
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "best.pt")

    if not os.path.exists(model_path):
        print(f"Model path {model_path} does not exist. Please train model or provide weights.")
        return

    model = YOLO(model_path)
    results = model.predict(source=image_path, conf=0.25)

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            print(f"Class: {cls_id}, Conf: {conf:.2f}, Box: {xyxy}")

if __name__ == "__main__":
    main()
