import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// POST /skills — Self or Admin/HR (ownership checked in controller)
router.post('/', authenticate, SkillController.addSkill);

export default router;
