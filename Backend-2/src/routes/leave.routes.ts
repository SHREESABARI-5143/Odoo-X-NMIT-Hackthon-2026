import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  createLeaveRequest,
  getAllLeaveRequests,
  getMyLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} from '../controllers/leave.controller';

const router = Router();

router.post('/', requireAuth, createLeaveRequest);
router.get('/my', requireAuth, getMyLeaveRequests);
router.get('/', requireAuth, requireAdmin, getAllLeaveRequests);
router.put('/:id/approve', requireAuth, requireAdmin, approveLeaveRequest);
router.put('/:id/reject', requireAuth, requireAdmin, rejectLeaveRequest);

export default router;
