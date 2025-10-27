import { Router } from 'express';
import { body } from 'express-validator';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create project
router.post(
  '/',
  validate([
    body('projectName').trim().notEmpty().withMessage('Project name is required'),
    body('projectType')
      .isIn(['individual', 'cluster'])
      .withMessage('Invalid project type'),
    body('industrySector').trim().notEmpty().withMessage('Industry sector is required'),
    body('totalCost').isNumeric().withMessage('Total cost must be a number'),
    body('ownContribution').isNumeric().withMessage('Own contribution must be a number'),
    body('loanAmount').isNumeric().withMessage('Loan amount must be a number'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ]),
  ProjectController.createProject
);

// Get all projects for current user
router.get('/', ProjectController.getUserProjects);

// Get project by ID
router.get('/:id', ProjectController.getProject);

// Update project
router.put('/:id', ProjectController.updateProject);

// Delete project
router.delete('/:id', ProjectController.deleteProject);

export default router;

