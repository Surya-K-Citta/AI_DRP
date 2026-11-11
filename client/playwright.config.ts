import { defineConfig, devices } from '@playwright/test';

/**
 * UI tests for the whole application. They run against the isolated QA stack (API :5055, database msme-dpr-qa, web :5199),
 * never your dev server: start it with `cd e2e && npm run stack:up` (from the repository root's e2e folder).
 *
 *   npx playwright test --ui                      everything, in Playwright's UI mode
 *   npx playwright test --project=phone           one screen size
 *   E2E_WEBKIT=1 npx playwright test              also Safari's engine (needs: npx playwright install webkit)
 *
 * `desktop` runs every spec. The other sizes run the specs named *.responsive.spec.ts (layout, accessibility and the main pages).
 */
const RESPONSIVE = /\.responsive\.spec\.ts$/;
const webkit = process.env.E2E_WEBKIT === '1';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5199',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'laptop', testMatch: RESPONSIVE, use: { viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', testMatch: RESPONSIVE, use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'phone', testMatch: RESPONSIVE, use: { viewport: { width: 360, height: 740 }, hasTouch: true } },
    ...(webkit
      ? [
          { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
          { name: 'webkit-phone', testMatch: RESPONSIVE, use: { ...devices['Desktop Safari'], viewport: { width: 360, height: 740 }, hasTouch: true } },
        ]
      : []),
  ],
});
