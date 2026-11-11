import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running with RETENTION_IDLE_DAYS=0 and RETENTION_WARNING_DAYS=0 (for the retention-hold test).
// Creates throw-away users and removes them afterwards.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const password = 'Priv-Test-2026';
const stamp = Date.now();
const email = (tag: string) => `priv.${tag}.${stamp}@msme.test`;
const people: Record<string, { token: string; id: string }> = {};

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let json: any = null;
  try { json = await response.json(); } catch { /* empty */ }
  return { status: response.status, body: json };
}

async function register(tag: string) {
  const r = await call('POST', '/auth/register', { body: { name: `Priv ${tag}`, email: email(tag), password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true } });
  assert.equal(r.status, 201);
  return { token: r.body.data.token as string, id: String(r.body.data.userId) };
}
const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};

before(async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200, `API is not running at ${base}`);
  for (const tag of ['admin', 'citizen', 'other']) people[tag] = await register(tag);
  const database = await db();
  await database.collection('users').updateOne({ email: email('admin') }, { $set: { role: 'admin' } });
  const login = await call('POST', '/auth/login', { body: { email: email('admin'), password } });
  people.admin.token = login.body.data.token;
});

after(async () => {
  const database = await db();
  const users = await database.collection('users').find({ email: { $regex: `^priv\\..*\\.${stamp}@msme\\.test$` } }).toArray();
  const ids = users.map((u) => u._id);
  await database.collection('users').deleteMany({ _id: { $in: ids } });
  await database.collection('privacycomplaints').deleteMany({ userId: { $in: ids } });
  await database.collection('usernotifications').deleteMany({ userId: { $in: ids } });
  await database.collection('databreachincidents').deleteMany({ title: { $regex: `^Test ${stamp}` } });
  await database.collection('dprversions').deleteMany({ projectId: { $regex: `^[0-9a-f]{24}$`, $options: 'i' }, userId: { $in: ids.map(String) } });
  await mongoose.disconnect();
});

describe('privacy requests (grievance workflow)', () => {
  let requestId = '';
  it('stores the request with the published officer inbox and a 90-day reply date', async () => {
    const r = await call('POST', '/privacy/complaint', { token: people.citizen.token, body: { subject: 'Delete my details', message: 'Please confirm what you hold about me.' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.inbox, 'apmsmedc@gmail.com');
    assert.match(r.body.message, /A Sudhakar/);
    requestId = String(r.body.data.id);
    const days = (new Date(r.body.data.dueAt).getTime() - Date.now()) / 86_400_000;
    assert.ok(days > 89 && days <= 90, `due in ${days} days`);
  });
  it('is visible to an admin and refused to everyone else', async () => {
    const listed = await call('GET', '/admin/complaints', { token: people.admin.token });
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.officer.name, 'A Sudhakar');
    assert.ok(listed.body.data.items.some((c: any) => String(c._id) === requestId));
    assert.equal((await call('GET', '/admin/complaints', { token: people.citizen.token })).status, 403);
    assert.equal((await call('PATCH', `/admin/complaints/${requestId}`, { token: people.citizen.token, body: { status: 'closed' } })).status, 403);
  });
  it('cannot be resolved without an answer, and rejects unknown statuses', async () => {
    assert.equal((await call('PATCH', `/admin/complaints/${requestId}`, { token: people.admin.token, body: { status: 'resolved' } })).status, 400);
    assert.equal((await call('PATCH', `/admin/complaints/${requestId}`, { token: people.admin.token, body: { status: 'nonsense' } })).status, 400);
    assert.equal((await call('PATCH', '/admin/complaints/not-an-id', { token: people.admin.token, body: { status: 'closed' } })).status, 400);
  });
  it('shows the reply to the person, keeps the internal note private and notifies them', async () => {
    const r = await call('PATCH', `/admin/complaints/${requestId}`, { token: people.admin.token, body: { status: 'resolved', response: 'We hold only your account and DPR drafts.', internalNote: 'checked with IT', assignedTo: 'Privacy desk' } });
    assert.equal(r.status, 200);
    const mine = await call('GET', '/privacy/complaints', { token: people.citizen.token });
    const row = mine.body.data.find((c: any) => String(c._id) === requestId);
    assert.equal(row.status, 'resolved');
    assert.equal(row.response, 'We hold only your account and DPR drafts.');
    assert.equal(row.internalNote, undefined, 'internal note never reaches the person');
    const others = await call('GET', '/privacy/complaints', { token: people.other.token });
    assert.equal(others.body.data.length, 0, 'someone else cannot see it');
    const notes = await call('GET', '/privacy/notifications', { token: people.citizen.token });
    assert.ok(notes.body.data.items.some((n: any) => n.kind === 'complaint_update' && /We hold only/.test(n.body)));
  });
});

describe('breach and incident register', () => {
  let id = '';
  const title = `Test ${stamp} exposed export file`;
  it('requires a title, what happened, and a sane detection time', async () => {
    assert.equal((await call('POST', '/admin/incidents', { token: people.admin.token, body: { title: 'x' } })).status, 400);
    assert.equal((await call('POST', '/admin/incidents', { token: people.admin.token, body: { title: 'x', nature: 'y', detectedAt: new Date(Date.now() + 86_400_000).toISOString() } })).status, 400);
    assert.equal((await call('POST', '/admin/incidents', { token: people.citizen.token, body: { title, nature: 'n' } })).status, 403);
  });
  it('records nature, data, people, detection time and a first timeline entry', async () => {
    const r = await call('POST', '/admin/incidents', { token: people.admin.token, body: { title, nature: 'A CSV with emails was reachable by link.', dataAffected: ['email', 'phone'], usersAffectedCount: 2, detectedAt: new Date(Date.now() - 3_600_000).toISOString() } });
    assert.equal(r.status, 201);
    id = String(r.body.data._id);
    assert.match(r.body.data.reference, /^INC-\d{8}-[0-9A-F]{4}$/);
    assert.deepEqual(r.body.data.dataAffected, ['email', 'phone']);
    assert.equal(r.body.data.timeline[0].kind, 'detected');
    assert.equal(r.body.data.status, 'detected');
  });
  it('makes the officer record the reasoning before declaring a breach, and containment before containing', async () => {
    assert.equal((await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'declared_breach' } })).status, 400);
    assert.equal((await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'contained' } })).status, 400);
    assert.equal((await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'closed' } })).status, 400);
  });
  it('cannot notify people before a breach is declared', async () => {
    assert.equal((await call('POST', `/admin/incidents/${id}/notify-users`, { token: people.admin.token, body: { message: 'hello' } })).status, 400);
  });
  it('declares a breach, starts the 72-hour Board clock and lists affected people by email', async () => {
    const r = await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'declared_breach', assessmentNote: 'Contact data was reachable without sign-in.', affectedEmails: [email('citizen'), 'nobody@msme.test'] } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.data.status, 'declared_breach');
    assert.ok(r.body.data.declaredBy && r.body.data.declaredAt);
    assert.equal(r.body.data.affectedUserCount, 1, 'unknown emails are ignored');
    const due = new Date(r.body.data.boardDetailedDueAt).getTime() - new Date(r.body.data.declaredAt).getTime();
    assert.equal(due, 72 * 3_600_000);
    assert.equal(r.body.data.boardReportOverdue, false);
    assert.equal(r.body.data.affectedUserIds, undefined, 'user ids are not echoed back');
  });
  it('records the Board report and notifies the affected person', async () => {
    const t = await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { boardIntimated: true, boardReference: 'DPB/2026/001' } });
    assert.equal(t.status, 200);
    assert.ok(t.body.data.boardIntimatedAt);
    assert.equal((await call('POST', `/admin/incidents/${id}/notify-users`, { token: people.admin.token, body: {} })).status, 400, 'the notice needs text');
    const n = await call('POST', `/admin/incidents/${id}/notify-users`, { token: people.admin.token, body: { message: 'A file with your email was exposed on 30 Oct. Change nothing; we have removed it.' } });
    assert.equal(n.status, 200);
    assert.equal(n.body.data.notified, 1);
    const notes = await call('GET', '/privacy/notifications', { token: people.citizen.token });
    assert.ok(notes.body.data.items.some((x: any) => x.kind === 'breach_notice' && /apmsmedc@gmail.com/.test(x.body)));
    const other = await call('GET', '/privacy/notifications', { token: people.other.token });
    assert.ok(!other.body.data.items.some((x: any) => x.kind === 'breach_notice'), 'people not listed are not notified');
  });
  it('contains and closes with the corrective actions on record', async () => {
    const c = await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'contained', containmentActions: 'Link revoked, file deleted.' } });
    assert.equal(c.status, 200);
    assert.ok(c.body.data.containedAt);
    const closed = await call('PATCH', `/admin/incidents/${id}`, { token: people.admin.token, body: { status: 'closed', correctiveActions: 'Exports now need sign-in.' } });
    assert.equal(closed.status, 200);
    const kinds = closed.body.data.timeline.map((t: any) => t.kind);
    for (const k of ['detected', 'status_declared_breach', 'board_intimated', 'users_notified', 'status_contained', 'status_closed']) assert.ok(kinds.includes(k), k);
  });
  it('writes every register change to the audit log without the incident text', async () => {
    const database = await db();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const rows = await database.collection('auditevents').find({ targetId: id, action: { $in: ['incident_create', 'incident_update', 'incident_notify'] } }).toArray();
    assert.ok(rows.length >= 5);
    assert.ok(!JSON.stringify(rows).includes('CSV with emails'));
  });
});

describe('retention hold on submitted reports', () => {
  const projectId = new mongoose.Types.ObjectId().toHexString();
  let dprId = '';
  const run = async () => (await call('POST', '/admin/retention/run', { token: people.admin.token })).body.data;
  before(async () => {
    const database = await db();
    const inserted = await database.collection('dprversions').insertOne({
      projectId,
      userId: people.citizen.id,
      status: 'submitted',
      content: { english: {}, telugu: {} },
      updatedAt: new Date(Date.now() - 400 * 86_400_000),
      createdAt: new Date(Date.now() - 400 * 86_400_000),
    });
    dprId = String(inserted.insertedId);
  });
  it('needs a reason and the department’s written reference', async () => {
    assert.equal((await call('POST', `/admin/dprs/${dprId}/retention-hold`, { token: people.admin.token, body: { reason: 'Bank file open' } })).status, 400);
    assert.equal((await call('POST', `/admin/dprs/${dprId}/retention-hold`, { token: people.citizen.token, body: { reason: 'r', reference: 'f' } })).status, 403);
    assert.equal((await call('POST', `/admin/dprs/${dprId}/retention-hold`, { token: people.admin.token, body: { reason: 'r', reference: 'f', until: '2020-01-01' } })).status, 400);
  });
  it('keeps a held report through retention runs: no warning and no deletion', async () => {
    const set = await call('POST', `/admin/dprs/${dprId}/retention-hold`, { token: people.admin.token, body: { reason: 'Bank sanction pending', reference: 'APMSMEDC/Lr/2026/114' } });
    assert.equal(set.status, 200);
    const holds = await call('GET', '/admin/retention/holds', { token: people.admin.token });
    assert.ok(holds.body.data.some((d: any) => String(d._id) === dprId));
    for (let i = 0; i < 2; i += 1) {
      const result = await run();
      assert.ok(!result.details.some((d: any) => d.dprId === dprId), 'held report is not warned or purged');
      assert.ok(result.held >= 1);
    }
    const database = await db();
    const row: any = await database.collection('dprversions').findOne({ _id: new mongoose.Types.ObjectId(dprId) });
    assert.ok(row, 'report still exists');
    assert.equal(row.retentionWarningAt, undefined);
  });
  it('warns first, then deletes, once the hold is lifted', async () => {
    assert.equal((await call('DELETE', `/admin/dprs/${dprId}/retention-hold`, { token: people.admin.token })).status, 200);
    assert.equal((await call('DELETE', `/admin/dprs/${dprId}/retention-hold`, { token: people.admin.token })).status, 404, 'already lifted');
    const first = await run();
    assert.ok(first.details.some((d: any) => d.dprId === dprId && d.action === 'warn'));
    const second = await run();
    assert.ok(second.details.some((d: any) => d.dprId === dprId && d.action === 'purge'));
    const database = await db();
    assert.equal(await database.collection('dprversions').countDocuments({ _id: new mongoose.Types.ObjectId(dprId) }), 0);
    const user = await call('GET', '/auth/profile', { token: people.citizen.token });
    assert.equal(user.status, 200, 'the account is never deleted by retention');
  });
});

describe('compliance status', () => {
  it('is admin only and covers every item the department listed', async () => {
    assert.equal((await call('GET', '/admin/compliance/status', { token: people.citizen.token })).status, 403);
    const r = await call('GET', '/admin/compliance/status', { token: people.admin.token });
    assert.equal(r.status, 200);
    const areas = r.body.data.items.map((i: any) => i.area);
    for (const a of ['Data Fiduciary', 'Privacy officer', 'Privacy mailbox', 'Grievance process', 'DPR retention', 'Deletion warning', 'Audit logs', 'Scheme records', 'Vendors and contracts', 'AI data use', 'Cross-border data', 'Breach management']) {
      assert.ok(areas.includes(a), a);
    }
    const vendors = r.body.data.items.find((i: any) => i.area === 'Vendors and contracts');
    assert.equal(vendors.status, 'action', 'not claimed ready until the contracts are confirmed');
  });
});
