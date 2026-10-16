// @ts-nocheck
import { Router } from 'express';
import { ReviewerController } from '../controllers/reviewer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// District Reviewers (their district only) and APMSMEDC Admins (all districts). Everyone else gets 403.
router.use(authenticate);
router.use(authorize('officer', 'admin'));

router.get('/summary', ReviewerController.summary);
router.get('/dprs', ReviewerController.list);
router.get('/dprs/:id', ReviewerController.detail);
router.post('/dprs/:id/review', ReviewerController.review);

export default router;
