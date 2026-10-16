import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev).
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const stamp = Date.now();
const email = `session.${stamp}@msme.test`;
const password = 'Session-Test-2026';
let userId = '';
let accessToken = '';
let cookie = '';

async function call(method: string, path: string, opts: { token?: string; cookie?: string; body?: unknown } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.cookie ? { Cookie: opts.cookie } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let json: any = null;
  try { json = await response.json(); } catch { /* empty */ }
  const setCookie = response.headers.get('set-cookie') || '';
  return { status: response.status, body: json, setCookie };
}

const cookieFrom = (setCookie: string) => setCookie.split(';')[0];
const claims = (token: string) => jwt.decode(token) as { exp: number; iat: number; userId: string };

async function db() {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
}

before(async () => {
  const registered = await call('POST', '/auth/register', {
    body: { name: 'Session Test', email, password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true },
  });
  assert.equal(registered.status, 201);
  userId = String(registered.body.data.userId);
  const login = await call('POST', '/auth/login', { body: { email, password } });
  assert.equal(login.status, 200);
  accessToken = login.body.data.token;
  cookie = cookieFrom(login.setCookie);
});

after(async () => {
  const database = await db();
  await database.collection('users').deleteMany({ email });
  await database.collection('refreshsessions').deleteMany({ userId });
  await database.collection('auditevents').deleteMany({ userId });
  await mongoose.disconnect();
});

describe('session lifetime', () => {
  it('login sets a 15 minute access token and an httpOnly refresh cookie', async () => {
    const c = claims(accessToken);
    assert.equal(c.exp - c.iat, 15 * 60);
    assert.match(cookie, /^dpr_refresh=/);
    const login = await call('POST', '/auth/login', { body: { email, password } });
    assert.match(login.setCookie, /HttpOnly/i);
    assert.match(login.setCookie, /Path=\/api\/auth/i);
  });

  it('an expired access token is 401 TOKEN_EXPIRED', async () => {
    const expired = jwt.sign({ userId, email, role: 'entrepreneur' }, (process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret').trim(), { expiresIn: -5 });
    const result = await call('GET', '/auth/profile', { token: expired });
    assert.equal(result.status, 401);
    assert.equal(result.body.code, 'TOKEN_EXPIRED');
    const garbage = await call('GET', '/auth/profile', { token: 'not.a.token' });
    assert.equal(garbage.body.code, 'TOKEN_INVALID');
  });

  it('refresh gives a new token while the session is in use, and needs the cookie', async () => {
    assert.equal((await call('POST', '/auth/refresh')).status, 401);
    const refreshed = await call('POST', '/auth/refresh', { cookie });
    assert.equal(refreshed.status, 200);
    assert.ok(refreshed.body.data.token);
    assert.equal(refreshed.body.data.expiresInSeconds, 900);
    assert.equal((await call('GET', '/auth/profile', { token: refreshed.body.data.token })).status, 200);
  });

  it('15 minutes idle ends the session', async () => {
    const database = await db();
    await database.collection('refreshsessions').updateMany({ userId }, { $set: { lastUsedAt: new Date(Date.now() - 16 * 60 * 1000) } });
    const idle = await call('POST', '/auth/refresh', { cookie });
    assert.equal(idle.status, 401);
    assert.equal(idle.body.code, 'SESSION_IDLE');
    // Once dropped it stays dropped.
    assert.equal((await call('POST', '/auth/refresh', { cookie })).status, 401);
  });

  it('logout revokes the session, even with an expired token', async () => {
    const login = await call('POST', '/auth/login', { body: { email, password } });
    const live = cookieFrom(login.setCookie);
    const expired = jwt.sign({ userId, email, role: 'entrepreneur' }, (process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret').trim(), { expiresIn: -5 });
    assert.equal((await call('POST', '/auth/logout', { token: expired, cookie: live })).status, 200);
    assert.equal((await call('POST', '/auth/refresh', { cookie: live })).status, 401);
  });

  it('a demotion shows up in the refreshed token', async () => {
    const login = await call('POST', '/auth/login', { body: { email, password } });
    const live = cookieFrom(login.setCookie);
    const database = await db();
    await database.collection('users').updateOne({ email }, { $set: { role: 'officer', reviewDistrict: 'Guntur' } });
    const refreshed = await call('POST', '/auth/refresh', { cookie: live });
    assert.equal(refreshed.body.data.role, 'officer');
    assert.equal((jwt.decode(refreshed.body.data.token) as any).role, 'officer');
  });
});
