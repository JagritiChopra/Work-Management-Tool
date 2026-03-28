import { Router } from 'express';
import * as profileCtrl from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.js';
import { handleAvatarUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();
router.use(protect);

router.patch(
  '/',
  [body('name').optional().trim().isLength({ min: 2, max: 50 })],
  validate,
  profileCtrl.updateProfile
);

router.post('/avatar', uploadLimiter, handleAvatarUpload, profileCtrl.uploadAvatar);
router.delete('/avatar', profileCtrl.deleteAvatar);

router.delete(
  '/account',
  [body('password').notEmpty().withMessage('Password required to delete account')],
  validate,
  profileCtrl.deleteAccount
);

export default router;
