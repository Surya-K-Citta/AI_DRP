// ADMA: the admin Analytics tab: numbers equal the stored records, filters change every part, charts click through, export, recent activity, access.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, clickText, bodyText, waitFor, sleep, dbCount, dbFind, dbClose, horizontalOverflow } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

const kpi = (page, label) => page.evaluate((l) => {
  const button = [...document.querySelectorAll('section[aria-label="Summary"] button')].find((b) => b.innerText.trim().startsWith(l));
  return button ? Number(button.innerText.trim().split('\n')[1]) : NaN;
}, label);
const openAnalytics = async () => {
  const page = await openPage(browser, { as: 'admin' });
  await go(page, '/admin', 2500);
  await waitFor(page, () => !!document.querySelector('section[aria-label="Summary"]'), undefined, 15000);
  return page;
};

describe('analytics numbers and filters', () => {
  test('ADMA-001 the four summary cards equal the stored users, projects and DPRs', async () => {
    const page = await openAnalytics();
    assert.equal(await kpi(page, 'Total Users'), await dbCount('users'));
    assert.equal(await kpi(page, 'Total Projects'), await dbCount('projects'));
    assert.equal(await kpi(page, 'DPRs Generated'), await dbCount('dprversions'));
    const completed = await dbCount('dprversions', { status: 'approved' });
    assert.equal(await kpi(page, 'Completed DPRs'), completed);
    assert.equal(await horizontalOverflow(page) <= 1, true);
    await page.close();
  });

  test('ADMA-002 choosing a district updates the cards and the filter line, and Reset Filters puts everything back', async () => {
    const page = await openAnalytics();
    const total = await kpi(page, 'Total Projects');
    await page.selectOption('select[aria-label="District"]', 'Guntur');
    await waitFor(page, (t) => document.querySelector('[data-testid=applied-filters]').textContent.includes('Guntur'), total);
    await sleep(800);
    const guntur = await kpi(page, 'Total Projects');
    assert.equal(guntur, (await dbFind('projects', { district: 'Guntur' }, { _id: 1 })).length, 'matches the projects stored for that district');
    assert.ok(guntur < total);
    assert.match(await bodyText(page), /Reset Filters/);
    await clickText(page, 'main button', /^Reset Filters/);
    await sleep(900);
    assert.equal(await kpi(page, 'Total Projects'), total);
    await page.close();
  });

  test('ADMA-003 a custom date range with no records shows a clear empty state', async () => {
    const page = await openAnalytics();
    await page.selectOption('select[aria-label="Date range"]', 'custom');
    await page.fill('input[aria-label="Start date"]', '2000-01-01');
    await page.fill('input[aria-label="End date"]', '2000-01-31');
    await waitFor(page, () => /No records match these filters/.test(document.body.innerText), undefined, 10000);
    await clickText(page, 'main button', /^Reset Filters/);
    await waitFor(page, () => !!document.querySelector('section[aria-label="Summary"]'));
    await page.close();
  });

  test('ADMA-004 pressing a sector in the legend filters the whole page to that sector', async () => {
    const page = await openAnalytics();
    const name = await page.evaluate(() => document.querySelector('section[aria-labelledby=chart-sector] ul button:not([disabled]) span.flex-1').textContent.trim());
    await page.evaluate(() => document.querySelector('section[aria-labelledby=chart-sector] ul button:not([disabled])').click());
    await waitFor(page, (n) => document.querySelector('[data-testid=applied-filters]').textContent.includes(n), name);
    await sleep(900);
    const shown = await kpi(page, 'Total Projects');
    const stored = await dbCount('projects', { industrySector: name });
    assert.equal(shown, stored, `projects in "${name}"`);
    await page.close();
  });

  test('ADMA-005 pressing a DPR status opens DPR Management on that status', async () => {
    const page = await openAnalytics();
    await page.evaluate(() => [...document.querySelectorAll('section[aria-labelledby=chart-status] ul button')].find((b) => b.innerText.startsWith('Draft')).click());
    await waitFor(page, () => [...document.querySelectorAll('select')].some((s) => s.value === 'draft'), undefined, 10000);
    assert.match(await bodyText(page), /DPR Management|All Status/);
    await page.close();
  });
});

describe('analytics export, activity and access', () => {
  test('ADMA-006 Export Report downloads a spreadsheet of what is on screen, including the filters', async () => {
    const page = await openAnalytics();
    await page.selectOption('select[aria-label="District"]', 'Guntur');
    await sleep(1200);
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), clickText(page, 'main button', /^Export Report/)]);
    assert.match(download.suggestedFilename(), /^admin-analytics-\d{4}-\d{2}-\d{2}\.csv$/);
    const { readFile } = await import('node:fs/promises');
    const csv = await readFile(await download.path(), 'utf8');
    assert.match(csv, /Filters,.*Guntur/);
    assert.match(csv, /Total projects,\d+/);
    assert.match(csv, /DPR status/);
    await page.close();
  });

  test('ADMA-007 Recent Activity lists real events, newest first, and View opens the DPR', async () => {
    const page = await openAnalytics();
    const rows = await page.evaluate(() => [...document.querySelectorAll('section[aria-labelledby=recent-activity] tbody tr')].map((tr) => ({ text: tr.innerText.replace(/\s+/g, ' ').trim(), view: !!tr.querySelector('button') })));
    assert.ok(rows.length >= 5, `${rows.length} rows`);
    const api5 = (await api('GET', '/admin/analytics/overview?activityLimit=5', undefined, (await signIn('admin')).token)).body.data.activity;
    for (let i = 1; i < api5.length; i++) assert.ok(new Date(api5[i - 1].at) >= new Date(api5[i].at), 'newest first');
    await page.evaluate(() => document.querySelector('section[aria-labelledby=recent-activity] tbody button[aria-label*="DPR"]')?.click());
    await waitFor(page, () => location.pathname.startsWith('/dpr/view/'), undefined, 10000);
    await page.close();
  });

  test('ADMA-008 only an administrator can read the overview', async () => {
    const me = await signIn('consultant');
    assert.equal((await api('GET', '/admin/analytics/overview', undefined, me.token)).status, 403);
    assert.equal((await api('GET', '/admin/analytics/overview')).status, 401);
    const admin = await signIn('admin');
    const ok = await api('GET', '/admin/analytics/overview?district=%24ne&sector=%7B%22%24gt%22%3A%22%22%7D', undefined, admin.token);
    assert.equal(ok.status, 200, 'odd filter text is treated as plain text, not as a query');
  });
});
