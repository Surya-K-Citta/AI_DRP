import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev). Uses throw-away users and DPRs.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const stamp = Date.now();
const email = `fin.${stamp}@msme.test`;
let token = '';
let userId = '';
const projects: string[] = [];

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json: any = null;
  try { json = await response.json(); } catch { /* empty */ }
  return { status: response.status, body: json };
}
const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};

const payload = (over: any = {}) => ({
  isIndividualDPR: true,
  matchedSchemeCode: null,
  step1: { unitName: 'Fin Test', clusterName: 'Fin Test', district: 'Guntur', location: 'Tenali' },
  step12: { machinery: 80, workingCapitalMargin: 20 },
  step13: { spvContribution: 25, bankLoan: 75 },
  ...over,
});

before(async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200, `API is not running at ${base}`);
  const r = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Fin', email, password: 'Fin-Test-2026', phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true, aiAssist: true }) });
  const j: any = await r.json();
  token = j.data.token;
  userId = String(j.data.userId);
});

after(async () => {
  const database = await db();
  await database.collection('users').deleteMany({ email });
  await database.collection('projects').deleteMany({ _id: { $in: projects.map((id) => new mongoose.Types.ObjectId(id)) } });
  await database.collection('dprversions').deleteMany({ projectId: { $in: projects } });
  await database.collection('auditevents').deleteMany({ userId });
  await mongoose.disconnect();
});

describe('server refuses a DPR whose money does not hold together', () => {
  it('generate: funding that does not match the cost is 422 with the blocker named', async () => {
    const result = await call('POST', '/dpr/cluster/generate', { clusterData: payload({ step13: { spvContribution: 25, bankLoan: 74 } }), language: 'english' });
    assert.equal(result.status, 422);
    assert.equal(result.body.code, 'DPR_NOT_READY');
    assert.ok(result.body.blockers.some((b: any) => b.id === 'mof.mismatch' && b.field === 'bankLoan' && b.step === 13));
  });
  it('generate: too little promoter equity, too much debt and missing step 1 fields are all named', async () => {
    const result = await call('POST', '/dpr/cluster/generate', { clusterData: payload({ step1: { unitName: 'Fin Test', clusterName: 'Fin Test' }, step13: { spvContribution: 5, bankLoan: 95 } }), language: 'english' });
    assert.equal(result.status, 422);
    assert.deepEqual(result.body.missing, ['district', 'location']);
    const ids = result.body.blockers.map((b: any) => b.id);
    assert.ok(ids.includes('equity.min') && ids.includes('debt.equity'), ids.join());
  });
  it('generate: a scheme lending limit is enforced (Mudra Kishore up to 5 lakh)', async () => {
    const result = await call('POST', '/dpr/cluster/generate', { clusterData: payload({ matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'kishore' }, step12: { machinery: 8, workingCapitalMargin: 2 }, step13: { spvContribution: 1, bankLoan: 9 } }), language: 'english' });
    assert.equal(result.status, 422);
    assert.ok(result.body.blockers.some((b: any) => b.id === 'lending.limit'));
  });
  it('submit: an individual DPR with unbalanced funding cannot be submitted, a balanced one can', async () => {
    const database = await db();
    const seed = async (data: any) => {
      const project = await database.collection('projects').insertOne({ userId, projectType: 'individual', projectName: `Fin ${stamp}`, industrySector: 'Food', totalCost: 1, ownContribution: 1, loanAmount: 0, location: 'T', stepData: data });
      const id = String(project.insertedId);
      projects.push(id);
      const dpr = await database.collection('dprversions').insertOne({ projectId: id, userId, status: 'draft', content: { english: { clusterData: data, isIndividualDPR: true }, telugu: {} } });
      return String(dpr.insertedId);
    };
    const bad = await seed(payload({ step13: { spvContribution: 25, bankLoan: 70 } }));
    const refused = await call('POST', `/dpr/${bad}/submit`, {});
    assert.equal(refused.status, 422);
    assert.equal(refused.body.code, 'DPR_NOT_READY');
    const good = await seed(payload());
    assert.equal((await call('POST', `/dpr/${good}/submit`, {})).status, 200);
  });
});
