import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  getPayrollDashboard,
  getEmployeePayrollDetail,
  generateMonthlyPayroll
} from '../controllers/payroll.controller';

const router = Router();

router.get('/', requireAuth, requireAdmin, getPayrollDashboard);
router.post('/generate', requireAuth, requireAdmin, generateMonthlyPayroll);
router.get('/:employeeId', requireAuth, requireAdmin, getEmployeePayrollDetail);

export default router;
