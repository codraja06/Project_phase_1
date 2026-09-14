export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionResult {
  className: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface AIDetectResponse {
  success: boolean;
  message?: string;
  detections: DetectionResult[];
}
