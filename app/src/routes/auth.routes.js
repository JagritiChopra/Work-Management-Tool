import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validators.js';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidator, validate, authCtrl.register);
router.get('/verify-email/:token', authCtrl.verifyEmail);
router.post('/resend-verification', authLimiter, [body('email').isEmail()], validate, authCtrl.resendVerificationEmail);
router.post('/login', authLimiter, loginValidator, validate, authCtrl.login);
router.post('/refresh', authCtrl.refreshToken);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, authCtrl.forgotPassword);
router.patch('/reset-password/:token', passwordResetLimiter, resetPasswordValidator, validate, authCtrl.resetPassword);

// Protected routes
router.use(protect);
router.get('/me', authCtrl.getMe);
router.post('/logout', authCtrl.logout);
router.patch('/change-password', changePasswordValidator, validate, authCtrl.changePassword);

export default router;
