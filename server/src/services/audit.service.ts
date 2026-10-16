import type { Request } from 'express';
import { appendAuditEvent } from '../lib/auditChain';

export type AuditAction =
  | 'register'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'consent_given'
  | 'consent_withdrawn'
  | 'notice_accepted'
  | 'ai_call'
  | 'support_ticket'
  | 'dpr_create'
  | 'dpr_change'
  | 'dpr_download'
  | 'dpr_delete'
  | 'kyc_upload'
  | 'kyc_delete'
  | 'data_export'
  | 'account_delete'
  | 'admin_view'
  | 'access_denied'
  | 'dpr_review'
  | 'role_change'
  | 'profile_change'
  | 'nominee_change'
  | 'complaint_submitted'
  | 'retention_warning'
  | 'retention_purge'
  | 'user_invite'
  | 'invite_accepted'
  | 'user_update'
  | 'user_delete'
  | 'user_deactivate'
  | 'user_reactivate'
  | 'sessions_revoked'
  | 'policy_change'
  | 'document_change'
  | 'template_update'
  | 'dpr_decision'
  | 'audit_export'
  | 'audit_verify'
  | 'ai_call'
  | 'support_ticket';

function clientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
}

export const AuditService = {
  async log(input: {
    action: AuditAction | string;
    userId?: string;
    role?: string;
    targetType?: string;
    targetId?: string;
    /** What changed or was decided: before/after values, counts, reasons. No secrets or document text. */
    payload?: unknown;
    req?: Request;
  }): Promise<void> {
    try {
      await appendAuditEvent({
        userId: input.userId || undefined,
        role: input.role,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ip: clientIp(input.req),
        payload: input.payload,
      });
    } catch (error) {
      console.error('Audit log failed:', (error as Error).message);
    }
  },
};
