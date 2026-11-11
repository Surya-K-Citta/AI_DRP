// The admin console, the district reviewer's queue, and the journey a DPR takes across people and modules.
import { api, draftBody, expect, login, newPerson, PASSWORD, test, unique, USERS } from './fixtures';

const submittedDpr = async (unit = unique('QA Journey'), district = 'Guntur') => {
  const me = await login(USERS.consultant);
  const saved = await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: { unitName: unit, location: district, district }, isIndividualDPR: true, currentStep: 1 } }, me.token);
  expect(saved.status, JSON.stringify(saved.body)).toBe(200);
  const sub = await api('POST', `/dpr/${saved.body.data.dprId}/submit`, {}, me.token);
  expect(sub.status, JSON.stringify(sub.body)).toBe(200);
  return { unit, me, ...saved.body.data };
};

test.describe('admin console', () => {
  test.use({ role: 'admin' });

  test('the user count on the dashboard equals the number of accounts', async ({ page }) => {
    const admin = await login(USERS.admin);
    const total = (await api('GET', '/admin/users?limit=1', undefined, admin.token)).body.data.pagination.total;
    await page.goto('/admin');
    await expect(page.locator('section[aria-label="Summary"] button').filter({ hasText: /^Total Users/ })).toContainText(String(total));
  });

  test('User Management finds an account with the search box, and the other tabs open without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/admin');
    for (const tab of ['User Management', 'Access Control', 'DPR Management', 'Policies', 'Audit log']) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await page.waitForTimeout(500);
    }
    await page.getByRole('tab', { name: /^User Management/ }).click();
    await page.getByPlaceholder('Search users...').fill(USERS.consultant);
    await expect(page.locator('body')).toContainText(USERS.consultant);
    await expect(page.locator('body')).not.toContainText(USERS.officer);
    expect(errors).toEqual([]);
  });

  test('the audit trail verifies as unbroken', async () => {
    const admin = await login(USERS.admin);
    const verify = await api('GET', '/admin/audit/verify', undefined, admin.token);
    expect(verify.status).toBe(200);
    expect(verify.body.data?.ok ?? verify.body.data?.valid ?? verify.body.success).toBe(true);
    expect((await api('GET', '/admin/audit?limit=5', undefined, admin.token)).status).toBe(200);
  });

  test('an admin can invite a District Reviewer, who must have a district; others cannot invite', async () => {
    const admin = await login(USERS.admin);
    const email = `${unique('invite')}@msme.test`;
    expect((await api('POST', '/admin/users/invite', { name: 'No District', email, role: 'officer' }, admin.token)).status).toBe(400);
    const ok = await api('POST', '/admin/users/invite', { name: 'QA Invited Reviewer', email, role: 'officer', reviewDistrict: 'Guntur' }, admin.token);
    expect([200, 201]).toContain(ok.status);
    const consultant = await login(USERS.consultant);
    expect((await api('POST', '/admin/users/invite', { name: 'x', email: `${unique('x')}@msme.test`, role: 'officer', reviewDistrict: 'Guntur' }, consultant.token)).status).toBe(403);
  });
});

test.describe('district review', () => {
  test('the reviewer sees submitted DPRs of their own district only', async () => {
    const mine = await submittedDpr(unique('QA Guntur'), 'Guntur');
    const other = await submittedDpr(unique('QA Krishna'), 'Krishna');
    const officer = await login(USERS.officer);
    const list = await api('GET', '/reviewer/dprs?status=submitted', undefined, officer.token);
    expect(list.status).toBe(200);
    const text = JSON.stringify(list.body);
    expect(text, 'own district is listed').toContain(mine.dprId);
    expect(text, 'another district is not').not.toContain(other.dprId);
    expect([403, 404], 'cannot open another district\'s DPR by id').toContain((await api('GET', `/reviewer/dprs/${other.dprId}`, undefined, officer.token)).status);
  });

  test('sending a DPR back needs remarks; approving works once; a decided DPR cannot be decided again', async () => {
    const d = await submittedDpr();
    const officer = await login(USERS.officer);
    expect((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'reject', remarks: '' }, officer.token)).status).toBe(400);
    expect((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'maybe' }, officer.token)).status).toBe(400);
    expect((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'approve' }, officer.token)).status).toBe(200);
    expect((await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'approve' }, officer.token)).status).toBe(409);
  });

  test.describe('the queue page', () => {
    test.use({ role: 'officer' });
    test('shows a waiting DPR, and approving it there changes its status for everyone', async ({ page }) => {
      const d = await submittedDpr(unique('QA Approve UI'));
      await page.goto('/reviewer');
      const card = page.locator('main').locator('li, article, div').filter({ hasText: d.unit }).filter({ has: page.getByRole('button', { name: /^Approve/ }) }).last();
      await expect(card).toBeVisible({ timeout: 20_000 });
      await card.getByRole('button', { name: /^Approve/ }).click();
      const confirm = page.locator('[role=alertdialog], [role=dialog]').getByRole('button', { name: /^(Approve|Confirm|Yes)/i });
      if (await confirm.count()) await confirm.first().click();
      await expect.poll(async () => JSON.stringify((await api('GET', `/dpr/${d.dprId}`, undefined, d.me.token)).body)).toMatch(/approved/i);
    });
  });
});

test.describe('across people and modules', () => {
  test('a draft saved in the DPR module appears in the project list, my DPR list and the admin counts', async () => {
    const me = await login(USERS.consultant);
    const admin = await login(USERS.admin);
    const before = (await api('GET', '/admin/analytics', undefined, admin.token)).body.data;
    const unit = unique('QA Cross');
    const saved = await api('POST', '/dpr/cluster/draft/save', draftBody(unit), me.token);
    expect(saved.status).toBe(200);
    expect(JSON.stringify((await api('GET', '/projects', undefined, me.token)).body), 'in my projects').toContain(unit);
    expect(JSON.stringify((await api('GET', '/dpr/user/list', undefined, me.token)).body), 'in my DPR list').toContain(saved.body.data.dprId);
    const after = (await api('GET', '/admin/analytics', undefined, admin.token)).body.data;
    expect(after.summary.totalProjects, 'the admin project count went up by exactly one').toBe(before.summary.totalProjects + 1);
    expect(after.summary.totalDPRs, 'and so did the DPR count').toBe(before.summary.totalDPRs + 1);
  });

  test('a submitted DPR is visible to the reviewer, then to the admin, and its status follows the decision back to its owner', async () => {
    const d = await submittedDpr();
    const officer = await login(USERS.officer);
    const admin = await login(USERS.admin);
    expect(JSON.stringify((await api('GET', '/reviewer/dprs?status=submitted', undefined, officer.token)).body)).toContain(d.dprId);
    expect(JSON.stringify((await api('GET', '/admin/dprs', undefined, admin.token)).body)).toContain(d.dprId);
    await api('POST', `/reviewer/dprs/${d.dprId}/review`, { decision: 'reject', remarks: 'Add the machinery quotes.' }, officer.token);
    const mine = JSON.stringify((await api('GET', `/dpr/${d.dprId}`, undefined, d.me.token)).body);
    expect(mine, 'the owner sees it was sent back').toMatch(/rejected/i);
    expect(mine, 'with the reviewer\'s remarks').toMatch(/machinery quotes/i);
  });

  test('one person\'s documents, drafts and exports are invisible to another, in every list', async () => {
    const a = await login(USERS.consultant);
    const b = await login(USERS.consultant2);
    const unit = unique('QA Secret');
    const saved = await api('POST', '/dpr/cluster/draft/save', draftBody(unit), a.token);
    for (const path of ['/projects', '/dpr/user/list', '/privacy/export', '/privacy/activity']) {
      const text = JSON.stringify((await api('GET', path, undefined, b.token)).body);
      expect(text, `${path} leaks`).not.toContain(unit);
      expect(text, `${path} leaks`).not.toContain(saved.body.data.dprId);
    }
  });

  test('a deactivated person is signed out of every module at once', async () => {
    const admin = await login(USERS.admin);
    const person = await newPerson('deact');
    expect((await api('GET', '/projects', undefined, person.token)).status).toBe(200);
    expect((await api('POST', `/admin/users/${person.user.userId || person.user._id}/deactivate`, {}, admin.token)).status).toBe(200);
    expect((await api('GET', '/projects', undefined, person.token)).status).toBe(401);
    expect((await api('POST', '/auth/login', { email: person.email, password: PASSWORD })).status).toBeGreaterThanOrEqual(400);
  });
});
