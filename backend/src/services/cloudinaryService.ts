import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  try {
    // If Cloudinary credentials are fully provided, upload to cloud
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'civic_complaints',
        resource_type: 'image',
      });

      // Cleanup local temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    }

    // Fallback: return accessible local backend static URL
    // BACKEND_PUBLIC_URL should be set to your machine's LAN IP for device testing
    const filename = path.basename(filePath);
    return `${env.BACKEND_PUBLIC_URL}/uploads/${filename}`;
  } catch (error) {
    console.error('Cloudinary upload error, falling back to local storage URL:', error);
    const filename = path.basename(filePath);
    return `${env.BACKEND_PUBLIC_URL}/uploads/${filename}`;
  }
};
