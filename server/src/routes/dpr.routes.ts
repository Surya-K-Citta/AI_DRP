import { Router } from 'express';
import { DPRController } from '../controllers/dpr.controller';
import { authenticate } from '../middleware/auth.middleware';
import { MLService } from '../services/ml.service';

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

// DPR Analytics routes
router.get('/analytics/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    // For now, we'll get the latest DPR for the project
    // In a real implementation, you might want to pass dprId as a query parameter
    const analytics = await MLService.analyzeDPRQuality(projectId, projectId);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get DPR analytics',
      error: error.message,
    });
  }
});

router.get('/analytics/:projectId/report', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Generate analytics report PDF
    const reportBuffer = await MLService.generateAnalyticsReport(projectId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPR_Analytics_${projectId}.pdf"`);
    res.send(reportBuffer);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics report',
      error: error.message,
    });
  }
});

export default router;

