import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  addSkill,
  addCertification,
} from '../controllers/employeeController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getEmployees);
router.get('/:id', authenticateToken, getEmployeeById);
router.post('/', authenticateToken, requireAdmin, createEmployee);
router.put('/:id', authenticateToken, updateEmployee);
router.post('/:id/skills', authenticateToken, addSkill);
router.post('/:id/certifications', authenticateToken, addCertification);

export default router;
