import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove special chars, retain clean extension
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const allowedExts = ['.pdf', '.jpeg', '.jpg', '.png'];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type or file too large.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

export const handleLeaveAttachmentUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uploadSingle = upload.single('attachment');
  uploadSingle(req, res, (err: any) => {
    if (err) {
      // Return verbatim error string as per spec
      res.status(400).json({
        error: 'Unsupported file type or file too large.',
        message: 'Unsupported file type or file too large.'
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded.',
        message: 'No file uploaded.'
      });
      return;
    }
    next();
  });
};
