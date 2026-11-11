// @ts-nocheck
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { getJwtSecret } from '../lib/jwtSecret';
import { roleAllowed } from '../lib/roleGate';
import { getAccountStatus } from '../lib/accountStatus';
import { collectPersonNames, enterAiContext } from '../lib/aiContext';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication token required' 
      });
      return;
    }

    const token = authHeader.substring(7);
    const secret = getJwtSecret();

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      iat?: number;
      iatMs?: number;
    };

    // A deactivated account, or a token issued before a "sign out everywhere", stops working here.
    const status = await getAccountStatus(decoded.userId);
    if (!status.active) {
      res.status(401).json({ success: false, code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated' });
      return;
    }
    const issuedAtMs = decoded.iatMs ?? (decoded.iat ? decoded.iat * 1000 : 0);
    if (issuedAtMs && issuedAtMs < status.validFromMs) {
      res.status(401).json({ success: false, code: 'SESSION_REVOKED', message: 'You were signed out. Please sign in again' });
      return;
    }

    req.user = decoded;
    // For the AI gateway: this person's name and the names typed in the request are swapped for placeholders before any AI call.
    enterAiContext({ userId: decoded.userId, names: [status.name, ...collectPersonNames(req.body)].filter(Boolean) });
    next();
  } catch (error: any) {
    const expired = error?.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      message: expired ? 'Session expired' : 'Invalid token',
    });
  }
};

/**
 * Role gate. Wrong role is 403 Forbidden, no token is 401.
 * Gates that exclude entrepreneurs (reviewer and admin routes) re-read the role from the database,
 * so a demoted or deleted account loses access immediately rather than when its token expires.
 */
export const authorize = (...roles: string[]) => {
  const privileged = !roles.includes('entrepreneur');
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.userId && privileged) {
        const { User } = await import('../models/User.model');
        const fresh: any = await User.findById(req.user.userId).select('role reviewDistrict').lean();
        if (!fresh) {
          res.status(401).json({ success: false, message: 'Authentication required' });
          return;
        }
        req.user.role = fresh.role;
        req.user.reviewDistrict = fresh.reviewDistrict || null;
      }

      const gate = roleAllowed(req.user?.role, roles);
      if (gate === 'unauthenticated') {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (gate === 'forbidden') {
        const { AuditService } = await import('../services/audit.service');
        await AuditService.log({
          action: 'access_denied',
          userId: req.user?.userId,
          role: req.user?.role,
          targetType: 'route',
          targetId: `${req.method} ${req.baseUrl}${req.path}`.slice(0, 200),
          req,
        }).catch(() => undefined);
        res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Forbidden: your role does not have access to this resource',
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
