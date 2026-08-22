import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import { Role } from '@prisma/client';

const router = Router();

// POST /employees — Admin/HR only: create employee with auto-generated login ID + temp password
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN_HR),
  validate(createEmployeeSchema),
  EmployeeController.create
);

// GET /employees — Authenticated: search + pagination + filters
router.get('/', authenticate, EmployeeController.getAll);

// GET /employees/:id — Authenticated: strips sensitive fields by role
router.get('/:id', authenticate, EmployeeController.getById);

// PUT /employees/:id — Admin/HR (all fields) or self (limited fields)
router.put('/:id', authenticate, EmployeeController.update);

export default router;
