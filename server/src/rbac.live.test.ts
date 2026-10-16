import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev). Creates throw-away users, projects and DPRs, then removes them.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const password = 'Rbac-Tier-2026';
const stamp = Date.now();
const email = (tag: string) => `rbac.${tag.toLowerCase()}.${stamp}@msme.test`;
const DISTRICT_A = 'Visakhapatnam';
const DISTRICT_B = 'Guntur';

type Who = { token: string; id: string };
const people: Record<string, Who> = {};
const createdProjects: string[] = [];
const dprs: Record<string, string> = {};

async function call(method: string, path: string, token?: string, body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try { json = await response.json(); } catch { /* empty body */ }
  return { status: response.status, body: json };
}

async function register(tag: string, extra: Record<string, unknown> = {}) {
  const result = await call('POST', '/auth/register', undefined, {
    name: `RBAC ${tag}`,
    email: email(tag),
    password,
    phoneNumber: '9876543210',
    dateOfBirth: '1990-01-01',
    accountConsent: true,
    privacyConsent: true,
    ...extra,
  });
  assert.equal(result.status, 201, `register ${tag}: ${JSON.stringify(result.body)}`);
  return { token: result.body.data.token as string, id: String(result.body.data.userId), role: result.body.data.role as string };
}

async function db() {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
}

async function relogin(tag: string) {
  const result = await call('POST', '/auth/login', undefined, { email: email(tag), password });
  assert.equal(result.status, 200);
  return result.body.data.token as string;
}

before(async () => {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200, `API is not running at ${base}`);

  // Someone trying to register as an admin must end up as an entrepreneur.
  const sneaky = await register('sneaky', { role: 'admin' });
  assert.equal(sneaky.role, 'entrepreneur');
  people.sneaky = sneaky;

  for (const tag of ['owner', 'reviewerA', 'reviewerB', 'admin']) {
    const made = await register(tag);
    people[tag] = made;
  }
  const database = await db();
  const users = database.collection('users');
  await users.updateOne({ email: email('reviewerA') }, { $set: { role: 'officer', reviewDistrict: DISTRICT_A } });
  await users.updateOne({ email: email('reviewerB') }, { $set: { role: 'officer', reviewDistrict: DISTRICT_B } });
  await users.updateOne({ email: email('admin') }, { $set: { role: 'admin' } });
  // Fresh tokens carry the new roles.
  for (const tag of ['reviewerA', 'reviewerB', 'admin']) people[tag].token = await relogin(tag);

  // One submitted DPR per district, owned by `owner`.
  for (const [key, district] of [['a', DISTRICT_A], ['b', DISTRICT_B]] as const) {
    const project = await database.collection('projects').insertOne({
      userId: people.owner.id,
      projectType: 'individual',
      projectName: `RBAC ${key} ${stamp}`,
      industrySector: 'Food',
      totalCost: 1,
      ownContribution: 1,
      loanAmount: 0,
      location: 'Test town',
      stepData: { step1: { district } },
    });
    const projectId = String(project.insertedId);
    createdProjects.push(projectId);
    const dpr = await database.collection('dprversions').insertOne({
      projectId,
      userId: people.owner.id,
      status: 'submitted',
      submittedAt: new Date(),
      content: { english: {}, telugu: {} },
    });
    dprs[key] = String(dpr.insertedId);
  }
});

after(async () => {
  const database = await db();
  await database.collection('users').deleteMany({ email: { $regex: `^rbac\\..*\\.${stamp}@msme\\.test$` } });
  await database.collection('projects').deleteMany({ projectName: { $in: [`RBAC a ${stamp}`, `RBAC b ${stamp}`] } });
  await database.collection('dprversions').deleteMany({ projectId: { $in: createdProjects } });
  await database.collection('auditevents').deleteMany({ userId: { $in: Object.values(people).map((p) => p.id) } });
  await mongoose.disconnect();
});

describe('three-tier RBAC', () => {
  it('registration never grants a privileged role', () => {
    assert.ok(people.sneaky);
  });

  it('no token: 401 on reviewer and admin routes', async () => {
    assert.equal((await call('GET', '/reviewer/dprs')).status, 401);
    assert.equal((await call('GET', '/admin/users')).status, 401);
  });

  it('entrepreneur: 403 Forbidden on every reviewer and admin route', async () => {
    const t = people.owner.token;
    for (const [method, path, body] of [
      ['GET', '/reviewer/summary'],
      ['GET', '/reviewer/dprs'],
      ['GET', `/reviewer/dprs/${dprs.a}`],
      ['POST', `/reviewer/dprs/${dprs.a}/review`, { decision: 'approve' }],
      ['GET', '/admin/users'],
      ['GET', '/admin/analytics'],
      ['GET', '/admin/dprs'],
      ['POST', `/admin/dprs/${dprs.a}/approve`, {}],
      ['PUT', `/admin/users/${people.owner.id}`, { role: 'admin' }],
      ['GET', '/documents'],
    ] as const) {
      const result = await call(method, path, t, body);
      assert.equal(result.status, 403, `${method} ${path} -> ${result.status}`);
    }
    const stillEntrepreneur = await call('GET', '/auth/profile', t);
    assert.equal(stillEntrepreneur.body?.data?.role, 'entrepreneur');
  });

  it('District Reviewer: reviewer routes yes, admin routes 403', async () => {
    const t = people.reviewerA.token;
    assert.equal((await call('GET', '/reviewer/summary', t)).status, 200);
    assert.equal((await call('GET', '/reviewer/dprs', t)).status, 200);
    for (const path of ['/admin/users', '/admin/analytics', '/admin/dprs', '/admin/policies', '/admin/audit']) {
      assert.equal((await call('GET', path, t)).status, 403, path);
    }
    assert.equal((await call('POST', `/admin/dprs/${dprs.a}/approve`, t, {})).status, 403);
  });

  it('District Reviewer only sees and touches their own district', async () => {
    const a = people.reviewerA.token;
    const list = await call('GET', '/reviewer/dprs', a);
    const ids = list.body.data.dprs.map((d: any) => d.dprId);
    assert.ok(ids.includes(dprs.a), 'sees own district DPR');
    assert.ok(!ids.includes(dprs.b), 'does not see the other district');

    assert.equal((await call('GET', `/reviewer/dprs/${dprs.a}`, a)).status, 200);
    assert.equal((await call('GET', `/reviewer/dprs/${dprs.b}`, a)).status, 403);
    assert.equal((await call('POST', `/reviewer/dprs/${dprs.b}/review`, a, { decision: 'approve' })).status, 403);
    // Shared DPR endpoint is scoped too.
    assert.equal((await call('GET', `/dpr/${dprs.b}`, a)).status, 403);
    // Applicant profile of a user with no project in the district would be 403; B's reviewer cannot read A's DPR.
    assert.equal((await call('GET', `/reviewer/dprs/${dprs.a}`, people.reviewerB.token)).status, 403);
  });

  it('review needs remarks to send back, and only works once', async () => {
    const a = people.reviewerA.token;
    assert.equal((await call('POST', `/reviewer/dprs/${dprs.a}/review`, a, { decision: 'reject' })).status, 400);
    assert.equal((await call('POST', `/reviewer/dprs/${dprs.a}/review`, a, { decision: 'maybe' })).status, 400);
    const ok = await call('POST', `/reviewer/dprs/${dprs.a}/review`, a, { decision: 'reject', remarks: 'Add quotations' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.status, 'rejected');
    assert.equal((await call('POST', `/reviewer/dprs/${dprs.a}/review`, a, { decision: 'approve' })).status, 409);
  });

  it('APMSMEDC Admin: every district and every admin route', async () => {
    const t = people.admin.token;
    const list = await call('GET', '/reviewer/dprs?status=all', t);
    assert.equal(list.status, 200);
    const ids = list.body.data.dprs.map((d: any) => d.dprId);
    assert.ok(ids.includes(dprs.a) && ids.includes(dprs.b));
    assert.equal((await call('GET', '/admin/users', t)).status, 200);
    assert.equal((await call('GET', '/admin/analytics', t)).status, 200);
    assert.equal((await call('GET', `/reviewer/dprs/${dprs.b}`, t)).status, 200);
  });

  it('only an admin can change roles; a reviewer must have a district; bad roles are rejected', async () => {
    const t = people.admin.token;
    assert.equal((await call('PUT', `/admin/users/${people.sneaky.id}`, t, { role: 'superuser' })).status, 400);
    assert.equal((await call('PUT', `/admin/users/${people.sneaky.id}`, t, { role: 'officer' })).status, 400);
    const promoted = await call('PUT', `/admin/users/${people.sneaky.id}`, t, { role: 'officer', reviewDistrict: DISTRICT_B });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.body.data.user.reviewDistrict, DISTRICT_B);
    assert.equal((await call('PUT', `/admin/users/${people.admin.id}`, t, { role: 'entrepreneur' })).status, 400, 'cannot demote self');
  });

  it('a demoted reviewer loses access immediately, even with an old token', async () => {
    const admin = people.admin.token;
    const oldToken = people.reviewerB.token;
    assert.equal((await call('GET', '/reviewer/dprs', oldToken)).status, 200);
    const demote = await call('PUT', `/admin/users/${people.reviewerB.id}`, admin, { role: 'entrepreneur' });
    assert.equal(demote.status, 200);
    assert.equal((await call('GET', '/reviewer/dprs', oldToken)).status, 403);
  });
});
