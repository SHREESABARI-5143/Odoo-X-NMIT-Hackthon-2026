import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { handleLeaveAttachmentUpload } from '../middleware/upload.middleware';
import { uploadLeaveAttachment } from '../controllers/upload.controller';

const router = Router();

router.post('/leave-attachment', requireAuth, handleLeaveAttachmentUpload, uploadLeaveAttachment);

export default router;
