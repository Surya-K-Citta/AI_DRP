import { Router } from 'express';
import { body } from 'express-validator';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Submit feedback
router.post(
  '/:projectId',
  validate([
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('feedbackType')
      .optional()
      .isIn(['quality', 'accuracy', 'usability', 'general'])
      .withMessage('Invalid feedback type'),
  ]),
  FeedbackController.submitFeedback
);

// Get project feedback
router.get('/:projectId', FeedbackController.getProjectFeedback);

export default router;

