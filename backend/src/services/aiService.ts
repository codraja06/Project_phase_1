import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface DetectionResult {
  className: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface PredictResponse {
  success: boolean;
  message?: string;
  detections: DetectionResult[];
}

export const detectCivicIssue = async (filePath: string): Promise<PredictResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));

    const response = await axios.post<PredictResponse>(
      `${env.AI_SERVICE_URL}/predict`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 15000, // 15 seconds timeout
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      throw new ApiError(
        status,
        data.detail || data.message || 'AI service prediction error.'
      );
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new ApiError(
        503,
        'AI Computer Vision service is currently unavailable. Please ensure python AI microservice is running.'
      );
    }
    throw new ApiError(500, `AI Service error: ${error.message}`);
  }
};
