import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import multer from 'multer';

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Custom API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'Unsupported file type or file too large.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists.`,
        });
        return;
      }
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Resource not found.',
        });
        return;
      default:
        break;
    }
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error.',
  });
}
