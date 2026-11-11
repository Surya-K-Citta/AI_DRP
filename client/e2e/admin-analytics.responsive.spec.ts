// The admin Analytics tab: numbers equal the stored records, filters change every part, charts click through, export, recent
// activity and access. Runs at every screen size.
import { api, expect, horizontalOverflow, login, test, USERS } from './fixtures';

const kpi = async (page: any, label: string) => {
  const text = await page.locator('section[aria-label="Summary"] button').filter({ hasText: new RegExp(`^${label}`) }).innerText();
  return Number(text.trim().split('\n')[1]);
};
const overview = async (query = '') => (await api('GET', `/admin/analytics/overview${query}`, undefined, (await login(USERS.admin)).token)).body.data;

test.describe('numbers and filters', () => {
  test.use({ role: 'admin' });
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('section[aria-label="Summary"]')).toBeVisible();
  });

  test('the four summary cards equal the stored users, projects and DPRs', async ({ page }) => {
    const data = await overview();
    expect(await kpi(page, 'Total Users')).toBe(data.kpis.users.total);
    expect(await kpi(page, 'Total Projects')).toBe(data.kpis.projects.total);
    expect(await kpi(page, 'DPRs Generated')).toBe(data.kpis.dprs.total);
    expect(await kpi(page, 'Completed DPRs')).toBe(data.kpis.dprs.completed);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('choosing a district updates the cards and the filter line, and Reset Filters puts everything back', async ({ page }) => {
    await expect.poll(() => kpi(page, 'Total Projects')).not.toBeNaN(); // wait for the numbers to load
    const total = await kpi(page, 'Total Projects');
    await page.locator('select[aria-label="District"]').selectOption('Guntur');
    await expect(page.getByTestId('applied-filters')).toContainText('Guntur');
    const expected = (await overview('?district=Guntur')).kpis.projects.total;
    await expect.poll(() => kpi(page, 'Total Projects')).toBe(expected);
    expect(expected).toBeLessThan(total);
    await page.getByRole('button', { name: /^Reset Filters/ }).click();
    await expect.poll(() => kpi(page, 'Total Projects')).toBe(total);
  });

  test('a custom date range with no records shows a clear empty state', async ({ page }) => {
    await page.getByLabel('Date range').selectOption('custom');
    await page.getByLabel('Start date').fill('2000-01-01');
    await page.getByLabel('End date').fill('2000-01-31');
    await expect(page.locator('body')).toContainText('No records match these filters');
    await page.getByRole('button', { name: /^Reset Filters/ }).first().click();
    await expect(page.locator('section[aria-label="Summary"]')).toBeVisible();
  });

  test('pressing a sector in the legend filters the whole page to that sector', async ({ page }) => {
    const button = page.locator('section[aria-labelledby=chart-sector] ul button:not([disabled])').first();
    const name = (await button.locator('span.flex-1').textContent())!.trim();
    await button.click();
    await expect(page.getByTestId('applied-filters')).toContainText(name);
    const expected = (await overview(`?sector=${encodeURIComponent(name)}`)).kpis.projects.total;
    await expect.poll(() => kpi(page, 'Total Projects')).toBe(expected);
  });

  test('pressing a DPR status opens DPR Management on that status', async ({ page }) => {
    await page.locator('section[aria-labelledby=chart-status] ul button').filter({ hasText: /^Draft/ }).click();
    await expect(page.locator('select').filter({ has: page.locator('option[value="draft"]') }).first()).toHaveValue('draft');
  });

  test('Export Report downloads a spreadsheet of what is on screen, including the filters', async ({ page }) => {
    await page.locator('select[aria-label="District"]').selectOption('Guntur');
    await expect(page.getByTestId('applied-filters')).toContainText('Guntur');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Export Report/ }).click()]);
    expect(download.suggestedFilename()).toMatch(/^admin-analytics-\d{4}-\d{2}-\d{2}\.csv$/);
    const { readFile } = await import('node:fs/promises');
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toMatch(/Filters,.*Guntur/);
    expect(csv).toMatch(/Total projects,\d+/);
    expect(csv).toMatch(/DPR status/);
  });

  test('Recent Activity lists real events, newest first, and View opens the DPR', async ({ page }) => {
    const rows = page.locator('section[aria-labelledby=recent-activity] tbody tr');
    await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(5);
    const events = (await overview('?activityLimit=5')).activity;
    for (let i = 1; i < events.length; i++) expect(new Date(events[i - 1].at).getTime()).toBeGreaterThanOrEqual(new Date(events[i].at).getTime());
    await page.locator('section[aria-labelledby=recent-activity] tbody button[aria-label*="DPR"]').first().click();
    await expect(page).toHaveURL(/\/dpr\/view\//);
  });

  test('hovering a slice of the sector donut shows its popup', async ({ page, hasTouch }) => {
    test.skip(!!hasTouch, 'hover popups are for a mouse');
    const box = (await page.locator('section[aria-labelledby=chart-sector] .recharts-wrapper').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 - 59, box.y + box.height / 2 + 2); // on the ring, left of the middle
    await expect(page.locator('section[aria-labelledby=chart-sector] .recharts-tooltip-wrapper')).toBeVisible();
  });
});

test('only an administrator can read the overview', async () => {
  const me = await login(USERS.consultant);
  expect((await api('GET', '/admin/analytics/overview', undefined, me.token)).status).toBe(403);
  expect((await api('GET', '/admin/analytics/overview')).status).toBe(401);
  const admin = await login(USERS.admin);
  expect((await api('GET', '/admin/analytics/overview?district=%24ne&sector=%7B%22%24gt%22%3A%22%22%7D', undefined, admin.token)).status, 'odd filter text is plain text, not a query').toBe(200);
});
