// @ts-nocheck
import crypto from 'crypto';
import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { User } from '../models/User.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { PrivacyComplaint } from '../models/PrivacyComplaint.model';
import { DataBreachIncident } from '../models/DataBreachIncident.model';
import { AuditService } from '../services/audit.service';
import { NotifyService } from '../services/notify.service';
import { gatewayConfig } from '../lib/aiGateway';
import { auditRetentionDays, isKycEncryptionEnabled, retentionIdleDays, retentionWarningDays } from '../lib/kycStorage';
import {
  AUDIT_RETENTION_MONTHS,
  BREACH_BOARD_REPORT_HOURS,
  DATA_FIDUCIARY_ADDRESS,
  DATA_FIDUCIARY_NAME,
  DELETION_WARNING_DAYS,
  DRAFT_RETENTION_MONTHS,
  GRIEVANCE_EMAIL,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_ROLE,
} from '../lib/privacyNotice';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const COMPLAINT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const INCIDENT_STATUSES = ['detected', 'assessing', 'declared_breach', 'not_a_breach', 'contained', 'closed'];

const isId = (id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id);
const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

async function actorName(req: AuthRequest): Promise<string> {
  const user = req.user?.userId ? await User.findById(req.user.userId).select('name email').lean() : null;
  return (user as any)?.name || (user as any)?.email || req.user?.email || 'admin';
}

function present(incident: any) {
  const row = incident.toObject ? incident.toObject() : incident;
  const declared = row.declaredAt ? new Date(row.declaredAt).getTime() : null;
  const boardDetailedDueAt = declared ? new Date(declared + BREACH_BOARD_REPORT_HOURS * HOUR) : null;
  return {
    ...row,
    affectedUserIds: undefined,
    affectedUserCount: (row.affectedUserIds || []).length,
    boardDetailedDueAt,
    boardReportOverdue:
      row.status === 'declared_breach' && !!boardDetailedDueAt && !row.boardDetailedReportAt && boardDetailedDueAt.getTime() < Date.now(),
  };
}

export class PrivacyOpsController {
  // ---------- Privacy requests and complaints ----------

  static async listComplaints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filter: any = {};
      const status = String(req.query.status || '');
      if (COMPLAINT_STATUSES.includes(status)) filter.status = status;
      const items = await PrivacyComplaint.find(filter).sort({ createdAt: -1 }).limit(200).lean();
      const now = Date.now();
      res.status(200).json({
        success: true,
        data: {
          officer: { name: PRIVACY_OFFICER_NAME, role: PRIVACY_OFFICER_ROLE, email: GRIEVANCE_EMAIL },
          items: items.map((c: any) => ({
            ...c,
            overdue: ['open', 'in_progress'].includes(c.status) && !!c.dueAt && new Date(c.dueAt).getTime() < now,
          })),
        },
      });
    } catch (error: any) {
      console.error('Admin list complaints error:', error);
      res.status(500).json({ success: false, message: 'Failed to load privacy requests' });
    }
  }

  static async updateComplaint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isId(id)) {
        res.status(400).json({ success: false, message: 'Invalid request id' });
        return;
      }
      const complaint = await PrivacyComplaint.findById(id);
      if (!complaint) {
        res.status(404).json({ success: false, message: 'Request not found' });
        return;
      }
      const { status, response, assignedTo, internalNote } = req.body || {};
      if (status !== undefined && !COMPLAINT_STATUSES.includes(status)) {
        res.status(400).json({ success: false, message: `status must be one of ${COMPLAINT_STATUSES.join(', ')}` });
        return;
      }
      const nextStatus = status ?? complaint.status;
      const nextResponse = response !== undefined ? text(response, 4000) : complaint.response;
      if (['resolved', 'closed'].includes(nextStatus) && !nextResponse) {
        res.status(400).json({ success: false, message: 'Write the answer to the person before resolving or closing the request' });
        return;
      }

      const responseChanged = response !== undefined && nextResponse !== (complaint.response || '');
      complaint.status = nextStatus;
      if (assignedTo !== undefined) complaint.assignedTo = text(assignedTo, 200);
      if (internalNote !== undefined) complaint.internalNote = text(internalNote, 4000);
      if (responseChanged) {
        complaint.response = nextResponse;
        complaint.respondedAt = new Date();
        complaint.respondedBy = req.user?.userId as any;
      }
      await complaint.save();

      // Tell the person when the officer answers or the request is closed.
      if (responseChanged || status !== undefined) {
        const user = await User.findById(complaint.userId).select('email phoneNumber name').lean();
        if (user) {
          await NotifyService.notify({
            userId: String(complaint.userId),
            kind: 'complaint_update',
            title: responseChanged ? 'Reply to your privacy request' : 'Your privacy request was updated',
            body: responseChanged
              ? `Your request “${complaint.subject}” has a reply: ${nextResponse}`
              : `Your request “${complaint.subject}” is now ${nextStatus.replace('_', ' ')}.`,
            phone: (user as any).phoneNumber,
            email: (user as any).email,
            targetType: 'complaint',
            targetId: String(complaint._id),
          });
        }
      }

      await AuditService.log({
        action: 'complaint_update',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'complaint',
        targetId: String(complaint._id),
        payload: { status: nextStatus, replied: responseChanged },
        req,
      });
      res.status(200).json({ success: true, data: complaint });
    } catch (error: any) {
      console.error('Admin update complaint error:', error);
      res.status(500).json({ success: false, message: 'Failed to update the request' });
    }
  }

  // ---------- Breach / incident register ----------

  static async listIncidents(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const items = await DataBreachIncident.find().sort({ detectedAt: -1 }).limit(200);
      res.status(200).json({
        success: true,
        data: { boardReportHours: BREACH_BOARD_REPORT_HOURS, items: items.map(present) },
      });
    } catch (error: any) {
      console.error('List incidents error:', error);
      res.status(500).json({ success: false, message: 'Failed to load incidents' });
    }
  }

  static async createIncident(req: AuthRequest, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const title = text(body.title, 200);
      const nature = text(body.nature, 4000);
      if (!title || !nature) {
        res.status(400).json({ success: false, message: 'Title and what happened (nature and scope) are required' });
        return;
      }
      const detectedAt = body.detectedAt ? new Date(body.detectedAt) : new Date();
      if (Number.isNaN(detectedAt.getTime()) || detectedAt.getTime() > Date.now() + 5 * 60 * 1000) {
        res.status(400).json({ success: false, message: 'Detection time must be a valid time, not in the future' });
        return;
      }
      const by = await actorName(req);
      const incident = await DataBreachIncident.create({
        reference: `INC-${detectedAt.toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        title,
        nature,
        dataAffected: Array.isArray(body.dataAffected) ? body.dataAffected.map((d: unknown) => text(d, 100)).filter(Boolean).slice(0, 30) : [],
        usersAffectedCount: Math.max(0, Number(body.usersAffectedCount) || 0),
        recordsAffected: text(body.recordsAffected, 1000),
        detectedAt,
        reportedBy: text(body.reportedBy, 200) || by,
        timeline: [{ at: new Date(), by, kind: 'detected', note: 'Incident logged' }],
      });
      await AuditService.log({
        action: 'incident_create',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'incident',
        targetId: String(incident._id),
        payload: { reference: incident.reference },
        req,
      });
      res.status(201).json({ success: true, data: present(incident) });
    } catch (error: any) {
      console.error('Create incident error:', error);
      res.status(500).json({ success: false, message: 'Failed to log the incident' });
    }
  }

  static async updateIncident(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isId(id)) {
        res.status(400).json({ success: false, message: 'Invalid incident id' });
        return;
      }
      const incident = await DataBreachIncident.findById(id);
      if (!incident) {
        res.status(404).json({ success: false, message: 'Incident not found' });
        return;
      }
      const body = req.body || {};
      const by = await actorName(req);
      const note = (kind: string, n?: string) => incident.timeline.push({ at: new Date(), by, kind, note: n });
      const changed: string[] = [];

      for (const [key, max] of [['title', 200], ['nature', 4000], ['recordsAffected', 1000], ['assessmentNote', 2000], ['containmentActions', 4000], ['correctiveActions', 4000], ['boardReference', 200]] as const) {
        if (body[key] !== undefined && text(body[key], max) !== (incident[key] || '')) {
          incident[key] = text(body[key], max);
          changed.push(key);
        }
      }
      if (Array.isArray(body.dataAffected)) {
        incident.dataAffected = body.dataAffected.map((d: unknown) => text(d, 100)).filter(Boolean).slice(0, 30);
        changed.push('dataAffected');
      }
      if (body.usersAffectedCount !== undefined) {
        incident.usersAffectedCount = Math.max(0, Number(body.usersAffectedCount) || 0);
        changed.push('usersAffectedCount');
      }
      if (Array.isArray(body.affectedUserIds) || Array.isArray(body.affectedEmails)) {
        const emails = (Array.isArray(body.affectedEmails) ? body.affectedEmails : []).map((e: unknown) => text(e, 200).toLowerCase()).filter(Boolean).slice(0, 5000);
        const found = emails.length ? await User.find({ email: { $in: emails } }).select('_id').lean() : [];
        const ids = [...new Set([...(Array.isArray(body.affectedUserIds) ? body.affectedUserIds.filter(isId) : []), ...found.map((u: any) => String(u._id))])].slice(0, 5000);
        incident.affectedUserIds = ids;
        if (ids.length > incident.usersAffectedCount) incident.usersAffectedCount = ids.length;
        changed.push('affectedUserIds');
      }
      if (body.boardIntimated === true && !incident.boardIntimatedAt) {
        incident.boardIntimatedAt = new Date();
        note('board_intimated', body.boardReference ? `Reference ${text(body.boardReference, 200)}` : undefined);
        changed.push('boardIntimatedAt');
      }
      if (body.boardDetailedReported === true && !incident.boardDetailedReportAt) {
        incident.boardDetailedReportAt = new Date();
        note('board_detailed_report', 'Detailed report sent to the Data Protection Board');
        changed.push('boardDetailedReportAt');
      }

      if (body.status !== undefined && body.status !== incident.status) {
        if (!INCIDENT_STATUSES.includes(body.status)) {
          res.status(400).json({ success: false, message: `status must be one of ${INCIDENT_STATUSES.join(', ')}` });
          return;
        }
        if (['declared_breach', 'not_a_breach'].includes(body.status) && !text(body.assessmentNote ?? incident.assessmentNote, 2000)) {
          res.status(400).json({ success: false, message: 'Record why this is, or is not, a personal data breach before deciding' });
          return;
        }
        if (body.status === 'contained' && !incident.containmentActions) {
          res.status(400).json({ success: false, message: 'Record the actions taken to contain the incident first' });
          return;
        }
        if (body.status === 'closed' && !incident.correctiveActions) {
          res.status(400).json({ success: false, message: 'Record the corrective and preventive actions before closing' });
          return;
        }
        if (body.status === 'declared_breach') {
          incident.declaredBy = by;
          incident.declaredAt = new Date();
        }
        if (body.status === 'contained') incident.containedAt = new Date();
        if (body.status === 'closed') incident.closedAt = new Date();
        note(`status_${body.status}`, text(body.statusNote, 2000) || undefined);
        incident.status = body.status;
        changed.push('status');
      }
      if (!changed.length) {
        res.status(400).json({ success: false, message: 'Nothing to update' });
        return;
      }
      await incident.save();
      await AuditService.log({
        action: 'incident_update',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'incident',
        targetId: String(incident._id),
        payload: { reference: incident.reference, changed, status: incident.status },
        req,
      });
      res.status(200).json({ success: true, data: present(incident) });
    } catch (error: any) {
      console.error('Update incident error:', error);
      res.status(500).json({ success: false, message: 'Failed to update the incident' });
    }
  }

  /** Sends the breach notice to every user listed on the incident (in-app, plus SMS and email when set up). */
  static async notifyIncidentUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isId(id)) {
        res.status(400).json({ success: false, message: 'Invalid incident id' });
        return;
      }
      const incident = await DataBreachIncident.findById(id);
      if (!incident) {
        res.status(404).json({ success: false, message: 'Incident not found' });
        return;
      }
      if (incident.status !== 'declared_breach' && incident.status !== 'contained' && incident.status !== 'closed') {
        res.status(400).json({ success: false, message: 'Declare the incident as a personal data breach before notifying people' });
        return;
      }
      if (incident.declaredAt == null) {
        res.status(400).json({ success: false, message: 'This incident was never declared a breach' });
        return;
      }
      const message = text(req.body?.message, 2000);
      if (!message) {
        res.status(400).json({ success: false, message: 'Write the notice people will receive: what happened, what it means for them, what to do, and who to contact' });
        return;
      }
      const ids = (incident.affectedUserIds || []).map(String);
      if (!ids.length) {
        res.status(400).json({ success: false, message: 'No affected users are listed on this incident' });
        return;
      }
      const users = await User.find({ _id: { $in: ids } }).select('email phoneNumber name').lean();
      let sent = 0;
      for (const user of users as any[]) {
        await NotifyService.notify({
          userId: String(user._id),
          kind: 'breach_notice',
          title: 'Important notice about your personal data',
          body: `${message} Contact ${PRIVACY_OFFICER_NAME} at ${GRIEVANCE_EMAIL}.`,
          phone: user.phoneNumber,
          email: user.email,
          targetType: 'incident',
          targetId: String(incident._id),
        });
        sent += 1;
      }
      incident.usersNotifiedAt = new Date();
      incident.usersNotifiedCount = sent;
      incident.timeline.push({ at: new Date(), by: await actorName(req), kind: 'users_notified', note: `${sent} people notified` });
      await incident.save();
      await AuditService.log({
        action: 'incident_notify',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'incident',
        targetId: String(incident._id),
        payload: { reference: incident.reference, notified: sent },
        req,
      });
      res.status(200).json({ success: true, data: { notified: sent, incident: present(incident) } });
    } catch (error: any) {
      console.error('Notify incident users error:', error);
      res.status(500).json({ success: false, message: 'Failed to notify the affected users' });
    }
  }

  // ---------- Retention hold (submitted reports that must outlive 12 months) ----------

  static async setRetentionHold(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isId(id)) {
        res.status(400).json({ success: false, message: 'Invalid DPR id' });
        return;
      }
      const reason = text(req.body?.reason, 500);
      const reference = text(req.body?.reference, 200);
      if (!reason || !reference) {
        res.status(400).json({ success: false, message: 'A reason and the department’s written reference (letter or file number) are required' });
        return;
      }
      let until: Date | undefined;
      if (req.body?.until) {
        until = new Date(req.body.until);
        if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
          res.status(400).json({ success: false, message: 'The end date must be a valid date in the future' });
          return;
        }
      }
      const by = await actorName(req);
      const dpr = await DPRVersion.findByIdAndUpdate(
        id,
        // Clearing the warning means the report is warned again if the hold is later lifted.
        { $set: { retentionHold: { active: true, reason, reference, until, setBy: by, setAt: new Date() } }, $unset: { retentionWarningAt: '' } },
        { new: true, timestamps: false }
      ).select('retentionHold status');
      if (!dpr) {
        res.status(404).json({ success: false, message: 'DPR not found' });
        return;
      }
      await AuditService.log({
        action: 'retention_hold_set',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'dpr',
        targetId: id,
        payload: { reference, until: until?.toISOString() ?? null },
        req,
      });
      res.status(200).json({ success: true, data: dpr.retentionHold });
    } catch (error: any) {
      console.error('Set retention hold error:', error);
      res.status(500).json({ success: false, message: 'Failed to set the retention hold' });
    }
  }

  static async liftRetentionHold(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!isId(id)) {
        res.status(400).json({ success: false, message: 'Invalid DPR id' });
        return;
      }
      const dpr = await DPRVersion.findOneAndUpdate(
        { _id: id, 'retentionHold.active': true },
        { $set: { 'retentionHold.active': false } },
        { new: true, timestamps: false }
      ).select('retentionHold');
      if (!dpr) {
        res.status(404).json({ success: false, message: 'This DPR has no active retention hold' });
        return;
      }
      await AuditService.log({
        action: 'retention_hold_lifted',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'dpr',
        targetId: id,
        payload: { reference: dpr.retentionHold?.reference },
        req,
      });
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Lift retention hold error:', error);
      res.status(500).json({ success: false, message: 'Failed to lift the retention hold' });
    }
  }

  static async listRetentionHolds(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const rows = await DPRVersion.find({ 'retentionHold.active': true }).select('retentionHold status userId updatedAt').lean();
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to load retention holds' });
    }
  }

  // ---------- Compliance status: what is ready and what still needs the department ----------

  static async complianceStatus(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const env = (name: string) => (process.env[name] || '').trim();
      const flag = (name: string) => env(name).toLowerCase() === 'true';
      const ai = gatewayConfig();
      const now = new Date();
      const [openComplaints, overdueComplaints, openIncidents, overdueBoard, holds] = await Promise.all([
        PrivacyComplaint.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        PrivacyComplaint.countDocuments({ status: { $in: ['open', 'in_progress'] }, dueAt: { $lt: now } }),
        DataBreachIncident.countDocuments({ status: { $in: ['detected', 'assessing', 'declared_breach'] } }),
        DataBreachIncident.countDocuments({
          status: 'declared_breach',
          boardDetailedReportAt: null,
          declaredAt: { $lt: new Date(now.getTime() - BREACH_BOARD_REPORT_HOURS * HOUR) },
        }),
        DPRVersion.countDocuments({ 'retentionHold.active': true }),
      ]);

      type Item = { area: string; status: 'ready' | 'action'; detail: string; needs?: string };
      const items: Item[] = [
        { area: 'Data Fiduciary', status: 'ready', detail: DATA_FIDUCIARY_ADDRESS },
        { area: 'Privacy officer', status: 'ready', detail: `${PRIVACY_OFFICER_NAME}, ${PRIVACY_OFFICER_ROLE}` },
        {
          area: 'Privacy mailbox',
          status: env('SMTP_HOST') ? 'ready' : 'action',
          detail: `Published as ${GRIEVANCE_EMAIL}. Requests are stored and shown in Admin → Privacy and incidents.`,
          needs: env('SMTP_HOST') ? undefined : 'A mail service (SMTP or API key) so mail reaches the mailbox and people. Until then emails are only logged.',
        },
        {
          area: 'Grievance process',
          status: overdueComplaints ? 'action' : 'ready',
          detail: `${openComplaints} open, ${overdueComplaints} past the 90-day limit. Reply from Admin → Privacy and incidents.`,
          needs: overdueComplaints ? 'Reply to the overdue requests.' : undefined,
        },
        {
          area: 'DPR retention',
          status: retentionIdleDays() === 365 ? 'ready' : 'action',
          detail: `Deleted ${retentionIdleDays()} days after last edit (policy: ${DRAFT_RETENTION_MONTHS} months).`,
          needs: retentionIdleDays() === 365 ? undefined : 'RETENTION_IDLE_DAYS differs from the 12-month policy.',
        },
        {
          area: 'Deletion warning',
          status: retentionWarningDays() === DELETION_WARNING_DAYS ? 'ready' : 'action',
          detail: `Warning ${retentionWarningDays()} days before deletion (policy: ${DELETION_WARNING_DAYS}).`,
        },
        {
          area: 'Warning delivery (SMS)',
          status: NotifyService.twilioReady() ? 'ready' : 'action',
          detail: NotifyService.twilioReady() ? 'SMS gateway connected.' : 'In-app warning works; SMS is mocked.',
          needs: NotifyService.twilioReady() ? undefined : 'Approve an SMS provider and supply its credentials (or confirm SMS is not required).',
        },
        {
          area: 'Audit logs',
          status: auditRetentionDays() === 730 ? 'ready' : 'action',
          detail: `Kept ${auditRetentionDays()} days (policy: ${AUDIT_RETENTION_MONTHS} months), tamper-evident chain.`,
        },
        {
          area: 'Scheme records',
          status: 'ready',
          detail: `${holds} report(s) on retention hold. Admins can hold a submitted DPR on written instruction.`,
          needs: 'Department to state in writing whether any submitted DPR must be kept until bank or DIC closure. If not, the 12-month rule applies.',
        },
        {
          area: 'Encryption at rest',
          status: env('DATA_ENCRYPTION_KEY') && isKycEncryptionEnabled() ? 'ready' : 'action',
          detail: 'Personal data and identity files are encrypted when the keys are set.',
          needs: env('DATA_ENCRYPTION_KEY') && isKycEncryptionEnabled() ? undefined : 'Set DATA_ENCRYPTION_KEY and KYC_ENCRYPTION_KEY before production.',
        },
        {
          area: 'Vendors and contracts',
          status: flag('VENDOR_CONTRACTS_CONFIRMED') ? 'ready' : 'action',
          detail: 'Processors: database / cloud host, OpenAI, Cloudinary, SMS gateway (if enabled).',
          needs: flag('VENDOR_CONTRACTS_CONFIRMED') ? undefined : 'Signed data-processing terms with each vendor (purpose, security, no unrelated use, deletion on exit). Then set VENDOR_CONTRACTS_CONFIRMED=true.',
        },
        {
          area: 'AI data use',
          status: ai.zeroRetentionConfirmed ? 'ready' : 'action',
          detail: 'Requests are scrubbed of identity data and sent with store disabled.',
          needs: ai.zeroRetentionConfirmed ? undefined : 'Written confirmation from OpenAI that API data is not used for training and zero retention applies. Then set OPENAI_ZDR_CONFIRMED=true.',
        },
        {
          area: 'Cross-border data',
          status: flag('CROSS_BORDER_CONFIRMED') ? 'ready' : 'action',
          detail: 'AI text (OpenAI) and Cloudinary files may be processed outside India. The notice says so.',
          needs: flag('CROSS_BORDER_CONFIRMED') ? undefined : 'Department decision on whether processing outside India is permitted. Then set CROSS_BORDER_CONFIRMED=true, or switch the vendor to an Indian region.',
        },
        {
          area: 'Breach management',
          status: overdueBoard ? 'action' : 'ready',
          detail: `${openIncidents} open incident(s). Register, Board-report clock and user notices are in Admin → Privacy and incidents.`,
          needs: overdueBoard ? 'A declared breach is past the 72-hour Board report.' : 'Department to name the incident owner and the person who reports to the Board (record them on each incident).',
        },
      ];
      res.status(200).json({ success: true, data: { items, generatedAt: now } });
    } catch (error: any) {
      console.error('Compliance status error:', error);
      res.status(500).json({ success: false, message: 'Failed to load the compliance status' });
    }
  }
}
