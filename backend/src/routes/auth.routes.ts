import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

// POST /auth/login — Public
router.post('/login', validate(loginSchema), AuthController.login);

// POST /auth/change-password — Authenticated
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
