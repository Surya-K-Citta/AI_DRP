// The dashboard home page: the numbers match the data, every card, button and shortcut opens the right place, deleting asks first.
// Runs at every screen size.
import { api, draftBody, expect, horizontalOverflow, newPerson, startSignedIn, test, unique } from './fixtures';

test.describe('layout and numbers', () => {
  test.use({ role: 'consultant' });

  test('the page shows the journey, summary cards, recent reports, search schemes and quick actions in order', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    const order = await page.locator('main h1, main h2').allTextContents();
    let at = -1;
    for (const title of ['Welcome back', 'Create a DPR in simple steps', 'My Recent DPRs', 'Search Scheme', 'Quick Actions']) {
      const next = order.findIndex((text, i) => i > at && text.trim().startsWith(title));
      expect(next, `"${title}" is missing or out of order in ${JSON.stringify(order)}`).toBeGreaterThan(at);
      at = next;
    }
    await expect(page.locator('main h1')).toHaveCount(1);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('the four "simple steps" boxes only explain; they are not buttons or links', async ({ page }) => {
    await page.goto('/dashboard');
    const steps = page.locator('[data-tour=journey] ol li');
    await expect(steps).toHaveCount(4);
    for (const index of [0, 1, 2, 3]) expect(await steps.nth(index).locator('button, a, [role=button], [tabindex]').count()).toBe(0);
    await steps.first().locator('div').first().click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('numbers for a new person', () => {
  test('the five summary numbers equal what is stored for this person', async ({ page }) => {
    const me = await newPerson('dash');
    for (const n of [1, 2]) expect((await api('POST', '/dpr/cluster/draft/save', draftBody(unique(`QA Num${n}`)), me.token)).status).toBe(200);
    await startSignedIn(page, me);
    await page.goto('/dashboard');
    const cards = page.locator('section[aria-label="DPR summary"] button');
    await expect(cards).toHaveCount(5);
    await expect(cards.nth(0)).toHaveAttribute('aria-label', /^Total DPRs: 2\./);
    await expect(cards.nth(1)).toHaveAttribute('aria-label', /^Draft: 2\./);
    await expect(cards.nth(2)).toHaveAttribute('aria-label', /^Submitted: 0\./);
    await expect(cards.nth(3)).toHaveAttribute('aria-label', /^Analyzed: 0\./);
    await expect(cards.nth(4)).toHaveAttribute('aria-label', /^Avg Quality: N\/A\./);
  });

  test('a person with no reports sees a clear empty state with a way to start', async ({ page }) => {
    const me = await newPerson('dash0');
    await startSignedIn(page, me);
    await page.goto('/dashboard');
    await expect(page.locator('body')).toContainText('No DPRs yet');
    await page.locator('main').getByRole('button', { name: /^Create DPR/ }).first().click();
    await expect(page).toHaveURL(/\/individual-dpr\/create/);
  });

  test('a row opens the report, and Delete asks first and only then removes it', async ({ page }) => {
    const me = await newPerson('dashrow');
    const unit = unique('QA Row');
    expect((await api('POST', '/dpr/cluster/draft/save', draftBody(unit), me.token)).status).toBe(200);
    await startSignedIn(page, me);
    await page.goto('/dashboard');
    await expect(page.locator('body')).toContainText(unit);
    const remove = page.getByRole('button', { name: new RegExp(`^Delete ${unit}`) });
    await remove.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^(Cancel|No|Keep)/i }).click();
    await expect(page.locator('body')).toContainText(unit);
    await remove.click();
    await page.getByRole('dialog').getByRole('button', { name: /^(Delete|Yes|Confirm)/i }).click();
    await expect(page.locator('body')).not.toContainText(unit);
  });
});

test.describe('navigation', () => {
  test.use({ role: 'consultant' });

  test('the Draft card opens the report list already filtered to drafts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('section[aria-label="DPR summary"] button').filter({ hasText: /^Draft/ }).click();
    await expect(page).toHaveURL(/\/dprs\?status=draft$/);
    await expect(page.locator('select').filter({ has: page.locator('option[value="draft"]') }).first()).toHaveValue('draft');
  });

  test('the top buttons and the Take Quick Guide button open their pages', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('[data-tour=actions]').getByRole('button', { name: /^Create DPR/ }).click();
    await expect(page).toHaveURL(/\/individual-dpr\/create/);
    await page.goto('/dashboard');
    await page.locator('[data-tour=journey]').getByRole('button', { name: /Take Quick Guide/ }).click();
    await expect(page).toHaveURL(/\/individual-dpr\/guide/);
    await page.goto('/dashboard');
    await page.locator('[data-tour=actions]').getByRole('button', { name: /^Scheme Finder$/ }).click();
    await expect(page).toHaveURL(/\/venture-match/);
  });

  test('searching in Search Scheme opens the scheme list with the words already typed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('input[type=search]').fill('food');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/individual-dpr\/create.*q=food/);
    await expect(page.locator('input[value="food"]').first()).toBeVisible();
  });

  test('the Search Scheme card lists real schemes, narrows them as you type, and a scheme starts a DPR for it', async ({ page }) => {
    await page.goto('/dashboard');
    const list = page.locator('[aria-labelledby=finder-list-title] li');
    expect(await list.count()).toBeGreaterThanOrEqual(5);
    await page.locator('input[type=search]').fill('mudra');
    await expect.poll(() => list.count()).toBeLessThan(5);
    expect(await list.allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/MUDRA/i)]));
    await list.getByRole('button', { name: /Pradhan Mantri MUDRA/i }).click();
    await expect(page).toHaveURL(/scheme=MUDRA/);
  });

  test('a sector chip and the quick-action tiles open their places', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /^Manufacturing$/ }).click();
    await expect(page).toHaveURL(/q=Manufacturing/);
    for (const [label, path] of [[/^Start with a guide/, '/individual-dpr/guide'], [/^Scheme Finder/, '/venture-match'], [/^My Projects/, '/projects']] as const) {
      await page.goto('/dashboard');
      await page.locator('section[aria-labelledby="quick-actions-title"]').getByRole('button', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test('View on a row opens that report', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('main ul button[aria-label^="View "]').first().click();
    await expect(page).toHaveURL(/\/dpr\/view\//);
  });
});
