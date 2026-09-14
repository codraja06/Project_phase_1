import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Image file is required.');
    }

    const imageUrl = await uploadToCloudinary(req.file.path);

    res.status(200).json(
      new ApiResponse('Image uploaded successfully', {
        imageUrl,
      })
    );
  } catch (error) {
    next(error);
  }
};
