// Sign-in, sign-up, protected pages, who may open what, sign-out. Real screens against the QA API.
import { api, expect, login, PASSWORD, test, unique, USERS, type Role } from './fixtures';

const uiLogin = async (page: any, email: string, password: string) => {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.keyboard.press('Enter');
};

test.describe('sign in', () => {
  test('a wrong password shows an error and stays on the sign-in page', async ({ page }) => {
    await uiLogin(page, USERS.consultant, 'definitely-wrong');
    await expect(page.locator('body')).toContainText(/invalid|incorrect|failed|error|wrong/i);
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => !!localStorage.getItem('token'))).toBe(false);
  });

  test('the right password opens the dashboard for that person', async ({ page }) => {
    await uiLogin(page, USERS.consultant, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Welcome back, QA Consultant/ })).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage') || '{}').state);
    expect(stored.isAuthenticated).toBe(true);
    expect(stored.user.email).toBe(USERS.consultant);
  });

  test('a signed-out visitor is sent away from every protected page', async ({ page }) => {
    for (const path of ['/dashboard', '/projects', '/individual-dpr/create', '/profile', '/admin', '/reviewer', '/chat']) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/(login)?$/);
    }
  });

  test('an email address is checked before the form can be sent', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type=email]').fill('not-an-email');
    await page.locator('input[type=password]').fill('whatever1');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.locator('input[type=email]').evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  });

  test('the whole sign-in form can be completed with the keyboard alone', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type=email]').focus();
    await page.keyboard.type(USERS.consultant);
    await page.keyboard.press('Tab');
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('sign up', () => {
  test('a new person can register, lands signed in, and can sign in again', async ({ page }) => {
    const email = `${unique('qa.reg')}@msme.test`;
    await page.goto('/register');
    await page.locator('input[type=text]').first().fill('QA Registered Person');
    await page.locator('input[type=tel]').fill('9876501234');
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=password]').fill(PASSWORD);
    await page.locator('input[type=date]').fill('1991-05-05');
    // The privacy notice must be read to the end before the agreement box can be ticked (by design).
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('form *'))) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
      }
    });
    for (const box of await page.locator('form input[type=checkbox]').all()) await box.check();
    await page.locator('form button[type=submit]').click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    const again = await api('POST', '/auth/login', { email, password: PASSWORD });
    expect(again.status, 'the new account works').toBe(200);
    expect(again.body.data.role, 'a new account is never privileged').toBe('entrepreneur');
  });

  test('a phone number that is not ten digits is refused', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[type=tel]').fill('12345');
    await expect(page.locator('body')).toContainText(/10|digit|valid|phone/i);
  });

  test('a person under 18 is told about the guardian step', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[type=date]').fill(`${new Date().getFullYear() - 12}-01-01`);
    await expect(page.locator('body')).toContainText(/guardian|parent|under 18|below 18|minor/i);
  });

  test('the server refuses a weak password and a duplicate email, and never grants an admin role', async () => {
    const base = { phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true };
    const dup = await api('POST', '/auth/register', { name: 'Dup', email: USERS.consultant, password: PASSWORD, ...base });
    expect([400, 409]).toContain(dup.status);
    const weak = await api('POST', '/auth/register', { name: 'Weak', email: `${unique('weak')}@msme.test`, password: '1', ...base });
    expect(weak.status).toBeGreaterThanOrEqual(400);
    expect(weak.status).toBeLessThan(500);
    const sneaky = await api('POST', '/auth/register', { name: 'Sneaky', email: `${unique('sneaky')}@msme.test`, password: PASSWORD, ...base, role: 'admin' });
    expect(sneaky.status).toBe(201);
    expect(sneaky.body.data.role).toBe('entrepreneur');
  });
});

const MATRIX: Array<[Role, string, boolean]> = [
  ['consultant', '/admin', false], ['consultant', '/admin/documents', false], ['consultant', '/reviewer', false], ['consultant', '/dashboard', true],
  ['officer', '/admin', false], ['officer', '/reviewer', true], ['officer', '/dashboard', true],
  ['admin', '/admin', true], ['admin', '/reviewer', true], ['admin', '/admin/documents', true],
];
for (const who of ['consultant', 'officer', 'admin'] as const) {
  test.describe(`who may open what: ${who}`, () => {
    test.use({ role: who });
    for (const [, path, allowed] of MATRIX.filter((row) => row[0] === who)) {
      test(`${allowed ? 'can open' : 'is refused'} ${path}`, async ({ page }) => {
        await page.goto(path);
        if (allowed) {
          await expect(page).toHaveURL(new RegExp(`${path}$`));
          await expect(page.locator('body')).not.toContainText(/\b403\b|not allowed|forbidden|access denied/i);
        } else {
          // Refused = sent somewhere else, or shown a "not allowed" message in place.
          await expect
            .poll(async () => new URL(page.url()).pathname !== path || /\b403\b|not allowed|forbidden|don.t have permission|access denied|not authori[sz]ed/i.test(await page.locator('body').innerText()))
            .toBe(true);
        }
      });
    }
  });
}

test.describe('sign out and tokens', () => {
  test('signing out clears the browser session and closes protected pages', async ({ page }) => {
    await uiLogin(page, USERS.consultant, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('button', { name: /Logout|Sign out/i }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
    expect(await page.evaluate(() => !!localStorage.getItem('token'))).toBe(false);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('the API refuses a missing, malformed or forged token', async () => {
    expect((await api('GET', '/auth/profile')).status).toBe(401);
    expect((await api('GET', '/auth/profile', undefined, 'garbage')).status).toBe(401);
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ4Iiwicm9sZSI6ImFkbWluIn0.invalidsignature';
    expect((await api('GET', '/admin/users', undefined, forged)).status).toBe(401);
    void login;
  });
});
