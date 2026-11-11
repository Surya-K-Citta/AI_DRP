# Test cases and results

> **Two suites exist.** The table below comes from the older `node:test` suite (`e2e/tests/`, IDs such as AUTH-001, DPR-011). The Playwright Test suite in `client/e2e/` (run with `npx playwright test --ui`) covers the same screens plus the later work (dashboard redesign, guided tour, Search Scheme, Compare, analytics) and runs at desktop, laptop, tablet and phone sizes: 359 tests (354 passed, 2 skipped, 3 failed on the last full run, see `execution-summary.md`). Its tests are named in plain words per file instead of by ID; the mapping is in the table at the end of this file.


Generated from the real run output (`e2e/run-all.sh`, each file in its own process). `KNOWN BUG` = the check failed because of a confirmed defect listed in `bug-report.md` (reported as `todo`, not hidden).

Every test below was run on both engines (Chromium, WebKit) and at four screen sizes (phone 360, tablet 768, laptop 1280, desktop 1440). The table lists the Chromium-desktop result; the matrix of all 8 combinations is:

| Browser | Screen | Pass | Fail (first run) | After fixes |
|---|---|---|---|---|
| chromium | desktop | 176 | 0 | clean |
| webkit | desktop | 176 | 0 | clean |
| chromium | laptop | 175 | 1 | PROJ-010 re-run 10/10 |
| webkit | laptop | 176 | 0 | clean |
| chromium | tablet | 176 | 0 | clean |
| webkit | tablet | 176 | 0 | clean |
| chromium | phone | 160 | 16 | BUG-016/017 fixed, smoke 69/69; IDPR-040 test made tall; re-run pass |
| webkit | phone | 160 | 16 | same as Chromium phone |

Phone failures on the first run were BUG-016 (unnamed menu button on every page), BUG-017 (features strip not keyboard-reachable) and a test that needed a tall window for mouse dragging (IDPR-040); the first two were fixed in the application.

Totals (Chromium, desktop): PASS 175

| ID | What it checks | Result | File | Note |
|---|---|---|---|---|
| SMOKE-001 | / (signed out) | PASS | 01-smoke-routes |  |
| SMOKE-002 | /login (signed out) | PASS | 01-smoke-routes |  |
| SMOKE-003 | /register (signed out) | PASS | 01-smoke-routes |  |
| SMOKE-004 | /privacy (signed out) | PASS | 01-smoke-routes |  |
| SMOKE-005 | /dashboard (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-006 | /projects (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-007 | /projects/create (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-008 | /dprs (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-009 | /individual-dpr/create (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-010 | /individual-dpr/guide (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-011 | /cluster-dpr/create (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-012 | /venture-match (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-013 | /chat (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-014 | /profile (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-015 | /account/privacy (consultant) | PASS | 01-smoke-routes |  |
| SMOKE-016 | /admin (admin) | PASS | 01-smoke-routes |  |
| SMOKE-017 | /admin/documents (admin) | PASS | 01-smoke-routes |  |
| SMOKE-018 | /reviewer (officer) | PASS | 01-smoke-routes |  |
| SMOKE-001-W360 | / | PASS | 01-smoke-routes |  |
| SMOKE-002-W360 | /login | PASS | 01-smoke-routes |  |
| SMOKE-003-W360 | /register | PASS | 01-smoke-routes |  |
| SMOKE-005-W360 | /dashboard | PASS | 01-smoke-routes |  |
| SMOKE-006-W360 | /projects | PASS | 01-smoke-routes |  |
| SMOKE-007-W360 | /projects/create | PASS | 01-smoke-routes |  |
| SMOKE-008-W360 | /dprs | PASS | 01-smoke-routes |  |
| SMOKE-009-W360 | /individual-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-010-W360 | /individual-dpr/guide | PASS | 01-smoke-routes |  |
| SMOKE-011-W360 | /cluster-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-012-W360 | /venture-match | PASS | 01-smoke-routes |  |
| SMOKE-013-W360 | /chat | PASS | 01-smoke-routes |  |
| SMOKE-014-W360 | /profile | PASS | 01-smoke-routes |  |
| SMOKE-015-W360 | /account/privacy | PASS | 01-smoke-routes |  |
| SMOKE-016-W360 | /admin | PASS | 01-smoke-routes |  |
| SMOKE-017-W360 | /admin/documents | PASS | 01-smoke-routes |  |
| SMOKE-018-W360 | /reviewer | PASS | 01-smoke-routes |  |
| SMOKE-001-W768 | / | PASS | 01-smoke-routes |  |
| SMOKE-002-W768 | /login | PASS | 01-smoke-routes |  |
| SMOKE-003-W768 | /register | PASS | 01-smoke-routes |  |
| SMOKE-005-W768 | /dashboard | PASS | 01-smoke-routes |  |
| SMOKE-006-W768 | /projects | PASS | 01-smoke-routes |  |
| SMOKE-007-W768 | /projects/create | PASS | 01-smoke-routes |  |
| SMOKE-008-W768 | /dprs | PASS | 01-smoke-routes |  |
| SMOKE-009-W768 | /individual-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-010-W768 | /individual-dpr/guide | PASS | 01-smoke-routes |  |
| SMOKE-011-W768 | /cluster-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-012-W768 | /venture-match | PASS | 01-smoke-routes |  |
| SMOKE-013-W768 | /chat | PASS | 01-smoke-routes |  |
| SMOKE-014-W768 | /profile | PASS | 01-smoke-routes |  |
| SMOKE-015-W768 | /account/privacy | PASS | 01-smoke-routes |  |
| SMOKE-016-W768 | /admin | PASS | 01-smoke-routes |  |
| SMOKE-017-W768 | /admin/documents | PASS | 01-smoke-routes |  |
| SMOKE-018-W768 | /reviewer | PASS | 01-smoke-routes |  |
| SMOKE-001-W1280 | / | PASS | 01-smoke-routes |  |
| SMOKE-002-W1280 | /login | PASS | 01-smoke-routes |  |
| SMOKE-003-W1280 | /register | PASS | 01-smoke-routes |  |
| SMOKE-005-W1280 | /dashboard | PASS | 01-smoke-routes |  |
| SMOKE-006-W1280 | /projects | PASS | 01-smoke-routes |  |
| SMOKE-007-W1280 | /projects/create | PASS | 01-smoke-routes |  |
| SMOKE-008-W1280 | /dprs | PASS | 01-smoke-routes |  |
| SMOKE-009-W1280 | /individual-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-010-W1280 | /individual-dpr/guide | PASS | 01-smoke-routes |  |
| SMOKE-011-W1280 | /cluster-dpr/create | PASS | 01-smoke-routes |  |
| SMOKE-012-W1280 | /venture-match | PASS | 01-smoke-routes |  |
| SMOKE-013-W1280 | /chat | PASS | 01-smoke-routes |  |
| SMOKE-014-W1280 | /profile | PASS | 01-smoke-routes |  |
| SMOKE-015-W1280 | /account/privacy | PASS | 01-smoke-routes |  |
| SMOKE-016-W1280 | /admin | PASS | 01-smoke-routes |  |
| SMOKE-017-W1280 | /admin/documents | PASS | 01-smoke-routes |  |
| SMOKE-018-W1280 | /reviewer | PASS | 01-smoke-routes |  |
| AUTH-001 | wrong password shows an error and stays on the sign-in page | PASS | 02-auth |  |
| AUTH-002 | right password opens the dashboard for that person | PASS | 02-auth |  |
| AUTH-003 | a signed-out visitor is sent away from every protected page | PASS | 02-auth |  |
| AUTH-004 | email is checked before the form can be sent | PASS | 02-auth |  |
| AUTH-010 | a new person can register, lands signed in, and can sign in again | PASS | 02-auth |  |
| AUTH-011 | a phone number that is not ten digits is refused | PASS | 02-auth |  |
| AUTH-012 | the server refuses a weak password and a duplicate email | PASS | 02-auth |  |
| AUTH-013 | registering never gives an admin role, even when asked | PASS | 02-auth |  |
| AUTH-014 | a person under 18 cannot register without a guardian step | PASS | 02-auth |  |
| AUTH-02x | consultant is refused /admin | PASS | 02-auth |  |
| AUTH-02x | consultant is refused /admin/documents | PASS | 02-auth |  |
| AUTH-02x | consultant is refused /reviewer | PASS | 02-auth |  |
| AUTH-02x | consultant can open /dashboard | PASS | 02-auth |  |
| AUTH-02x | officer is refused /admin | PASS | 02-auth |  |
| AUTH-02x | officer can open /reviewer | PASS | 02-auth |  |
| AUTH-02x | officer can open /dashboard | PASS | 02-auth |  |
| AUTH-02x | admin can open /admin | PASS | 02-auth |  |
| AUTH-02x | admin can open /reviewer | PASS | 02-auth |  |
| AUTH-02x | admin can open /admin/documents | PASS | 02-auth |  |
| AUTH-030 | signing out clears the browser session and closes protected pages | PASS | 02-auth |  |
| AUTH-031 | the API refuses a missing, malformed or forged token | PASS | 02-auth |  |
| PROJ-001 | a project filled in through the form is saved and shown in the list | PASS | 03-projects |  |
| PROJ-002 | required fields stop an empty form (nothing is sent) | PASS | 03-projects |  |
| PROJ-003 | the server rejects a project with a missing name, a bad type or a non-numeric cost | PASS | 03-projects |  |
| PROJ-004 | boundary: a very long name and unusual characters are stored safely, not executed | PASS | 03-projects |  |
| PROJ-005 | boundary: zero and negative money values are handled (not a server error) | PASS | 03-projects |  |
| PROJ-010 | a project opens from its own address and shows its details | PASS | 03-projects |  |
| PROJ-011 | editing a project through the API changes only that project and keeps the rest | PASS | 03-projects |  |
| PROJ-012 | deleting a project from the list asks first, then removes it | PASS | 03-projects |  |
| PROJ-013 | deleting a project also removes its saved DPR drafts (no orphans) | PASS | 03-projects |  |
| PROJ-020 | another person cannot read, change or delete my project | PASS | 03-projects |  |
| DPR-001 | saving a draft creates one project and one draft, and later saves update them (no duplicates) | PASS | 04-dpr-api |  |
| DPR-002 | the draft appears in my DPR list and opens by its id for me | PASS | 04-dpr-api |  |
| DPR-003 | a draft needs a unit name, and a signed-out caller is refused | PASS | 04-dpr-api |  |
| DPR-004 | an applicant under 18 is refused (403) and nothing is stored | PASS | 04-dpr-api |  |
| DPR-005 | boundary: a very long unit name and a large payload are accepted or refused cleanly (never a server error) | PASS | 04-dpr-api |  |
| DPR-010 | another person cannot open, export or submit my draft | PASS | 04-dpr-api |  |
| DPR-011 | another person cannot overwrite my project by sending its id in a draft save | PASS | 04-dpr-api |  |
| DPR-012 | only an admin can change a scheme's default report look | PASS | 04-dpr-api |  |
| DPR-013 | AI features need the person's AI consent (403 without it) | PASS | 04-dpr-api |  |
| DPR-020 | the owner can download the draft as a real PDF, Word file and spreadsheet | PASS | 04-dpr-api |  |
| DPR-021 | submitting records who, when and to whom, and a second submit does not duplicate it | PASS | 04-dpr-api |  |
| DPR-022 | a submitted DPR can be reviewed only by the right people (district officer sees their district) | PASS | 04-dpr-api |  |
| IDPR-001 | choosing a scheme from the list leads to its brief, then to the step list | PASS | 05-individual-dpr-ui |  |
| IDPR-002 | any step can be opened straight away, without filling earlier steps | PASS | 05-individual-dpr-ui |  |
| IDPR-003 | opening one step closes the other, and pressing the open one closes it | PASS | 05-individual-dpr-ui |  |
| IDPR-004 | Next and Previous move one step; Previous is off on the first step | PASS | 05-individual-dpr-ui |  |
| IDPR-010 | the required count shows on steps with missing answers and Generate DPR stays off | PASS | 05-individual-dpr-ui |  |
| IDPR-011 | "Check my answers" lists what is missing | PASS | 05-individual-dpr-ui |  |
| IDPR-020 | typing a unit name and pressing Save Draft stores it for this person | PASS | 05-individual-dpr-ui |  |
| IDPR-021 | the saved draft is offered under "Continue where you left off" and reopens with its answers | PASS | 05-individual-dpr-ui |  |
| IDPR-022 | changes are saved by themselves about 30 seconds after the first change | PASS | 05-individual-dpr-ui |  |
| IDPR-023 | a failed save shows an error and keeps what was typed | PASS | 05-individual-dpr-ui |  |
| IDPR-024 | an under-18 applicant is refused by the server and the person is told | PASS | 05-individual-dpr-ui |  |
| IDPR-030 | switching between Basic and Advanced keeps what was typed | PASS | 05-individual-dpr-ui |  |
| IDPR-031 | typing straight into the report (Advanced) updates the answer used by the form | PASS | 05-individual-dpr-ui |  |
| IDPR-032 | undo and redo take back and bring back a change in the report | PASS | 05-individual-dpr-ui |  |
| IDPR-040 | dragging a step to a new place renumbers the steps and the report follows | PASS | 05-individual-dpr-ui |  |
| IDPR-041 | hiding a step leaves its section out of the report; showing it brings it back | PASS | 05-individual-dpr-ui |  |
| IDPR-042 | choosing another template changes the look and is kept in the draft | PASS | 05-individual-dpr-ui |  |
| IDPR-043 | Preview opens a read-only copy, Esc closes it, and focus goes back to the button | PASS | 05-individual-dpr-ui |  |
| IDPR-044 | number boxes accept zero and above only | PASS | 05-individual-dpr-ui |  |
| VM-001 | each answer narrows the list of possible schemes and moves to the next question | PASS | 06-venture-match |  |
| VM-002 | Previous goes back one question and keeps the earlier answer | PASS | 06-venture-match |  |
| VM-003 | reloading mid-way does not break the page | PASS | 06-venture-match |  |
| VM-010 | one choice from each pick-one group can be combined (woman + SC) | PASS | 06-venture-match |  |
| VM-011 | choosing a second person from the same group replaces the first (woman, then transgender) | PASS | 06-venture-match |  |
| VM-012 | SC and ST cannot both be chosen (the second replaces the first) | PASS | 06-venture-match |  |
| VM-013 | disability combines with any other choice | PASS | 06-venture-match |  |
| VM-014 | general category man replaces a choice from both groups (woman + SC, then H) | PASS | 06-venture-match |  |
| VM-015 | "not decided", "no 51% holder" and "not sure" stand alone (they clear everything else) | PASS | 06-venture-match |  |
| VM-016 | choosing a person after "not sure" clears it | PASS | 06-venture-match |  |
| VM-017 | pressing a chosen option again clears it | PASS | 06-venture-match |  |
| VM-020 | answering every question ends with matching schemes the person can act on | PASS | 06-venture-match |  |
| CHAT-001 | a question is shown, sent, and the assistant's reply appears | PASS | 07-chat-profile-privacy |  |
| CHAT-002 | when the assistant fails the person is told, and their question is not lost | PASS | 07-chat-profile-privacy |  |
| CHAT-003 | an empty message cannot be sent, and the clear button asks before removing the conversation | PASS | 07-chat-profile-privacy |  |
| CHAT-004 | the server only answers a person who allowed AI help | PASS | 07-chat-profile-privacy |  |
| PROF-001 | the profile shows my details and a changed name is saved | PASS | 07-chat-profile-privacy |  |
| PROF-002 | the email cannot be changed, and an invalid phone number is refused by the server | PASS | 07-chat-profile-privacy |  |
| PRIV-001 | "download my data" contains my own records and nobody else's | PASS | 07-chat-profile-privacy |  |
| PRIV-002 | switching AI help on and off is saved, and the server honours it | PASS | 07-chat-profile-privacy |  |
| PRIV-003 | a nominee needs a name and a phone or email | PASS | 07-chat-profile-privacy |  |
| PRIV-004 | a complaint needs a subject and a message, and reaches the support desk | PASS | 07-chat-profile-privacy |  |
| PRIV-005 | notifications can be listed and marked read, only by their owner | PASS | 07-chat-profile-privacy |  |
| PRIV-006 | deleting my account needs the word DELETE, then removes me and my records | PASS | 07-chat-profile-privacy |  |
| ADM-001 | the user count on the dashboard equals the number of accounts in the database | PASS | 08-admin-reviewer-integration |  |
| ADM-002 | User Management lists the accounts, and the other tabs open without errors | PASS | 08-admin-reviewer-integration |  |
| ADM-003 | the audit trail records sign-ins and verifies as unbroken | PASS | 08-admin-reviewer-integration |  |
| ADM-004 | an admin can invite a District Reviewer, who must have a district | PASS | 08-admin-reviewer-integration |  |
| REV-001 | the reviewer sees submitted DPRs of their own district only | PASS | 08-admin-reviewer-integration |  |
| REV-002 | sending a DPR back needs remarks; approving works once; a decided DPR cannot be decided again | PASS | 08-admin-reviewer-integration |  |
| REV-003 | the queue page shows a waiting DPR and approving it there changes its status for everyone | PASS | 08-admin-reviewer-integration |  |
| INT-001 | a draft saved in the DPR module appears in the project list, dashboard totals, admin counts and "All DPRs" | PASS | 08-admin-reviewer-integration |  |
| INT-002 | a submitted DPR is visible to the reviewer, then to the admin, and its status follows the decision back to its owner | PASS | 08-admin-reviewer-integration |  |
| INT-003 | one person's documents, drafts and exports are invisible to another, in every list | PASS | 08-admin-reviewer-integration |  |
| INT-004 | a deactivated person is signed out of every module at once | PASS | 08-admin-reviewer-integration |  |
| CLUS-001 | the cluster form opens on step 1 with all 18 steps and a live preview | PASS | 09-cluster-session-keyboard |  |
| CLUS-002 | typing the cluster name and pressing Save Draft stores a cluster (not individual) draft | PASS | 09-cluster-session-keyboard |  |
| CLUS-003 | Form, Split and Preview views change what is shown and keep what was typed | PASS | 09-cluster-session-keyboard |  |
| SESS-001 | a session that has ended sends the person to sign in with a message, not to a blank page | PASS | 09-cluster-session-keyboard |  |
| SESS-002 | an API call with an expired token says TOKEN_EXPIRED (so the app can renew quietly) | PASS | 09-cluster-session-keyboard |  |
| SESS-003 | near the end of an idle session a warning offers "Stay signed in", and pressing it keeps the person in | PASS | 09-cluster-session-keyboard |  |
| KEY-001 | the first Tab stop is "Skip to main content", and it moves focus to the page content | PASS | 09-cluster-session-keyboard |  |
| KEY-002 | the whole sign-in form can be completed and submitted with the keyboard alone | PASS | 09-cluster-session-keyboard |  |
| LANG-001 | switching to Telugu changes the page text and the document language, and back again | PASS | 09-cluster-session-keyboard |  |

## Playwright Test suite: files and what each proves
| File (`client/e2e/`) | Sizes | Proves |
|---|---|---|
| `routes.responsive.spec.ts` | all 4 | 18 screens open for the right person, no script errors, no serious accessibility problem, no sideways scroll |
| `auth.spec.ts` | desktop | sign-in, sign-up, weak/duplicate/admin-role registration, who may open which page, sign-out, forged tokens |
| `projects.responsive.spec.ts` | all 4 | create/open/delete projects, validation, scripts in names, long names, ownership, no orphan DPRs |
| `individual-dpr.spec.ts` | desktop | steps, required answers, save/autosave/failed save, Basic/Advanced rules, arrange and style, preview focus |
| `scheme-finder.responsive.spec.ts` | all 4 | questions, Previous, owner-category rules, results, Compare dialog, suggested plan, equal card heights |
| `assistant-profile-privacy.spec.ts` | desktop | chat with the provider stubbed, profile, export, consent, nominee, complaint, notifications, account erase |
| `admin-reviewer.spec.ts` | desktop | admin console, user search, audit chain, invitations, reviewer queue and decisions, cross-module journeys, deactivation |
| `admin-analytics.responsive.spec.ts` | all 4 | analytics numbers equal the records, filters, empty state, chart click-through, CSV export, recent activity, access |
| `dashboard.responsive.spec.ts` | all 4 | layout order, numbers, empty state, delete asks first, navigation, Search Scheme list |
| `tour.spec.ts` | desktop | tour start, arrow and "Click here", rest of page switched off, panel beside target, Exit, full walk-through |
| `cluster-session-keyboard.responsive.spec.ts` | all 4 | cluster form, expired session, idle warning, skip link, Telugu switch |
| `consultant-dpr-screens.spec.ts` | desktop | style editor: add, name, resize, hide and delete a picture |
