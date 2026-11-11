import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running. Reopening, editing and generating the same Latest DPR must keep one DPR, not add copies.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const stamp = Date.now();
const email = `ver.${stamp}@msme.test`;
let token = '';
let userId = '';

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json: any = null;
  try { json = await r.json(); } catch { /* empty */ }
  return { status: r.status, body: json };
}
const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};
const answers = (name: string, extra: Record<string, unknown> = {}) => ({
  isIndividualDPR: true,
  matchedSchemeCode: 'PMFME',
  step1: { unitName: name, clusterName: name, district: 'Guntur', location: 'Prathipadu' },
  step2: { sectorType: 'Food processing' },
  ...extra,
});
const save = (data: Record<string, unknown>) => call('POST', '/dpr/cluster/draft/save', { clusterData: data });
const generate = (data: Record<string, unknown>) => call('POST', '/dpr/cluster/generate', { clusterData: data, language: 'bilingual' });
const versionsOf = async (projectId: string) => (await (await db()).collection('dprversions').find({ projectId }).toArray()) as any[];

before(async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200, `API is not running at ${base}`);
  const r = await call('POST', '/auth/register', { name: 'Ver', email, password: 'Ver-Test-2026', phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true, aiAssist: true });
  assert.equal(r.status, 201);
  token = r.body.data.token;
  userId = String(r.body.data.userId);
});

after(async () => {
  const database = await db();
  const projects = await database.collection('projects').find({ userId }).toArray();
  const ids = projects.map((p) => String(p._id));
  await database.collection('dprversions').deleteMany({ projectId: { $in: ids } });
  await database.collection('projects').deleteMany({ userId });
  await database.collection('users').deleteMany({ email });
  await mongoose.disconnect();
});

describe('amounts that arrive as text', () => {
  it('are added as numbers, so the draft still saves (they used to be joined into "0.002.4…" and fail)', async () => {
    const r = await save(answers('Text Amounts Foods', { step12: { land: '0.00', building: '2.4', machinery: '7.2', workingCapitalMargin: '0.9' }, step13: { spvContribution: '1.5', bankLoan: '9' } }));
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const project: any = await (await db()).collection('projects').findOne({ _id: new mongoose.Types.ObjectId(r.body.data.projectId) });
    assert.equal(Math.round(project.totalCost * 100) / 100, 10.5);
    assert.equal(project.loanAmount, 9);
  });
});

describe('one DPR per draft', () => {
  let projectId = '';
  let dprId = '';

  it('saving a draft again updates it', async () => {
    const first = await save(answers('Sri Durga Chilli Foods'));
    assert.equal(first.status, 200);
    projectId = first.body.data.projectId;
    dprId = first.body.data.dprId;
    const again = await save(answers('Sri Durga Chilli Foods', { projectId, dprId, step3: { geography: 'Edited' } }));
    assert.equal(again.body.data.dprId, dprId);
    assert.equal((await versionsOf(projectId)).length, 1);
  });

  it('generating, once or many times, updates the same DPR instead of adding one per click', async () => {
    for (let i = 0; i < 3; i += 1) {
      const gen = await generate(answers('Sri Durga Chilli Foods', { projectId, dprId, step3: { geography: `Edit ${i}` } }));
      assert.equal(gen.status, 200, JSON.stringify(gen.body));
      assert.equal(String(gen.body.data.dprId), dprId, 'generate returns the DPR that was open');
    }
    const versions = await versionsOf(projectId);
    assert.equal(versions.length, 1, 'still one DPR for this project');
    assert.equal(versions[0].content.english.clusterData.step3.geography, 'Edit 2', 'with the latest answers');
  });

  it('the person’s list shows it once', async () => {
    const list = await call('GET', '/dpr/user/list');
    const rows: any[] = list.body?.data?.dprs || list.body?.data || [];
    assert.equal(rows.filter((r) => String(r.projectId?._id || r.projectId) === projectId).length, 1);
  });

  it('with copies already there, an edit goes to the DPR that was opened, not to the newest copy', async () => {
    const database = await db();
    const original: any = (await versionsOf(projectId))[0];
    const copy = { ...original, _id: new mongoose.Types.ObjectId(), createdAt: new Date(Date.now() + 5000), updatedAt: new Date(Date.now() + 5000) };
    await database.collection('dprversions').insertOne(copy);
    const edit = await save(answers('Sri Durga Chilli Foods', { projectId, dprId, step3: { geography: 'Opened the original' } }));
    assert.equal(edit.body.data.dprId, dprId);
    const after = await versionsOf(projectId);
    assert.equal(after.length, 2, 'no third copy appears');
    assert.equal(after.find((v) => String(v._id) === dprId).content.english.clusterData.step3.geography, 'Opened the original');
    assert.notEqual(after.find((v) => String(v._id) === String(copy._id)).content.english.clusterData.step3.geography, 'Opened the original');
    await database.collection('dprversions').deleteOne({ _id: copy._id });
  });

  it('a submitted DPR is not overwritten: generating again makes a new version', async () => {
    const database = await db();
    await database.collection('dprversions').updateOne({ _id: new mongoose.Types.ObjectId(dprId) }, { $set: { status: 'submitted' } });
    const gen = await generate(answers('Sri Durga Chilli Foods', { projectId, dprId, step3: { geography: 'After submission' } }));
    assert.equal(gen.status, 200);
    assert.notEqual(String(gen.body.data.dprId), dprId);
    const versions = await versionsOf(projectId);
    assert.equal(versions.length, 2);
    assert.equal(versions.find((v) => String(v._id) === dprId).status, 'submitted');
    assert.notEqual(versions.find((v) => String(v._id) === dprId).content.english.clusterData.step3.geography, 'After submission');
  });
});
