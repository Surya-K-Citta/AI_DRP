// @ts-nocheck
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { getJwtSecret } from './jwtSecret';
import { RefreshSession } from '../models/RefreshSession.model';
import { User } from '../models/User.model';

/** A session is dropped after 6 idle minutes (activity renews it); the token lasts 6 minutes 30 seconds (see below). */
// SESSION_ACCESS_SECONDS exists so tests can run the whole lifecycle in under a minute. It is ignored in production,
// so a stray value in a hosting dashboard can never lengthen (or shorten) the real 6 minute session.
// The idle limit is 6 minutes; the browser enforces it exactly. The token and the server's own idle check allow a short
// slack on top, so the browser always ends a quiet session first and the server is only the backstop.
const IDLE_SECONDS = 6 * 60;
const SLACK_SECONDS = 30;
const DEFAULT_ACCESS_SECONDS = IDLE_SECONDS + SLACK_SECONDS;
const IN_PRODUCTION = process.env.NODE_ENV === 'production';
if (IN_PRODUCTION && process.env.SESSION_ACCESS_SECONDS) {
  console.warn('SESSION_ACCESS_SECONDS is set but ignored in production; access tokens last 6.5 minutes (6 minutes idle limit).');
}
export const ACCESS_TOKEN_SECONDS = IN_PRODUCTION
  ? DEFAULT_ACCESS_SECONDS
  : Math.max(10, Number(process.env.SESSION_ACCESS_SECONDS) || DEFAULT_ACCESS_SECONDS);
export const IDLE_MS = ACCESS_TOKEN_SECONDS * 1000;
export const ABSOLUTE_MS = Math.max(1, Number(process.env.SESSION_MAX_HOURS) || 8) * 60 * 60 * 1000;
const COOKIE = 'dpr_refresh';

export function signAccessToken(user: { _id: unknown; email: string; role: string }): string {
  return jwt.sign(
    // iatMs is the issue time to the millisecond, so "signed out at" can be compared exactly (the standard iat is whole seconds).
    { userId: String(user._id), email: user.email, role: user.role, iatMs: Date.now() },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_SECONDS } as SignOptions
  );
}

const hash = (secret: string) => crypto.createHash('sha256').update(secret).digest('hex');

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

function cookieOptions(maxAge: number) {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    // The deployed client and API are on different sites, so production needs SameSite=None (with Secure).
    sameSite: (production ? 'none' : 'lax') as 'none' | 'lax',
    path: '/api/auth',
    maxAge,
  };
}

/** Starts a session for a user who just proved who they are and returns the access token. */
export async function startSession(user: any, req: Request, res: Response): Promise<string> {
  const secret = crypto.randomBytes(48).toString('base64url');
  const now = Date.now();
  await RefreshSession.create({
    userId: String(user._id),
    tokenHash: hash(secret),
    lastUsedAt: new Date(now),
    absoluteExpiresAt: new Date(now + ABSOLUTE_MS),
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
  });
  res.cookie(COOKIE, secret, cookieOptions(ABSOLUTE_MS));
  return signAccessToken(user);
}

export type RefreshOutcome =
  | { ok: true; token: string; user: any; expiresInSeconds: number }
  | { ok: false; code: 'NO_SESSION' | 'SESSION_IDLE' | 'SESSION_EXPIRED' | 'SESSION_REVOKED' | 'ACCOUNT_DEACTIVATED' };

/** Swaps a live session for a fresh access token and slides the idle window. */
export async function refreshSession(req: Request, res: Response): Promise<RefreshOutcome> {
  const secret = readCookie(req, COOKIE);
  if (!secret) return { ok: false, code: 'NO_SESSION' };
  const session: any = await RefreshSession.findOne({ tokenHash: hash(secret) });
  if (!session) return { ok: false, code: 'NO_SESSION' };
  const now = Date.now();
  let failure: RefreshOutcome | null = null;
  if (session.revokedAt) failure = { ok: false, code: 'SESSION_REVOKED' };
  else if (now > session.absoluteExpiresAt.getTime()) failure = { ok: false, code: 'SESSION_EXPIRED' };
  else if (now - session.lastUsedAt.getTime() > IDLE_MS) failure = { ok: false, code: 'SESSION_IDLE' };
  if (failure) {
    if (!session.revokedAt) await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    res.clearCookie(COOKIE, { ...cookieOptions(0), maxAge: undefined });
    return failure;
  }
  // The role is read again here, so a demotion shows up in the next token.
  const user: any = await User.findById(session.userId).select('-passwordHash');
  if (!user) {
    await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    res.clearCookie(COOKIE, { ...cookieOptions(0), maxAge: undefined });
    return { ok: false, code: 'SESSION_REVOKED' };
  }
  if (user.isActive === false) {
    await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    res.clearCookie(COOKIE, { ...cookieOptions(0), maxAge: undefined });
    return { ok: false, code: 'ACCOUNT_DEACTIVATED' };
  }
  await RefreshSession.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date(now) } });
  return { ok: true, token: signAccessToken(user), user, expiresInSeconds: ACCESS_TOKEN_SECONDS };
}

/** Ends this browser's session. Works with an expired access token because it only needs the cookie. */
export async function endSession(req: Request, res: Response): Promise<void> {
  const secret = readCookie(req, COOKIE);
  if (secret) await RefreshSession.updateOne({ tokenHash: hash(secret) }, { $set: { revokedAt: new Date() } });
  res.clearCookie(COOKIE, { ...cookieOptions(0), maxAge: undefined });
}

export async function endAllSessions(userId: string): Promise<void> {
  await RefreshSession.updateMany({ userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}
