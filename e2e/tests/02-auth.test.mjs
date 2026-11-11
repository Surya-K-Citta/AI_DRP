// AUTH: sign-in, sign-up, protected routes, role access, sign-out. Real UI against the QA API and database.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, QA, clickText, typeInto, bodyText, waitFor, sleep, shot, unique } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); });
const here = (page) => new URL(page.url()).pathname;
/** Waits until the address satisfies `ok` (the app redirects a moment after it loads); returns the final path either way. */
async function pathSettled(page, ok, timeout = 6000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (ok(here(page))) return here(page); await sleep(150); }
  return here(page);
}

async function uiLogin(page, email, password) {
  await go(page, '/login', 800);
  await typeInto(page, 'input[type=email]', email);
  await typeInto(page, 'input[type=password]', password);
  await page.keyboard.press('Enter');
}

describe('sign in', () => {
  test('AUTH-001 wrong password shows an error and stays on the sign-in page', async () => {
    const page = await openPage(browser);
    await uiLogin(page, QA.users.consultant.email, 'definitely-wrong');
    await sleep(1500);
    assert.equal(here(page), '/login');
    assert.equal(await page.evaluate(() => !!localStorage.getItem('token')), false, 'no token is stored');
    assert.match(await bodyText(page), /invalid|incorrect|failed|error|wrong/i, 'an error message is shown');
    await page.close();
  });

  test('AUTH-002 right password opens the dashboard for that person', async () => {
    const page = await openPage(browser);
    await uiLogin(page, QA.users.consultant.email, QA.password);
    await waitFor(page, () => location.pathname === '/dashboard');
    assert.match(await bodyText(page), /Welcome back, QA Consultant/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state);
    assert.equal(stored.isAuthenticated, true);
    assert.equal(stored.user.email, QA.users.consultant.email);
    await page.close();
  });

  test('AUTH-003 a signed-out visitor is sent away from every protected page', async () => {
    const page = await openPage(browser);
    for (const path of ['/dashboard', '/projects', '/individual-dpr/create', '/profile', '/admin', '/reviewer', '/chat']) {
      await go(page, path, 200);
      const landed = await pathSettled(page, (p) => ['/login', '/'].includes(p));
      assert.ok(['/login', '/'].includes(landed), `${path} → ${landed}`);
    }
    await page.close();
  });

  test('AUTH-004 email is checked before the form can be sent', async () => {
    const page = await openPage(browser);
    await go(page, '/login', 800);
    await typeInto(page, 'input[type=email]', 'not-an-email');
    await typeInto(page, 'input[type=password]', 'whatever1');
    await page.keyboard.press('Enter');
    await sleep(800);
    assert.equal(here(page), '/login');
    assert.equal(await page.evaluate(() => !document.querySelector('input[type=email]').checkValidity()), true, 'the browser reports the email as invalid');
    await page.close();
  });
});

describe('sign up', () => {
  test('AUTH-010 a new person can register, lands signed in, and can sign in again', async () => {
    const email = `${unique('qa.reg')}@msme.test`;
    const page = await openPage(browser);
    await go(page, '/register', 1000);
    const inputs = await page.$$('form input:not([type=checkbox])');
    assert.ok(inputs.length >= 5, 'registration form has its fields');
    await typeInto(page, 'input[type=text]', 'QA Registered Person');
    await typeInto(page, 'input[type=tel]', '9876501234');
    await typeInto(page, 'input[type=email]', email);
    await typeInto(page, 'input[type=password]', QA.password);
    await page.evaluate(() => { const d = document.querySelector('input[type=date]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(d, '1991-05-05'); d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); });
    // The privacy notice must be read to the end before the agreement box can be ticked (by design).
    await page.evaluate(() => { for (const el of document.querySelectorAll('form *')) { const s = getComputedStyle(el); if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll', { bubbles: true })); } } });
    await sleep(500);
    for (const box of await page.$$('form input[type=checkbox]')) { if (!(await box.evaluate((el) => el.checked))) await box.click(); }
    await page.evaluate(() => document.querySelector('form button[type=submit]').click());
    await waitFor(page, () => location.pathname === '/dashboard', undefined, 15000).catch(async () => { await shot(page, 'fail-AUTH-010'); throw new Error(`still on ${here(page)}: ${(await bodyText(page)).slice(0, 300)}`); });
    const login = await api('POST', '/auth/login', { email, password: QA.password });
    assert.equal(login.status, 200, 'the new account works');
    assert.equal(login.body.data.role, 'entrepreneur', 'a new account is never privileged');
    await page.close();
  });

  test('AUTH-011 a phone number that is not ten digits is refused', async () => {
    const page = await openPage(browser);
    await go(page, '/register', 800);
    await typeInto(page, 'input[type=tel]', '12345');
    await sleep(300);
    assert.match(await bodyText(page), /10|digit|valid|phone/i);
    await page.close();
  });

  test('AUTH-012 the server refuses a weak password and a duplicate email', async () => {
    const dup = await api('POST', '/auth/register', { name: 'Dup', email: QA.users.consultant.email, password: QA.password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
    assert.ok([400, 409].includes(dup.status), `duplicate email → ${dup.status}`);
    const weak = await api('POST', '/auth/register', { name: 'Weak', email: `${unique('weak')}@msme.test`, password: '1', phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
    assert.ok(weak.status >= 400 && weak.status < 500, `weak password → ${weak.status}`);
  });

  test('AUTH-013 registering never gives an admin role, even when asked', async () => {
    const email = `${unique('sneaky')}@msme.test`;
    const made = await api('POST', '/auth/register', { name: 'Sneaky', email, password: QA.password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true, role: 'admin' });
    assert.equal(made.status, 201);
    assert.equal(made.body.data.role, 'entrepreneur');
  });

  test('AUTH-014 a person under 18 cannot register without a guardian step', async () => {
    const page = await openPage(browser);
    await go(page, '/register', 800);
    await page.evaluate(() => { const d = document.querySelector('input[type=date]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const y = new Date().getFullYear() - 12; set.call(d, `${y}-01-01`); d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(500);
    assert.match(await bodyText(page), /guardian|parent|under 18|below 18|minor/i);
    await page.close();
  });
});

describe('roles and sign-out', () => {
  const MATRIX = [
    // user, path, allowed?
    ['consultant', '/admin', false], ['consultant', '/admin/documents', false], ['consultant', '/reviewer', false], ['consultant', '/dashboard', true],
    ['officer', '/admin', false], ['officer', '/reviewer', true], ['officer', '/dashboard', true],
    ['admin', '/admin', true], ['admin', '/reviewer', true], ['admin', '/admin/documents', true],
  ];
  for (const [who, path, allowed] of MATRIX) {
    test(`AUTH-02x ${who} ${allowed ? 'can open' : 'is refused'} ${path}`, async () => {
      const page = await openPage(browser, { as: who });
      await go(page, path, 300);
      await pathSettled(page, (p) => p !== path, allowed ? 2500 : 4000);
      await sleep(500);
      const text = await bodyText(page);
      const forbidden = /\b403\b|not allowed|forbidden|don.t have permission|access denied|not authori[sz]ed/i.test(text);
      if (allowed) assert.ok(!forbidden && here(page) === path, `${who} should see ${path}`);
      else assert.ok(forbidden || here(page) !== path, `${who} must not see ${path}`);
      await page.close();
    });
  }

  test('AUTH-030 signing out clears the browser session and closes protected pages', async () => {
    const page = await openPage(browser, { width: 1440 });
    await uiLogin(page, QA.users.consultant.email, QA.password);
    await waitFor(page, () => location.pathname === '/dashboard');
    await sleep(800);
    await clickText(page, 'button', /Logout|Sign out/i);
    await sleep(1500);
    assert.ok(['/', '/login'].includes(here(page)), `after logout: ${here(page)}`);
    assert.equal(await page.evaluate(() => !!localStorage.getItem('token')), false);
    await go(page, '/dashboard', 200);
    assert.ok(['/', '/login'].includes(await pathSettled(page, (p) => p !== '/dashboard')));
    await page.close();
  });

  test('AUTH-031 the API refuses a missing, malformed or forged token', async () => {
    assert.equal((await api('GET', '/auth/profile')).status, 401);
    assert.equal((await api('GET', '/auth/profile', undefined, 'garbage')).status, 401);
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ4Iiwicm9sZSI6ImFkbWluIn0.invalidsignature';
    assert.equal((await api('GET', '/admin/users', undefined, forged)).status, 401);
  });
});
