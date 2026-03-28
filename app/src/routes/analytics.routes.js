import { Router } from 'express';
import * as analyticsCtrl from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/dashboard', analyticsCtrl.getDashboardAnalytics);
router.get('/tasks', analyticsCtrl.getTaskAnalytics);
router.get('/sessions', analyticsCtrl.getSessionAnalytics);

export default router;
