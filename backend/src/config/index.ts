import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    get maxFileSizeBytes() {
      return this.maxFileSizeMB * 1024 * 1024;
    },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    profilePicturePath: 'profile-pictures',
    documentsPath: 'documents',
    logosPath: 'logos',
  },

  get uploadBasePath() {
    return path.resolve(process.cwd(), this.upload.dir);
  },
};
