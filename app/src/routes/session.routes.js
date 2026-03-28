import { Router } from 'express';
import * as sessionCtrl from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createSessionValidator,
  updateSessionValidator,
  sessionQueryValidator,
} from '../validators/session.validators.js';
import { param } from 'express-validator';

const router = Router();
router.use(protect);

router.get('/dashboard', sessionCtrl.getSessionDashboard);

router.route('/')
  .get(sessionQueryValidator, validate, sessionCtrl.getSessions)
  .post(createSessionValidator, validate, sessionCtrl.createSession);

router.route('/:id')
  .get([param('id').isMongoId()], validate, sessionCtrl.getSession)
  .patch(updateSessionValidator, validate, sessionCtrl.updateSession)
  .delete([param('id').isMongoId()], validate, sessionCtrl.deleteSession);

export default router;
