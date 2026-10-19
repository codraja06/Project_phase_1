import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.detector import detector_instance, apply_nms

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert data["modelConfigured"] is detector_instance.is_ready()
    assert "loadedModels" in data
    assert len(data["loadedModels"]) == len(detector_instance.models)

def test_predict_without_model_returns_503(monkeypatch):
    monkeypatch.setattr(detector_instance, "models", {})

    response = client.post(
        "/predict",
        files={"image": ("test.jpg", b"fake image bytes", "image/jpeg")}
    )

    assert response.status_code == 503
    data = response.json()
    assert "AI model weights are not configured" in data["detail"]

class EmptyModel:
    def predict(self, **kwargs):
        return []

def test_predict_invalid_image_returns_400(monkeypatch):
    monkeypatch.setattr(detector_instance, "models", {"test": EmptyModel()})
    response = client.post(
        "/predict",
        files={"image": ("test.jpg", b"not a real image binary data", "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert "must be a valid image" in data["detail"]

def test_predict_valid_image_success(monkeypatch):
    monkeypatch.setattr(detector_instance, "models", {"test": EmptyModel()})
    img = Image.new("RGB", (640, 640), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    response = client.post(
        "/predict",
        files={"image": ("sample.jpg", image_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "detected" in data
    assert "detections" in data
    assert isinstance(data["detections"], list)


def test_inference_failure_is_not_reported_as_no_detection(monkeypatch):
    class FailingModel:
        def predict(self, **kwargs):
            raise RuntimeError("inference unavailable")

    monkeypatch.setattr(detector_instance, "models", {"test": FailingModel()})
    buf = io.BytesIO()
    Image.new("RGB", (8, 8)).save(buf, format="PNG")
    response = client.post("/predict", files={"image": ("test.png", buf.getvalue(), "image/png")})
    assert response.status_code == 503
    assert "could not be completed" in response.json()["detail"]


def test_overlapping_distinct_categories_are_preserved():
    box = {"x1": 0, "y1": 0, "x2": 100, "y2": 100}
    detections = [
        {"category": "pothole", "confidence": 0.9, "bbox": box},
        {"category": "garbage", "confidence": 0.8, "bbox": box},
        {"category": "pothole", "confidence": 0.7, "bbox": box},
    ]
    assert [item["category"] for item in apply_nms(detections)] == ["pothole", "garbage"]


def test_oversized_image_returns_413(monkeypatch):
    monkeypatch.setattr(detector_instance, "models", {"test": EmptyModel()})
    response = client.post("/predict", files={"image": ("large.jpg", b"x" * (10 * 1024 * 1024 + 1), "image/jpeg")})
    assert response.status_code == 413


def test_rgb_input_is_passed_to_yolo_without_channel_swapping(monkeypatch):
    class RecordingModel:
        def predict(self, source, **kwargs):
            assert isinstance(source, Image.Image)
            assert source.getpixel((0, 0)) == (255, 0, 0)
            return []

    monkeypatch.setattr(detector_instance, "models", {"test": RecordingModel()})
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (255, 0, 0)).save(buf, format="PNG")
    assert detector_instance.detect(buf.getvalue()) == []
