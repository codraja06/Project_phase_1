import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (err.name === 'ZodError') {
    statusCode = 400;
    errors = err.issues.map((issue: any) => ({ field: issue.path.join('.'), message: issue.message }));
    message = errors.map((issue: any) => issue.message).join(' ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid record identifier.';
  } else if (err.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 10 MB or smaller.' : 'Invalid image upload.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database Validation Error';
    errors = Object.values(err.errors).map((e: any) => e.message);
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered.';
  }

  if (statusCode >= 500 && env.NODE_ENV === 'production') {
    message = 'The service could not complete this request. Please try again.';
    errors = [];
  }

  if (env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${statusCode} - ${message}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
