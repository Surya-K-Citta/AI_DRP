# How to run the tests

## Safety first
The tests create data. They must **only** run against the isolated QA stack (API on `:5055`, database `msme-dpr-qa`). Your normal dev server (`:5000`, database `msme-dpr`) is never touched by the stack script, and the script refuses a database name without "qa".

> The server live suites read `RBAC_API_BASE` and default to `http://localhost:5000/api` — **the dev server**. Always export the QA address first (below). A first run that skipped this wrote throw-away `@msme.test` users into the dev database.

Prerequisites: MongoDB running locally, Node 24, `npm install` done in `client/`, `server/` and `e2e/`, then `npm run browsers:install` in `e2e/` once (downloads Playwright's Chromium, WebKit and Firefox, about 300 MB).

## 1. Start the QA stack and seed accounts
```bash
cd e2e
npm run stack:up        # API :5055 + web :5199, then seeds the four QA accounts
# stop later with: npm run stack:down
```
QA accounts (password `Qa-Test-2026!`): `qa.consultant@msme.test`, `qa.consultant2@msme.test`, `qa.admin@msme.test`, `qa.officer@msme.test`.

If MongoDB drops while testing, the API can leak connections (BUG-001). Check `lsof -nP -iTCP:27017 | wc -l`; if it is in the thousands, stop the QA API (`pkill -f QA_STACK_API`), start it again and re-run.

## 2. Browser end-to-end tests (e2e/)
```bash
cd e2e
./run-all.sh            # each file in its own process; prints pass/fail/todo per file (results in /tmp/qa-e2e-results)
E2E_BROWSER=webkit E2E_DEVICE=phone ./run-all.sh /tmp/out   # pick the engine (chromium|webkit|firefox) and screen (phone 360 | tablet 768 | laptop 1280 | desktop 1440)
./run-matrix.sh         # every engine x every screen size (about an hour); results in /tmp/qa-matrix/<engine>-<screen>/
E2E_HEADED=1 E2E_SLOWMO=300 node --test --test-concurrency=1 tests/02-auth.test.mjs      # watch it in a visible window, slowed down (ms per step)
E2E_HEADED=1 E2E_BROWSER=webkit E2E_DEVICE=phone node --test tests/05-individual-dpr-ui.test.mjs
PWDEBUG=1 E2E_HEADED=1 node --test --test-name-pattern="AUTH-002" tests/02-auth.test.mjs  # Playwright Inspector: pause and step
npm test                # all files in one process (faster, but one browser crash can cascade)
npm run test:smoke      # only route / accessibility / overflow checks
node --test --test-concurrency=1 --test-name-pattern="SESS-003" tests/09-cluster-session-keyboard.test.mjs   # one test
python3 make-test-cases.py /tmp/qa-e2e-results     # rebuilds test-docs/test-cases.md from the results
```
Notes: screenshots of failures go to `e2e/artifacts/`. Tests use unique names (`QA …-<timestamp>`), so re-runs never clash. `todo` in the output means "a confirmed bug is the cause" and links to `bug-report.md`.

Environment switches: `E2E_BROWSER` (chromium | webkit | firefox), `E2E_DEVICE` (phone 360x740 | tablet 768x1024 | laptop 1280x800 | desktop 1440x900, default desktop), `E2E_HEADED=1`, `E2E_SLOWMO=<ms>`. Phone and tablet runs use touch. Firefox would not launch on the Mac used for the audit (graphics crash at start-up), so it is untested. Playwright's own UI mode (`playwright test --ui`) is not available: the tests use Node's `node:test` runner, not `@playwright/test`.


## 2b. The Playwright Test suite (client/e2e): run it in UI mode
Every screen-level check is also available as a standard Playwright Test suite, so `--ui` mode (timeline, snapshots, re-run on save) works for the whole application. It runs against the same isolated QA stack, never your dev server.
```bash
cd e2e && npm run stack:up              # QA API :5055 + web :5199 + the four QA accounts (once)
cd ../client
npx playwright install chromium         # once; add `webkit` for Safari's engine
npx playwright test --ui                # everything, in the UI window
npx playwright test                     # everything, in the terminal (HTML report in client/playwright-report)
npx playwright test --project=phone     # one screen size: desktop | laptop | tablet | phone
npx playwright test tour                # one file
E2E_WEBKIT=1 npx playwright test        # also Safari's engine (webkit-desktop, webkit-phone)
```
Specs (`client/e2e/`): `routes.responsive` (every screen: opens, accessible, no sideways scroll), `auth`, `projects.responsive`, `individual-dpr`, `scheme-finder.responsive`, `assistant-profile-privacy`, `admin-reviewer` (admin console, reviewer queue, cross-module journeys), `admin-analytics.responsive`, `dashboard.responsive`, `tour`, `cluster-session-keyboard.responsive`, and the older `consultant-dpr-screens` (style editor and pictures). Files named `*.responsive.spec.ts` run at all four screen sizes; the others run at desktop size only. Environment: `E2E_BASE_URL` (default `http://localhost:5199`), `E2E_API_URL` (default `http://localhost:5055/api`), `E2E_EMAIL` / `E2E_PASSWORD` for the consultant account. `global-setup.ts` checks the stack is up and seeds the QA accounts (it refuses a database whose name lacks "qa").

## 3. Server tests (server/)
```bash
cd server
export RBAC_API_BASE=http://localhost:5055/api API_BASE_URL=http://localhost:5055/api \
       MONGODB_URI=mongodb://localhost:27017/msme-dpr-qa
npm test                 # unit / contract tests (no server needed)
npm run test:api test:rbac test:security test:finance test:support test:admin test:session test:pdf test:encryption   # run each as `npm run test:<name>`
```
Browser tests also need `E2E_*` only if you use different accounts; the defaults are the seeded QA ones.

## 4. What is mocked
- `/ai/chat` is intercepted in the browser and answered with a fixed reply (no AI cost, deterministic). The real AI is **not** tested.
- Save failures are forced by intercepting the request (to test error handling).
- Everything else — API, database, authentication, sessions, PDF — is real.

## 5. Reading failures
| Looks like | Usually means |
|---|---|
| `Target closed`, `browser has been closed`, `Execution context was destroyed` | the headless browser died or the page navigated mid-step (test environment) — re-run the file; not an application defect |
| `QA stack is not running` | start the stack (step 1) |
| Everything in 8 ms, `ECONNREFUSED` | the API or MongoDB is down |
| `✖` with an assertion about the app | a real finding — see `bug-report.md` or add it |
