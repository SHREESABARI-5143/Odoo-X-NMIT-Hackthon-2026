import { Router } from 'express';
import { login, changePassword } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/change-password', changePassword);

export default router;
