import { Router } from 'express';
import { APMSMEController } from '../controllers/apmsme.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// AP MSME ONE Portal integration routes
router.get('/schemes', APMSMEController.getSchemes);
router.get('/guidelines/:sector', APMSMEController.getSectorGuidelines);
router.get('/financial-institutions', APMSMEController.getFinancialInstitutions);
router.post('/submit/:projectId/:dprId', APMSMEController.submitDPR);
router.get('/status/:dprId', APMSMEController.checkDPRStatus);
router.get('/entrepreneur/:entrepreneurId', APMSMEController.getEntrepreneurProfile);

export default router;
