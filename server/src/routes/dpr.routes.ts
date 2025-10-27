import { Router } from 'express';
import { DPRController } from '../controllers/dpr.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate DPR for a project
router.post('/generate/:projectId', DPRController.generateDPR);

// Get DPR status
router.get('/:dprId/status', DPRController.getDPRStatus);

// Get DPR by ID
router.get('/:dprId', DPRController.getDPR);

// Get all DPRs for a project
router.get('/project/:projectId', DPRController.getProjectDPRs);

// Download DPR as PDF
router.get('/:dprId/download/pdf', DPRController.downloadPDF);

// Download DPR as DOCX
router.get('/:dprId/download/docx', DPRController.downloadDOCX);

export default router;

