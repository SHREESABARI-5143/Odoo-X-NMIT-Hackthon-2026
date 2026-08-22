import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
} from '../controllers/attendanceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/check-in', authenticateToken, checkIn);
router.post('/check-out', authenticateToken, checkOut);
router.get('/today', authenticateToken, getTodayAttendance);
router.get('/history', authenticateToken, getAttendanceHistory);

export default router;
