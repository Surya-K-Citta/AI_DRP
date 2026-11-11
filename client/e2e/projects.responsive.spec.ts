// Projects: create, list, open, edit, delete, validation and ownership. The create form and the list are checked at every screen size.
import { api, expect, login, unique, USERS, test } from './fixtures';

const body = (name: string, extra: Record<string, unknown> = {}) => ({
  projectName: name, projectType: 'individual', industrySector: 'Manufacturing', totalCost: 1000000, ownContribution: 200000, loanAmount: 800000, location: 'Guntur', businessDescription: 'QA test project', ...extra,
});
const idOf = (made: any) => made.body.data._id || made.body.data.id || made.body.data.project?._id;

test.describe('projects in the browser', () => {
  test.use({ role: 'consultant' });

  test('a project filled in through the form is saved and shown in the list', async ({ page }) => {
    const name = unique('QA Unit');
    await page.goto('/projects/create');
    const texts = page.locator('form input:not([type=number]):not([type=checkbox])');
    await texts.nth(0).fill(name);
    await texts.nth(2).fill('Guntur');
    await page.locator('form select').nth(1).selectOption('Manufacturing');
    const numbers = page.locator('form input[type=number]');
    for (const [index, value] of ['1000000', '200000', '800000'].entries()) await numbers.nth(index).fill(value);
    await page.locator('form button[type=submit]').click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 15_000 });
    await expect(page.getByText(name)).toBeVisible();
    const { token } = await login(USERS.consultant);
    expect(JSON.stringify((await api('GET', '/projects', undefined, token)).body)).toContain(name);
  });

  test('required fields stop an empty form (nothing is sent)', async ({ page }) => {
    await page.goto('/projects/create');
    await page.locator('form button[type=submit]').click();
    await expect(page).toHaveURL(/\/projects\/create$/);
    expect(await page.locator('form [required]').evaluateAll((els) => els.some((el: any) => !el.checkValidity()))).toBe(true);
  });

  test('a project opens from its own address and shows its details', async ({ page }) => {
    const { token } = await login(USERS.consultant);
    const name = unique('QA Open');
    const id = idOf(await api('POST', '/projects', body(name), token));
    await page.goto(`/projects/${id}`);
    await expect(page.locator(`input[value="${name}"]`)).toBeVisible();
  });

  test('deleting a project from the list asks first, then removes it', async ({ page }) => {
    const { token } = await login(USERS.consultant);
    const name = unique('QA Delete');
    const id = idOf(await api('POST', '/projects', body(name), token));
    await page.goto('/projects');
    const card = page.locator('article').filter({ hasText: name });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: new RegExp(`^Delete ${name}`) }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^(Delete|Yes|Confirm)/i }).click();
    await expect(card).toHaveCount(0);
    expect((await api('GET', `/projects/${id}`, undefined, token)).status, 'the project is gone').toBe(404);
  });

  test('a script in a project name never runs', async ({ page }) => {
    const { token } = await login(USERS.consultant);
    const nasty = `<img src=x onerror=alert(1)> ${'ñ'.repeat(40)} ${unique('long')}`;
    const made = await api('POST', '/projects', body(nasty), token);
    expect([201, 400]).toContain(made.status);
    let alerted = false;
    page.on('dialog', async (d) => { alerted = true; await d.dismiss(); });
    await page.goto('/projects');
    await page.waitForTimeout(1500);
    expect(alerted).toBe(false);
  });

  test('a very long name without spaces wraps inside its card', async ({ page }) => {
    const { token } = await login(USERS.consultant);
    const name = `${'U'.repeat(150)}${unique('')}`;
    await api('POST', '/projects', body(name), token);
    await page.goto('/projects');
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});

test.describe('projects through the API', () => {
  test('the server rejects a missing name, a bad type, a non-numeric cost and a missing location', async () => {
    const { token } = await login(USERS.consultant);
    for (const bad of [{ projectName: '' }, { projectType: 'weird' }, { totalCost: 'abc' }, { location: '' }]) {
      expect((await api('POST', '/projects', body(unique('bad'), bad), token)).status).toBe(400);
    }
    expect((await api('POST', '/projects', body('x'))).status, 'signed-out creation is refused').toBe(401);
  });

  test('zero and negative money values never cause a server error', async () => {
    const { token } = await login(USERS.consultant);
    for (const cost of [0, -1]) expect((await api('POST', '/projects', body(unique('edge'), { totalCost: cost }), token)).status).toBeLessThan(500);
  });

  test('editing a project changes only that project and keeps the rest', async () => {
    const { token } = await login(USERS.consultant);
    const name = unique('QA Edit');
    const id = idOf(await api('POST', '/projects', body(name), token));
    expect((await api('PUT', `/projects/${id}`, { location: 'Vijayawada' }, token)).status).toBe(200);
    const got = await api('GET', `/projects/${id}`, undefined, token);
    const project = got.body.data.project || got.body.data;
    expect(project.location).toBe('Vijayawada');
    expect(project.projectName, 'untouched fields stay').toBe(name);
  });

  test('deleting a project also removes its saved DPR drafts (no orphans)', async () => {
    const { token } = await login(USERS.consultant);
    const saved = await api('POST', '/dpr/cluster/draft/save', { clusterData: { step1: { unitName: unique('QA Orphan'), location: 'Guntur' }, isIndividualDPR: true, currentStep: 1 } }, token);
    expect(saved.status).toBe(200);
    const { projectId, dprId } = saved.body.data;
    expect((await api('GET', `/dpr/${dprId}`, undefined, token)).status, 'the draft exists before').toBe(200);
    expect((await api('DELETE', `/projects/${projectId}`, undefined, token)).status).toBe(200);
    expect((await api('GET', `/dpr/${dprId}`, undefined, token)).status, 'the draft is gone with its project').toBe(404);
  });

  test('another person cannot read, change or delete my project', async () => {
    const mine = await login(USERS.consultant);
    const other = await login(USERS.consultant2);
    const id = idOf(await api('POST', '/projects', body(unique('QA Private')), mine.token));
    expect((await api('GET', `/projects/${id}`, undefined, other.token)).status).toBe(404);
    expect((await api('PUT', `/projects/${id}`, { location: 'Hacked' }, other.token)).status).toBe(404);
    expect((await api('DELETE', `/projects/${id}`, undefined, other.token)).status).toBe(404);
    expect(JSON.stringify((await api('GET', '/projects', undefined, other.token)).body)).not.toContain(id);
    expect((await api('GET', `/projects/${id}`, undefined, mine.token)).status, 'still there for the owner').toBe(200);
  });
});
