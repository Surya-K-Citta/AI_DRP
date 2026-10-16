import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { AuditEvent } from './models/AuditEvent.model.ts';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev). Creates throw-away users and removes them afterwards.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const password = 'Adm-Test-2026';
const stamp = Date.now();
const email = (tag: string) => `adm.${tag}.${stamp}@msme.test`;
const people: Record<string, { token: string; id: string; cookie?: string }> = {};

async function call(method: string, path: string, opts: { token?: string; cookie?: string; body?: unknown } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}), ...(opts.cookie ? { Cookie: opts.cookie } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let json: any = null;
  try { json = await response.json(); } catch { /* empty */ }
  return { status: response.status, body: json, setCookie: response.headers.get('set-cookie') || '' };
}

async function register(tag: string) {
  const r = await call('POST', '/auth/register', { body: { name: `Adm ${tag}`, email: email(tag), password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true } });
  assert.equal(r.status, 201);
  return { token: r.body.data.token as string, id: String(r.body.data.userId), cookie: r.setCookie.split(';')[0] };
}
const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};
const latest = async (action: string, targetId?: string, minSeq = 0) => {
  const database = await db();
  const filter: any = { action, seq: { $gt: minSeq } };
  if (targetId) filter.targetId = targetId;
  // Changes made through a wrapped route are written just after the response, so give them a moment.
  for (let i = 0; i < 20; i += 1) {
    const found = (await database.collection('auditevents').find(filter).sort({ seq: -1 }).limit(1).toArray())[0] as any;
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return undefined as any;
};
const lastSeq = async () => ((await (await db()).collection('auditevents').find({ seq: { $exists: true } }).sort({ seq: -1 }).limit(1).toArray())[0] as any)?.seq ?? 0;

before(async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200, `API is not running at ${base}`);
  for (const tag of ['admin', 'worker', 'second']) people[tag] = await register(tag);
  const database = await db();
  await database.collection('users').updateOne({ email: email('admin') }, { $set: { role: 'admin' } });
  const login = await call('POST', '/auth/login', { body: { email: email('admin'), password } });
  people.admin.token = login.body.data.token;
});

after(async () => {
  const database = await db();
  const users = await database.collection('users').find({ email: { $regex: `^adm\\..*\\.${stamp}@msme\\.test$` } }).toArray();
  const ids = users.map((u) => String(u._id));
  await database.collection('users').deleteMany({ _id: { $in: users.map((u) => u._id) } });
  await database.collection('refreshsessions').deleteMany({ userId: { $in: ids } });
  await mongoose.disconnect();
});

describe('audit trail', () => {
  it('records logins with time, user, IP and details, chained by hash', async () => {
    const e = await latest('login_success', undefined);
    assert.ok(e.seq > 0 && e.at && e.ip && e.userId);
    assert.match(e.hash, /^[0-9a-f]{64}$/);
    assert.match(e.prevHash, /^[0-9a-f]{64}$/);
    assert.ok(e.payload?.userAgent !== undefined);
    const prev = (await (await db()).collection('auditevents').findOne({ seq: e.seq - 1 })) as any;
    assert.equal(e.prevHash, prev.hash, 'each event carries the hash of the one before');
  });
  it('records admin edits with what changed', async () => {
    const r = await call('PUT', `/admin/users/${people.worker.id}`, { token: people.admin.token, body: { role: 'officer', reviewDistrict: 'Guntur' } });
    assert.equal(r.status, 200);
    const e = await latest('user_update', people.worker.id);
    assert.equal(e.payload.role.from, 'entrepreneur');
    assert.equal(e.payload.role.to, 'officer');
    assert.equal(e.payload.reviewDistrict.to, 'Guntur');
    assert.equal(String(e.userId), people.admin.id);
    await call('PUT', `/admin/users/${people.worker.id}`, { token: people.admin.token, body: { role: 'entrepreneur' } });
  });
  it('records policy and template changes, and failed attempts are not recorded as changes', async () => {
    const mark = await lastSeq();
    const created = await call('POST', '/admin/policies', { token: people.admin.token, body: { title: `Audit test ${stamp}`, description: 'd', category: 'general', content: 'secret text that must not be logged', version: '1' } });
    if (created.status < 300) {
      const e = await latest('policy_change', undefined, mark);
      assert.equal(e.payload.op, 'create');
      assert.ok(!JSON.stringify(e.payload).includes('secret text'));
      await call('DELETE', `/admin/policies/${created.body.data?.policy?._id || created.body.data?._id}`, { token: people.admin.token });
    }
    const failedMark = await lastSeq();
    const failed = await call('PUT', '/admin/policies/not-an-id', { token: people.admin.token, body: { title: 'x' } });
    assert.ok(failed.status >= 400);
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.equal(await (async () => ((await (await db()).collection('auditevents').find({ action: 'policy_change', seq: { $gt: failedMark } }).toArray()).length))(), 0, 'a refused change is not recorded as a change');
    const styleMark = await lastSeq();
    const style = await call('PUT', '/dpr/scheme-style/PMEGP', { token: people.admin.token, body: { documentStyle: { preset: 'government', pictures: [] } } });
    if (style.status < 300) assert.equal((await latest('template_update', 'PMEGP', styleMark)).payload.scheme, 'PMEGP');
  });
  it('is verified clean, and refuses changes through the application', async () => {
    const verdict = await call('GET', '/admin/audit/verify', { token: people.admin.token });
    assert.equal(verdict.status, 200);
    assert.equal(verdict.body.data.ok, true, JSON.stringify(verdict.body.data));
    assert.ok(verdict.body.data.checked > 5);
    await db();
    await assert.rejects(() => AuditEvent.updateOne({ action: 'login_success' }, { $set: { role: 'x' } }), /append-only/);
    await assert.rejects(() => AuditEvent.deleteMany({}), /append-only/);
    await assert.rejects(() => AuditEvent.findOneAndUpdate({}, { role: 'x' }), /append-only/);
    const doc = await AuditEvent.findOne({ seq: { $exists: true } });
    (doc as any).role = 'tampered';
    await assert.rejects(() => (doc as any).save(), /append-only/);
  });
  it('shows exactly where a changed event breaks the chain', async () => {
    const database = await db();
    const e: any = await latest('audit_verify');
    const original = e.role;
    await database.collection('auditevents').updateOne({ seq: e.seq }, { $set: { role: 'tampered-by-test' } });
    try {
      const verdict = await call('GET', '/admin/audit/verify', { token: people.admin.token });
      assert.equal(verdict.body.data.ok, false);
      assert.equal(verdict.body.data.problem.seq, e.seq);
      assert.match(verdict.body.data.problem.reason, /changed after it was written/);
    } finally {
      await database.collection('auditevents').updateOne({ seq: e.seq }, original === undefined ? { $unset: { role: '' } } : { $set: { role: original } });
    }
    assert.equal((await call('GET', '/admin/audit/verify', { token: people.admin.token })).body.data.ok, true);
  });
  it('the CSV export is safe to open in a spreadsheet and is itself recorded', async () => {
    const response = await fetch(`${base}/admin/audit/csv`, { headers: { Authorization: `Bearer ${people.admin.token}` } });
    const text = await response.text();
    assert.match(text.split('\n')[0], /^seq,at,userId,role,action,targetType,targetId,ip,payload,hash$/);
    assert.ok(!/^[=+@]/m.test(text.split('\n').slice(1).join('\n')));
    assert.ok(await latest('audit_export'));
  });
});

describe('account deactivation ends access within seconds', () => {
  it('stops the access token at once, blocks refresh and sign-in, and says so in the audit trail', async () => {
    const worker = people.second;
    assert.equal((await call('GET', '/auth/profile', { token: worker.token })).status, 200);
    const refreshBefore = await call('POST', '/auth/refresh', { cookie: worker.cookie });
    assert.equal(refreshBefore.status, 200);
    const off = await call('POST', `/admin/users/${worker.id}/deactivate`, { token: people.admin.token, body: { reason: 'left the programme' } });
    assert.equal(off.status, 200);
    const started = Date.now();
    const denied = await call('GET', '/auth/profile', { token: worker.token });
    assert.equal(denied.status, 401);
    assert.equal(denied.body.code, 'ACCOUNT_DEACTIVATED');
    assert.ok(Date.now() - started < 30_000);
    assert.equal((await call('POST', '/auth/refresh', { cookie: worker.cookie })).status, 401);
    const login = await call('POST', '/auth/login', { body: { email: email('second'), password } });
    assert.equal(login.status, 403);
    assert.equal(login.body.code, 'ACCOUNT_DEACTIVATED');
    const e = await latest('user_deactivate', worker.id);
    assert.equal(e.payload.reason, 'left the programme');
  });
  it('a switch-off made directly in the database is enforced within 30 seconds', async () => {
    const victim = await register('direct');
    assert.equal((await call('GET', '/auth/profile', { token: victim.token })).status, 200);
    const database = await db();
    await database.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(victim.id) }, { $set: { isActive: false } });
    const started = Date.now();
    let status = 200;
    while (status === 200 && Date.now() - started < 30_000) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = (await call('GET', '/auth/profile', { token: victim.token })).status;
    }
    const seconds = (Date.now() - started) / 1000;
    assert.equal(status, 401, `still allowed after ${seconds}s`);
    assert.ok(seconds <= 30, `took ${seconds}s`);
    console.log(`      deactivated directly in the database: refused after ${seconds.toFixed(1)}s`);
  });
  it('reactivation lets the person sign in again but old tokens stay dead; sign out everywhere ends live tokens', async () => {
    const worker = people.second;
    assert.equal((await call('POST', `/admin/users/${worker.id}/reactivate`, { token: people.admin.token })).status, 200);
    assert.equal((await call('GET', '/auth/profile', { token: worker.token })).body.code, 'SESSION_REVOKED');
    const login = await call('POST', '/auth/login', { body: { email: email('second'), password } });
    assert.equal(login.status, 200);
    const fresh = login.body.data.token;
    assert.equal((await call('GET', '/auth/profile', { token: fresh })).status, 200);
    assert.equal((await call('POST', `/admin/users/${worker.id}/revoke-sessions`, { token: people.admin.token })).status, 200);
    assert.equal((await call('GET', '/auth/profile', { token: fresh })).status, 401);
    assert.equal((await call('POST', '/auth/refresh', { cookie: login.setCookie.split(';')[0] })).status, 401);
  });
  it('protects against the obvious mistakes and non-admins', async () => {
    assert.equal((await call('POST', `/admin/users/${people.admin.id}/deactivate`, { token: people.admin.token })).status, 400);
    assert.equal((await call('POST', `/admin/users/${people.second.id}/deactivate`, { token: people.worker.token })).status, 403);
    assert.equal((await call('POST', '/admin/users/invite', { token: people.worker.token, body: { name: 'x y', email: 'z@z.co' } })).status, 403);
  });
});

describe('onboarding by invitation', () => {
  it('rejects bad invitations', async () => {
    const admin = people.admin.token;
    assert.equal((await call('POST', '/admin/users/invite', { token: admin, body: { name: 'Officer', email: email('noDistrict'), role: 'officer' } })).status, 400);
    assert.equal((await call('POST', '/admin/users/invite', { token: admin, body: { name: 'Officer', email: email('worker'), role: 'officer', reviewDistrict: 'Guntur' } })).status, 409);
    assert.equal((await call('POST', '/admin/users/invite', { token: admin, body: { name: 'Officer', email: 'not-an-email', role: 'officer', reviewDistrict: 'Guntur' } })).status, 400);
    assert.equal((await call('POST', '/admin/users/invite', { token: admin, body: { name: 'Officer', email: email('badRole'), role: 'superuser' } })).status, 400);
  });
  it('creates a District Reviewer who sets their own password once and gets the right access', async () => {
    const invite = await call('POST', '/admin/users/invite', { token: people.admin.token, body: { name: 'Anil Reddy', email: email('officer'), role: 'officer', reviewDistrict: 'Visakhapatnam' } });
    assert.equal(invite.status, 201);
    const token = new URL(invite.body.data.inviteUrl).searchParams.get('token') as string;
    assert.ok(token.length > 30);
    const info = await call('GET', `/auth/invite/${token}`);
    assert.deepEqual([info.status, info.body.data.role, info.body.data.reviewDistrict, info.body.data.email], [200, 'officer', 'Visakhapatnam', email('officer')]);
    assert.equal((await call('GET', '/auth/invite/not-a-real-token-at-all-1234567890')).status, 404);
    // Nobody can sign in before accepting.
    assert.equal((await call('POST', '/auth/login', { body: { email: email('officer'), password: 'anything-at-all' } })).status, 401);
    const accept = (extra: object) => call('POST', '/auth/accept-invite', { body: { token, password: 'Officer-Pass-1', phoneNumber: '9876500000', dateOfBirth: '1985-04-01', accountConsent: true, ...extra } });
    assert.equal((await accept({ password: 'short' })).status, 400);
    assert.equal((await accept({ accountConsent: false })).status, 400);
    assert.equal((await accept({ dateOfBirth: '2015-01-01' })).status, 403);
    const done = await accept({});
    assert.equal(done.status, 200, JSON.stringify(done.body));
    assert.equal(done.body.data.role, 'officer');
    assert.equal((await call('GET', '/reviewer/summary', { token: done.body.data.token })).status, 200);
    assert.equal((await call('GET', '/admin/users', { token: done.body.data.token })).status, 403);
    assert.equal((await call('POST', '/auth/login', { body: { email: email('officer'), password: 'Officer-Pass-1' } })).status, 200);
    assert.equal((await accept({})).status, 404, 'the link works once');
    assert.equal((await latest('invite_accepted')).role, 'officer');
    assert.equal((await latest('user_invite')).payload.reviewDistrict, 'Visakhapatnam');
  });
  it('an expired invitation is refused', async () => {
    const invite = await call('POST', '/admin/users/invite', { token: people.admin.token, body: { name: 'Late Person', email: email('late'), role: 'entrepreneur' } });
    const token = new URL(invite.body.data.inviteUrl).searchParams.get('token') as string;
    await (await db()).collection('users').updateOne({ email: email('late') }, { $set: { 'invite.expiresAt': new Date(Date.now() - 1000) } });
    assert.equal((await call('GET', `/auth/invite/${token}`)).status, 404);
  });
});
