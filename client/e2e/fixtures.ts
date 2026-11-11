import { test as base, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export { expect };
export const API = process.env.E2E_API_URL || 'http://localhost:5055/api';
export const PASSWORD = process.env.E2E_PASSWORD || 'Qa-Test-2026!';
export const USERS = {
  consultant: process.env.E2E_EMAIL || 'qa.consultant@msme.test',
  consultant2: 'qa.consultant2@msme.test',
  admin: process.env.E2E_ADMIN_EMAIL || 'qa.admin@msme.test',
  officer: 'qa.officer@msme.test',
} as const;
export type Role = keyof typeof USERS;

export interface Session {
  token: string;
  cookie: string | null;
  user: any;
}

const sessions = new Map<string, { at: number; value: Session }>();

/** Real sign-in through the API (the same call the login screen makes). Reused for two minutes; access tokens last about six. */
export async function login(email: string, password = PASSWORD): Promise<Session> {
  const hit = sessions.get(email);
  if (hit && Date.now() - hit.at < 120_000) return hit.value;
  const raw = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const body: any = await raw.json().catch(() => null);
  if (raw.status !== 200) throw new Error(`sign-in as ${email} failed: ${raw.status} ${JSON.stringify(body)}`);
  const cookie = (raw.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('dpr_refresh='));
  const profile = await api('GET', '/auth/profile', undefined, body.data.token);
  const value = { token: body.data.token, cookie: cookie ? cookie.slice('dpr_refresh='.length) : null, user: profile.body?.data?.user || profile.body?.data };
  sessions.set(email, { at: Date.now(), value });
  return value;
}

export async function api(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await response.json();
  } catch {
    /* empty body */
  }
  return { status: response.status, body: json };
}

export const unique = (tag: string) => `${tag}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** A brand-new person (so numbers such as "2 drafts" are exact). */
export async function newPerson(tag = 'person') {
  const email = `${unique(tag)}@msme.test`;
  const made = await api('POST', '/auth/register', { name: `QA ${tag}`, email, password: PASSWORD, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
  if (made.status !== 201) throw new Error(`register failed: ${made.status} ${JSON.stringify(made.body)}`);
  const session = await login(email);
  return { email, ...session };
}

/** Saves an individual-DPR draft through the API. */
export const draftBody = (unitName: string, extra: Record<string, unknown> = {}) => ({
  clusterData: { step1: { unitName, location: 'Guntur', district: 'Guntur' }, isIndividualDPR: true, ...extra },
});

/** Makes the browser start already signed in as this session (the state the login screen leaves behind). */
export async function startSignedIn(page: Page, session: Session, mode: 'form' | 'document' = 'form') {
  const context = page.context();
  if (session.cookie) await context.addCookies([{ name: 'dpr_refresh', value: session.cookie, domain: 'localhost', path: '/api/auth' }]);
  await context.addInitScript(
    (state) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: state.user, token: state.token, isAuthenticated: true }, version: 0 }));
      localStorage.setItem('token', state.token);
      localStorage.setItem('voice-input-notice-accepted', '1');
      localStorage.setItem('dpr-edit-mode', JSON.stringify({ state: { mode: state.mode }, version: 0 }));
      localStorage.setItem('i18nextLng', 'en');
    },
    { user: session.user, token: session.token, mode }
  );
}

const require = createRequire(import.meta.url);
let axeSource = '';
/** Automatic accessibility check (axe-core). Contrast inside decorative aria-hidden pictures is not judged. */
export async function seriousA11y(page: Page) {
  axeSource ||= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity), undefined, { timeout: 5000 }).catch(() => undefined);
  await page.evaluate(axeSource);
  return page.evaluate(async () => {
    const result = await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    const inDecoration = (node: any) => {
      try {
        return !!document.querySelector(node.target.join(' '))?.closest('[aria-hidden="true"]');
      } catch {
        return false;
      }
    };
    return result.violations
      .map((v: any) => (v.id === 'color-contrast' ? { ...v, nodes: v.nodes.filter((n: any) => !inDecoration(n)) } : v))
      .filter((v: any) => v.nodes.length && ['serious', 'critical'].includes(v.impact))
      .map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0].target.join(' ').slice(0, 80) }));
  });
}

export const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Collects script and console errors on a page, ignoring the harmless ones (icons, fonts, expected 401/403/404/429 answers). */
export function watchProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message.slice(0, 200)}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|fonts\.g|Failed to load resource: net::ERR_(INTERNET|NAME|CONNECTION)|status of (401|403|404|429)/i.test(text)) return;
    problems.push(`console: ${text.slice(0, 200)}`);
  });
  return problems;
}

export const test = base.extend<{ role: Role | null; me: Session | null; editMode: 'form' | 'document' }>({
  /** `test.use({ role: 'consultant' })` starts every test of that describe block signed in as that QA person. */
  role: [null, { option: true }],
  editMode: ['form', { option: true }],
  me: async ({ role }, use) => {
    await use(role ? await login(USERS[role]) : null);
  },
  page: async ({ page, me, editMode }, use) => {
    if (me) await startSignedIn(page, me, editMode);
    await use(page);
  },
});
