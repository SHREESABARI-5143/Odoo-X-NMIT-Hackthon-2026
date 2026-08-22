import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  getEmployeeSalary,
  updateEmployeeSalary
} from '../controllers/salary.controller';

const router = Router();

router.get('/:id/salary', requireAuth, getEmployeeSalary);
router.put('/:id/salary', requireAuth, requireAdmin, updateEmployeeSalary);

export default router;
