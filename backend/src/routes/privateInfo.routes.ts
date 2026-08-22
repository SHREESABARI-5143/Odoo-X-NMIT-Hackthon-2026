import { Router } from 'express';
import { PrivateInfoController } from '../controllers/privateInfo.controller';
import { authenticate } from '../middleware/authenticate';
import { ownershipCheck } from '../middleware/ownershipCheck';
import { validate } from '../middleware/validate';
import { updatePrivateInfoSchema } from '../validators/privateInfo.validator';

const router = Router({ mergeParams: true });

// GET /employees/:id/private-info — Self or Admin/HR
router.get('/', authenticate, ownershipCheck, PrivateInfoController.get);

// PUT /employees/:id/private-info — Self or Admin/HR
router.put('/', authenticate, ownershipCheck, validate(updatePrivateInfoSchema), PrivateInfoController.update);

export default router;
