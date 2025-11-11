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

// User management
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// DPR management
router.get('/dprs', AdminController.getAllDPRs);
router.post('/dprs/:id/approve', AdminController.approveDPR);
router.post('/dprs/:id/reject', AdminController.rejectDPR);

// Policy management
router.get('/policies', AdminController.getAllPolicies);
router.post('/policies', AdminController.createPolicy);
router.put('/policies/:id', AdminController.updatePolicy);
router.delete('/policies/:id', AdminController.deletePolicy);
router.post('/policies/:id/approve', AdminController.approvePolicy);

export default router;

