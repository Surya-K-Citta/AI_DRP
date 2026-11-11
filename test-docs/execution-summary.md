# Final execution summary

Branch `feature/application_testcases`. Run on the isolated QA stack (API :5055, DB `msme-dpr-qa`). The audit itself changed no production code; the defects it found were then fixed on your instruction (list in `bug-report.md`, "What was changed"). The test code was ported from Puppeteer to Playwright.

## Browser engine and screen sizes
The browser suite now runs on **Playwright** (it was Puppeteer). `E2E_BROWSER` picks Chromium or WebKit (Safari's engine) and `E2E_DEVICE` picks phone 360, tablet 768, laptop 1280 or desktop 1440. The full matrix of 8 combinations was run: desktop, laptop and tablet were clean on both engines; phone found BUG-016 and BUG-017 (fixed) and a test-side issue (drag needs a tall window); after the fixes the phone smoke file is 69/69 on both engines. **Firefox could not be run**: Playwright's Firefox fails to start on this Mac (a graphics crash at launch, the same with every flag I tried), so Firefox is untested. WebKit does not Tab to links by default, so KEY-001 focuses the skip link directly on WebKit.

## Dashboard redesign and guided tour (added later)
New file `e2e/tests/10-dashboard.test.mjs` (DASH-001..021, TOUR-001..006). Only the new tour tests and DASH-011 were run after the last change (all pass on Chromium desktop); the full matrix has **not** been re-run since the redesign, so the totals below predate it.

## Playwright Test suite for UI mode (added later)
`client/e2e/*.spec.ts` ports every screen-level check (routes and accessibility, sign-in, projects, individual DPR, Scheme Finder, assistant/profile/privacy, admin console, reviewer queue, analytics, dashboard, guided tour, cluster form, session and keyboard) to `@playwright/test`, with desktop, laptop, tablet and phone projects, so `npx playwright test --ui` covers the application. First full run: 359 tests, 337 passed, 22 failed; most failures were test-side (ambiguous locators, a hover check on touch screens, a stale lookup) plus **one real defect** found at tablet size (BUG-018, fixed). Second full run: 354 passed, 2 skipped (hover popups are skipped on touch screens), 3 failed; two were test faults that were fixed and re-run green, and one was a leftover-file error from overlapping runs. A clean third full run has not been done. See the execution guide section 2b.

## Results (real runs)
| Suite | Pass | Fail | Known-bug (todo) |
|---|---|---|---|
| Browser e2e (`e2e/`, 10 files, each in its own process) — Chromium desktop, after the fixes | 176 | 0 | 0 |
| Same suite, WebKit desktop; Chromium and WebKit at laptop and tablet; both engines at phone after BUG-016/017 | 176 each (one Chromium laptop timeout passed on re-run; phone files re-run after the fixes) | 0 | 0 |
| Server unit/contract (`npm test`) | 106 | 0 | 0 |
| Server live: api 3, rbac 9, security 10, finance 4, support 4, admin 13, session 6, pdf 1, encryption 4 | 54 | 0 | 0 |

"Known-bug" means the check ran and failed because of a confirmed defect (see `bug-report.md`); it is reported as `todo`, not hidden. Per-test outcomes: `test-cases.md`.

## Defects: 17 found, 17 fixed (2 high)
Before the fixes the browser suite was 160 pass with 16 known-bug todos; after fixing, every todo became a pass (see `bug-report.md`, "What was changed").
High: BUG-009 (another user's project can be overwritten), BUG-001 (Mongo reconnect loop leaks connections; it took down MongoDB twice and hit the QA stack again during this audit). Medium: BUG-007, 008, 010, 011, 012, 013, 014, 015 and a11y items 004–006; Low: 002, 003. Details and fixes: `bug-report.md`.

## Test-side problems fixed (not app bugs)
SESS-003 clock approach; AUTH-02x matched "403" inside data; VM-002 clicked a `position: fixed` button that the helper treated as hidden; ADM-002 assumed the user was on page 1; browser crashes now restart Chrome automatically.

## Not covered / mocked
AI is stubbed in browser tests; not tested: AI-guided builder, document/RAG upload, images/annexures, APMSME, support-desk UI, accept-invite UI, All-DPRs filters, DOCX/XLS content, email delivery, Chromium + WebKit only (no Firefox), no load/performance, no manual screen-reader pass. So coverage is **not** 100%; see the inventory's gap list.

## Needs your decision
0. To watch tests in a window: `E2E_HEADED=1 E2E_SLOWMO=300 node --test tests/02-auth.test.mjs` (see the execution guide). Playwright UI mode is not available with the current runner.
1. Review the diff (`git diff`) and commit; nothing is committed yet.
2. Dev database: `node e2e/cleanup-dev-pollution.mjs --since 2026-10-22` is a dry run listing 17 throw-away `@msme.test` users (no projects/DPRs) written to the dev DB by my first run. Say the word and I run it with `--apply`.
3. Restart your own dev server (I stopped it while recovering MongoDB).
