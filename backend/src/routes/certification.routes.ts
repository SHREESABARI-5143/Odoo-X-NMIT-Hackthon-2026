import { Router } from 'express';
import { CertificationController } from '../controllers/skill.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// POST /certifications — Self or Admin/HR (ownership checked in controller)
router.post('/', authenticate, CertificationController.addCertification);

export default router;
