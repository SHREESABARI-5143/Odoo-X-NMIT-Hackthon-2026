import { Router } from 'express';
import { getSalaryConfig, updateSalaryConfig } from '../controllers/salaryController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/:employeeId', authenticateToken, getSalaryConfig);
router.put('/:employeeId', authenticateToken, requireAdmin, updateSalaryConfig);

export default router;
