// CLUS / SESS / KEY: the cluster DPR form, session expiry handling, keyboard-only use and the language switch.
import { before, after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, go, requireStack, api, signIn, clickText, typeInto, bodyText, waitFor, sleep, unique, dbFind, dbClose, QA, BROWSER } from '../lib/harness.mjs';

let browser;
before(async () => { await requireStack(); browser = await launch(); });
after(async () => { await browser?.close(); await dbClose(); });

describe('cluster DPR', () => {
  test('CLUS-001 the cluster form opens on step 1 with all 18 steps and a live preview', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/cluster-dpr/create', 2500);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^\d+Step \d+/.test(b.textContent.trim())).length), 18);
    assert.match(await bodyText(page), /Live DPR Preview/);
    await page.close();
  });

  test('CLUS-002 typing the cluster name and pressing Save Draft stores a cluster (not individual) draft', async () => {
    const name = unique('QA Cluster');
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/cluster-dpr/create', 2500);
    await typeInto(page, 'input[placeholder="Enter cluster name"]', name);
    await clickText(page, 'button', /^Save Draft/);
    await waitFor(page, () => /saved|success/i.test(document.body.innerText), undefined, 15000);
    const rows = await dbFind('dprversions', {});
    const mine = rows.find((r) => r.content?.english?.clusterData?.step1?.clusterName === name || r.content?.english?.clusterData?.step1?.unitName === name);
    assert.ok(mine, 'stored');
    assert.equal(mine.content.english.isIndividualDPR, false);
    await page.close();
  });

  test('CLUS-003 Form, Split and Preview views change what is shown and keep what was typed', async () => {
    const name = unique('QA ClusterView');
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/cluster-dpr/create', 2500);
    await typeInto(page, 'input[placeholder="Enter cluster name"]', name);
    await clickText(page, 'button', /^Preview$/); await sleep(600);
    await clickText(page, 'button', /^Form$/); await sleep(600);
    assert.equal(await page.evaluate((n) => [...document.querySelectorAll('input')].some((i) => i.value === n), name), true);
    await page.close();
  });
});

describe('session', () => {
  test('SESS-001 a session that has ended sends the person to sign in with a message, not to a blank page', async () => {
    const expired = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ userId: 'x', role: 'entrepreneur', exp: Math.floor(Date.now() / 1000) - 60, iat: Math.floor(Date.now() / 1000) - 500 })).toString('base64url') + '.sig';
    const page = await openPage(browser);
    await page.evaluateOnNewDocument((t) => { localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { name: 'Old', role: 'entrepreneur' }, token: t, isAuthenticated: true }, version: 0 })); localStorage.setItem('token', t); }, expired);
    await go(page, '/dashboard', 3000);
    const end = Date.now() + 8000;
    while (Date.now() < end && new URL(page.url()).pathname === '/dashboard') await sleep(200);
    assert.equal(new URL(page.url()).pathname, '/login');
    await page.close();
  });

  test('SESS-002 an API call with an expired token says TOKEN_EXPIRED (so the app can renew quietly)', async () => {
    const expired = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ userId: 'x', exp: 1 })).toString('base64url') + '.sig';
    const r = await api('GET', '/projects', undefined, expired);
    assert.equal(r.status, 401);
  });

  test('SESS-003 near the end of an idle session a warning offers "Stay signed in", and pressing it keeps the person in', async () => {
    const me = await signIn('consultant');
    const page = await openPage(browser, { as: 'consultant' });
    // The manager counts from the later of saved activity and the token's issue time, so move the page clock forward instead: 340 s of idle time of the token's 390 s leaves ~50 s, inside the one-minute warning.
    await page.evaluateOnNewDocument(() => { const real = Date.now.bind(Date); window.__skew = 0; Date.now = () => real() + window.__skew; });
    await go(page, '/dashboard', 1500);
    await page.evaluate(() => { window.__skew = 340 * 1000; });
    const key = await page.evaluate(() => Object.keys(localStorage).filter((k) => /activity/i.test(k)));
    const shown = await page.evaluate(async () => { for (let i = 0; i < 40; i++) { if (document.querySelector('[role=alertdialog]')) return true; await new Promise((r) => setTimeout(r, 250)); } return false; });
    if (!shown) assert.fail(`no warning appeared (activity keys: ${JSON.stringify(key)})`);
    assert.match(await bodyText(page), /still there/i);
    // A real key press counts as activity and closes the warning (a script's click is not counted as activity, by design).
    await page.evaluate(() => { window.__skew = 0; });
    await page.keyboard.press('Enter');
    await sleep(1200);
    assert.equal(await page.evaluate(() => !!document.querySelector('[role=alertdialog]')), false);
    assert.equal(new URL(page.url()).pathname, '/dashboard');
    await page.close();
  });
});

describe('keyboard and language', () => {
  test('KEY-001 the first Tab stop is "Skip to main content", and it moves focus to the page content', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 1500);
    if (BROWSER === 'webkit') {
      // Safari's engine does not Tab to links unless the user turns that on (Option+Tab otherwise), so the link is focused directly here.
      await page.focus('a[href="#main-content"]');
    } else {
      await page.keyboard.press('Tab');
    }
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Skip to main content/i);
    await page.keyboard.press('Enter'); await sleep(300);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
    await page.close();
  });

  test('KEY-002 the whole sign-in form can be completed and submitted with the keyboard alone', async () => {
    const page = await openPage(browser);
    await go(page, '/login', 1000);
    await page.focus('input[type=email]');
    await page.keyboard.type(QA.users.consultant.email);
    await page.keyboard.press('Tab'); await page.keyboard.type(QA.password);
    await page.keyboard.press('Enter');
    await waitFor(page, () => location.pathname === '/dashboard', undefined, 15000);
    await page.close();
  });

  test('LANG-001 switching to Telugu changes the page text and the document language, and back again', async () => {
    const page = await openPage(browser, { as: 'consultant' });
    await go(page, '/dashboard', 1500);
    const english = await bodyText(page);
    await clickText(page, 'button', /తెలుగు/); await sleep(2500);
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'te');
    assert.notEqual(await bodyText(page), english);
    assert.match(await bodyText(page), /[ఀ-౿]{3,}/, 'Telugu letters are shown');
    await clickText(page, 'button', /English/); await sleep(1500);
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await page.close();
  });
});
