// @ts-nocheck
import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import { dprRoutes } from './dpr.routes';
import schemeRoutes from './scheme.routes';
import feedbackRoutes from './feedback.routes';
import adminRoutes from './admin.routes';
import aiRoutes from './ai.routes';
import apmsmeRoutes from './apmsme.routes';
import documentRoutes from './document.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MSME DPR API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/dpr', dprRoutes);
router.use('/schemes', schemeRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/apmsme', apmsmeRoutes);
router.use('/documents', documentRoutes);

export default router;

