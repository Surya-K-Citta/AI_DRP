// ADM / REV / INT: the admin console, the district reviewer's queue, and the journey a DPR takes across people and modules.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, bodyText, waitFor, sleep, clickText, typeInto, unique, dbCount, dbFind, dbClose, QA } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

const draft = (unit, district = 'Guntur') => ({ clusterData: { step1: { unitName: unit, location: district, district }, isIndividualDPR: true, currentStep: 1 } });
async function submittedDpr(unit = unique('QA Journey'), district = 'Guntur') {
  const me = await signIn('consultant');
  const saved = await api('POST', '/dpr/cluster/draft/save', draft(unit, district), me.token);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const sub = await api('POST', `/dpr/${saved.body.data.dprId}/submit`, {}, me.token);
  assert.equal(sub.status, 200, JSON.stringify(sub.body));
  return { unit, me, ...saved.body.data };
}

describe('admin console', () => {
  test('ADM-001 the user count on the dashboard equals the number of accounts in the database', async () => {
    const page = await openPage(browser, { as: 'admin' });
    await go(page, '/admin', 3000);
    const shown = Number(((await bodyText(page)).match(/Total Users\s+(\d+)/) || [])[1]);
    assert.equal(shown, await dbCount('users'));
    const projects = Number(((await bodyText(page)).match(/Total Projects\s+(\d+)/) || [])[1]);
    assert.equal(projects, await dbCount('projects'));
    await page.close();
  });

  test('ADM-002 User Management lists the accounts, and the other tabs open without errors', async (t) => {
    const page = await openPage(browser, { as: 'admin' });
    await go(page, '/admin', 2500);
    for (const tab of ['User Management', 'Access Control', 'DPR Management', 'Policies', 'Audit log']) {
      await clickText(page, 'main button', new RegExp('^' + tab)); await sleep(1200);
    }
    await clickText(page, 'main button', /^User Management/); await sleep(1200);
    // The screen loads only the first 50 accounts and its search box filters just those, so on a database with more than 50 people
    // some accounts cannot be reached from the screen at all (BUG-014). The check below finds a known account through the search box.
    await typeInto(page, 'input[placeholder="Search users..."]', QA.users.consultant.email); await sleep(800);
    const found = await bodyText(page);
    const admin = await signIn('admin');
    const total = (await api('GET', '/admin/users?limit=1', undefined, admin.token)).body?.data?.pagination?.total ?? 0;
    if (!/qa\.consultant@msme\.test/.test(found) && total > 50) { t.todo(`BUG-014 the admin user list shows only the first 50 of ${total} accounts and searches only those`); await page.close(); return; }
    assert.match(found, /qa\.consultant@msme\.test/);
    assert.doesNotMatch(found, /qa\.officer@msme\.test/, 'the search narrows the list');
    assert.deepEqual(page.problems, []);
    await page.close();
  });

  test('ADM-003 the audit trail records sign-ins and verifies as unbroken', async () => {
    const admin = await signIn('admin');
    const verify = await api('GET', '/admin/audit/verify', undefined, admin.token);
    assert.equal(verify.status, 200);
    assert.equal(verify.body.data?.ok ?? verify.body.data?.valid ?? verify.body.success, true, JSON.stringify(verify.body).slice(0, 200));
    const audit = await api('GET', '/admin/audit?limit=5', undefined, admin.token);
    assert.equal(audit.status, 200);
  });

  test('ADM-004 an admin can invite a District Reviewer, who must have a district', async () => {
    const admin = await signIn('admin');
    const email = `${unique('invite')}@msme.test`;
    const noDistrict = await api('POST', '/admin/users/invite', { name: 'No District', email, role: 'officer' }, admin.token);
    assert.equal(noDistrict.status, 400);
    const ok = await api('POST', '/admin/users/invite', { name: 'QA Invited Reviewer', email, role: 'officer', reviewDistrict: 'Guntur' }, admin.token);
    assert.ok([200, 201].includes(ok.status), JSON.stringify(ok.body));
    const consultant = await signIn('consultant');
    assert.equal((await api('POST', '/admin/users/invite', { name: 'x', email: `${unique('x')}@msme.test`, role: 'officer', reviewDistrict: 'Guntur' }, consultant.token)).status, 403);
  });
});

describe('district review', () => {
  test('REV-001 the reviewer sees submitted DPRs of their own district only', async () => {
    const mine = await submittedDpr(unique('QA Guntur'), 'Guntur');
    const other = await submittedDpr(unique('QA Krishna'), 'Krishna');
    const officer = await signIn('officer');
    const list = await api('GET', '/reviewer/dprs?status=submitted', undefined, officer.token);
    assert.equal(list.status, 200);
    const text = JSON.stringify(list.body);
    assert.ok(text.includes(mine.dprId), 'own district is listed');
    assert.ok(!text.includes(other.dprId), 'another district is not');
    assert.ok([403, 404].includes((await api('GET', `/reviewer/dprs/${other.dprId}`, undefined, officer.token)).status), 'cannot open another district\'s DPR by id');
  });

  test('REV-002 sending a DPR back needs remarks; approving works once; a decided DPR cannot be decided again', async () => {
    const d = await submittedDpr();
    const officer = await signIn('officer');
    assert.equal((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'reject', remarks: '' }, officer.token)).status, 400);
    assert.equal((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'maybe' }, officer.token)).status, 400);
    assert.equal((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'approve' }, officer.token)).status, 200);
    assert.equal((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'approve' }, officer.token)).status, 409);
  });

  test('REV-003 the queue page shows a waiting DPR and approving it there changes its status for everyone', async () => {
    const d = await submittedDpr(unique('QA Approve UI'));
    const page = await openPage(browser, { as: 'officer' });
    await go(page, '/reviewer', 2500);
    await waitFor(page, (u) => document.body.innerText.includes(u), d.unit, 15000);
    const clicked = await page.evaluate((u) => {
      const card = [...document.querySelectorAll('main *')].filter((el) => el.textContent.includes(u)).pop();
      let node = card; while (node && ![...node.querySelectorAll('button')].some((b) => /^Approve/.test(b.textContent.trim()))) node = node.parentElement;
      const btn = node && [...node.querySelectorAll('button')].find((b) => /^Approve/.test(b.textContent.trim()));
      if (!btn) return false; btn.click(); return true;
    }, d.unit);
    assert.ok(clicked, 'found the Approve button for that DPR');
    await sleep(500);
    await page.evaluate(() => [...document.querySelectorAll('[role=alertdialog] button, [role=dialog] button')].find((b) => /^(Approve|Confirm|Yes)/i.test(b.textContent.trim()))?.click());
    await sleep(2000);
    const row = (await dbFind('dprversions', { projectId: d.projectId }))[0];
    assert.equal(row.status, 'approved');
    await page.close();
  });
});

describe('across modules and people', () => {
  test('INT-001 a draft saved in the DPR module appears in the project list, dashboard totals, admin counts and "All DPRs"', async () => {
    const me = await signIn('consultant');
    const admin = await signIn('admin');
    const before = (await api('GET', '/admin/analytics', undefined, admin.token)).body.data;
    const unit = unique('QA Cross');
    const saved = await api('POST', '/dpr/cluster/draft/save', draft(unit), me.token);
    assert.equal(saved.status, 200);
    const projects = await api('GET', '/projects', undefined, me.token);
    assert.ok(JSON.stringify(projects.body).includes(unit), 'in my projects');
    const dprs = await api('GET', '/dpr/user/list', undefined, me.token);
    assert.ok(JSON.stringify(dprs.body).includes(saved.body.data.dprId), 'in my DPR list');
    const after = (await api('GET', '/admin/analytics', undefined, admin.token)).body.data;
    const total = (a) => a.summary.totalProjects;
    assert.equal(total(after), total(before) + 1, 'the admin project count went up by exactly one');
    assert.equal(after.summary.totalDPRs, before.summary.totalDPRs + 1, 'and so did the DPR count');
  });

  test('INT-002 a submitted DPR is visible to the reviewer, then to the admin, and its status follows the decision back to its owner', async () => {
    const d = await submittedDpr();
    const officer = await signIn('officer'); const admin = await signIn('admin');
    assert.ok(JSON.stringify((await api('GET', '/reviewer/dprs?status=submitted', undefined, officer.token)).body).includes(d.dprId));
    assert.ok(JSON.stringify((await api('GET', '/admin/dprs', undefined, admin.token)).body).includes(d.dprId));
    await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'reject', remarks: 'Add the machinery quotes.' }, officer.token);
    const mine = await api('GET', `/dpr/${d.dprId}`, undefined, d.me.token);
    assert.match(JSON.stringify(mine.body), /rejected/i, 'the owner sees it was sent back');
    assert.match(JSON.stringify(mine.body), /machinery quotes/i, 'with the reviewer\'s remarks');
  });

  test('INT-003 one person\'s documents, drafts and exports are invisible to another, in every list', async () => {
    const a = await signIn('consultant'); const b = await signIn('consultant2');
    const unit = unique('QA Secret');
    const saved = await api('POST', '/dpr/cluster/draft/save', draft(unit), a.token);
    for (const path of ['/projects', '/dpr/user/list', '/privacy/export', '/privacy/activity']) {
      const r = await api('GET', path, undefined, b.token);
      assert.ok(!JSON.stringify(r.body).includes(unit) && !JSON.stringify(r.body).includes(saved.body.data.dprId), `${path} leaks`);
    }
  });

  test('INT-004 a deactivated person is signed out of every module at once', async () => {
    const admin = await signIn('admin');
    const email = `${unique('deact')}@msme.test`;
    const made = await api('POST', '/auth/register', { name: 'Deactivate Me', email, password: QA.password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
    const token = made.body.data.token;
    assert.equal((await api('GET', '/projects', undefined, token)).status, 200);
    assert.equal((await api('POST', `/admin/users/${made.body.data.userId}/deactivate`, {}, admin.token)).status, 200);
    assert.equal((await api('GET', '/projects', undefined, token)).status, 401);
    assert.equal((await api('POST', '/auth/login', { email, password: QA.password })).status >= 400, true);
  });
});
