/**
 * Responsive audit: opens every main screen at phone, tablet and desktop widths in a real browser and reports
 * anything that spills past the screen edge. No server needed (the app falls back to sample data), so toasts
 * about failed requests are expected.
 *
 *   npm run dev            # in one terminal
 *   npm run audit:responsive                       # all screens, all widths
 *   npm run audit:responsive -- dashboard,finder-q 375,768   # some screens, save screenshots at those widths
 *
 * BROWSER_PATH points at a Chromium-based browser (default: installed Google Chrome). SHOTS_DIR sets where
 * screenshots go (default ./audit-shots). BASE_URL defaults to http://localhost:5173.
 */
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const SP = process.env.SHOTS_DIR || './audit-shots';
mkdirSync(`${SP}/shots`, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const VIEWPORTS = [[320, 640], [375, 667], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900]];
const only = process.argv[2] ? process.argv[2].split(',') : null;
const shotAt = process.argv[3] ? process.argv[3].split(',').map(Number) : [];

const user = { userId: 'u1', name: 'Test User', email: 't@t.test', role: 'super_admin',
  privacy: { needsNoticeAcceptance: false, accountConsent: true, aiAssist: true, analytics: false, noticeVersion: '2026-09-4' } };
const finderDone = JSON.stringify({ answers: { activity: 'mfg', stage: 'greenfield', supportType: 'loanOrSubsidy', sectorFlag: 'none', budget: '10to20L', legal: 'sole', owner: ['female','sc'], domicile: 'ap', location: 'urban', riceCard: 'yes', age: '21to50', education: '8thPlus', udyam: 'yes', priorSubsidy: 'none', govtFamily: 'no', market: 'offline' }, step: 15, done: true });

const ROUTES = [
  ['landing', '/', false], ['login', '/login', false], ['register', '/register', false], ['privacy', '/privacy', false],
  ['dashboard', '/dashboard', true], ['projects', '/projects', true], ['project-new', '/projects/create', true], ['dprs', '/dprs', true],
  ['finder-q', '/venture-match', true, 'q'], ['finder-results', '/venture-match', true, 'results'],
  ['dpr-pick', '/individual-dpr/create?new=true', true], ['dpr-brief', '/individual-dpr/create?new=true&scheme=PMEGP', true],
  ['dpr-form', '/individual-dpr/create?new=true&scheme=PMEGP', true, 'form'],
  ['cluster', '/cluster-dpr/create?new=true', true], ['chat', '/chat', true], ['profile', '/profile', true],
  ['account-privacy', '/account/privacy', true], ['admin', '/admin', true], ['admin-docs', '/admin/documents', true],
];

const browser = await chromium.launch(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH, headless: true } : { channel: 'chrome', headless: true });
const report = [];
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'en-US' });
  for (const [name, path, auth, mode] of ROUTES) {
    if (only && !only.includes(name)) continue;
    const page = await ctx.newPage();
    await page.addInitScript(([auth, user, finderDone, mode]) => {
      localStorage.setItem('i18nextLng', 'en');
      if (auth) {
        localStorage.setItem('token', 'test');
        localStorage.setItem('auth-storage', JSON.stringify({ state: { user, token: 'test', isAuthenticated: true }, version: 0 }));
      }
      if (mode === 'results') localStorage.setItem('venture-match-progress:u1', finderDone);
    }, [auth, user, finderDone, mode]);
    try {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1800);
      if (mode === 'form') {
        const start = page.getByRole('button', { name: /Start DPR steps/i });
        if (await start.count()) { await start.first().click(); await page.waitForTimeout(1500); }
      }
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const off = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.visibility === 'hidden') return;
          if (r.right > vw + 2 || r.left < -2) {
            // skip if inside an element that scrolls horizontally on purpose
            let p = el.parentElement, scroller = false;
            while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.getBoundingClientRect().right <= vw + 2) { scroller = true; break; } p = p.parentElement; }
            if (!scroller) off.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 3).join('.') : ''} [${Math.round(r.left)}..${Math.round(r.right)}]`);
          }
        });
        return { vw, sw, over: sw - vw, off: [...new Set(off)].slice(0, 6), title: document.title, text: document.body.innerText.slice(0, 60).replace(/\n/g, ' ') };
      });
      if (shotAt.includes(w)) await page.screenshot({ path: `${SP}/shots/${name}-${w}.png`, fullPage: false });
      report.push({ w, name, ...m });
    } catch (e) {
      report.push({ w, name, error: String(e.message).slice(0, 100) });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
const bad = report.filter((r) => r.error || r.over > 1 || (r.off && r.off.length));
console.log('checked', report.length, 'bad', bad.length);
process.exitCode = bad.length ? 1 : 0;
for (const r of bad) console.log(`${r.w}px ${r.name}: ${r.error || `overflow ${r.over}px`} ${r.off ? JSON.stringify(r.off) : ''}`);
