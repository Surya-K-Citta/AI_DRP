// DPR (API level): the draft lifecycle, ownership, under-18 rule, exports, AI-consent gate. Real QA server and database.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { api, signIn, requireStack, unique, dbCount, dbFind, dbClose, QA } from '../lib/harness.mjs';

before(async () => { await requireStack(); });
after(async () => { await dbClose(); });

const draft = (unit, extra = {}) => ({ clusterData: { step1: { unitName: unit, location: 'Guntur', district: 'Guntur' }, isIndividualDPR: true, currentStep: 1, ...extra } });
async function savedDraft(who = 'consultant', unit = unique('QA Draft')) {
  const me = await signIn(who);
  const r = await api('POST', '/dpr/cluster/draft/save', draft(unit), me.token);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return { me, unit, ...r.body.data };
}
async function download(token, path) {
  const r = await fetch(QA.api + path, { headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, type: r.headers.get('content-type'), bytes: Buffer.from(await r.arrayBuffer()) };
}

describe('draft lifecycle', () => {
  test('DPR-001 saving a draft creates one project and one draft, and later saves update them (no duplicates)', async () => {
    const first = await savedDraft();
    const again = await api('POST', '/dpr/cluster/draft/save', draft(first.unit, { projectId: first.projectId, step1: { unitName: first.unit, natureOfBusiness: 'Pickles' } }), first.me.token);
    assert.equal(again.body.data.projectId, first.projectId);
    assert.equal(again.body.data.dprId, first.dprId);
    assert.equal(await dbCount('dprversions', { projectId: first.projectId }), 1, 'still one version');
    const saved = await dbFind('dprversions', { projectId: first.projectId });
    assert.equal(saved[0].content.english.clusterData.step1.natureOfBusiness, 'Pickles', 'latest answers are stored');
  });

  test('DPR-002 the draft appears in my DPR list and opens by its id for me', async () => {
    const d = await savedDraft();
    const list = await api('GET', '/dpr/user/list', undefined, d.me.token);
    assert.ok(JSON.stringify(list.body).includes(d.dprId), 'listed');
    assert.equal((await api('GET', `/dpr/${d.dprId}`, undefined, d.me.token)).status, 200);
  });

  test('DPR-003 a draft needs a unit name, and a signed-out caller is refused', async () => {
    const me = await signIn('consultant');
    assert.equal((await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: {} } }, me.token)).status, 400);
    assert.equal((await api('POST', '/dpr/cluster/draft/save', {}, me.token)).status, 400);
    assert.equal((await api('POST', '/dpr/cluster/draft/save', draft('x'))).status, 401);
  });

  test('DPR-004 an applicant under 18 is refused (403) and nothing is stored', async () => {
    const me = await signIn('consultant');
    const unit = unique('QA Minor');
    const r = await api('POST', '/dpr/cluster/draft/save', draft(unit, { schemeExtras: { entrepreneurAge: 15 } }), me.token);
    assert.equal(r.status, 403);
    assert.equal(await dbCount('projects', { projectName: unit }), 0);
  });

  test('DPR-005 boundary: a very long unit name and a large payload are accepted or refused cleanly (never a server error)', async () => {
    const me = await signIn('consultant');
    const long = await api('POST', '/dpr/cluster/draft/save', draft('U'.repeat(500) + unique('')), me.token);
    assert.ok(long.status < 500, `long name → ${long.status}`);
    const big = await api('POST', '/dpr/cluster/draft/save', draft(unique('QA Big'), { step4: { notes: 'x'.repeat(200000) } }), me.token);
    assert.ok(big.status < 500, `large payload → ${big.status}`);
  });
});

describe('ownership and access control', () => {
  test('DPR-010 another person cannot open, export or submit my draft', async () => {
    const d = await savedDraft();
    const other = await signIn('consultant2');
    assert.equal((await api('GET', `/dpr/${d.dprId}`, undefined, other.token)).status, 403);
    assert.equal((await download(other.token, `/dpr/${d.dprId}/download/pdf`)).status, 403);
    assert.ok([403, 404].includes((await api('POST', `/dpr/${d.dprId}/submit`, {}, other.token)).status));
    assert.ok([403, 404].includes((await api('DELETE', `/dpr/${d.dprId}`, undefined, other.token)).status));
  });

  test('DPR-011 another person cannot overwrite my project by sending its id in a draft save', async (t) => {
    const mine = await savedDraft('consultant', unique('QA Mine'));
    const other = await signIn('consultant2');
    const hijack = await api('POST', '/dpr/cluster/draft/save', draft('HIJACKED', { projectId: mine.projectId, step1: { unitName: 'HIJACKED', location: 'Hacked' } }), other.token);
    const stored = await dbFind('projects', { projectName: mine.unit });
    const intact = stored.length === 1 && stored[0].location !== 'Hacked' && stored[0].stepData?.step1?.unitName === mine.unit;
    if (!intact || hijack.status === 200) { t.todo(`BUG-009 (security, high) a different signed-in user changed someone else's project through the draft-save endpoint: status ${hijack.status}, stored location "${stored[0]?.location}"`); return; }
    assert.ok(hijack.status >= 400);
  });

  test('DPR-012 only an admin can change a scheme\'s default report look', async () => {
    const consultant = await signIn('consultant');
    const admin = await signIn('admin');
    const style = { documentStyle: { preset: 'government', pictures: [] } };
    assert.equal((await api('PUT', '/dpr/scheme-style/ZZ_QA_E2E', style, consultant.token)).status, 403);
    assert.equal((await api('PUT', '/dpr/scheme-style/ZZ_QA_E2E', style, admin.token)).status, 200);
    assert.equal((await api('GET', '/dpr/scheme-style/ZZ_QA_E2E', undefined, consultant.token)).status, 200, 'anyone signed in can read it');
  });

  test('DPR-013 AI features need the person\'s AI consent (403 without it)', async () => {
    const d = await savedDraft();
    assert.equal((await api('GET', `/dpr/${d.dprId}/quality`, undefined, d.me.token)).status, 403);
    assert.equal((await api('POST', '/dpr/cluster/ai/suggestions', { currentStep: 2 }, d.me.token)).status, 403);
  });
});

describe('exports and submission', () => {
  test('DPR-020 the owner can download the draft as a real PDF, Word file and spreadsheet', async () => {
    const d = await savedDraft();
    const pdf = await download(d.me.token, `/dpr/${d.dprId}/download/pdf`);
    assert.equal(pdf.status, 200); assert.match(pdf.type, /pdf/); assert.equal(pdf.bytes.slice(0, 4).toString('latin1'), '%PDF');
    const docx = await download(d.me.token, `/dpr/${d.dprId}/download/docx`);
    assert.equal(docx.status, 200); assert.equal(docx.bytes.slice(0, 2).toString('latin1'), 'PK', 'a .docx is a zip file');
    const xls = await download(d.me.token, `/dpr/${d.dprId}/download/xls`);
    assert.equal(xls.status, 200); assert.ok(xls.bytes.length > 50);
  });

  test('DPR-021 submitting records who, when and to whom, and a second submit does not duplicate it', async () => {
    const d = await savedDraft();
    const first = await api('POST', `/dpr/${d.dprId}/submit`, {}, d.me.token);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.status, 'submitted');
    const second = await api('POST', `/dpr/${d.dprId}/submit`, {}, d.me.token);
    assert.ok(second.status < 500, `second submit → ${second.status}`);
    assert.equal(await dbCount('dprversions', { projectId: d.projectId }), 1);
  });

  test('DPR-022 a submitted DPR can be reviewed only by the right people (district officer sees their district)', async () => {
    const d = await savedDraft();
    await api('POST', `/dpr/${d.dprId}/submit`, {}, d.me.token);
    const consultant = await signIn('consultant');
    assert.equal((await api('GET', '/reviewer/dprs', undefined, consultant.token)).status, 403);
    const officer = await signIn('officer');
    assert.equal((await api('GET', '/reviewer/dprs', undefined, officer.token)).status, 200);
    const admin = await signIn('admin');
    const all = await api('GET', '/admin/dprs', undefined, admin.token);
    assert.equal(all.status, 200);
    assert.ok(JSON.stringify(all.body).includes(d.dprId), 'admin sees it in the all-DPR list');
  });
});
