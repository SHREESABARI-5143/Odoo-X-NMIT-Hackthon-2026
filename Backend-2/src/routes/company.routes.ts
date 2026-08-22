import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// In-memory or fallback company settings
let companySettings = {
  name: 'Dayflow Technologies',
  logo: '',
  workingDaysPerWeek: 5,
  breakHours: 1,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  paidLeaveDefault: 18,
  sickLeaveDefault: 12,
  pfEmployeePct: 12,
  pfEmployerPct: 12,
  professionalTax: 200
};

// GET /company
router.get('/', (req: Request, res: Response) => {
  res.json(companySettings);
});

// PUT /company
router.put('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  companySettings = {
    ...companySettings,
    ...req.body
  };
  res.json(companySettings);
});

export default router;
