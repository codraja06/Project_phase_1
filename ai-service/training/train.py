"""
CivicDetect — YOLOv8 Training Script
======================================
Trains a YOLOv8 object detection model on civic issue datasets
(potholes, road damage, garbage, drainage, broken streetlights).

Usage:
    cd ai-service/training
    python train.py [--model yolov8n.pt] [--epochs 100] [--batch 16] [--device cpu]

After training, best.pt will be automatically copied to ../models/best.pt
"""

import argparse
import os
import sys
import shutil
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv8 for CivicDetect")
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="Base model: yolov8n.pt (nano), yolov8s.pt (small/better accuracy)",
    )
    parser.add_argument(
        "--data",
        type=str,
        default=str(Path(__file__).parent / "dataset.yaml"),
        help="Path to dataset YAML config",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs (100-200 recommended)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size. Reduce to 4-8 for CPU training",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size (640 is standard for YOLOv8)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="",
        help="Device: '' for auto-detect, 'cpu', '0' for first GPU",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=25,
        help="Early stopping patience (epochs without improvement)",
    )
    parser.add_argument(
        "--no-deploy",
        action="store_true",
        help="Skip auto-copying best.pt to ../models/",
    )
    return parser.parse_args()


def check_dataset(data_yaml: str):
    """Verify dataset config and data directories exist before training."""
    if not Path(data_yaml).exists():
        print(f"[ERROR] Dataset config not found: {data_yaml}")
        print("  Ensure dataset.yaml exists. See training/README.md for setup.")
        sys.exit(1)

    # Check expected data directories
    base = Path(__file__).parent / "data"
    required = [
        base / "images" / "train",
        base / "images" / "val",
        base / "labels" / "train",
        base / "labels" / "val",
    ]
    missing = [str(d) for d in required if not d.exists()]
    if missing:
        print("[ERROR] Missing required dataset directories:")
        for m in missing:
            print(f"  - {m}")
        print("\nRead training/README.md for dataset setup instructions.")
        sys.exit(1)

    train_imgs = list((base / "images" / "train").glob("*.jpg")) + \
                 list((base / "images" / "train").glob("*.png"))
    val_imgs = list((base / "images" / "val").glob("*.jpg")) + \
               list((base / "images" / "val").glob("*.png"))

    print(f"[INFO] Dataset: {len(train_imgs)} train images, {len(val_imgs)} val images")
    if not train_imgs:
        print("[ERROR] No training images found. Add .jpg/.png images to data/images/train/")
        sys.exit(1)


def main():
    args = parse_args()

    # Validate dataset before wasting GPU time
    check_dataset(args.data)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics not installed. Run: pip install ultralytics>=8.2.0")
        sys.exit(1)

    print("=" * 60)
    print("  CivicDetect — YOLOv8 Object Detection Training")
    print("=" * 60)
    print(f"  Base model : {args.model}")
    print(f"  Dataset    : {args.data}")
    print(f"  Epochs     : {args.epochs}")
    print(f"  Batch size : {args.batch}")
    print(f"  Image size : {args.imgsz}x{args.imgsz}")
    print(f"  Device     : {args.device or 'auto'}")
    print(f"  Patience   : {args.patience}")
    print("=" * 60)

    # Load base pre-trained model (downloads automatically if not cached)
    model = YOLO(args.model)

    # Run training
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device if args.device else None,
        patience=args.patience,
        project=str(Path(__file__).parent / "runs" / "detect"),
        name="civicdetect_v1",
        save=True,
        plots=True,
        verbose=True,
        exist_ok=True,
    )

    # Locate best.pt
    best_pt = Path(__file__).parent / "runs" / "detect" / "civicdetect_v1" / "weights" / "best.pt"

    print()
    print("=" * 60)
    print("  Training Complete!")
    print("=" * 60)

    if best_pt.exists():
        size_mb = best_pt.stat().st_size / 1024 / 1024
        print(f"  Best weights : {best_pt}")
        print(f"  Size         : {size_mb:.1f} MB")

    # Print validation metrics
    if hasattr(results, 'box'):
        print(f"  mAP50        : {getattr(results.box, 'map50', 'N/A')}")
        print(f"  mAP50-95     : {getattr(results.box, 'map', 'N/A')}")

    # Auto-deploy to ../models/best.pt unless disabled
    if not args.no_deploy and best_pt.exists():
        models_dir = Path(__file__).parent.parent / "models"
        models_dir.mkdir(exist_ok=True)
        dest = models_dir / "best.pt"
        shutil.copy2(best_pt, dest)
        print(f"  Deployed to  : {dest}")
        print()
        print("  Restart the AI service to use the new model:")
        print("    uvicorn app.main:app --reload --port 8000")
    elif not best_pt.exists():
        print("[WARN] best.pt not found. Check the training output for errors.")

    print("=" * 60)


if __name__ == "__main__":
    main()
