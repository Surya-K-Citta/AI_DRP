import { Router } from 'express';
import { PrivacyController } from '../controllers/privacy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/export', PrivacyController.exportMyData);
router.patch('/consent', PrivacyController.updateConsent);
router.put('/nominee', PrivacyController.saveNominee);
router.delete('/account', PrivacyController.deleteMyAccount);
router.post('/complaint', PrivacyController.submitComplaint);
router.get('/complaints', PrivacyController.myComplaints);
router.get('/activity', PrivacyController.myActivity);
router.get('/notifications', PrivacyController.listNotifications);
router.post('/notifications/:id/read', PrivacyController.markNotificationRead);

export default router;
