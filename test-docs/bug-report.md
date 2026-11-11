# Bug report — MSME DPR application

> **Status: all 17 defects below are fixed** (BUG-016 and BUG-017 were found later by the phone-size run on Playwright; see the end of this file) (authorised by the user after the first audit). Each fix was re-tested: the browser suite is 176/176 with no known-bug todos, and the server suites are 160/160. BUG-001 (the connection leak) has no automated test because it needs MongoDB to drop; the code path that leaked was removed, so please watch `lsof -nP -iTCP:27017 | wc -l` on your dev server after restarting it. The "Test that shows it" column names the test that failed before the fix and passes now.

Found by the QA audit on branch `feature/application_testcases`. **No production code was changed.** Each defect below was reproduced by an automated test or a direct probe against the isolated QA stack (API `:5055`, database `msme-dpr-qa`). Fixes are listed as recommendations only; they need your authorisation (see "Decisions needed").

Severity: **High** = security / data loss / outage · **Medium** = wrong behaviour or accessibility barrier on a core screen · **Low** = cosmetic or console noise.

| ID | Severity | Area | Summary | Test that shows it |
|---|---|---|---|---|
| BUG-001 | High | Server / database | A lost MongoDB connection starts a reconnect loop that opens new connections without closing old ones; tens of thousands of connections exhaust MongoDB. | Seen on dev (≈58 k) and again on the QA stack (≈46 k); no automated test (it needs MongoDB to drop). |
| BUG-009 | High (security) | DPR API | `POST /dpr/cluster/draft/save` loads `Project.findById(clusterData.projectId)` with no owner check, so a signed-in user can overwrite another user's project. | `DPR-011` (TODO while it exists) |
| BUG-010 | Medium | Projects API | `DELETE /projects/:id` removes only the project; its DPR versions stay in the database as orphans (also a privacy/retention concern). | `PROJ-013` (TODO) |
| BUG-007 | Medium | DPR API | A negative `totalCost` is not rejected with 400. | `PROJ-005` (TODO when it returns 5xx) |
| BUG-015 | Medium (responsive) | Dashboard | On a 360 px phone the View / Edit / Delete buttons of the "My Detailed Project Reports" cards run ~120 px past the right edge, so the whole page scrolls sideways (seen once the user has reports). | `SMOKE-005-W360` (TODO) |
| BUG-014 | Medium | Admin console | User Management loads only the first 50 accounts (`GET /admin/users?limit=50`, no paging control) and its search box filters just those; with more than 50 accounts the rest cannot be reached from the screen. | `ADM-002` (TODO) |
| BUG-013 | Medium | UI + validation | A 500-character name without spaces is accepted and makes `/dprs` (up to ~7000 px) and the dashboard scroll sideways; there is no maximum length and the title does not wrap. | `SMOKE-005/008-W*` (TODO), `DPR-005` |
| BUG-011 | Medium (a11y) | Dashboard, All DPRs | The "Draft" (orange, 2.82:1) and "Rejected" (red, 4.03:1) status badges fail WCAG AA contrast (needs 4.5:1). Shows up once a user has such reports. | `SMOKE-005`, `SMOKE-008` (TODO) |
| BUG-012 | Medium (a11y) | Projects | The orange location text on project cards is 2.63:1. | `SMOKE-006` (TODO) |
| BUG-008 | Medium (a11y) | Projects, dashboard cards | The icon-only trash button on each card has no accessible name (20 on `/projects`), so a screen reader says only "button". | `SMOKE-006` (TODO) |
| BUG-006 | Medium (a11y) | Admin → Documents | Unnamed delete button and unnamed dropdowns. | `SMOKE-017` (TODO) |
| BUG-005 | Medium (a11y) | Admin | The scrollable table region has an invalid ARIA structure. | `SMOKE-016` (TODO) |
| BUG-004 | Medium (a11y) | AI chat | Low colour contrast on the chat screen. | `SMOKE-013` (TODO) |
| BUG-002 | Low | Cluster DPR document view | `classname=""` is rendered (should be `className`), so React logs an invalid-property error. | `SMOKE-011` (TODO) |
| BUG-003 | Low | Home page | React warns about an unknown prop. | `SMOKE-001` (TODO) |

## Details

### BUG-001 — Mongo reconnect loop leaks connections (High)
- **Where:** `server/src/config/database.ts` (reconnect handler).
- **Reproduce:** drop the MongoDB connection for a few seconds (stop `mongod`, or exhaust its threads) and watch `lsof -iTCP:27017`. Each `disconnected` event schedules a new `mongoose.connect()` without closing or reusing the first one.
- **Impact:** an outage turns into a bigger one. `mongod` failed with `pthread_create failed`, the dev API had to be killed, and our QA API repeated it (46 516 sockets from one process) while the browser tests ran.
- **Recommendation:** connect once; let the driver's own reconnect run (`serverSelectionTimeoutMS`, `maxPoolSize`); in the `disconnected` handler only log; guard any manual retry with a single in-flight flag and a back-off.

### BUG-009 — Another user's project can be overwritten (High, security)
- **Where:** `server/src/controllers/clusterDPR.controller.ts`, `saveClusterDPRDraft`.
- **Reproduce:** sign in as user B, `POST /dpr/cluster/draft/save` with `clusterData.projectId` set to user A's project id. The project's location and details change; the response is 200.
- **Impact:** broken object-level authorisation (IDOR). User B can alter A's project records.
- **Recommendation:** load the project with `{ _id, userId: req.user.userId }` and return 404 (not 403) when it is not the caller's; add the same check for every other `projectId`/`dprId` taken from a body.

### BUG-010 — Deleting a project leaves its DPRs behind (Medium)
- **Where:** `server/src/controllers/project.controller.ts`, `deleteProject` (`findOneAndDelete({ _id, userId })` only).
- **Impact:** orphaned `dprversions` that no screen can reach but that still hold personal data.
- **Recommendation:** delete or archive the project's DPR versions (and files) in the same operation, then record it in the audit trail.

### BUG-007 — Negative cost is not refused (Medium)
A negative `totalCost` should be 400 with a clear message. Add schema validation (≥ 0, finite, sensible upper bound).

### BUG-013 — Very long unbroken name breaks layout (Medium)
- **Reproduce:** save a draft whose unit name is 500 × "U" (accepted by the API), open `/dprs`: the page is ≈7 000 px wide at every screen size; the dashboard overflows by 133 px on a 360 px phone.
- **Recommendation:** cap the name (e.g. 120 characters) in the API and form; add `break-words`/`min-w-0` (or `truncate`) on card titles.

### BUG-014 — Admin cannot reach accounts beyond the first 50 (Medium)
- **Where:** `client/src/pages/AdminDashboard.tsx` (loads `?limit=50`, filters in the browser, lines ~354); the API already pages (`page`, `limit`, `pagination.total`).
- **Reproduce:** with 66 accounts, search "qa.consultant@msme.test" → no result, although the account exists.
- **Recommendation:** add paging controls and send the search text to the server (`?q=`), or load all pages; show "Showing 50 of N".

### BUG-015 — Dashboard report cards overflow on phones (Medium)
- **Reproduce:** sign in as a user with several reports, open `/dashboard` at 360 px: `document.documentElement.scrollWidth` is 481 px. The row `View · Edit · Delete (· PDF)` does not wrap.
- **Recommendation:** `flex-wrap` on that action row (and `min-w-0` on the card text column), as was done on `/dprs`. Not seen earlier because the previously used test account had no reports.

### BUG-011 / BUG-012 — Contrast (Medium)
Measured by axe-core: `bg-warning/10 text-warning` 2.82:1; `bg-destructive/10 text-destructive` 4.03:1; `text-secondary` orange on the pale card 2.63:1. Use darker text tokens (e.g. a `warning-foreground` / `destructive-foreground` pair that reaches 4.5:1) for small text.

### BUG-008 — Unnamed trash button (Medium)
Add `aria-label={`Delete ${name}`}` to the card's icon button (and a visible tooltip).

### BUG-004, BUG-005, BUG-006, BUG-002, BUG-003
See the table; each is a one-line markup/theme fix. BUG-005: give the scroll container a role/label (`role="region" aria-label=… tabIndex=0`) or remove the invalid role. BUG-006: add `aria-label`s to the delete button and the `<select>`s.

## Observations (not counted as bugs)
- When the "Are you still there?" warning opens, `document.activeElement` was the page body in the headless run, not the dialog button. The component wraps it in `ModalFocus`; please confirm by hand with a screen reader (SESS-003 only proves that real input dismisses the warning).
- The login page shows demo credentials (`Login.tsx`). Fine for a demo; remove before production.
- Registration needs the privacy notice to be scrolled before the consent box can be ticked (by design; the tests do it).

- `server/src/controllers/dpr.controller.ts` (~line 1509) does `require('exceljs')` for the spreadsheet download, but `exceljs` is neither in `server/package.json` nor installed. The download still works (DPR-020 passes) because the code falls back when the require fails, but the richer workbook path never runs. Decide whether to add the package or delete that path; I left it alone because adding it would change the download's content.
- The animated product mock-ups on the home page change colour while they play, so an automated contrast scan can land on a pale frame. They are hidden from assistive technology (`aria-hidden`), so the smoke test no longer judges colour contrast inside `aria-hidden` illustrations (the page's real text is still checked).

## Test-environment problems (not application defects)
| Problem | Cause | Handling |
|---|---|---|
| First live run polluted the **dev** database | `RBAC_API_BASE` was unset and defaulted to `localhost:5000` | Always export it to the QA URL; see the execution guide. Clean-up of the dev data is pending your decision. |
| `connection closed` / `detached frame` cascades | headless Chrome died on a busy machine | the harness now starts a fresh browser automatically |
| Session tests failing in 8 ms | MongoDB was down (BUG-001 effect) | re-run on a healthy stack: all pass |
| SESS-003 could not set an old "last activity" | the app uses the later of the saved time and the token's issue time | the test moves the page clock forward instead |

## Found by the Playwright phone-size run (also fixed)
| ID | Severity | Summary |
|---|---|---|
| BUG-016 | Medium (a11y, critical in axe) | At phone width every signed-in page had a menu button with no accessible name (an icon only). Now `aria-label` "Open menu / Close menu" and `aria-expanded` (`Navbar.tsx`). |
| BUG-017 | Medium (a11y) | The swipeable features strip on the home page scrolled sideways but could not be reached with the keyboard. Now focusable, labelled region (`FeaturesScroller.tsx`). |

## Found by the Playwright tablet-size run (also fixed)
| ID | Severity | Summary |
|---|---|---|
| BUG-018 | Medium (layout) | On a tablet-width screen (768 px) the round "Previous" button on the Scheme Finder questions sat under the side menu's "Expand menu" control, so pressing it did nothing. It now sits clear of the side menu (`VentureMatch.tsx`, `md:left-20`). |

## What was changed
- **Server:** `config/database.ts` (BUG-001: no second `connect()`; the driver reconnects itself), `clusterDPR.controller.ts` (BUG-009: project looked up by id *and* owner, 404 otherwise; BUG-013: unit name capped at 200 characters), `project.controller.ts` (BUG-010: deleting a project also deletes its DPR versions; BUG-007: invalid values give 400 not 500), `admin.controller.ts` (BUG-014: `?q=` search by name/email).
- **Client:** colour tokens `text-warning-text`, `text-destructive-text`, `text-success-text`, `text-secondary-text` (BUG-011/012, ≥ 4.5:1 in light and dark); names wrap and action rows wrap on Dashboard/All DPRs/Projects (BUG-013/015); delete buttons named (BUG-008, BUG-006); admin tabs are real `role="tab"`s and the sector chart has a text label (BUG-005); `<select>`s labelled (BUG-006); chat count no longer faded (BUG-004); `className` typo (BUG-002); `fetchpriority` spelling (BUG-003); Users tab searches on the server, shows "Showing N of total" and "Load more" (BUG-014).

## Decisions needed
1. May I fix **BUG-009** and **BUG-001** (small, well-contained server changes)? They are the two that matter most.
2. May I fix the front-end accessibility/layout items (BUG-002…008, 011–013)? They are markup/theme changes.
3. Dev database clean-up: about 17 throw-away `@msme.test` users and their records were created on the dev DB by the first run. Shall I write a dry-run script that lists them first?
