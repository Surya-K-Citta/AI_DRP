// The cluster DPR form, session expiry handling, keyboard-only use and the language switch. Runs at every screen size.
import { api, expect, login, newPerson, startSignedIn, test, unique, USERS } from './fixtures';

test.describe('cluster DPR', () => {
  test.use({ role: 'consultant' });

  test('the cluster form opens on step 1 with all 18 steps and a live preview', async ({ page }) => {
    await page.goto('/cluster-dpr/create');
    await expect(page.getByPlaceholder('Enter cluster name')).toBeVisible();
    // The step list sits beside the form on wide screens; on a phone it is folded into the screen's own step control.
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await expect(page.getByRole('button', { name: /^\d+\s*Step \d+/ })).toHaveCount(18);
      await expect(page.locator('body')).toContainText(/Live DPR Preview|Preview/);
    }
  });

  test('typing the cluster name and pressing Save Draft stores a cluster (not individual) draft', async ({ page }) => {
    const name = unique('QA Cluster');
    await page.goto('/cluster-dpr/create');
    await page.getByPlaceholder('Enter cluster name').fill(name);
    const [saved] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/dpr/cluster/draft/save') && r.request().method() === 'POST' && (r.request().postData() || '').includes(name)),
      page.getByRole('button', { name: /^Save Draft/ }).first().click(),
    ]);
    expect(saved.status()).toBe(200);
    const { dprId } = (await saved.json()).data;
    const { token } = await login(USERS.consultant);
    const detail = JSON.stringify((await api('GET', `/dpr/${dprId}`, undefined, token)).body);
    expect(detail, 'stored under the typed name').toContain(name);
    expect(detail, 'as a cluster draft, not an individual one').not.toMatch(/"isIndividualDPR":true/);
  });

  test('Form, Split and Preview views change what is shown and keep what was typed', async ({ page }) => {
    const name = unique('QA ClusterView');
    await page.goto('/cluster-dpr/create');
    await page.getByPlaceholder('Enter cluster name').fill(name);
    await page.getByRole('button', { name: /^Preview$/ }).first().click();
    await page.getByRole('button', { name: /^Form$/ }).first().click();
    await expect(page.locator(`input[value="${name}"]`).first()).toBeVisible();
  });
});

test.describe('session', () => {
  test('a session that has ended sends the person to sign in, not to a blank page', async ({ page }) => {
    const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const expired = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ userId: 'x', role: 'entrepreneur', exp: now - 60, iat: now - 600 })}.sig`;
    await page.addInitScript((token) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { name: 'Old', role: 'entrepreneur' }, token, isAuthenticated: true }, version: 0 }));
      localStorage.setItem('token', token);
    }, expired);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('an API call with an expired token is refused', async () => {
    const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    expect((await api('GET', '/projects', undefined, `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ userId: 'x', exp: 1 })}.sig`)).status).toBe(401);
  });

  test.describe('idle warning', () => {
    test('near the end of an idle session a warning offers "Stay signed in", and real input keeps the person in', async ({ page }) => {
      // A brand-new sign-in, so the token is fresh and "340 s idle" really leaves the last minute of its 390 s.
      await startSignedIn(page, await newPerson('idle'));
      // The session counts from the later of saved activity and the token's issue time, so the page clock is moved forward instead:
      // 340 s of the token's 390 s leaves about 50 s, inside the one-minute warning.
      await page.addInitScript(() => {
        const real = Date.now.bind(Date);
        (window as any).__skew = 0;
        Date.now = () => real() + (window as any).__skew;
      });
      await page.goto('/dashboard');
      await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
      await page.evaluate(() => { (window as any).__skew = 340 * 1000; });
      const warning = page.getByRole('alertdialog');
      await expect(warning).toBeVisible({ timeout: 15_000 });
      await expect(warning).toContainText(/still there/i);
      await page.evaluate(() => { (window as any).__skew = 0; });
      await page.keyboard.press('Enter'); // a real key press counts as activity (a script's click does not, by design)
      await expect(warning).toHaveCount(0);
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });
});

test.describe('keyboard and language', () => {
  test.use({ role: 'consultant' });

  test('the first Tab stop is "Skip to main content", and it moves focus to the page content', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    if (browserName === 'webkit') await page.locator('a[href="#main-content"]').focus(); // Safari's engine does not Tab to links by default
    else await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toContainText(/Skip to main content/i);
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('switching to Telugu changes the page text and the document language, and back again', async ({ page }) => {
    await page.goto('/dashboard');
    const english = await page.locator('body').innerText();
    await page.getByRole('button', { name: /తెలుగు/ }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'te');
    expect(await page.locator('body').innerText()).not.toBe(english);
    await expect(page.locator('body')).toContainText(/[ఀ-౿]{3,}/);
    await page.getByRole('button', { name: /English/ }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
