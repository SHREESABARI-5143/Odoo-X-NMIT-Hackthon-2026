import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  getLeaveAllocations,
  updateLeaveAllocation
} from '../controllers/leaveAllocation.controller';

const router = Router();

router.get('/', requireAuth, requireAdmin, getLeaveAllocations);
router.put('/', requireAuth, requireAdmin, updateLeaveAllocation);

export default router;
