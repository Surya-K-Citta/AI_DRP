// The guided tour: it starts from the dashboard, points an arrow at the real button to press, switches the rest of the page off,
// walks through creating a DPR with sample answers, can be left at any point and ends on the dashboard. Desktop layout.
import { expect, test, type Page } from './fixtures';

test.use({ role: 'consultant' });

const panel = (page: Page) => page.locator('[role=dialog][aria-labelledby=tour-title]');
const title = (page: Page) => page.locator('#tour-title');
const next = (page: Page) => panel(page).getByRole('button', { name: /^Next/ }).click();
const start = async (page: Page) => {
  await page.goto('/dashboard');
  await page.locator('[data-tour=journey]').getByRole('button', { name: /Take a Tour/ }).click();
  await expect(panel(page)).toBeVisible();
};
/** Presses the button the arrow points at. */
const pressTarget = (page: Page) => page.locator('[data-tour-active="click"]').click();

test('Take a Tour starts at the beginning, explains the page, then points an arrow at Create DPR', async ({ page }) => {
  await start(page);
  await expect(title(page)).toHaveText('Welcome to the tour');
  await next(page);
  await expect(title(page)).toHaveText('Your reports at a glance');
  await next(page);
  await expect(title(page)).toHaveText('Start a new DPR');
  await expect(page.locator('.tour-arrow')).toBeVisible();
  await expect(page.locator('[data-tour-active="click"]')).toHaveText('Create DPR');
  await expect(page.getByText(/click here/i).first()).toBeVisible();
});

test('only the tour panel and the one button to press respond; everything else is off', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: /View All DPRs/ }).first().click({ force: true });
  await page.mouse.click(10, 10);
  await expect(page).toHaveURL(/\/dashboard$/);
  await next(page);
  await next(page);
  await page.locator('[data-tour=actions]').getByRole('button', { name: /^Scheme Finder$/ }).click({ force: true });
  await expect(page).toHaveURL(/\/dashboard$/);
  await pressTarget(page);
  await expect(page).toHaveURL(/\/individual-dpr\/create/);
});

test('the explanation sits next to what it explains and never covers it', async ({ page }) => {
  await start(page);
  await page.waitForTimeout(900);
  const gap = await page.evaluate(() => {
    const p = document.querySelector('[role=dialog][aria-labelledby=tour-title]')!.getBoundingClientRect();
    const t = document.querySelector('[data-tour-active]')!.getBoundingClientRect();
    const overlaps = !(p.right < t.left || p.left > t.right || p.bottom < t.top || p.top > t.bottom);
    return { overlaps, distance: p.top >= t.bottom ? p.top - t.bottom : t.top >= p.bottom ? t.top - p.bottom : 0 };
  });
  expect(gap.overlaps).toBe(false);
  expect(gap.distance).toBeLessThanOrEqual(60);
});

test('Exit tour stops at any point and returns to the dashboard; the tour can start again', async ({ page }) => {
  await start(page);
  await next(page);
  await next(page);
  await pressTarget(page);
  await expect(page).toHaveURL(/\/individual-dpr\/create/);
  await panel(page).getByRole('button', { name: /^Exit tour/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('#tour-title')).toHaveCount(0);
  await expect(page.locator('.tour-arrow')).toHaveCount(0);
  await expect(page.locator('[data-tour-active]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#tour-title')).toHaveCount(0);
  await page.locator('[data-tour=journey]').getByRole('button', { name: /Take a Tour/ }).click();
  await expect(title(page)).toHaveText('Welcome to the tour');
});

test('the full walk-through: scheme, brief, form explained, sample answers, Save Draft, finished on the dashboard', async ({ page }) => {
  await start(page);
  await next(page);
  await next(page);
  await pressTarget(page);
  await expect(title(page)).toHaveText('Choose how you want to apply');
  await next(page);
  await expect(title(page)).toHaveText('Pick one to try');
  await pressTarget(page);
  await expect(title(page)).toHaveText('A short brief first');
  await next(page);
  await expect(title(page)).toHaveText('Start the steps');
  await pressTarget(page);
  await expect(title(page)).toHaveText('Your progress');
  await next(page);
  await expect(title(page)).toHaveText('Where you answer');
  await next(page);
  await expect(title(page)).toHaveText('Try it with sample answers');
  await panel(page).getByRole('button', { name: /Fill sample answers/ }).click();
  await expect(title(page)).toHaveText('The report writes itself');
  await expect(page.locator('#dpr-preview')).toContainText('Sri Annapurna');
  await next(page);
  await next(page);
  await next(page);
  await expect(title(page)).toHaveText('Save your work');
  await pressTarget(page);
  await expect(title(page)).toHaveText('Check my answers');
  await next(page);
  await expect(title(page)).toHaveText('Generate the DPR');
  await panel(page).getByRole('button', { name: /^Finish/ }).click();
  await expect(page.locator('#tour-title')).toHaveCount(0);
  await expect(page).toHaveURL(/\/dashboard$/);
});
