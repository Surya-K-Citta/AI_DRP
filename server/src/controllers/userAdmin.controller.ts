// @ts-nocheck
import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User.model';
import { AuditService } from '../services/audit.service';
import { isRole, ROLES } from '../lib/rbac';
import { endAllSessions } from '../lib/session';
import { invalidateAccount } from '../lib/accountStatus';

const INVITE_HOURS = 72;
const sha256 = (text: string) => crypto.createHash('sha256').update(text).digest('hex');
const clientOrigin = () => (process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

/** Onboarding, activation and sign-out controls for admins. Every action is written to the audit trail with the reason. */
export class UserAdminController {
  /** Creates an account for someone (for example a District Reviewer) and returns a one-time link to set their password. */
  static async invite(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, role = 'officer', reviewDistrict } = req.body || {};
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (cleanName.length < 2 || cleanName.length > 80) {
        res.status(400).json({ success: false, message: 'Enter the person’s name (2 to 80 characters)' });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        res.status(400).json({ success: false, message: 'Enter a valid email address' });
        return;
      }
      if (!isRole(role)) {
        res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(', ')}` });
        return;
      }
      const district = String(reviewDistrict || '').trim();
      if (role === 'officer' && !district) {
        res.status(400).json({ success: false, message: 'A District Reviewer must be assigned a district' });
        return;
      }
      if (await User.findOne({ email: cleanEmail })) {
        res.status(409).json({ success: false, message: 'An account with this email already exists' });
        return;
      }
      const token = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + INVITE_HOURS * 3600 * 1000);
      const user: any = await User.create({
        name: cleanName,
        email: cleanEmail,
        // Nobody can sign in with this; the invited person sets their own password.
        passwordHash: crypto.randomBytes(32).toString('hex'),
        role,
        reviewDistrict: role === 'officer' ? district : undefined,
        invite: { tokenHash: sha256(token), expiresAt, invitedBy: req.user?.userId, invitedAt: new Date() },
      });
      await AuditService.log({
        action: 'user_invite',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'user',
        targetId: String(user._id),
        payload: { role, reviewDistrict: role === 'officer' ? district : undefined, expiresAt },
        req,
      });
      res.status(201).json({
        success: true,
        message: 'Invitation created. Share the link with the person; it works once and expires in 72 hours.',
        data: { userId: String(user._id), inviteUrl: `${clientOrigin()}/accept-invite?token=${token}`, expiresAt },
      });
    } catch (error: any) {
      console.error('Invite error:', error);
      res.status(500).json({ success: false, message: 'Could not create the invitation' });
    }
  }

  /** Switches an account off. Its sessions end at once and its tokens stop working within seconds. */
  static async deactivate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reason = String(req.body?.reason || '').trim().slice(0, 300);
      if (id === req.user?.userId) {
        res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
        return;
      }
      const target: any = await User.findById(id);
      if (!target) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      if (target.isActive === false) {
        res.status(200).json({ success: true, message: 'Already deactivated' });
        return;
      }
      if (target.role === 'admin') {
        const otherAdmins = await User.countDocuments({ role: 'admin', isActive: { $ne: false }, _id: { $ne: target._id } });
        if (otherAdmins === 0) {
          res.status(400).json({ success: false, message: 'This is the last active admin. Make another admin first' });
          return;
        }
      }
      const now = new Date();
      await User.updateOne({ _id: target._id }, { $set: { isActive: false, deactivatedAt: now, deactivatedBy: req.user?.userId, deactivationReason: reason, sessionsValidFrom: now } });
      await endAllSessions(String(target._id));
      invalidateAccount(String(target._id));
      await AuditService.log({
        action: 'user_deactivate',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'user',
        targetId: String(target._id),
        payload: { reason, targetRole: target.role },
        req,
      });
      res.status(200).json({ success: true, message: 'Account deactivated. Active sessions are being ended now.' });
    } catch (error: any) {
      console.error('Deactivate error:', error);
      res.status(500).json({ success: false, message: 'Could not deactivate the account' });
    }
  }

  static async reactivate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const target: any = await User.findById(id);
      if (!target) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      // Tokens from before the switch-off stay dead: sessionsValidFrom moves to now.
      await User.updateOne({ _id: target._id }, { $set: { isActive: true, sessionsValidFrom: new Date() }, $unset: { deactivatedAt: '', deactivatedBy: '', deactivationReason: '' } });
      invalidateAccount(String(target._id));
      await AuditService.log({ action: 'user_reactivate', userId: req.user?.userId, role: req.user?.role, targetType: 'user', targetId: String(target._id), req });
      res.status(200).json({ success: true, message: 'Account reactivated. The person has to sign in again.' });
    } catch (error: any) {
      console.error('Reactivate error:', error);
      res.status(500).json({ success: false, message: 'Could not reactivate the account' });
    }
  }

  /** Signs the person out everywhere without switching the account off. */
  static async revokeSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const target: any = await User.findById(id).select('_id');
      if (!target) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      await User.updateOne({ _id: target._id }, { $set: { sessionsValidFrom: new Date() } });
      await endAllSessions(String(target._id));
      invalidateAccount(String(target._id));
      await AuditService.log({ action: 'sessions_revoked', userId: req.user?.userId, role: req.user?.role, targetType: 'user', targetId: String(target._id), req });
      res.status(200).json({ success: true, message: 'Signed out everywhere.' });
    } catch (error: any) {
      console.error('Revoke sessions error:', error);
      res.status(500).json({ success: false, message: 'Could not end the sessions' });
    }
  }
}
