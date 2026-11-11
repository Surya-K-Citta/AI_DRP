# Accessibility: audit notes for the DPR creation screen

Target: WCAG 2.2 Level AA, WAI-ARIA Authoring Practices, and the Guidelines for Indian Government Websites (GIGW 3.0). This page records what was
checked and changed. **It is not a conformance claim or a certificate**: automated scans and one engineer's manual checks do not replace an
independent audit (STQC / an accessibility auditor) with real assistive technology.

Scope of this pass: the Individual DPR creation screen (scheme picker, scheme brief, Form mode, Document mode, Sections / Style panes, Preview and
template pop-ups, the step path, save button). Other pages (dashboard, admin, cluster DPR, login, privacy) were **not** audited here.

## Already in place before this pass

Skip link and accessibility bar (text size, high contrast) in `AccessibilityBar`; `<main>` landmark in `Layout`; document language kept in step
with the interface language (`i18n/config.ts`); reduced-motion rules on animations; modal pop-ups with Esc, click-outside and focus return
(`lib/useDialog.ts`); session-expiry warning with "Stay signed in".

## Changes in this pass

| Area | Change | Files |
| --- | --- | --- |
| Names for answers typed in the report | Every inline text box, dropdown, date and number box in Document mode now has an accessible name (the question, plus row number and column for table cells). Before, ~70 controls had none. | `IndividualDPRDocumentView.tsx` |
| Unnamed dropdowns in Form mode | District and Location now have names. | `IndividualDPRForm.tsx` |
| Scrollable report preview | Reachable by keyboard (`tabindex=0`), named region, visible focus. | `IndividualDPRCreation.tsx` |
| Modal pop-ups | Tab / Shift+Tab now stay inside an open pop-up (they used to leave it). Esc and focus return unchanged. | `lib/useDialog.ts` |
| Save state | A polite live message says "Unsaved changes…", "Saving…", "Everything on screen is saved" or "Could not save" when the state changes. | `SaveDraftButton.tsx` |
| Colour contrast | Secondary text darkened from #737373 to a 38% grey (4.34:1 → about 6:1 on the light grey chips). Text on the orange buttons changed from near-white (2.65:1) to near-black. "Jump to next" chip darkened (3.77:1 → above 4.5:1). | `index.css`, `DocFieldGuide.tsx` |
| Focus not hidden | Scroll padding so a focused answer is not hidden under the sticky footer or the floating toolbar. | `index.css` |
| Forced-colors | Focus outline and progress bar keep working in Windows high-contrast mode. | `index.css` |
| Reordering sections | The grip of each row in the Sections pane is now a keyboard control: Up / Down arrow keys move the section, with the name read out. Dragging still works. | `StyleEditor.tsx` |
| Step path | Each step is a button with a full name ("Step 4: Your unit profile, 100%, 2 required answers missing"), `aria-current="step"`, arrow keys / Home / End between steps; the visible name bubble also shows on keyboard focus. | `AuthoringStepper.tsx` |
| Required answers | The count of missing required answers is on every step (badge and text for screen readers). | `AuthoringStepper.tsx` |

## What was tested

Automated: axe-core 4.10 (WCAG 2.0/2.1/2.2 A and AA plus best-practice rules) in headless Chrome on the scheme picker, scheme brief, Form mode,
Document mode and the open Style pane. Result after the changes: no violations, except two contrast hits on the faint "Confidential" watermark
text drawn inside template thumbnails (decorative, hidden from assistive technology, so treated as exempt).

Browser checks (scripted, headless Chrome): Preview and Template pop-ups open by keyboard, keep Tab inside, close with Esc and return focus to
the button; arrow keys move between steps; no horizontal scrolling at 320 px wide (reflow) or 720 px wide (≈ 200% zoom of a 1440 px screen); no
overflow with the WCAG text-spacing values applied (line height 1.5, letter spacing 0.12em, word spacing 0.16em).

**Not done in this pass (no tool or device available): NVDA / JAWS / VoiceOver / TalkBack testing, Telugu screen-reader pronunciation,
speech-input software, real mobile devices, accessible-PDF checks on the exported DPR, and the colour contrast of dark mode.** These must be
tested by a person before anything is claimed.

## WCAG 2.2 AA: status for this screen

| Criterion | Status | Note |
| --- | --- | --- |
| 1.1.1 Non-text content | Partly tested | Icon-only buttons have names (axe). Template thumbnails are decorative. Alt text of uploaded pictures not checked. |
| 1.3.1 Info and relationships | Pass (automated) | Labels, lists, tables, landmarks pass axe. Heading order on this screen not manually reviewed. |
| 1.3.5 Input purpose | Not tested | Autocomplete attributes on personal-data fields not reviewed. |
| 1.4.1 Use of colour | Partly | Required answers are red and also carry a count / text; error states also carry text. |
| 1.4.3 Contrast (minimum) | Pass (automated, light mode) | See above. Dark mode and the user-chosen template colours not checked. |
| 1.4.4 Resize text / 1.4.10 Reflow | Pass (scripted) | 200% equivalent and 320 px, no loss of content found. |
| 1.4.11 Non-text contrast | Partly | Focus rings and input borders were not measured one by one. |
| 1.4.12 Text spacing | Pass (scripted) | No overflow found; clipping not inspected visually. |
| 1.4.13 Content on hover or focus | Partly | Step-name bubbles appear on hover and focus and do not hide other content; Esc-dismiss is not implemented. |
| 2.1.1 Keyboard / 2.1.2 No keyboard trap | Pass (scripted) | Pop-ups trap on purpose and release on Esc. Section reordering now has an arrow-key alternative. |
| 2.4.1 Bypass blocks | Pass | Skip link exists. |
| 2.4.3 Focus order / 2.4.7 Focus visible | Partly | Visible focus on controls; order checked on step path and pop-ups only. |
| 2.4.11 Focus not obscured | Improved | Scroll padding added; not verified on every field. |
| 2.5.7 Dragging movements | **Partly** | Sections can now be reordered from the keyboard (focus the grip, press Up / Down). A single-click alternative for mouse and touch users (move up / move down buttons) is still missing. |
| 2.5.8 Target size (minimum) | Pass (by design) | Step dots 30 px, icon buttons 28 px. |
| 3.1.1 / 3.1.2 Language | Partly | Page language follows the interface language; passages of the other language are not marked. |
| 3.2.x Predictable | Pass (manual) | Switching mode and layout only on the person's action. |
| 3.3.1 / 3.3.2 / 3.3.3 Errors and labels | Partly | Field errors are text; error summary links not reviewed. |
| 3.3.7 Redundant entry / 3.3.8 Accessible authentication | Not tested | Login was not in scope. |
| 4.1.2 Name, role, value | Pass (automated) | The Document / Sections / Style switch is marked as tabs without tab panels; it works with a screen reader but is not the exact tabs pattern. |
| 4.1.3 Status messages | Improved | Save state is announced; toasts rely on the library's live region (not verified). |

## GIGW 3.0: review summary

Reviewed against this screen only. Items that need the organisation, not code, are open: an accessibility statement with a contact route
(draft wording below), a published policy set (privacy exists), bilingual coverage check of all UI strings (the audit script passes for this
screen), accessible downloadable documents (**the exported DPR PDF has not been checked for tags, reading order or table headers**), and the
conformity evaluation / certification, which has not been done.

Draft accessibility statement: "This service aims to meet WCAG 2.2 Level AA and the GIGW 3.0 guidelines. It has had an internal review and
automated testing; it has not yet been independently audited. Known limitations: reordering report sections by mouse or touch uses dragging (the keyboard uses arrow keys); exported
documents may not be fully accessible. To report a problem or ask for another format, write to <contact address>."

## Whole-application pass (second round)

axe-core (same rules) was run on 25 routes with a signed-in admin and the API answered with empty data: `/`, `/login`, `/register`, `/privacy`,
`/accept-invite`, `/dashboard`, `/projects`, `/projects/create`, `/projects/:id`, `/dprs`, `/dpr/builder`, `/dpr/:projectId`, `/dpr/view/:id`,
`/cluster-dpr/create`, `/individual-dpr/guide`, `/individual-dpr/create`, `/venture-match`, `/chat`, `/profile`, `/account/privacy`, `/admin`,
`/admin/documents`, `/reviewer`. Before: contrast, label, select-name, button-name, landmark and heading-order violations on 14 of them. After:
no violations on every route except the two items below. Pages whose content needs real data (a saved DPR, the generated report view,
district review with cases, admin tables with rows) were only seen in their empty state.

| Change | Where |
| --- | --- |
| Every `label` passed to the shared Input is now linked to its field (`htmlFor` / `id`). This was the cause of most "form element has no label" findings, across all forms. | `components/ui/Input.tsx` |
| A small safety net links a plain `<label>` to the control right after it when that control has no name (the AI builder and older forms write labels without `for`). | `lib/a11yEnhance.ts`, `main.tsx` |
| Page and section headings: card titles are `h2` (were `h3` under the page `h1`), stat figures on the dashboard are plain text, builder step titles are `h2`; `CardTitle` takes `as="h1"` for pages that had no `h1` (Set up your account, DPR generation). | `Card.tsx`, `Dashboard.tsx`, `AllDPRs.tsx`, `Projects.tsx`, `AIGuidedDPRBuilder.tsx`, `AcceptInvite.tsx`, `DPRGeneration.tsx` |
| `<main>` landmark on Login, Register and Chat. | `Login.tsx`, `Register.tsx`, `Chat.tsx` |
| Names for icon-only and unnamed controls: chat clear / send / message box / voice language; DPR list filters; project type and sector. | `Chat.tsx`, `AllDPRs.tsx`, `ProjectForm.tsx` |
| Contrast: landing-page grey text, the report-guide hints, the green button in the cluster report. | `Landing.tsx`, `ReportGuide.tsx`, `ClusterDPRDocumentView.tsx` |
| Scrollable areas reachable by keyboard: AI builder step strip, report-guide preview. | `AIGuidedDPRBuilder.tsx`, `ReportGuide.tsx` |
| Focus handling for every pop-up that uses the shared helper now also covers the confirm dialogs, "Check my answers", and the expand-a-field window: focus moves in, Tab stays inside, focus returns to the button on close. A development-only focus glitch (React running effects twice) is also fixed. | `lib/useDialog.ts`, `ConfirmProvider.tsx`, `DataChecks.tsx`, `ExpandableField.tsx` |

Still open from this round: the generated cluster report contains an `h4` after an `h2` (it is the report's own structure); some pages show a
page heading only after data loads, so an empty or failed state can lack an `h1`; the pop-ups in `AISuggestions`, `FinanceCalculators` and the
Document-mode AI window have not been moved onto the shared focus helper yet.

## Third round: structure, navigation and the remaining gaps

| Area | Change | Where |
| --- | --- | --- |
| Bypass blocks (2.4.1) | A "Skip to main content" link is now the first stop on every app page (it was only on the home page); the page content is a focusable `main` with id `main-content`. Navigation bar is labelled. | `SkipLink.tsx`, `Layout.tsx`, `Navbar.tsx`, `Chat.tsx`, `Login.tsx`, `Register.tsx` |
| Page titles (2.4.2) | The browser tab title now follows the page's main heading ("Dashboard · MSME DPR Tool") and the language. | `lib/routeA11y.tsx` |
| Focus on page change | After moving to another page, focus goes to the start of the new page, so a screen reader reads it. Query-string changes (such as form steps) do not move focus. | `lib/routeA11y.tsx` |
| Pop-ups (2.1.2, 2.4.3) | The AI regenerate window, finance calculators, the Document-mode AI window and the session "Are you still there?" warning now move focus in, hold Tab, close on Esc where closing is allowed, and give focus back. | `components/ui/ModalFocus.tsx`, `AISuggestions.tsx`, `FinanceCalculators.tsx`, `DocFieldGuide.tsx`, `SessionManager.tsx` |
| Dragging alternative (2.5.7) | Each section row has Move up / Move down buttons (shown on hover, focus, and on touch screens) as well as arrow keys. | `StyleEditor.tsx`, `index.css` |
| Content on hover or focus (1.4.13) | Esc hides the step-name bubbles until the pointer or focus moves. | `AuthoringStepper.tsx` |
| Target size (2.5.8) | The 16 px "Information" buttons now have a 24 px hit area; footer links have height. Scripted check: no interactive element under 24 px on the DPR screen or the dashboard (links inside sentences are exempt). | `InfoTooltip.tsx`, `Layout.tsx` |
| Input purpose (1.3.5) | `autocomplete` on sign-in and registration fields (username, current/new password, name, email, date of birth). | `Login.tsx`, `Register.tsx` |
| Dark mode contrast (1.4.3) | Axe in dark mode: clean on the pages listed above after darkening the error red, dark text on the orange and amber buttons, the primary-colour buttons with white text, the Document-mode toolbar, and by keeping the home page and report-guide on the light theme. | `index.css`, `StyleEditor.tsx`, `Landing.tsx`, `ReportGuide.tsx` |
| Accessibility statement (GIGW) | New public page `/accessibility`, linked from every footer, in English and Telugu. It names the target standard, what has been done, what is not finished and how to ask for help (it points to the contact details on the Privacy notice; add a dedicated address and a date reviewed when the organisation decides them). | `pages/Accessibility.tsx`, `Layout.tsx` |

Scripted checks that pass: first Tab reaches the skip link and Enter moves focus to the page content; page change updates title and focus; all 61
Tab stops on the DPR screen show a focus outline or ring; the session warning takes focus on its button.

What this still does **not** cover (cannot be done by code or by a script): testing with NVDA, JAWS, VoiceOver and TalkBack in English and
Telugu; speech-input software; an accessible-PDF check of every exported report; checking pages with real data (generated report, review
queues, admin tables); user-chosen template colours; an independent audit or STQC certification. These are listed as "not tested", not as passed.

## Known open items (priority order)

1. High: accessible-PDF check of the exported DPR (tags, reading order, table headers, language).
2. High: manual run with NVDA + Firefox/Chrome and VoiceOver + Safari through the whole create flow, English and Telugu.
3. Medium: template colours chosen by users can fail contrast (the editor already has a contrast helper to warn).
4. Medium: mark Telugu / English passages with `lang`; give every page an `h1` even in loading and error states.
5. Low: change the Document / Sections / Style switch to the full tabs pattern or to toggle buttons.

## Keeping it from regressing

Run axe-core on the five screens above in CI (a headless-browser script against a preview build); keep `scripts/i18n-audit.mjs --strict`
in CI; require an accessible name for every new icon-only control and for every new inline answer.
