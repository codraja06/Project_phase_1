import uvicorn
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import PredictResponse, ErrorResponse
from app.detector import detector_instance

app = FastAPI(
    title="AI Civic Issue Detection Service",
    description="Ultralytics YOLO Computer Vision Microservice for Civic Problem Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

import io
from PIL import Image

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    model_ready = detector_instance.is_ready()
    return {
        "status": "OK",
        "service": "AI Object Detection Microservice",
        "modelConfigured": model_ready,
        "loadedModels": list(detector_instance.models.keys()),
        "modelCount": len(detector_instance.models),
        "modelPath": settings.MODEL_PATH
    }

@app.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        503: {"model": ErrorResponse, "description": "AI Model Weights Unconfigured"},
        400: {"model": ErrorResponse, "description": "Invalid Image Input"}
    }
)
def predict_issue(image: UploadFile = File(...)):
    # Check model availability first
    if not detector_instance.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model weights are not configured. Please provide MODEL_PATH/best.pt."
        )

    try:
        # Synchronous inference runs in FastAPI's thread pool, keeping health
        # checks responsive. Bound the read even when called without Express.
        contents = image.file.read(10 * 1024 * 1024 + 1)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image file is empty."
            )

        # Validate image content using PIL
        try:
            test_img = Image.open(io.BytesIO(contents))
            test_img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided file must be a valid image."
            )

        detections = detector_instance.detect(contents)

        return PredictResponse(
            detected=len(detections) > 0,
            message="Civic issue detection completed successfully" if len(detections) > 0 else "No supported civic issue detected automatically.",
            detections=detections
        )
    except HTTPException:
        raise
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re)
        )
    except Exception:
        logging.exception("Computer vision inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Computer vision analysis failed. Please retry."
        )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.AI_PORT, reload=True)
