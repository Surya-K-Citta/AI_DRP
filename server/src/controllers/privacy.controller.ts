import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { DPRSession } from '../models/DPRSession.model';
import { Document } from '../models/Document.model';
import { AuditEvent } from '../models/AuditEvent.model';
import { PrivacyComplaint } from '../models/PrivacyComplaint.model';
import { UserNotification } from '../models/UserNotification.model';
import { AuditService } from '../services/audit.service';
import { NotifyService } from '../services/notify.service';
import { eraseAccount } from '../services/accountErase.service';
import {
  GRIEVANCE_EMAIL,
  GRIEVANCE_RESPONSE_DAYS,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_ROLE,
} from '../lib/privacyNotice';

function publicPrivacyUser(user: any) {
  const noticeVersion = user.privacy?.noticeVersion || null;
  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
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

const USER_ACTIVITY_ACTIONS = [
  'login_success',
  'login_failed',
  'logout',
  'consent_given',
  'consent_withdrawn',
  'notice_accepted',
  'dpr_create',
  'dpr_change',
  'dpr_download',
  'dpr_delete',
  'kyc_upload',
  'kyc_delete',
  'data_export',
  'profile_change',
  'nominee_change',
  'complaint_submitted',
  'complaint_update',
  'retention_warning',
  'retention_purge',
];

export class PrivacyController {
  static async exportMyData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const user = await User.findById(userId).select('-passwordHash').lean();
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const projects = await Project.find({ userId }).lean();
      const projectIds = projects.map((p) => p._id.toString());
      const dprs = await DPRVersion.find({
        $or: [{ userId }, { projectId: { $in: projectIds } }],
      }).lean();
      const sessions = await DPRSession.find({ userId }).lean();
      const documents = await Document.find({
        uploadedBy: userId,
        'metadata.isTemplate': { $ne: true },
      })
        .select('-__v')
        .lean();
      const complaints = await PrivacyComplaint.find({ userId }).lean();

      const payload = {
        exportedAt: new Date().toISOString(),
        noticeVersion: PRIVACY_NOTICE_VERSION,
        profile: publicPrivacyUser(user),
        projects,
        dprs,
        sessions,
        documents,
        complaints,
      };

      await AuditService.log({
        action: 'data_export',
        userId,
        role: req.user?.role,
        req,
      });

      const filename = `msme-dpr-data-${userId}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(payload, null, 2));
    } catch (error: any) {
      console.error('Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
        error: error.message,
      });
    }
  }

  static async updateConsent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.privacy?.accountConsent) {
        res.status(400).json({
          success: false,
          message: 'Accept the privacy notice before changing these settings.',
        });
        return;
      }

      const prevAi = !!user.privacy?.aiAssist;
      user.privacy = user.privacy || {};
      if (typeof req.body.aiAssist === 'boolean') {
        user.privacy.aiAssist = req.body.aiAssist;
        user.privacy.aiAssistAt = req.body.aiAssist ? new Date() : user.privacy.aiAssistAt;
      }
      if (typeof req.body.analytics === 'boolean') {
        user.privacy.analytics = req.body.analytics;
        user.privacy.analyticsAt = req.body.analytics ? new Date() : user.privacy.analyticsAt;
      }
      user.markModified('privacy');
      await user.save();

      const nextAi = !!user.privacy.aiAssist;
      if (prevAi && !nextAi) {
        await AuditService.log({
          action: 'consent_withdrawn',
          userId,
          role: req.user?.role,
          targetType: 'aiAssist',
          req,
        });
      } else if (!prevAi && nextAi) {
        await AuditService.log({
          action: 'consent_given',
          userId,
          role: req.user?.role,
          targetType: 'aiAssist',
          req,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Privacy choices saved',
        data: publicPrivacyUser(user),
      });
    } catch (error: any) {
      console.error('Update privacy consent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save privacy choices',
        error: error.message,
      });
    }
  }

  static async saveNominee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const name = String(req.body.name || '').trim();
      const phone = String(req.body.phone || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();

      if (!name) {
        res.status(400).json({ success: false, message: 'Nominee name is required' });
        return;
      }
      if (!phone && !email) {
        res.status(400).json({
          success: false,
          message: 'Give the nominee a phone number or an email',
        });
        return;
      }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        res.status(400).json({ success: false, message: 'Nominee email is not valid' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.privacy = user.privacy || {};
      user.privacy.nominee = { name, phone, email };
      user.markModified('privacy');
      await user.save();

      await AuditService.log({
        action: 'nominee_change',
        userId,
        role: req.user?.role,
        req,
      });

      res.status(200).json({
        success: true,
        message: 'Nominee saved',
        data: publicPrivacyUser(user),
      });
    } catch (error: any) {
      console.error('Save nominee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save nominee',
        error: error.message,
      });
    }
  }

  static async deleteMyAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const confirm = String(req.body.confirm || '').trim();
      if (confirm !== 'DELETE') {
        res.status(400).json({
          success: false,
          message: 'Type DELETE to confirm account deletion',
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await AuditService.log({
        action: 'account_delete',
        userId,
        role: req.user?.role,
        targetType: 'user',
        targetId: userId,
        req,
      });

      const result = await eraseAccount(userId);

      res.status(200).json({
        success: true,
        message: 'Your account and stored files were deleted. Audit records were kept.',
        data: result,
      });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message,
      });
    }
  }

  static async submitComplaint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const subject = String(req.body.subject || '').trim();
      const message = String(req.body.message || '').trim();
      if (!subject || !message) {
        res.status(400).json({
          success: false,
          message: 'Subject and message are required',
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const complaint = await PrivacyComplaint.create({
        userId,
        email: user.email,
        name: user.name,
        subject,
        message,
        inbox: GRIEVANCE_EMAIL,
        status: 'open',
        dueAt: new Date(Date.now() + GRIEVANCE_RESPONSE_DAYS * 24 * 60 * 60 * 1000),
      });

      // Tell the department mailbox. Until SMTP is configured this only logs (see NotifyService).
      await NotifyService.sendMail(
        GRIEVANCE_EMAIL,
        `[Privacy request] ${subject}`,
        `From: ${user.name || ''} <${user.email}>\nReference: ${complaint._id}\nReply due by: ${complaint.dueAt?.toISOString()}\n\n${message}`
      );

      await AuditService.log({
        action: 'complaint_submitted',
        userId,
        role: req.user?.role,
        targetType: 'complaint',
        targetId: complaint._id.toString(),
        req,
      });

      res.status(201).json({
        success: true,
        message: `Your request was saved. ${PRIVACY_OFFICER_NAME}, ${PRIVACY_OFFICER_ROLE}, will reply within ${GRIEVANCE_RESPONSE_DAYS} days. You can follow it on this page.`,
        data: {
          id: complaint._id,
          inbox: GRIEVANCE_EMAIL,
          createdAt: complaint.createdAt,
          dueAt: complaint.dueAt,
          status: complaint.status,
        },
      });
    } catch (error: any) {
      console.error('Submit complaint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit privacy request',
        error: error.message,
      });
    }
  }

  /** The person's own requests with their status and the officer's answer. Internal notes are never returned. */
  static async myComplaints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
      const items = await PrivacyComplaint.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('subject message status response respondedAt dueAt createdAt')
        .lean();
      res.status(200).json({ success: true, data: items });
    } catch (error: any) {
      console.error('List complaints error:', error);
      res.status(500).json({ success: false, message: 'Failed to load privacy requests' });
    }
  }

  static async myActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const limit = Math.min(Number(req.query.limit) || 30, 100);
      const events = await AuditEvent.find({
        userId,
        action: { $in: USER_ACTIVITY_ACTIONS },
      })
        .sort({ at: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: events.map((event) => ({
          at: event.at,
          action: event.action,
          targetType: event.targetType,
          targetId: event.targetId,
        })),
      });
    } catch (error: any) {
      console.error('Activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load activity',
        error: error.message,
      });
    }
  }

  static async listNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
      const limit = Math.min(Number(req.query.limit) || 30, 100);
      const items = await UserNotification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
      const unread = await UserNotification.countDocuments({ userId, readAt: { $exists: false } });
      res.status(200).json({
        success: true,
        data: {
          unread,
          items: items.map((row) => ({
            id: row._id,
            kind: row.kind,
            title: row.title,
            body: row.body,
            at: row.createdAt,
            readAt: row.readAt,
            smsStatus: row.smsStatus,
            emailStatus: row.emailStatus,
          })),
        },
      });
    } catch (error: any) {
      console.error('List notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load notifications',
        error: error.message,
      });
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
      const { id } = req.params;
      if (id === 'all') {
        await UserNotification.updateMany(
          { userId, readAt: { $exists: false } },
          { $set: { readAt: new Date() } }
        );
      } else {
        await UserNotification.findOneAndUpdate(
          { _id: id, userId },
          { $set: { readAt: new Date() } }
        );
      }
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification',
        error: error.message,
      });
    }
  }
}
