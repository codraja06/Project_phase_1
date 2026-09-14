from pydantic import BaseModel, Field
from typing import List, Optional

class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left X coordinate")
    y1: float = Field(..., description="Top-left Y coordinate")
    x2: float = Field(..., description="Bottom-right X coordinate")
    y2: float = Field(..., description="Bottom-right Y coordinate")

class DetectionItem(BaseModel):
    className: str = Field(..., description="Detected civic issue category")
    confidence: float = Field(..., description="Detection confidence score between 0 and 1")
    bbox: BoundingBox

class PredictResponse(BaseModel):
    success: bool = True
    message: Optional[str] = "Object detection executed successfully"
    detections: List[DetectionItem] = []

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None
