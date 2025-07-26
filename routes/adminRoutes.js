import express from 'express';
import { getDashboardStats, getAnalytics, getSystemHealth, getRecentActivities } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/health', getSystemHealth);
router.get('/activities', getRecentActivities);

export default router;