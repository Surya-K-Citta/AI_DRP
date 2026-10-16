// @ts-nocheck
import crypto from 'crypto';
import { startSession, refreshSession, endSession } from '../lib/session';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { AuditService } from '../services/audit.service';
import { getJwtSecret } from '../lib/jwtSecret';
import {
  GUARDIAN_MESSAGE,
  PRIVACY_NOTICE_VERSION,
  UNDER_18_CODE,
} from '../lib/privacyNotice';
import { ageFromDob } from '../lib/under18';

async function findInvitedUser(token: string) {
  if (token.length < 20 || token.length > 200) return null;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user: any = await User.findOne({ 'invite.tokenHash': hash });
  if (!user || !user.invite?.expiresAt || new Date(user.invite.expiresAt).getTime() < Date.now()) return null;
  return user;
}

function publicUser(user: any) {
  const noticeVersion = user.privacy?.noticeVersion || null;
  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    reviewDistrict: user.reviewDistrict,
    udyamNumber: user.udyamNumber,
    location: user.location,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth,
    privacy: {
      noticeVersion,
      accountConsent: !!user.privacy?.accountConsent,
      aiAssist: !!user.privacy?.aiAssist,
      analytics: !!user.privacy?.analytics,
      needsNoticeAcceptance: noticeVersion !== PRIVACY_NOTICE_VERSION,
      nominee: {
        name: user.privacy?.nominee?.name || '',
        phone: user.privacy?.nominee?.phone || '',
        email: user.privacy?.nominee?.email || '',
      },
    },
  };
}

function applyConsent(user: any, body: any, now: Date) {
  const accountConsent = body.accountConsent === true;
  const aiAssist = body.aiAssist === true;
  const analytics = body.analytics === true;
  const prevAi = !!user.privacy?.aiAssist;

  user.privacy = user.privacy || {};
  user.privacy.accountConsent = accountConsent;
  user.privacy.accountConsentAt = accountConsent ? now : undefined;
  user.privacy.aiAssist = aiAssist;
  user.privacy.aiAssistAt = aiAssist ? now : user.privacy.aiAssistAt;
  user.privacy.analytics = analytics;
  user.privacy.analyticsAt = analytics ? now : user.privacy.analyticsAt;
  user.privacy.noticeVersion = PRIVACY_NOTICE_VERSION;
  user.privacy.noticeAcceptedAt = now;
  if (typeof user.markModified === 'function') {
    user.markModified('privacy');
  }

  return { accountConsent, aiAssist, prevAi };
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password,
        udyamNumber,
        location,
        phoneNumber,
        dateOfBirth,
        accountConsent,
        aiAssist,
        analytics,
        noticeVersion,
      } = req.body;

      if (accountConsent !== true) {
        res.status(400).json({
          success: false,
          message: 'You must agree to the privacy notice to create an account.',
        });
        return;
      }

      if (noticeVersion && noticeVersion !== PRIVACY_NOTICE_VERSION) {
        res.status(400).json({
          success: false,
          message: 'Please read the current privacy notice and try again.',
        });
        return;
      }

      const phoneDigits = String(phoneNumber ?? '').replace(/\D/g, '');
      if (!/^\d{10}$/.test(phoneDigits)) {
        res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits.',
        });
        return;
      }

      const age = ageFromDob(dateOfBirth);
      if (age == null) {
        res.status(400).json({
          success: false,
          message: 'Date of birth is required.',
        });
        return;
      }
      if (age < 18) {
        res.status(403).json({
          success: false,
          code: UNDER_18_CODE,
          message: GUARDIAN_MESSAGE,
        });
        return;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
        return;
      }

      const now = new Date();
      const user = await User.create({
        name,
        email,
        passwordHash: password,
        // Anyone can register, but only as an entrepreneur. An admin grants reviewer or admin access.
        role: 'entrepreneur',
        udyamNumber,
        location,
        phoneNumber: phoneDigits,
        dateOfBirth: new Date(dateOfBirth),
        privacy: {
          noticeVersion: PRIVACY_NOTICE_VERSION,
          noticeAcceptedAt: now,
          accountConsent: true,
          accountConsentAt: now,
          aiAssist: aiAssist === true,
          aiAssistAt: aiAssist === true ? now : undefined,
          analytics: analytics === true,
          analyticsAt: analytics === true ? now : undefined,
        },
      });

      await AuditService.log({
        action: 'register',
        userId: user._id.toString(),
        role: user.role,
        req,
      });
      await AuditService.log({
        action: 'notice_accepted',
        userId: user._id.toString(),
        role: user.role,
        targetId: PRIVACY_NOTICE_VERSION,
        req,
      });
      await AuditService.log({
        action: 'consent_given',
        userId: user._id.toString(),
        role: user.role,
        targetType: 'account',
        req,
      });
      if (aiAssist === true) {
        await AuditService.log({
          action: 'consent_given',
          userId: user._id.toString(),
          role: user.role,
          targetType: 'aiAssist',
          req,
        });
      }

      const token = await startSession(user, req, res);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          ...publicUser(user),
          token,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        await AuditService.log({ action: 'login_failed', req });
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await AuditService.log({
          action: 'login_failed',
          userId: user._id.toString(),
          role: user.role,
          payload: { reason: 'wrong password', userAgent: String(req.headers['user-agent'] || '').slice(0, 160) },
          req,
        });
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      if (user.isActive === false) {
        await AuditService.log({
          action: 'login_failed',
          userId: user._id.toString(),
          role: user.role,
          payload: { reason: 'account deactivated' },
          req,
        });
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This account has been deactivated. Please contact the APMSMEDC Admin.',
        });
        return;
      }

      await AuditService.log({
        action: 'login_success',
        userId: user._id.toString(),
        role: user.role,
        payload: { userAgent: String(req.headers['user-agent'] || '').slice(0, 160) },
        req,
      });

      const token = await startSession(user, req, res);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          ...publicUser(user),
          token,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  /** What an invitation link is for (name, email, role), so the page can greet the person. Nothing secret is returned. */
  static async inviteInfo(req: Request, res: Response): Promise<void> {
    try {
      const user: any = await findInvitedUser(String(req.params.token || ''));
      if (!user) {
        res.status(404).json({ success: false, message: 'This invitation is not valid or has expired. Ask the APMSMEDC Admin for a new one.' });
        return;
      }
      res.status(200).json({ success: true, data: { name: user.name, email: user.email, role: user.role, reviewDistrict: user.reviewDistrict || null } });
    } catch {
      res.status(500).json({ success: false, message: 'Could not check the invitation' });
    }
  }

  /** The invited person sets their own password and accepts the privacy notice. The link works once. */
  static async acceptInvite(req: Request, res: Response): Promise<void> {
    try {
      const { token, password, phoneNumber, dateOfBirth, accountConsent, aiAssist, noticeVersion } = req.body || {};
      const user: any = await findInvitedUser(String(token || ''));
      if (!user) {
        res.status(404).json({ success: false, message: 'This invitation is not valid or has expired. Ask the APMSMEDC Admin for a new one.' });
        return;
      }
      if (typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ success: false, message: 'Choose a password of at least 8 characters.' });
        return;
      }
      if (accountConsent !== true) {
        res.status(400).json({ success: false, message: 'You must agree to the privacy notice to create an account.' });
        return;
      }
      if (noticeVersion && noticeVersion !== PRIVACY_NOTICE_VERSION) {
        res.status(400).json({ success: false, message: 'Please read the current privacy notice and try again.' });
        return;
      }
      const phoneDigits = String(phoneNumber ?? '').replace(/\D/g, '');
      if (!/^\d{10}$/.test(phoneDigits)) {
        res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits.' });
        return;
      }
      const age = ageFromDob(dateOfBirth);
      if (age == null) {
        res.status(400).json({ success: false, message: 'Date of birth is required.' });
        return;
      }
      if (age < 18) {
        res.status(403).json({ success: false, code: UNDER_18_CODE, message: GUARDIAN_MESSAGE });
        return;
      }
      const now = new Date();
      user.passwordHash = password;
      user.phoneNumber = phoneDigits;
      user.dateOfBirth = new Date(dateOfBirth);
      user.invite = undefined;
      user.privacy = {
        noticeVersion: PRIVACY_NOTICE_VERSION,
        noticeAcceptedAt: now,
        accountConsent: true,
        accountConsentAt: now,
        aiAssist: aiAssist === true,
        aiAssistAt: aiAssist === true ? now : undefined,
      };
      await user.save();
      await AuditService.log({ action: 'invite_accepted', userId: String(user._id), role: user.role, targetType: 'user', targetId: String(user._id), req });
      const sessionToken = await startSession(user, req, res);
      res.status(200).json({ success: true, message: 'Your account is ready.', data: { ...publicUser(user), token: sessionToken } });
    } catch (error: any) {
      console.error('Accept invite error:', error);
      res.status(500).json({ success: false, message: 'Could not finish setting up the account' });
    }
  }

  /** New 15 minute access token for a session that has been used within the last 15 minutes. */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const outcome = await refreshSession(req, res);
      if (!outcome.ok) {
        res.status(401).json({
          success: false,
          code: outcome.code,
          message: outcome.code === 'SESSION_IDLE' ? 'Signed out after 15 minutes without activity' : outcome.code === 'ACCOUNT_DEACTIVATED' ? 'This account has been deactivated' : 'Please sign in again',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: { ...publicUser(outcome.user), token: outcome.token, expiresInSeconds: outcome.expiresInSeconds },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Could not refresh the session' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // No bearer needed: an expired token must still be able to sign out.
      let userId: string | undefined;
      let role: string | undefined;
      const header = req.headers.authorization;
      if (header?.startsWith('Bearer ')) {
        const decoded: any = jwt.verify(header.substring(7), getJwtSecret(), { ignoreExpiration: true });
        userId = decoded?.userId;
        role = decoded?.role;
      }
      await endSession(req, res);
      await AuditService.log({ action: 'logout', userId, role, req });
      res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error: any) {
      await endSession(req, res).catch(() => undefined);
      res.status(200).json({ success: true, message: 'Logged out' });
    }
  }

  static async acceptConsent(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (req.body.accountConsent !== true) {
        res.status(400).json({
          success: false,
          message: 'You must agree to the privacy notice to use this site.',
        });
        return;
      }

      const now = new Date();
      const { aiAssist, prevAi } = applyConsent(user, req.body, now);
      await user.save();

      await AuditService.log({
        action: 'notice_accepted',
        userId: user._id.toString(),
        role: user.role,
        targetId: PRIVACY_NOTICE_VERSION,
        req,
      });
      await AuditService.log({
        action: 'consent_given',
        userId: user._id.toString(),
        role: user.role,
        targetType: 'account',
        req,
      });
      if (aiAssist && !prevAi) {
        await AuditService.log({
          action: 'consent_given',
          userId: user._id.toString(),
          role: user.role,
          targetType: 'aiAssist',
          req,
        });
      } else if (!aiAssist && prevAi) {
        await AuditService.log({
          action: 'consent_withdrawn',
          userId: user._id.toString(),
          role: user.role,
          targetType: 'aiAssist',
          req,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Consent saved',
        data: publicUser(user),
      });
    } catch (error: any) {
      console.error('Consent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save consent',
        error: error.message,
      });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;

      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: publicUser(user),
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message,
      });
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const { name, udyamNumber, location, phoneNumber } = req.body;
      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...(name !== undefined ? { name } : {}),
          ...(udyamNumber !== undefined ? { udyamNumber } : {}),
          ...(location !== undefined ? { location } : {}),
          ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        },
        {
          new: true,
          runValidators: true,
        }
      ).select('-passwordHash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await AuditService.log({
        action: 'profile_change',
        userId,
        role: authReq.user?.role,
        req,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: publicUser(user),
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message,
      });
    }
  }
}
