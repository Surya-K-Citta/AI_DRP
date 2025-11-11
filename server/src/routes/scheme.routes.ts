// @ts-nocheck
import { Router } from 'express';
import { SchemeController } from '../controllers/scheme.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all schemes
router.get('/', SchemeController.getAllSchemes);

// Get scheme by code
router.get('/:schemeCode', SchemeController.getScheme);

// Recommend schemes for a project
router.post('/recommend/:projectId', SchemeController.recommendSchemes);

// Select a scheme for a project
router.post('/select/:projectId/:schemeCode', SchemeController.selectScheme);

export default router;

