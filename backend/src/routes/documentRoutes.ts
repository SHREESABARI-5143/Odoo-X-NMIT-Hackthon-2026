import { Router } from 'express';
import {
  uploadDocument,
  getEmployeeDocuments,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.post('/upload', authenticateToken, upload.single('file'), uploadDocument);
router.get('/employee/:employeeId', authenticateToken, getEmployeeDocuments);
router.get('/:id/download', downloadDocument);
router.delete('/:id', authenticateToken, requireAdmin, deleteDocument);

export default router;
