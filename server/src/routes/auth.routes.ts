// @ts-nocheck
import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isString()
      .withMessage('Password must be text')
      .bail()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('accountConsent')
      .custom((value) => value === true)
      .withMessage('Privacy consent is required'),
  ]),
  AuthController.register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().withMessage('Password must be text').bail().notEmpty().withMessage('Password is required'),
  ]),
  AuthController.login
);

router.post('/refresh', AuthController.refresh);
router.get('/invite/:token', AuthController.inviteInfo);
router.post('/accept-invite', AuthController.acceptInvite);
router.post('/logout', AuthController.logout);
router.post('/consent', authenticate, AuthController.acceptConsent);
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router;
