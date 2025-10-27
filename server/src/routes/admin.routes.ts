import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get analytics
router.get('/analytics', AdminController.getAnalytics);

// Get all users
router.get('/users', AdminController.getAllUsers);

// Get all projects
router.get('/projects', AdminController.getAllProjects);

// Get all feedback
router.get('/feedback', AdminController.getAllFeedback);

export default router;

