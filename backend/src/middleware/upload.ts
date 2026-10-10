import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError';
import { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists for local fallback
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' } as Record<string, string>)[file.mimetype] || '.jpg';
    cb(null, `civic-issue-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Choose a JPEG, PNG or WebP image.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

export const validateImageContent = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) return next(new ApiError(400, 'An image is required.'));
  const file = req.file;
  const fd = fs.openSync(file.path, 'r');
  const bytes = Buffer.alloc(12);
  try { fs.readSync(fd, bytes, 0, 12, 0); } finally { fs.closeSync(fd); }
  const valid = (file.mimetype === 'image/jpeg' && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
    (file.mimetype === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (file.mimetype === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
  if (!valid) {
    fs.unlinkSync(file.path);
    return next(new ApiError(400, 'The file content is not a supported image.'));
  }
  next();
};
