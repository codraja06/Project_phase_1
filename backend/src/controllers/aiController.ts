import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { detectCivicIssue } from '../services/aiService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import fs from 'fs';

export const detectIssue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let filePath = '';
  try {
    if (!req.file) {
      throw new ApiError(400, 'Image file is required for AI detection.');
    }

    filePath = req.file.path;
    const aiResult = await detectCivicIssue(filePath);

    // Clean up local temp file after sending to AI microservice
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Determine user-facing message based on detection result
    let message = aiResult.message || 'AI Detection completed successfully';
    if (!aiResult.detected) {
      message = aiResult.message || 'No civic issue detected in this image. Please try a clearer photo or select the category manually.';
    } else if (aiResult.detections && aiResult.detections.length > 0) {
      const topClass = aiResult.detections[0].category.replace(/_/g, ' ');
      const topConf = Math.round(aiResult.detections[0].confidence * 100);
      message = `Detected: ${topClass} (${topConf}% confidence)`;
    }

    res.status(200).json(
      new ApiResponse(message, {
        detected: aiResult.detected,
        message,
        detections: aiResult.detections || [],
      })
    );
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore unlink failure
      }
    }
    next(error);
  }
};
