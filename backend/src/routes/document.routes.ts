import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ownershipCheck } from '../middleware/ownershipCheck';
import { createUploader } from '../utils/fileUpload';
import { config } from '../config';
import { Role } from '@prisma/client';

const router = Router({ mergeParams: true });
const documentUpload = createUploader(config.upload.documentsPath);

// POST /employees/:id/documents — Self or Admin/HR (multipart upload)
router.post(
  '/',
  authenticate,
  ownershipCheck,
  documentUpload.single('file'),
  DocumentController.upload
);

// GET /employees/:id/documents — Self or Admin/HR
router.get('/', authenticate, ownershipCheck, DocumentController.getAll);

// DELETE /employees/:id/documents/:documentId — Admin/HR only
router.delete(
  '/:documentId',
  authenticate,
  authorize(Role.ADMIN_HR),
  DocumentController.delete
);

export default router;
