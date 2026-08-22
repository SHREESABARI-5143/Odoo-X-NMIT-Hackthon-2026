import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance
} from '../controllers/attendance.controller';

const router = Router();

router.post('/check-in', requireAuth, checkIn);
router.post('/check-out', requireAuth, checkOut);
router.get('/my', requireAuth, getMyAttendance);
router.get('/', requireAuth, requireAdmin, getAllAttendance);

export default router;
