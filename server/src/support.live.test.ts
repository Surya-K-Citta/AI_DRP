import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev). Creates throw-away users and tickets and removes them afterwards.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const password = 'Sup-Test-2026';
const stamp = Date.now();
const people: Record<string, { token: string; id: string }> = {};

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const r = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) }, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  let body: any = null;
  try { body = await r.json(); } catch { /* empty */ }
  return { status: r.status, body };
}
async function register(tag: string) {
  const r = await call('POST', '/auth/register', { body: { name: `Sup ${tag}`, email: `sup.${tag}.${stamp}@msme.test`, password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true } });
  assert.equal(r.status, 201);
  return { token: r.body.data.token as string, id: String(r.body.data.userId) };
}
const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};

describe('support desk', () => {
  before(async () => {
    for (const tag of ['a', 'b', 'officer', 'admin']) people[tag] = await register(tag);
    const database = await db();
    await database.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(people.officer.id) }, { $set: { role: 'officer', reviewDistrict: 'Guntur' } });
    await database.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(people.admin.id) }, { $set: { role: 'admin' } });
  });
  after(async () => {
    const database = await db();
    const ids = Object.values(people).map((p) => p.id);
    await database.collection('supporttickets').deleteMany({ userId: { $in: ids } });
    await database.collection('users').deleteMany({ _id: { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) } });
    await mongoose.disconnect();
  });

  let ticketId = '';
  it('lets a person raise a request and sees only their own', async () => {
    const r = await call('POST', '/support/tickets', { token: people.a.token, body: { subject: 'Cannot export', description: 'PDF button does nothing', priority: 'P2' } });
    assert.equal(r.status, 201);
    assert.match(r.body.data.ticketNo, /^SUP-\d{4}-\d{5}$/);
    assert.equal(r.body.data.priority, 'P2');
    ticketId = r.body.data.id;
    assert.equal((await call('GET', '/support/tickets/mine', { token: people.a.token })).body.data.length, 1);
    assert.equal((await call('GET', '/support/tickets/mine', { token: people.b.token })).body.data.length, 0);
    assert.equal((await call('POST', `/support/tickets/${ticketId}/reply`, { token: people.b.token, body: { text: 'hi' } })).status, 404);
  });
  it('keeps the desk to staff, and tiers to admin', async () => {
    assert.equal((await call('GET', '/support/queue', { token: people.a.token })).status, 403);
    assert.equal((await call('PATCH', `/support/tickets/${ticketId}`, { token: people.a.token, body: { status: 'closed' } })).status, 403);
    const q = await call('GET', '/support/queue', { token: people.officer.token });
    assert.equal(q.status, 200);
    assert.equal((await call('GET', '/support/report', { token: people.officer.token })).status, 403);
    assert.equal((await call('GET', '/support/report', { token: people.admin.token })).status, 200);
  });
  it('records the first reply, hides internal notes from the person, and ignores internal notes for the SLA clock', async () => {
    const internal = await call('PATCH', `/support/tickets/${ticketId}`, { token: people.officer.token, body: { note: 'checking logs', internal: true } });
    assert.equal(internal.body.data.firstResponseAt, null);
    const reply = await call('PATCH', `/support/tickets/${ticketId}`, { token: people.officer.token, body: { note: 'We are looking into it', status: 'in_progress' } });
    assert.ok(reply.body.data.firstResponseAt);
    const mine = (await call('GET', '/support/tickets/mine', { token: people.a.token })).body.data[0];
    assert.deepEqual(mine.notes.map((n: any) => n.text), ['We are looking into it']);
    assert.equal(mine.tier, undefined);
  });
  it('escalates an overdue unanswered ticket automatically and flags the breach', async () => {
    const r = await call('POST', '/support/tickets', { token: people.b.token, body: { subject: 'Site down', description: 'Nothing loads', priority: 'P2' } });
    const id = r.body.data.id;
    const database = await db();
    await database.collection('supporttickets').updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { createdAt: new Date(Date.now() - 9 * 3_600_000) } });
    const run = await call('POST', '/support/escalate', { token: people.admin.token });
    assert.ok(run.body.data.breached >= 1);
    const queue = await call('GET', '/support/queue?breached=true&tier=L3', { token: people.admin.token });
    const found = queue.body.data.find((t: any) => t.id === id);
    assert.equal(found.tier, 'L3');
    assert.equal(found.breached, true);
    assert.equal(found.escalations.at(-1).auto, true);
    // a District Reviewer no longer sees it: it left the L1 queue
    assert.ok(!(await call('GET', '/support/queue', { token: people.officer.token })).body.data.some((t: any) => t.id === id));
  });
});
