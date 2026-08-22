import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// GET /company — Authenticated
router.get('/', authenticate, CompanyController.get);

export default router;
