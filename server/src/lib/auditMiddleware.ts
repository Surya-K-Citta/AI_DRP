// @ts-nocheck
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuditService } from '../services/audit.service';

type Spec = {
  action: string;
  targetType: string;
  /** Which id the change is about. Defaults to the :id style URL parameter. */
  targetId?: (req: AuthRequest) => string | undefined;
  /** What to record besides who and when. Secrets are removed and the size is capped on the way in. */
  payload?: (req: AuthRequest) => unknown;
};

/**
 * Wraps a route handler so that a successful change (any 2xx) is written to the audit trail, with the
 * caller's user id, role and IP. Failed or refused requests are not recorded as changes.
 */
export function auditOnSuccess(handler: (req: AuthRequest, res: Response, next: NextFunction) => unknown, spec: Spec) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.once('finish', () => {
      if (res.statusCode >= 400) return;
      const params = req.params || {};
      const targetId = spec.targetId?.(req) ?? params.id ?? params.documentId ?? params.schemeCode ?? params.dprId;
      void AuditService.log({
        action: spec.action,
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: spec.targetType,
        targetId: targetId ? String(targetId) : undefined,
        payload: spec.payload ? spec.payload(req) : undefined,
        req,
      });
    });
    return handler(req, res, next);
  };
}

/** Only these body fields are worth keeping for a policy change; the long text itself stays out of the log. */
export const pick = (source: any, keys: string[]) => Object.fromEntries(keys.filter((k) => source && source[k] !== undefined).map((k) => [k, source[k]]));
