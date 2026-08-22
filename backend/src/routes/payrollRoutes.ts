import { Router } from 'express';
import { getPayrollDashboard } from '../controllers/payrollController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateToken, requireAdmin, getPayrollDashboard);

export default router;
