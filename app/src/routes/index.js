import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import taskRoutes from './task.routes.js';
import calendarRoutes from './calendar.routes.js';
import sessionRoutes from './session.routes.js';
import folderRoutes from './folder.routes.js';
import documentRoutes from './document.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/tasks', taskRoutes);
router.use('/calendar', calendarRoutes);
router.use('/sessions', sessionRoutes);
router.use('/folders', folderRoutes);
router.use('/documents', documentRoutes);
router.use('/analytics', analyticsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
