export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionResult {
  category: string;
  confidence: number;
  bbox: BoundingBox;
  model: string;
}

export interface AIDetectResponse {
  detected: boolean;
  message?: string;
  detections: DetectionResult[];
}
