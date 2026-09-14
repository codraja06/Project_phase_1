import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.detector import detector_instance

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert "modelConfigured" in data

def test_predict_without_model_returns_503():
    # Force detector to unconfigured state
    original_state = detector_instance.model
    detector_instance.model = None

    response = client.post(
        "/predict",
        files={"image": ("test.jpg", b"fake image bytes", "image/jpeg")}
    )

    assert response.status_code == 503
    data = response.json()
    assert "AI model weights are not configured" in data["detail"]

    # Restore state
    detector_instance.model = original_state
