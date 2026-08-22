import { Router } from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/companyController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/settings', getCompanySettings);
router.put('/settings', authenticateToken, requireAdmin, upload.single('logo'), updateCompanySettings);

export default router;
