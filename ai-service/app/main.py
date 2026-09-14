import uvicorn
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    model_ready = detector_instance.is_ready()
    return {
        "status": "OK",
        "service": "AI Object Detection Microservice",
        "modelConfigured": model_ready,
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
async def predict_issue(image: UploadFile = File(...)):
    # Check model availability first
    if not detector_instance.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model weights are not configured. Please provide MODEL_PATH/best.pt."
        )

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided file must be a valid image."
        )

    try:
        contents = await image.read()
        detections = detector_instance.detect(contents)

        return PredictResponse(
            success=True,
            message="Civic issue detection completed successfully",
            detections=detections
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing computer vision detection: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.AI_PORT, reload=True)
