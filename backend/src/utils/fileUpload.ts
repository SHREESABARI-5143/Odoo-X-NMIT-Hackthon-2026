import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config';
import { ApiError } from './apiError';

/**
 * Sanitize a filename: remove special chars, prepend timestamp + random hex.
 */
function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(4).toString('hex');
  return `${timestamp}_${randomHex}_${baseName}${ext}`;
}

/**
 * Ensure upload directory exists.
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create a multer upload middleware for a given sub-directory.
 */
export function createUploader(subDir: string) {
  const uploadDir = path.join(config.uploadBasePath, subDir);
  ensureDir(uploadDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      cb(null, sanitizeFilename(file.originalname));
    },
  });

  const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeAllowed = config.upload.allowedMimeTypes.includes(file.mimetype);
    const extAllowed = config.upload.allowedExtensions.includes(ext);

    if (mimeAllowed && extAllowed) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Unsupported file type or file too large.'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.upload.maxFileSizeBytes,
    },
  });
}

/**
 * Get the served URL for an uploaded file (relative to the server root).
 * Never exposes raw filesystem paths.
 */
export function getFileUrl(subDir: string, filename: string): string {
  return `/uploads/${subDir}/${filename}`;
}

/**
 * Delete a file from the uploads directory.
 */
export function deleteFile(filePath: string): void {
  const fullPath = path.join(config.uploadBasePath, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}
