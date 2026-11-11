// Every screen opens for the person who may use it, shows its content, throws no script errors, passes an automated accessibility
// scan and does not scroll sideways. Runs at every screen size (desktop, laptop, tablet, phone).
import { expect, horizontalOverflow, seriousA11y, test, watchProblems, type Role } from './fixtures';

// [path, who, text that proves the right page opened]
const ROUTES: Array<[string, Role | null, RegExp]> = [
  ['/', null, /Detailed\s+Project\s+Reports|Get Started/i],
  ['/login', null, /Sign in|Login/i],
  ['/register', null, /Create|Register|Sign up/i],
  ['/privacy', null, /privacy/i],
  ['/dashboard', 'consultant', /Welcome back/i],
  ['/projects', 'consultant', /Projects/i],
  ['/projects/create', 'consultant', /Create New Project|New Project/i],
  ['/dprs', 'consultant', /DPR/i],
  ['/individual-dpr/create', 'consultant', /Scheme|DPR/i],
  ['/individual-dpr/guide', 'consultant', /Set up your report/i],
  ['/cluster-dpr/create', 'consultant', /Cluster|DPR/i],
  ['/venture-match', 'consultant', /Scheme Finder|Question/i],
  ['/chat', 'consultant', /AI Assistant/i],
  ['/profile', 'consultant', /Profile/i],
  ['/account/privacy', 'consultant', /Privacy/i],
  ['/admin', 'admin', /Admin|Analytics|Users/i],
  ['/admin/documents', 'admin', /Document/i],
  ['/reviewer', 'officer', /Review/i],
];

for (const who of [null, 'consultant', 'admin', 'officer'] as const) {
  test.describe(`screens for ${who ?? 'a signed-out visitor'}`, () => {
    test.use({ role: who });
    for (const [path, owner, proof] of ROUTES.filter((route) => route[1] === who)) {
      test(`${path} opens, is accessible and fits the screen`, async ({ page }) => {
        const problems = watchProblems(page);
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path}(\\?.*)?$`));
        await expect(page.locator('body')).toContainText(proof);
        await expect(page.locator('main, [role=main], h1').first()).toBeVisible();
        await page.waitForTimeout(1200);
        expect(problems, 'no script or console errors').toEqual([]);
        expect(await seriousA11y(page), 'no serious accessibility problems').toEqual([]);
        expect(await horizontalOverflow(page), 'no sideways scrolling').toBeLessThanOrEqual(1);
        void owner;
      });
    }
  });
}
