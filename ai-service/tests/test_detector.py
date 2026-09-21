import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.detector import detector_instance

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert data["modelConfigured"] is True
    assert "loadedModels" in data
    assert len(data["loadedModels"]) > 0

def test_predict_without_model_returns_503():
    # Force detector to unconfigured state
    original_models = detector_instance.models
    detector_instance.models = {}

    response = client.post(
        "/predict",
        files={"image": ("test.jpg", b"fake image bytes", "image/jpeg")}
    )

    assert response.status_code == 503
    data = response.json()
    assert "AI model weights are not configured" in data["detail"]

    # Restore state
    detector_instance.models = original_models

def test_predict_invalid_image_returns_400():
    response = client.post(
        "/predict",
        files={"image": ("test.jpg", b"not a real image binary data", "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert "must be a valid image" in data["detail"]

def test_predict_valid_image_success():
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
