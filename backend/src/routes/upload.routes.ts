import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { createUploader } from '../utils/fileUpload';
import { config } from '../config';
import { Role } from '@prisma/client';

const router = Router();
const profileUpload = createUploader(config.upload.profilePicturePath);
const logoUpload = createUploader(config.upload.logosPath);

// POST /upload/profile-picture — Self or Admin/HR
router.post(
  '/profile-picture',
  authenticate,
  profileUpload.single('file'),
  UploadController.uploadProfilePicture
);

// POST /upload/company-logo — Admin/HR only
router.post(
  '/company-logo',
  authenticate,
  authorize(Role.ADMIN_HR),
  logoUpload.single('file'),
  UploadController.uploadCompanyLogo
);

export default router;
