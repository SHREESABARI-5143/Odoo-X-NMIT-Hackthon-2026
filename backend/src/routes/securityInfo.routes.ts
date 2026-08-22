import { Router } from 'express';
import { SecurityInfoController } from '../controllers/securityInfo.controller';
import { authenticate } from '../middleware/authenticate';
import { ownershipCheck } from '../middleware/ownershipCheck';
import { validate } from '../middleware/validate';
import { updateSecurityInfoSchema } from '../validators/securityInfo.validator';

const router = Router({ mergeParams: true });

// GET /employees/:id/security — Self or Admin/HR
router.get('/', authenticate, ownershipCheck, SecurityInfoController.get);

// PUT /employees/:id/security — Self or Admin/HR
router.put('/', authenticate, ownershipCheck, validate(updateSecurityInfoSchema), SecurityInfoController.update);

export default router;
