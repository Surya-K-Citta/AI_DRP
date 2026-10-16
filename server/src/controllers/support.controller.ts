// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { SupportTicket } from '../models/SupportTicket.model';
import { AuditService } from '../services/audit.service';
import { PRIORITY_MEANING, RESPONSE_TARGET_MS, isPriority, resolutionDueAt, responseDueAt, startingTier } from '../lib/supportSla';
import { runEscalation } from '../services/supportEscalation.service';

const STATUSES = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];

// What a person sees about their own request. Internal notes are never shown.
function publicView(t: any) {
  return {
    id: String(t._id),
    ticketNo: t.ticketNo,
    subject: t.subject,
    description: t.description,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt,
    firstResponseAt: t.firstResponseAt || null,
    responseDueAt: t.responseDueAt,
    resolvedAt: t.resolvedAt || null,
    notes: (t.notes || []).filter((n: any) => n.visibleToUser),
  };
}
const staffView = (t: any) => ({ ...publicView(t), userId: t.userId, tier: t.tier, breached: t.breached, escalations: t.escalations, resolutionDueAt: t.resolutionDueAt, notes: t.notes });

async function nextTicketNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await SupportTicket.countDocuments({ ticketNo: new RegExp(`^SUP-${year}-`) });
  return `SUP-${year}-${String(count + 1).padStart(5, '0')}`;
}

export class SupportController {
  static info(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: { priorities: Object.keys(PRIORITY_MEANING).map((p) => ({ priority: p, meaning: PRIORITY_MEANING[p], firstResponseHours: RESPONSE_TARGET_MS[p] / 3_600_000 })) } });
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const subject = String(req.body?.subject || '').trim();
      const description = String(req.body?.description || '').trim();
      if (!subject || !description) return res.status(400).json({ success: false, message: 'Give a short title and describe the problem' });
      // The person says how urgent it is; the Admin can re-rate it afterwards.
      const priority = isPriority(req.body?.priority) ? req.body.priority : 'P3';
      const now = new Date();
      let ticket;
      for (let attempt = 0; attempt < 5 && !ticket; attempt += 1) {
        try {
          ticket = await SupportTicket.create({
            ticketNo: await nextTicketNo(), userId: req.user.userId, subject: subject.slice(0, 200), description: description.slice(0, 4000),
            priority, tier: startingTier(priority), responseDueAt: responseDueAt(priority, now), resolutionDueAt: resolutionDueAt(priority, now),
          });
        } catch (error: any) {
          if (error?.code !== 11000) throw error;
        }
      }
      await AuditService.log({ action: 'support_ticket', userId: req.user.userId, role: req.user.role, targetType: 'support_ticket', targetId: String(ticket._id), req, payload: { event: 'created', ticketNo: ticket.ticketNo, priority } });
      res.status(201).json({ success: true, data: publicView(ticket) });
    } catch (error: any) {
      console.error('Create ticket error:', error);
      res.status(500).json({ success: false, message: 'Could not raise the request' });
    }
  }

  static async mine(req: AuthRequest, res: Response) {
    const tickets = await SupportTicket.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: tickets.map(publicView) });
  }

  static async reply(req: AuthRequest, res: Response) {
    const text = String(req.body?.text || '').trim().slice(0, 4000);
    if (!text) return res.status(400).json({ success: false, message: 'Write a message first' });
    const ticket: any = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Request not found' });
    ticket.notes.push({ byUserId: req.user.userId, byRole: req.user.role, text, visibleToUser: true });
    if (ticket.status === 'waiting_user') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ success: true, data: publicView(ticket) });
  }

  // ---- staff: admin sees every tier, a District Reviewer works the L1 queue only ----
  static async queue(req: AuthRequest, res: Response) {
    const filter: any = {};
    if (req.user.role === 'officer') filter.tier = 'L1';
    else if (['L1', 'L2', 'L3'].includes(String(req.query.tier))) filter.tier = req.query.tier;
    if (STATUSES.includes(String(req.query.status))) filter.status = req.query.status;
    else filter.status = { $in: ['open', 'in_progress', 'waiting_user'] };
    if (req.query.breached === 'true') filter.breached = true;
    const tickets = await SupportTicket.find(filter).sort({ priority: 1, responseDueAt: 1 }).limit(200).lean();
    res.json({ success: true, data: tickets.map(staffView) });
  }

  static async update(req: AuthRequest, res: Response) {
    const ticket: any = await SupportTicket.findById(req.params.id);
    if (!ticket || (req.user.role === 'officer' && ticket.tier !== 'L1')) return res.status(404).json({ success: false, message: 'Request not found' });
    const now = new Date();
    const changes: Record<string, unknown> = {};
    const { status, priority, tier, note, internal } = req.body || {};
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Unknown status' });
      ticket.status = status; changes.status = status;
      if (status === 'resolved' || status === 'closed') ticket.resolvedAt = ticket.resolvedAt || now;
    }
    if (priority !== undefined && req.user.role === 'admin') {
      if (!isPriority(priority)) return res.status(400).json({ success: false, message: 'Unknown priority' });
      ticket.priority = priority; ticket.responseDueAt = responseDueAt(priority, ticket.createdAt); ticket.resolutionDueAt = resolutionDueAt(priority, ticket.createdAt); changes.priority = priority;
    }
    if (tier !== undefined) {
      if (!['L1', 'L2', 'L3'].includes(tier)) return res.status(400).json({ success: false, message: 'Unknown tier' });
      if (tier !== ticket.tier) { ticket.escalations.push({ at: now, from: ticket.tier, to: tier, reason: 'Moved by staff', auto: false }); ticket.tier = tier; changes.tier = tier; }
    }
    if (typeof note === 'string' && note.trim()) {
      ticket.notes.push({ byUserId: req.user.userId, byRole: req.user.role, text: note.trim().slice(0, 4000), visibleToUser: internal !== true });
      if (internal !== true && !ticket.firstResponseAt) ticket.firstResponseAt = now; // an internal note is not a reply to the person
      changes.note = internal === true ? 'internal' : 'reply';
    }
    await ticket.save();
    await AuditService.log({ action: 'support_ticket', userId: req.user.userId, role: req.user.role, targetType: 'support_ticket', targetId: String(ticket._id), req, payload: { event: 'updated', ticketNo: ticket.ticketNo, ...changes } });
    res.json({ success: true, data: staffView(ticket) });
  }

  static async escalateNow(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: await runEscalation() });
  }

  static async report(_req: AuthRequest, res: Response) {
    const open = await SupportTicket.find({ status: { $in: ['open', 'in_progress', 'waiting_user'] } }).lean();
    const all = await SupportTicket.find({ firstResponseAt: { $exists: true } }).select('priority createdAt firstResponseAt').lean();
    const met = (p: string) => {
      const rows = all.filter((t: any) => t.priority === p);
      const ok = rows.filter((t: any) => new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime() <= RESPONSE_TARGET_MS[p]).length;
      return { priority: p, answered: rows.length, withinTarget: ok, percent: rows.length ? Math.round((ok / rows.length) * 100) : null };
    };
    res.json({ success: true, data: { open: open.length, breached: open.filter((t: any) => t.breached).length, byTier: { L1: open.filter((t: any) => t.tier === 'L1').length, L2: open.filter((t: any) => t.tier === 'L2').length, L3: open.filter((t: any) => t.tier === 'L3').length }, responseTargets: ['P1', 'P2', 'P3', 'P4'].map(met) } });
  }
}
