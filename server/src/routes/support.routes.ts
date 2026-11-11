// @ts-nocheck
import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Anyone signed in can raise and follow their own requests.
router.get('/info', SupportController.info);
router.get('/tickets/mine', SupportController.mine);
router.post('/tickets', SupportController.create);
router.post('/tickets/:id/reply', SupportController.reply);

// Support staff: District Reviewers work the L1 queue, the APMSMEDC Admin sees all tiers.
router.get('/queue', authorize('admin', 'officer'), SupportController.queue);
router.patch('/tickets/:id', authorize('admin', 'officer'), SupportController.update);
router.get('/report', authorize('admin'), SupportController.report);
router.post('/escalate', authorize('admin'), SupportController.escalateNow);

export default router;
