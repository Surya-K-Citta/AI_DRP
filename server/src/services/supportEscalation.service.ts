// @ts-nocheck
import { SupportTicket } from '../models/SupportTicket.model';
import { AuditService } from './audit.service';
import { escalationFor } from '../lib/supportSla';

// Moves unanswered tickets up the L1 -> L2 -> L3 ladder and flags SLA breaches. Runs every minute and is safe to run twice.
export async function runEscalation(now = new Date()) {
  const open = await SupportTicket.find({ status: { $in: ['open', 'in_progress', 'waiting_user'] }, firstResponseAt: { $exists: false } });
  let escalated = 0;
  let breached = 0;
  for (const ticket of open) {
    const next = escalationFor({ priority: ticket.priority, tier: ticket.tier, createdAt: ticket.createdAt, firstResponseAt: ticket.firstResponseAt, now });
    const tierChanged = next.tier !== ticket.tier;
    const newBreach = next.breached && !ticket.breached;
    if (!tierChanged && !newBreach) continue;
    if (tierChanged) {
      ticket.escalations.push({ at: now, from: ticket.tier, to: next.tier, reason: next.reason, auto: true });
      ticket.tier = next.tier;
      escalated += 1;
    }
    if (newBreach) { ticket.breached = true; breached += 1; }
    await ticket.save();
    await AuditService.log({ action: 'support_ticket', targetType: 'support_ticket', targetId: String(ticket._id), payload: { event: newBreach ? 'sla_breach' : 'auto_escalated', ticketNo: ticket.ticketNo, priority: ticket.priority, tier: ticket.tier, reason: next.reason } });
  }
  return { checked: open.length, escalated, breached };
}
