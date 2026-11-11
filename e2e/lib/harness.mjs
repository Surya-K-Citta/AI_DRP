// Shared helpers for the browser end-to-end tests. Every test talks to the isolated QA stack (see ../qa-stack.sh), never to the dev server.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { QA, seed } from '../seed-qa.mjs';

export { QA };
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../package.json'));
const axeSource = fs.readFileSync(join(here, '../node_modules/axe-core/axe.min.js'), 'utf8');
import * as playwright from 'playwright';

/** Which browser engine and which screen the run uses: E2E_BROWSER=chromium|firefox|webkit, E2E_DEVICE=phone|tablet|laptop|desktop. */
export const BROWSER = process.env.E2E_BROWSER || 'chromium';
export const DEVICES = {
  phone: { width: 360, height: 740, touch: true },
  tablet: { width: 768, height: 1024, touch: true },
  laptop: { width: 1280, height: 800, touch: false },
  desktop: { width: 1440, height: 900, touch: false },
};
/** E2E_HEADED=1 shows the browser window; E2E_SLOWMO=300 slows each step (milliseconds). */
const HEADED = process.env.E2E_HEADED === '1';
const SLOWMO = Number(process.env.E2E_SLOWMO || 0);
export const DEVICE = process.env.E2E_DEVICE || 'desktop';
if (!DEVICES[DEVICE]) throw new Error(`E2E_DEVICE must be one of ${Object.keys(DEVICES).join(', ')}`);
if (!playwright[BROWSER]) throw new Error('E2E_BROWSER must be chromium, firefox or webkit');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const SCREENSHOT_DIR = join(here, '../artifacts');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

/** Fails fast (instead of hanging) when the QA stack is not running. */
export async function requireStack() {
  for (const url of [`${QA.api}/health`, QA.web]) {
    let ok = false;
    try { ok = (await fetch(url, { signal: AbortSignal.timeout(4000) })).ok; } catch { /* handled below */ }
    if (!ok) throw new Error(`QA stack is not running (${url}). Start it with: npm run stack:up (in e2e/)`);
  }
  await seed();
}

const LAUNCH_ARGS = BROWSER === 'chromium' ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-timer-throttling'] : [];

/**
 * Starts a headless browser (Playwright). If the browser dies on a busy machine, which would fail every later test with a
 * "closed" error (a test-environment failure, not an application one), the handle starts a fresh one.
 */
export async function launch() {
  let current = await playwright[BROWSER].launch({ headless: !HEADED, slowMo: SLOWMO, args: LAUNCH_ARGS });
  const alive = async () => {
    if (!current.isConnected()) current = await playwright[BROWSER].launch({ headless: !HEADED, slowMo: SLOWMO, args: LAUNCH_ARGS });
    return current;
  };
  return {
    createBrowserContext: async (options) => (await alive()).newContext(options),
    close: async () => { await current.close().catch(() => {}); },
  };
}

/** Playwright takes one argument in evaluate(); the tests pass several, so they are bundled and unpacked in the page. */
const runInPage = ([source, args]) => (0, eval)(`(${source})`)(...args);
function adaptPage(page, context) {
  const evaluate = page.evaluate.bind(page);
  page.evaluate = (fn, ...args) => (typeof fn === 'function' ? evaluate(runInPage, [fn.toString(), args]) : evaluate(fn));
  const evaluateHandle = page.evaluateHandle.bind(page);
  page.evaluateHandle = (fn, ...args) => evaluateHandle(runInPage, [fn.toString(), args]);
  const waitForFunction = page.waitForFunction.bind(page);
  page.waitForFunction = (fn, options, arg) => waitForFunction(runInPage, [fn.toString(), [arg]], options);
  page.evaluateOnNewDocument = (fn, ...args) => page.addInitScript(runInPage, [fn.toString(), args]);
  page.setViewport = ({ width, height }) => page.setViewportSize({ width, height });
  page.setCookie = (cookie) => context.addCookies([{ name: cookie.name, value: cookie.value, domain: new URL(cookie.url).hostname, path: cookie.path || '/' }]);
  page.select = (selector, ...values) => page.selectOption(selector, values);
  // Request interception, in the shape the tests use: setRequestInterception(true), then on('request', (r) => r.respond(...) | r.continue()).
  const handlers = [];
  let routed = false;
  const on = page.on.bind(page);
  page.setRequestInterception = async (enabled) => {
    if (!enabled || routed) return;
    routed = true;
    await context.route('**/*', async (route) => {
      const request = route.request();
      const wrapped = {
        url: () => request.url(),
        method: () => request.method(),
        postData: () => request.postData(),
        continue: () => route.continue(),
        respond: ({ status = 200, headers = {}, contentType, body = '' }) => route.fulfill({ status, headers: { ...headers, ...(contentType ? { 'content-type': contentType } : {}) }, body }),
      };
      if (!handlers.length) return route.continue();
      handlers.forEach((handler) => handler(wrapped));
    });
  };
  page.on = (event, handler) => (event === 'request' && routed ? (handlers.push(handler), page) : on(event, handler));
  return page;
}

export async function api(method, path, body, token) {
  const response = await fetch(QA.api + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await response.json(); } catch { /* empty body */ }
  return { status: response.status, body: json };
}

const sessions = new Map();
/** Real sign-in through the API; the result is reused across tests. */
export async function signIn(userKey) {
  // Access tokens last about 6 minutes, so a cached sign-in is reused for at most 2 minutes.
  const cached = sessions.get(userKey);
  if (cached && Date.now() - cached.at < 120000) return cached;
  const user = QA.users[userKey];
  // The refresh cookie the server sets is kept too: the page needs it to renew its session, exactly as after a real sign-in.
  const raw = await fetch(QA.api + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: QA.password }) });
  const login = { status: raw.status, body: await raw.json().catch(() => null) };
  if (login.status !== 200) throw new Error(`sign-in as ${userKey} failed: ${login.status} ${JSON.stringify(login.body)}`);
  const token = login.body.data.token;
  const cookie = (raw.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('dpr_refresh='));
  const profile = await api('GET', '/auth/profile', undefined, token);
  const result = { token, cookie: cookie ? cookie.slice('dpr_refresh='.length) : null, at: Date.now(), user: profile.body.data?.user || profile.body.data };
  sessions.set(userKey, result);
  return result;
}

/** Opens a page. With `as`, the browser starts already signed in as that QA user (same state the login screen would leave). */
export async function openPage(browser, { as, width = DEVICES[DEVICE].width, height = DEVICES[DEVICE].height, mode = 'form', storage = {} } = {}) {
  // Every page gets its own private browser context, so one test's sign-in can never leak into another's (local storage is per context).
  const touch = DEVICES[DEVICE].touch && BROWSER !== 'firefox';
  const context = await browser.createBrowserContext({ viewport: { width, height }, hasTouch: touch, locale: 'en-IN' });
  const page = adaptPage(await context.newPage(), context);
  const closePage = page.close.bind(page);
  page.close = async () => { await closePage().catch(() => {}); await context.close().catch(() => {}); };
  page.problems = [];
  page.on('pageerror', (error) => page.problems.push(`pageerror: ${error.message.slice(0, 200)}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|fonts\.g|Failed to load resource: net::ERR_(INTERNET|NAME|CONNECTION)|status of (401|403|404|429)/i.test(text)) return;
    page.problems.push(`console: ${text.slice(0, 200)}`);
  });
  const auth = as ? await signIn(as) : null;
  if (auth?.cookie) await page.setCookie({ name: 'dpr_refresh', value: auth.cookie, url: QA.api, path: '/api/auth' });
  await page.evaluateOnNewDocument(
    (state) => {
      if (state.auth) {
        localStorage.setItem('auth-storage', JSON.stringify({ state: { user: state.auth.user, token: state.auth.token, isAuthenticated: true }, version: 0 }));
        localStorage.setItem('token', state.auth.token);
      }
      localStorage.setItem('voice-input-notice-accepted', '1');
      localStorage.setItem('dpr-edit-mode', JSON.stringify({ state: { mode: state.mode }, version: 0 }));
      for (const [key, value] of Object.entries(state.storage)) localStorage.setItem(key, value);
    },
    { auth, mode, storage }
  );
  return page;
}

export async function go(page, path, settle = 1500) {
  await page.goto(QA.web + path, { waitUntil: 'load' });
  await page.bringToFront().catch(() => {}); // headless WebKit/Firefox otherwise leave the page without keyboard focus
  await sleep(settle);
}

/** Waits for a condition evaluated in the page (no fixed sleeps). */
export async function waitFor(page, fn, arg, timeout = 10000) {
  await page.waitForFunction(fn, { timeout, polling: 100 }, arg);
}

export async function clickText(page, selector, pattern, { exact = false } = {}) {
  const ok = await page.evaluate(
    (sel, source, flags) => {
      const re = new RegExp(source, flags);
      const el = [...document.querySelectorAll(sel)].find((node) => re.test(((node.getAttribute('aria-label') || '') + ' ' + node.textContent.trim()).trim()) && node.getClientRects().length > 0);
      if (!el) return false;
      el.click();
      return true;
    },
    selector,
    exact ? `^${pattern.source}$` : pattern.source,
    pattern.flags
  );
  if (!ok) throw new Error(`nothing to click: ${selector} matching ${pattern}`);
}

export async function typeInto(page, selector, text) {
  await page.waitForSelector(selector, { timeout: 8000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(selector, text, { delay: 5 });
}

export async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

export async function axeScan(page, { impacts = ['serious', 'critical'] } = {}) {
  // Let fade-in animations finish: a half-transparent label would be measured with a blended (too low) contrast.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity), { timeout: 5000, polling: 100 }).catch(() => {});
  await page.evaluate(axeSource);
  const found = await page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    // Purely decorative illustrations are hidden from assistive technology (aria-hidden); the animated mock-ups on the home page change
    // colour while they play, so contrast inside them is not judged (it would depend on which frame the scan lands on).
    const inDecoration = (node) => { try { return !!document.querySelector(node.target.join(' '))?.closest('[aria-hidden="true"]'); } catch { return false; } };
    return result.violations
      .map((v) => (v.id === 'color-contrast' ? { ...v, nodes: v.nodes.filter((node) => !inDecoration(node)) } : v))
      .filter((v) => v.nodes.length)
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target.join(' ').slice(0, 80) }));
  });
  return found.filter((v) => impacts.includes(v.impact));
}

export async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export async function shot(page, name) {
  await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
}

const mongoose = createRequire(join(here, '../../server/package.json'))('mongoose');
/** Reads the QA database directly (never the dev one) to check what the application really stored. */
export async function dbCount(collection, filter = {}) {
  if (!/qa/.test(QA.mongo)) throw new Error('QA database name must contain "qa"');
  if (mongoose.connection.readyState === 0) await mongoose.connect(QA.mongo);
  return mongoose.connection.db.collection(collection).countDocuments(filter);
}
export async function dbFind(collection, filter = {}, projection = {}) {
  if (mongoose.connection.readyState === 0) await mongoose.connect(QA.mongo);
  return mongoose.connection.db.collection(collection).find(filter, { projection }).toArray();
}
export async function dbClose() { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); }

export const unique = (tag) => `${tag}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
