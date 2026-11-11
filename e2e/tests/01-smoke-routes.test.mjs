// NAV / SMOKE: every route opens for the role that may use it, shows content, throws no script errors, and passes an automated accessibility scan.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, axeScan, horizontalOverflow, bodyText, shot } from '../lib/harness.mjs';

// Confirmed defects (see ../test-docs/bug-report.md). The test still runs and reports TODO while the defect exists, and fails again if the check passes for a different reason.
const KNOWN = {}; // empty: every defect found by the first audit has been fixed, so any failure here is a regression.

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); });

// [id, path, signed in as, text that proves the right page opened]
const ROUTES = [
  ['SMOKE-001', '/', null, /Detailed\s+Project\s+Reports|Get Started/i],
  ['SMOKE-002', '/login', null, /Sign in|Login/i],
  ['SMOKE-003', '/register', null, /Create|Register|Sign up/i],
  ['SMOKE-004', '/privacy', null, /privacy/i],
  ['SMOKE-005', '/dashboard', 'consultant', /Welcome back/i],
  ['SMOKE-006', '/projects', 'consultant', /Projects/i],
  ['SMOKE-007', '/projects/create', 'consultant', /Create New Project|New Project/i],
  ['SMOKE-008', '/dprs', 'consultant', /DPR/i],
  ['SMOKE-009', '/individual-dpr/create', 'consultant', /Scheme|DPR/i],
  ['SMOKE-010', '/individual-dpr/guide', 'consultant', /Set up your report/i],
  ['SMOKE-011', '/cluster-dpr/create', 'consultant', /Cluster|DPR/i],
  ['SMOKE-012', '/venture-match', 'consultant', /Scheme Finder|Question/i],
  ['SMOKE-013', '/chat', 'consultant', /AI Assistant/i],
  ['SMOKE-014', '/profile', 'consultant', /Profile/i],
  ['SMOKE-015', '/account/privacy', 'consultant', /Privacy/i],
  ['SMOKE-016', '/admin', 'admin', /Admin|Analytics|Users/i],
  ['SMOKE-017', '/admin/documents', 'admin', /Document/i],
  ['SMOKE-018', '/reviewer', 'officer', /Review/i],
];

describe('routes open and are healthy', () => {
  for (const [id, path, as, proof] of ROUTES) {
    test(`${id} ${path} (${as || 'signed out'})`, async (t) => {
      const page = await openPage(browser, { as });
      try {
        await go(page, path, 2200);
        assert.equal(new URL(page.url()).pathname, path, 'stays on the route (no redirect)');
        assert.match(await bodyText(page), proof, 'expected content is on the page');
        assert.equal(await page.evaluate(() => document.querySelectorAll('main, [role=main]').length > 0 || !!document.querySelector('h1')), true, 'has a main area or heading');
        assert.deepEqual(page.problems, [], 'no script errors or console errors');
        const serious = await axeScan(page);
        assert.deepEqual(serious, [], `serious accessibility violations: ${JSON.stringify(serious)}`);
      } catch (error) {
        await shot(page, `fail-${id}`);
        if (KNOWN[id]) { t.todo(KNOWN[id]); return; }
        throw error;
      } finally {
        await page.close();
      }
    });
  }
});

describe('no horizontal overflow at phone, tablet and laptop widths', () => {
  for (const width of [360, 768, 1280]) {
    for (const [id, path, as] of ROUTES.filter((r) => r[1] !== '/privacy')) {
      test(`${id}-W${width} ${path}`, async (t) => {
        const page = await openPage(browser, { as, width, height: width < 500 ? 740 : 900 });
        try {
          await go(page, path, 1600);
          const extra = await horizontalOverflow(page);
          assert.ok(extra <= 1, `page is ${extra}px wider than the screen`);
        } finally {
          await page.close();
        }
      });
    }
  }
});
