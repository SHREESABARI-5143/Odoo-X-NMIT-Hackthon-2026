import { Router } from 'express';
import {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/request', authenticateToken, requestLeave);
router.get('/my-leaves', authenticateToken, getMyLeaves);
router.get('/all', authenticateToken, requireAdmin, getAllLeaves);
router.post('/:id/approve', authenticateToken, requireAdmin, approveLeave);
router.post('/:id/reject', authenticateToken, requireAdmin, rejectLeave);

export default router;
