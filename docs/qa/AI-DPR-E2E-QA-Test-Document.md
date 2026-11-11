# AI-DPR (AP MSME DPR Tool) — End-to-End QA Test Document

**Version:** 1.0 · **Prepared:** 2026-10-16 · **Prepared by:** QA · **Audience:** manual testers
**Scope:** Every individual-DPR scheme pack (30 schemes + the vanilla bank-term-loan path). Step counts follow the **code** (`schemeStepCatalog.ts`), which differs from some spec docs. For each one this document gives the exact value to type or select in every step and every input, so a tester can finish with a real generated DPR (live preview, PDF, Word, Excel).
**Out of scope:** Cluster DPR (`/cluster-dpr/create`), admin and reviewer screens beyond the smoke checks in Part A.

> All people, firms, phone numbers, emails, Aadhaar, PAN and Udyam numbers below are **fictional test data** in realistic formats. Do not use real people's identifiers.

---

## How to use this document

1. Do **Part A** once (environment, account, common flow).
2. Do **Part B** (Scheme Finder) to confirm each scheme can be reached from the matcher. It is optional per scheme, because each scheme can also be opened directly from the picker or by URL.
3. For each scheme in **Part C**, open `/individual-dpr/create?new=true&scheme=<CODE>` (or pick the scheme card), then type the values from the step tables in order, using **Next** after each step.
4. After the last step run the scheme's **Generate & verify** checklist, then the **negative / boundary tests**.
5. Log failures with: scheme code, step number, field label, input used, actual vs expected, screenshot. Items under **Discrepancies spotted** are places where the written spec and the code already disagree. Treat them as suspected defects.

Conventions: `₹` = rupees, `L` = lakh (₹1,00,000). Each table says whether a money field is in ₹ or ₹ lakh. Dates use the date picker (`YYYY-MM-DD` shown). "Req?" = blocks **Next** / **Generate** if empty (turn Dev mode off, see A.6). "AUTO" = the app fills or calculates it; verify the shown value.

## Scheme index (step counts as found in the code)

| § | Scheme | Code | Steps |
|---|---|---|---|
| 1 | Vanilla bank term loan — no scheme chosen (`VANILLA` = empty scheme code) | `` | 18 |
| 2 | Prime Minister’s Employment Generation Programme (PMEGP) | `PMEGP` | 14 |
| 3 | 2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units | `PMEGP_2ND` | 14 |
| 4 | Pradhan Mantri MUDRA Yojana — PMMY bank-unit pack | `MUDRA` | 12 |
| 5 | Stand-Up India — bank-unit pack | `STANDUP` | 13 |
| 6 | PM SVANidhi — street-vendor working-capital pack | `SVANIDHI` | 11 |
| 7 | PM Vishwakarma — artisan pack | `VISHWAKARMA` | 12 |
| 8 | CGTMSE — credit guarantee for micro and small enterprises | `CGTMSE` | 12 |
| 9 | PM Formalisation of Micro Food Processing Enterprises | `PMFME` | 14 |
| 10 | Special Credit Linked Capital Subsidy Scheme for SC/ST MSEs | `SCLCSS` | 13 |
| 11 | AP Technology Upgradation Subsidy | `AP_TECH_UPGRADE` | 13 |
| 12 | AP MSME & Entrepreneur Development Policy 4.0 — new-unit capital subsidy | `AP_EDP` | 13 |
| 13 | Emergency Credit Line Guarantee Scheme 5.0 | `ECLGS` | 7 |
| 14 | AP Food Processing Policy 4.0 | `AP_FPP` | 13 |
| 15 | AP Chief Minister's Entrepreneur Programme (AP CMEP) | `AP_CMEP` | 13 |
| 16 | AP MSME-PARKS land rebate | `AP_PARKS` | 11 |
| 17 | AP OBMMS welfare self-employment | `OBMMS` | 11 |
| 18 | RAMP MSE-SPICE (Circular Economy) | `MSE_SPICE` | 12 |
| 19 | EPM Niryat Protsahan | `EPM_NIRYAT` | 7 |
| 20 | RAMP TEAM (ONDC) | `RAMP_TEAM` | 8 |
| 21 | ASPIRE — Promotion of Innovation, Rural Industries and Entrepreneurship | `ASPIRE` | 11 |
| 22 | National Handloom Development Programme | `NHDP` | 11 |
| 23 | Coir Vikas Yojana | `CVY` | 12 |
| 24 | MSE Green Investment and Financing for Transformation | `MSE_GIFT` | 12 |
| 25 | Pharmaceutical Technology Upgradation Assistance Scheme | `PTUAS` | 13 |
| 26 | Pharmaceutical & Medical Devices Promotion and Development Scheme | `PMPDS` | 8 |
| 27 | MSME Sustainable ZED Certification | `ZED` | 8 |
| 28 | MSME Competitive LEAN | `LEAN` | 8 |
| 29 | MSME Innovative — IPR | `MSME_IPR` | 8 |
| 30 | Procurement and Marketing Scheme | `PMS` | 8 |
| 31 | National SC/ST Hub | `SCST_HUB` | 8 |

## Known discrepancies affecting every tester (read first)

Found while writing this document by reading the code. Treat as suspected defects; per-scheme lists are at the end of each scheme section.

1. **Step counts differ from the specs.** Code has 8 steps for ZED/LEAN/MSME_IPR/PMS/SCST_HUB (docs say 5), 11 for ASPIRE/NHDP/AP_PARKS/OBMMS/SVANIDHI (docs say 10), 8 for PMPDS/RAMP_TEAM (docs say 5). This document follows the code.
2. **Funding tolerance.** Generate is blocked unless Means of Finance equals Project Cost to 0.01 lakh, not the 1% the docs state.
3. **Generate needs Privacy → AI assist = ON** on the account.
4. **STANDUP is unreachable from the UI** (no Scheme Finder rule, no picker card). Open it by URL `?scheme=STANDUP`.
5. **Scheme Finder button reads "Know more & create"**, not "Generate DPR for this Match".
6. **NHDP:** uploading the Weaver ID slot overwrites the Step 1 typed ID with `[object Object]`. Upload that slot last and recheck Step 1.
7. **PMEGP / PMEGP_2ND:** the 8th-pass certificate upload slot never appears in the direct flow (its rule needs a Scheme Finder answer).
8. **DSCR shown in two places disagrees** (Step 15 card vs finance panel/report) for the same inputs.
9. **Data check `dates.order` never fires** (reads a field the form does not save).
10. **Vanilla form:** machinery list can vanish while typing when total cost is under ₹5 lakh.
11. **Not run in a browser:** values were verified against the app's own finance, data-check and Scheme Finder code (run outside the UI). Labels and options were read from code. Please report any label mismatch you see on screen.

---

# PART A — Environment, accounts and common flow

## A.1 Environment

| Item | Value |
|---|---|
| API | `cd server && npm run dev` → http://localhost:5000 (API docs at `/api/docs`) |
| UI | `cd client && npm run dev` → http://localhost:5173 |
| Database | MongoDB running; `.env` has `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY` |
| Browsers | Chrome (latest) primary; Safari and Edge for the final smoke pass |
| Screen sizes | 1440×900 desktop, 768×1024 tablet, 390×844 phone (form and live preview must both remain usable) |
| Time | System date 2026-10-16. Planning year 2026-27 |
| Export check | Headless Chrome (Puppeteer) works on the API host, since PDF export depends on it |

## A.2 Seeded accounts (development only)

| Role | Email | Password |
|---|---|---|
| Admin | `rbac.admin@msme.test` | `Rbac-Test-2026` |
| District Reviewer | `rbac.officer@msme.test` | `Rbac-Test-2026` |
| Consultant / entrepreneur | `rbac.consultant@msme.test` | `Rbac-Test-2026` |

## A.3 Register a fresh entrepreneur (test case A-REG)

Open `/register`. Scroll the privacy notice to the end first; the consent box stays disabled until the notice is read.

| # | Field | Input | Notes |
|---|---|---|---|
| 1 | Full Name | `Ravi Teja Kommineni` | Required |
| 2 | Phone Number | `9848276130` | Exactly 10 digits. Typing letters or more digits is stripped |
| 3 | Email | `ravi.kommineni@example.com` | Required, unique |
| 4 | Password | `Msme@Test2026!` | Required |
| 5 | Location | `Guntur, Andhra Pradesh` | |
| 6 | Udyam Number (Optional) | `UDYAM-AP-08-0041257` | Leave blank in one run to prove it is optional |
| 7 | Date of birth | `1991-03-14` | Age 35, so no guardian notice |
| 8 | Privacy notice | scroll to the end | Enables the next box |
| 9 | Account consent | tick | Required |
| 10 | AI assist | tick (run 2: untick) | With it unticked, AI suggestion buttons should explain they are unavailable |
| 11 | Analytics | tick (run 2: untick) | Optional |

Click **Create account**. Expected: success toast, redirect to the Dashboard.

**Register negative tests**

| ID | Input | Expected |
|---|---|---|
| A-REG-N1 | Phone `98482761` (8 digits) | Inline "phone invalid" error, no submit |
| A-REG-N2 | Phone blank | "Phone required" error |
| A-REG-N3 | Date of birth `2012-05-20` (age 14) | Guardian notice appears and scrolls into view; submit follows the under-18 rule in `server/src/lib/under18.ts` |
| A-REG-N4 | Reuse `ravi.kommineni@example.com` | Duplicate-email error, no second account |
| A-REG-N5 | Consent box untouched | Submit blocked |
| A-REG-N6 | Notice not scrolled to the end | Consent checkbox disabled |

## A.4 Login and session (test case A-LOGIN)

| # | Step | Input | Expected |
|---|---|---|---|
| 1 | Open `/login` | email `ravi.kommineni@example.com`, password `Msme@Test2026!` | Dashboard loads |
| 2 | Wrong password `Wrong@1234` | | Error, no session |
| 3 | Idle for the session warning period | | Idle prompt appears; staying active refreshes silently (access token 5 min, sign-out to the login screen after 5 idle minutes, 8 h absolute cap) |
| 4 | Sign out while a draft is open | | Draft saves first. If the save fails you are asked before logging out |
| 5 | Sign in as a different user on the same browser | | None of the previous user's draft, chat or DPR list is visible |

## A.5 Dashboard (A-DASH)

Dashboard lists the latest 5 reports with **Edit** and **Delete**, plus **View all DPRs**. After each scheme test below, confirm the new DPR appears here with the right scheme and a sensible status. Confirm delete shows a confirmation dialog (`docs/delete-confirmation.md`) and **Cancel** keeps the DPR.

## A.6 Common DPR flow (applies to every scheme in Part C)

| Stage | What to do | Expected |
|---|---|---|
| 1. Entry | Open `/individual-dpr/create?new=true&scheme=<CODE>` | **Brief** screen for that scheme: Benefits, Eligibility, How to apply, Documents, FAQs (EN/TE). Button **Next** goes to the form |
| 1b. Picker entry | Open `/individual-dpr/create?new=true` | Scheme card grid; clicking a card shows the same brief. Back reads **All Schemes** |
| 2. Dev mode | Off. Only a super admin sees the flask switch. Leave it **off** to test required-field blocking | Required checks active |
| 3. Fill steps | Type the step tables in order | Stepper ring and % per section update on every keystroke; overall % and milestones (25 / 50 / 75 / 100%) move |
| 4. Autosave | Wait 30 s after a change (unit name needed) | Badge: **Saving…** then **Saved hh:mm** |
| 5. Save Draft | Click **Save Draft** | Toast, badge **Saved** |
| 6. Resume | Leave the page, return to the picker | **Continue where you left off** lists the draft; **Resume** returns to the saved step with all values. Aadhaar/PAN ID-number fields come back blank by design (DPDP) |
| 7. Check my answers | Header button | Groups: Missing / Does not add up / Unclear / Unusual. With the values in this document, **no Missing or Does-not-add-up items** should remain. Report any |
| 8. Live preview | Right panel | Updates as you type; fields editable in the document |
| 9. Preview button | Full-screen read-only final view | Only answered content, saved style, zoom / fit-page, Esc closes |
| 10. Customise / Style | Style tab | Change paper, type, colours, page extras; sample updates |
| 11. Generate | **Generate DPR** on the last step (account Privacy → **AI assist must be ON**, otherwise Generate fails — see Known discrepancies) | If anything is open, the check list shows **Generate anyway**. Then `/dpr/view/:id` |
| 12. Verify | See each scheme's **Generate & verify** | One section per catalog step; numbers match the entry |
| 13. Download | PDF, Word (DOCX), Excel from preview and from **All DPRs** | Files open; contents equal the preview; export is English only |
| 14. Telugu | Switch UI language to Telugu mid-form | Labels switch; typed values stay; export stays English |
| 15. Submit for review | **Submit for review** on the preview | Status becomes `submitted`; it appears in the reviewer queue |
| 16. Reviewer | Log in as `rbac.officer@msme.test` | Opens DPR read-only; **Approve** or **Send back** with remarks |

## A.7 Common field rules observed across schemes

- **Data checks (advisory):** placeholder text (`na`, `test`, `xxx`, `123`), very short narrative answers, the same text pasted into two fields, any amount of 5,000+ lakh, funding total off by more than 1% (minimum 0.05 L) — advisory only; note that **Generate is actually blocked unless funding equals project cost to 0.01 lakh** (see Known discrepancies), grace period not shorter than loan period, production date before commitment date, interest rate under 6% or over 16%, loan period under 12 or over 180 months, own money under 5% of cost, subsidy over 50% of cost, project cost over ₹5 crore, yearly costs above yearly sales, capacity use over 100% or under 30%, break-even over 100%, more than 250 direct jobs.
- **Finance guard (blocks submission):** debt-to-equity above 3:1, promoter share below the minimum, sources not equal to uses.
- **Dates:** date pickers accept 1990–2100; Start must be on or before Commitment.
- **District / Location:** choosing District filters the Location list. Changing District clears a Location not in the new district.
- **Common negative tests for every scheme:** (a) leave a required field empty and press **Next** → blocked with a field-level message; (b) type `test` in a narrative box → Unclear note; (c) make funding total ≠ project cost → Does-not-add-up; (d) close the tab with unsaved changes → browser warning; (e) hit browser Back mid-form → returns to the previous screen without losing the saved draft.

---

# PART B — Scheme Finder (`/venture-match`) test data


**Route:** `/venture-match` (page title "Scheme Finder"). Matching is client-side (`evaluate()` in `client/src/lib/ventureMatch/evaluate.ts`, rules in `schemes.ts`). **Every answer set below was executed through the real `evaluate()` and `analyzeCombinations()` (bundled with esbuild) and the named scheme appears in `matches` with 0 open criteria.** Script: `scratchpad/vm/run.ts`, `neg.ts`, `gen.ts`.

**How to answer:** one card per screen. Single-choice cards advance on click. The owner card (multi) needs the option(s) ticked and then the floating Next (round, right) button. Conditional cards appear only when their trigger is met, so the card count differs (15-18); the tables list only the cards the tester will see, in on-screen order. Cards: Activity, Stage, Support type, [Upgrade intent: only if Stage = Existing business or Reopening], [Quality track: only if Support type = Quality certification], [Special sector: only if Activity = Making goods / Traditional craft / Food processing], Budget, Registration, Owner, [Government procurement: only if owner SC or ST], Domicile, Location, Rice card, Age, Education, Udyam, Old loans, Family job, Where sell.

**What "match" means:** no criterion fails (unknown is allowed, but in these sets everything is answered, so open = 0). "Best-plan lead" = the schemes `analyzeCombinations().core` puts in "In your best plan"; support / short-pack schemes (ZED, LEAN, MSME_IPR, ASPIRE, PMS, NHDP, SCST_HUB etc.) still show as match cards even when they are not plan leads. Result-page header: "Schemes that may suit your answers"; excluded list header "{n} schemes do not match".

### 0.0 Important findings before the cases

1. **STANDUP is not in the Scheme Finder.** `SCHEMES` in `schemes.ts` has no `STANDUP` rule (it exists in the DPR catalog `standupQuestions.ts`, but `grep STANDUP client/src/lib/ventureMatch` returns nothing; the docs table also omits it). It can never appear as a match or in the "do not match" list. Test it by direct URL `/individual-dpr/create?new=true&scheme=STANDUP`. Closest finder answers (woman, ₹50 lakh-1 Cr, new business) yield PMEGP, CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE (verified) - none is STANDUP. Log as a bug/gap if STANDUP is expected in the finder. Verified schemes below: **29 of 30**.
2. **Button label differs from the brief/doc.** The results card button reads **"Know more & create"** (`ventureMatch.knowMoreCreate`). The string "Generate DPR for this Match" exists in en.json (`generateDprForMatch`) but is not referenced in any TSX, so the tester will not see it. Footer button: **"Create DPR"**.
3. `docs/venture-match-business-logic.md` is stale: it describes 14 cards / 16 schemes; code has 15 base cards (Support type is now always asked) plus 4 conditional (Upgrade intent, Quality track, Special sector, Government procurement) = up to 19 defined, 15-18 seen per path, and 29 individual-DPR rules (plus CTA/cluster rules not shown).
4. ASPIRE passes with almost any non-failing answers (location "City or town" is `unknown`, not fail), so it shows up in most sets; only "More than ₹10 crore" budget, non-enterprise activity or a stage of existing/not-sure removes it.
5. Cards CHAMPIONS/ESDP/NTCEC (CTA only) and MSE_CDP/SFURTI/AP_CDP/APICF (cluster) are excluded from `evaluate()` (`isIndividualPickerScheme`), so they never show in the Finder results despite the docs.

### 1. Positive answer sets (one per scheme)

#### `AP_CMEP`  (full)
**Persona:** Sravani Chowdary, 29, woman entrepreneur from Tenali (Guntur), starting a new auto-component machining unit; live in AP; sole owner; wants bank-linked credit of ₹20-50 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Woman |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** AP_CMEP in matches, fit 4/4 passed, 0 open, CMEP booster banner shown. Cards shown: PMEGP, MUDRA, CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_CMEP.

#### `AP_EDP`  (full)
**Persona:** Venkata Ramana Reddy, 41, BC, new plastic-moulding unit as a private limited company in a village near Gudur (Nellore); ₹1-10 Cr project.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹1 crore to ₹10 crore |
| 6 | How is your business registered? | Private or public limited company |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** AP_EDP in matches, fit 7/7 passed, 0 open. Cards shown: PMEGP, CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_EDP.

#### `AP_FPP`  (full)
**Persona:** Lakshmi Prasanna, 36, woman, new mango-pulp processing company in a village near Chittoor; ₹50 lakh-1 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Food processing (for example: bakery, pickle unit, spice grinding) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹50 lakh to ₹1 crore |
| 6 | How is your business registered? | Private or public limited company |
| 7 | Who owns more than half of the business (51% or more)? | Woman |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** AP_FPP in matches, fit 5/5 passed, 0 open. Cards shown: PMEGP, CGTMSE, AP_FPP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_FPP.

#### `AP_PARKS`  (full)
**Persona:** Mohan Krishna Varma, 45, partnership firm taking a plot in an APIIC park near Rajahmundry for a new fabrication unit; ₹1-10 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹1 crore to ₹10 crore |
| 6 | How is your business registered? | Partnership or LLP |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Inside an APIIC industrial park |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** AP_PARKS in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, CGTMSE, AP_EDP, AP_PARKS, AP_CMEP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_EDP (this scheme is a match card but not a plan lead).

#### `AP_TECH_UPGRADE`  (full)
**Persona:** Srinivasa Rao Gudivada, 48, existing CNC job-work unit in Vijayawada upgrading machines; ₹50 lakh-1 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | Upgrade machines / technology |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹50 lakh to ₹1 crore |
| 7 | How is your business registered? | Sole owner (only me) |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | No |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** AP_TECH_UPGRADE in matches, fit 6/6 passed, 0 open. Cards shown: CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, LEAN, MSME_IPR, MSE_GIFT. Best-plan lead(s): AP_TECH_UPGRADE, MSE_GIFT, MSE_SPICE.

#### `ASPIRE`  (short)
**Persona:** Anitha Kumari, 33, village-based idea-stage rural manufacturing start-up near Kadapa; ₹5-10 lakh; not yet registered; will register Udyam.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Only an idea so far — no land, machines, or operations yet |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 6 | How is your business registered? | Not decided yet |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** ASPIRE in matches, fit 4/4 passed, 0 open. Cards shown: MSME_IPR, ASPIRE. Best-plan lead(s): none (support add-ons only) (this scheme is a match card but not a plan lead).

#### `CGTMSE`  (full)
**Persona:** Ravi Teja Naidu, 38, existing service firm (sole owner) in Visakhapatnam needing collateral-free working-capital cover.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Services (for example: salon, clinic, repair shop) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Loan guarantee / extra working capital cover |
| 4 | For your existing unit, what do you want to do? | Only working capital / liquidity |
| 5 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** CGTMSE in matches, fit 4/4 passed, 0 open. Cards shown: MUDRA, CGTMSE, MSE_SPICE, ECLGS. Best-plan lead(s): MSE_SPICE (this scheme is a match card but not a plan lead).

#### `CVY`  (full)
**Persona:** Padma Latha, 40, coir-rope maker in a coastal village near Amalapuram (East Godavari); ₹5-10 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Traditional craft (for example: carpentry, pottery, tailoring, goldsmith) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | Coir |
| 5 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** CVY in matches, fit 3/3 passed, 0 open. Cards shown: VISHWAKARMA, PMEGP, MUDRA, CGTMSE, ASPIRE, CVY. Best-plan lead(s): PMEGP (this scheme is a match card but not a plan lead).

#### `ECLGS`  (short)
**Persona:** Suresh Babu & Partners, partnership service firm in Guntur needing only working-capital top-up.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Services (for example: salon, clinic, repair shop) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Loan guarantee / extra working capital cover |
| 4 | For your existing unit, what do you want to do? | Only working capital / liquidity |
| 5 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 6 | How is your business registered? | Partnership or LLP |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** ECLGS in matches, fit 5/5 passed, 0 open. Cards shown: MUDRA, CGTMSE, MSE_SPICE, ECLGS. Best-plan lead(s): MSE_SPICE (this scheme is a match card but not a plan lead).

#### `EPM_NIRYAT`  (full)
**Persona:** Karthik Reddy, 44, private-limited garment/spice exporter in Hyderabad-Vijayawada corridor; sells abroad; ₹1-10 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹1 crore to ₹10 crore |
| 6 | How is your business registered? | Private or public limited company |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | To other countries |

**Verified:** EPM_NIRYAT in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, CGTMSE, AP_EDP, AP_CMEP, EPM_NIRYAT, MSME_IPR, ASPIRE. Best-plan lead(s): AP_EDP (this scheme is a match card but not a plan lead).

#### `LEAN`  (short)
**Persona:** Naga Malleswari, 42, existing machining unit in Nellore wanting LEAN consulting.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Quality certification or consulting (ZED / LEAN / IPR) |
| 4 | For your existing unit, what do you want to do? | Expand capacity in the same line |
| 5 | Which certification or consulting track fits? | LEAN consulting |
| 6 | Is your unit in one of these special sectors? | No special sector |
| 7 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 8 | How is your business registered? | Sole owner (only me) |
| 9 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 10 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 11 | Where is your business physically located? | City or town (municipality) |
| 12 | Does your family have a White Rice Card? | No |
| 13 | How old are you? | 21 to 50 years |
| 14 | What is the highest class you have passed? | 8th class or higher |
| 15 | Do you have Udyam registration? | Yes |
| 16 | In the last 5 years, did you take a government subsidy loan? | No |
| 17 | Does anyone in your close family have a government job? | No |
| 18 | How do you mainly sell your products? | In a shop or local market |

**Verified:** LEAN in matches, fit 4/4 passed, 0 open. Cards shown: MUDRA, CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, LEAN. Best-plan lead(s): AP_TECH_UPGRADE, MSE_SPICE (this scheme is a match card but not a plan lead).

#### `MSE_GIFT`  (full)
**Persona:** Harish Varma, 50, existing company in Kakinada replacing boilers with green tech; ₹50 lakh-1 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | Upgrade machines / technology |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹50 lakh to ₹1 crore |
| 7 | How is your business registered? | Private or public limited company |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | No |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** MSE_GIFT in matches, fit 5/5 passed, 0 open. Cards shown: CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, LEAN, MSME_IPR, MSE_GIFT. Best-plan lead(s): AP_TECH_UPGRADE, MSE_GIFT, MSE_SPICE.

#### `MSE_SPICE`  (full)
**Persona:** Prasad Rao, 46, existing unit in Ongole expanding; wants MSE-SPICE.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | Expand capacity in the same line |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 7 | How is your business registered? | Sole owner (only me) |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | No |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** MSE_SPICE in matches, fit 3/3 passed, 0 open. Cards shown: MUDRA, CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, LEAN, MSME_IPR. Best-plan lead(s): AP_TECH_UPGRADE, MSE_SPICE.

#### `MSME_IPR`  (short)
**Persona:** Divya Sree, 27, software/IP start-up (knowledge economy) in Visakhapatnam seeking IPR/incubation.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Knowledge economy & tech services (IT/ITeS, software, biotech, R&D) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Quality certification or consulting (ZED / LEAN / IPR) |
| 4 | Which certification or consulting track fits? | IPR / design / incubation |
| 5 | How much money do you need to set this up? | ₹10 lakh to ₹20 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** MSME_IPR in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, AP_CMEP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_CMEP (this scheme is a match card but not a plan lead).

#### `MUDRA`  (full)
**Persona:** Sai Kiran, 25, new mobile-repair shop in Eluru; ₹2-5 lakh; below 8th class; will register Udyam.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Services (for example: salon, clinic, repair shop) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | How much money do you need to set this up? | ₹2 lakh to ₹5 lakh |
| 5 | How is your business registered? | Sole owner (only me) |
| 6 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 7 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 8 | Where is your business physically located? | City or town (municipality) |
| 9 | Does your family have a White Rice Card? | No |
| 10 | How old are you? | 21 to 50 years |
| 11 | What is the highest class you have passed? | Below 8th class |
| 12 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 13 | In the last 5 years, did you take a government subsidy loan? | No |
| 14 | Does anyone in your close family have a government job? | No |
| 15 | How do you mainly sell your products? | In a shop or local market |

**Verified:** MUDRA in matches, fit 5/5 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, ASPIRE. Best-plan lead(s): PMEGP (this scheme is a match card but not a plan lead).

#### `NHDP`  (short)
**Persona:** Chandrakala, 52, handloom weaver at Dharmavaram (Anantapur) village; ₹5-10 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Traditional craft (for example: carpentry, pottery, tailoring, goldsmith) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | Handloom / weaving |
| 5 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** NHDP in matches, fit 2/2 passed, 0 open. Cards shown: VISHWAKARMA, PMEGP, MUDRA, CGTMSE, ASPIRE, NHDP. Best-plan lead(s): PMEGP (this scheme is a match card but not a plan lead).

#### `OBMMS`  (full)
**Persona:** Gangadhar Yadav, 34, BC, White Rice Card holder, new unregistered kirana/trade unit in a village near Srikakulam.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Buying and selling (for example: kirana shop, cloth shop) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 5 | How is your business registered? | No firm yet — not registered |
| 6 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 7 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 8 | Where is your business physically located? | Village (gram panchayat) |
| 9 | Does your family have a White Rice Card? | Yes |
| 10 | How old are you? | 21 to 50 years |
| 11 | What is the highest class you have passed? | 8th class or higher |
| 12 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 13 | In the last 5 years, did you take a government subsidy loan? | No |
| 14 | Does anyone in your close family have a government job? | No |
| 15 | How do you mainly sell your products? | In a shop or local market |

**Verified:** OBMMS in matches, fit 8/8 passed, 0 open. Cards shown: OBMMS, ASPIRE. Best-plan lead(s): OBMMS.

#### `PMEGP`  (full)
**Persona:** Anusha Devi, 30, woman, new village agarbatti/mfg unit near Madanapalle; ₹10-20 lakh; 8th pass.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹10 lakh to ₹20 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Woman |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PMEGP in matches, fit 6/6 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE. Best-plan lead(s): AP_CMEP (this scheme is a match card but not a plan lead).

#### `PMEGP_2ND`  (full)
**Persona:** Bhaskar Rao, 43, existing PMEGP-assisted unit, subsidy loan fully repaid, applying for 2nd loan.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | 2nd PMEGP loan on an existing assisted unit |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹10 lakh to ₹20 lakh |
| 7 | How is your business registered? | Sole owner (only me) |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | Yes, but I have fully repaid it |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PMEGP_2ND in matches, fit 7/7 passed, 0 open. Cards shown: MUDRA, CGTMSE, MSE_SPICE, PMEGP_2ND, LEAN, MSME_IPR. Best-plan lead(s): PMEGP_2ND.

#### `PMFME`  (full)
**Persona:** Rukmini Devi, 39, pickle & spice micro unit in Guntur town; ₹5-10 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Food processing (for example: bakery, pickle unit, spice grinding) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PMFME in matches, fit 4/4 passed, 0 open. Cards shown: PMFME, PMEGP, MUDRA, CGTMSE, AP_FPP, MSME_IPR, ASPIRE. Best-plan lead(s): PMFME, AP_FPP.

#### `PMPDS`  (full)
**Persona:** Dr. Vamsi Krishna, 47, pharma formulation private limited company near Visakhapatnam; ₹1-10 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | Pharma / medical devices |
| 5 | How much money do you need to set this up? | ₹1 crore to ₹10 crore |
| 6 | How is your business registered? | Private or public limited company |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PMPDS in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE, PMPDS. Best-plan lead(s): AP_EDP (this scheme is a match card but not a plan lead).

#### `PMS`  (short)
**Persona:** Rajeswari Textiles, existing trade unit in Machilipatnam wanting trade-fair support.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Buying and selling (for example: kirana shop, cloth shop) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Trade fair / marketing support |
| 4 | For your existing unit, what do you want to do? | Expand capacity in the same line |
| 5 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 6 | How is your business registered? | Sole owner (only me) |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PMS in matches, fit 3/3 passed, 0 open. Cards shown: MUDRA, CGTMSE, MSE_SPICE, PMS. Best-plan lead(s): MSE_SPICE (this scheme is a match card but not a plan lead).

#### `PTUAS`  (full)
**Persona:** Satya Pharma Pvt Ltd, existing pharma unit in Anakapalli upgrading technology; ₹1-10 Cr.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | Upgrade machines / technology |
| 5 | Is your unit in one of these special sectors? | Pharma / medical devices |
| 6 | How much money do you need to set this up? | ₹1 crore to ₹10 crore |
| 7 | How is your business registered? | Private or public limited company |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | No |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** PTUAS in matches, fit 6/6 passed, 0 open. Cards shown: CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, LEAN, MSME_IPR, MSE_GIFT, PTUAS, PMPDS. Best-plan lead(s): AP_TECH_UPGRADE, MSE_GIFT, PTUAS, MSE_SPICE.

#### `RAMP_TEAM`  (full)
**Persona:** Bhavya Sri, 31, sole-owner trader in Tirupati selling handloom sarees online (ONDC).

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Buying and selling (for example: kirana shop, cloth shop) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 5 | How is your business registered? | Sole owner (only me) |
| 6 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 7 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 8 | Where is your business physically located? | City or town (municipality) |
| 9 | Does your family have a White Rice Card? | No |
| 10 | How old are you? | 21 to 50 years |
| 11 | What is the highest class you have passed? | 8th class or higher |
| 12 | Do you have Udyam registration? | Yes |
| 13 | In the last 5 years, did you take a government subsidy loan? | No |
| 14 | Does anyone in your close family have a government job? | No |
| 15 | How do you mainly sell your products? | Online (ONDC or other websites) |

**Verified:** RAMP_TEAM in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, RAMP_TEAM, ASPIRE. Best-plan lead(s): PMEGP (this scheme is a match card but not a plan lead).

#### `SCLCSS`  (full)
**Persona:** Ramesh Babu Mala, 44, SC entrepreneur, existing manufacturing unit near Ongole upgrading technology; ₹20-50 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | Existing business (I want to expand or upgrade) |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | For your existing unit, what do you want to do? | Upgrade machines / technology |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 7 | How is your business registered? | Sole owner (only me) |
| 8 | Who owns more than half of the business (51% or more)? | Scheduled Caste (SC) |
| 9 | Are you interested in selling to government / GeM? | Yes |
| 10 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 11 | Where is your business physically located? | City or town (municipality) |
| 12 | Does your family have a White Rice Card? | No |
| 13 | How old are you? | 21 to 50 years |
| 14 | What is the highest class you have passed? | 8th class or higher |
| 15 | Do you have Udyam registration? | Yes |
| 16 | In the last 5 years, did you take a government subsidy loan? | No |
| 17 | Does anyone in your close family have a government job? | No |
| 18 | How do you mainly sell your products? | In a shop or local market |

**Verified:** SCLCSS in matches, fit 7/7 passed, 0 open. Cards shown: MUDRA, CGTMSE, AP_TECH_UPGRADE, MSE_SPICE, SCLCSS, LEAN, MSME_IPR, SCST_HUB, MSE_GIFT. Best-plan lead(s): SCLCSS, AP_TECH_UPGRADE, MSE_GIFT, MSE_SPICE.

#### `SCST_HUB`  (short)
**Persona:** ST entrepreneur Rajesh Koya, 37, service firm near Paderu wanting GeM/procurement support.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Services (for example: salon, clinic, repair shop) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | How much money do you need to set this up? | ₹5 lakh to ₹10 lakh |
| 5 | How is your business registered? | Sole owner (only me) |
| 6 | Who owns more than half of the business (51% or more)? | Scheduled Tribe (ST) |
| 7 | Are you interested in selling to government / GeM? | Yes |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | City or town (municipality) |
| 10 | Does your family have a White Rice Card? | No |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | Yes |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** SCST_HUB in matches, fit 3/3 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, SCST_HUB, ASPIRE. Best-plan lead(s): PMEGP (this scheme is a match card but not a plan lead).

#### `SVANIDHI`  (full)
**Persona:** Mastan Vali, 35, street food cart vendor in Nellore town; below ₹2 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Street vending (for example: food cart or market stall) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | How much money do you need to set this up? | Less than ₹2 lakh |
| 5 | How is your business registered? | No firm yet — not registered |
| 6 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 7 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 8 | Where is your business physically located? | City or town (municipality) |
| 9 | Does your family have a White Rice Card? | Yes |
| 10 | How old are you? | 21 to 50 years |
| 11 | What is the highest class you have passed? | Below 8th class |
| 12 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 13 | In the last 5 years, did you take a government subsidy loan? | No |
| 14 | Does anyone in your close family have a government job? | No |
| 15 | How do you mainly sell your products? | In a shop or local market |

**Verified:** SVANIDHI in matches, fit 3/3 passed, 0 open. Cards shown: SVANIDHI, OBMMS, ASPIRE. Best-plan lead(s): OBMMS, SVANIDHI.

#### `VISHWAKARMA`  (full)
**Persona:** Ramulu Achari, 42, traditional carpenter in a village near Nandyal; ₹2-5 lakh.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Traditional craft (for example: carpentry, pottery, tailoring, goldsmith) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Bank loan or capital subsidy |
| 4 | Is your unit in one of these special sectors? | No special sector |
| 5 | How much money do you need to set this up? | ₹2 lakh to ₹5 lakh |
| 6 | How is your business registered? | No firm yet — not registered |
| 7 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 8 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 9 | Where is your business physically located? | Village (gram panchayat) |
| 10 | Does your family have a White Rice Card? | Yes |
| 11 | How old are you? | 21 to 50 years |
| 12 | What is the highest class you have passed? | 8th class or higher |
| 13 | Do you have Udyam registration? | No, but I am ready to register (it is free) |
| 14 | In the last 5 years, did you take a government subsidy loan? | No |
| 15 | Does anyone in your close family have a government job? | No |
| 16 | How do you mainly sell your products? | In a shop or local market |

**Verified:** VISHWAKARMA in matches, fit 4/4 passed, 0 open. Cards shown: VISHWAKARMA, OBMMS, ASPIRE. Best-plan lead(s): VISHWAKARMA, OBMMS.

#### `ZED`  (short)
**Persona:** Kiran Kumar Industries, 40, existing mfg unit in Guntur seeking ZED certification.

| # | Card (exact on-screen title) | Select (exact option label) |
|---|---|---|
| 1 | What kind of work do you want to do? | Making goods (for example: machines, plastic items, metal work) |
| 2 | Is this a new business, an existing one, or only an idea? | New business |
| 3 | What support are you looking for first? | Quality certification or consulting (ZED / LEAN / IPR) |
| 4 | Which certification or consulting track fits? | ZED certification |
| 5 | Is your unit in one of these special sectors? | No special sector |
| 6 | How much money do you need to set this up? | ₹20 lakh to ₹50 lakh |
| 7 | How is your business registered? | Sole owner (only me) |
| 8 | Who owns more than half of the business (51% or more)? | Backward Class (BC) or Minority |
| 9 | Do you live in Andhra Pradesh? | Yes, I live in Andhra Pradesh |
| 10 | Where is your business physically located? | City or town (municipality) |
| 11 | Does your family have a White Rice Card? | No |
| 12 | How old are you? | 21 to 50 years |
| 13 | What is the highest class you have passed? | 8th class or higher |
| 14 | Do you have Udyam registration? | Yes |
| 15 | In the last 5 years, did you take a government subsidy loan? | No |
| 16 | Does anyone in your close family have a government job? | No |
| 17 | How do you mainly sell your products? | In a shop or local market |

**Verified:** ZED in matches, fit 4/4 passed, 0 open. Cards shown: PMEGP, MUDRA, CGTMSE, AP_EDP, AP_CMEP, ZED, ASPIRE. Best-plan lead(s): AP_EDP (this scheme is a match card but not a plan lead).

### 2. Negative cases (verified by running `evaluate()`)

Start from the named positive set and change only the stated card; go to the results and open the "do not match" list (or watch the "schemes ruled out" strip under the card under the cards). Texts are the exact English criterion strings.

| # | Base set | Change (card -> exact label) | Must be EXCLUDED | Exclusion reason shown | Also verified |
|---|---|---|---|---|---|
| N1 | PMEGP | What kind of work -> "I am not starting a business unit" (sector card disappears) | PMEGP, MUDRA, AP_CMEP, ZED (all 29 fail) | "Must be a non-farm enterprise (making, services, trade, or mixed)"; AP_CMEP: "AP CMEP is strictly for Manufacturing or Knowledge Economy ventures."; ZED also "Must be starting or running a business unit, not a job search" | 0 matches; results shows empty state. "Still deciding" behaves the same (blocksAllSchemes) |
| N2 | PMEGP | How old -> "Below 18 years" | PMEGP, MUDRA, SVANIDHI, VISHWAKARMA | "You must be 18 years or older" | Remaining matches (CGTMSE, AP_EDP, AP_CMEP, MSME_IPR, ASPIRE) show but **no "Know more & create" button** and the footer Create DPR is disabled (`under18`); guardian notice shown on Age card |
| N3 | PMEGP | What kind of work -> "Growing crops on a farm" | PMEGP, MUDRA, CGTMSE, AP_EDP | "Must be a non-farm enterprise (making, services, trade, or mixed)"; AP_EDP "Must make or produce goods" | 0 matches |
| N4 | PMEGP | Stage -> "Existing business (I want to expand or upgrade)" (Upgrade card appears: pick "Expand capacity in the same line") | PMEGP, AP_EDP, AP_CMEP | "Must be a new business" | AP_TECH_UPGRADE, MSE_SPICE, LEAN now match |
| N5 | PMEGP (Making goods, ₹10-20 lakh) | Education -> "Below 8th class" | PMEGP | "If the project is large, you must have passed 8th class (₹10 lakh for making goods, ₹5 lakh for services)" | MUDRA, CGTMSE, AP_EDP, AP_CMEP still match (no education gate) |
| N6 | AP_CMEP | Live in AP -> "No, I live in another state" | AP_CMEP, AP_EDP, OBMMS | AP_CMEP "AP CMEP requires Andhra Pradesh local domicile."; AP_EDP "You must live in Andhra Pradesh" | PMEGP, MUDRA, CGTMSE (central) still match |
| N7 | VISHWAKARMA | Family job -> "Yes" | VISHWAKARMA | "No close family member should have a government job" | |
| N8 | PMEGP | Project cost -> "No money needed" | PMEGP, AP_CMEP, AP_EDP | "Must have a project cost (not zero and not unknown)"; AP_CMEP "AP CMEP requires a bank-linked credit loan."; PMEGP also shows the education line | only MSME_IPR, ASPIRE left |
| N9 | MSE_SPICE | Udyam -> "No, and I do not want to register" | MSE_SPICE, MUDRA, CGTMSE | "Must have Udyam registration, or be ready to get it" | AP_TECH_UPGRADE still matches (no Udyam rule) |
| N10 | OBMMS | Rice card -> "No" | OBMMS | "Must have a White Rice Card" | |
| N11 | SCLCSS | Owner -> "General category man" (Government procurement card disappears) | SCLCSS, SCST_HUB | "Main owner must be SC or ST (51%+)" | Ownership hint card ("put the firm in wife/mother's name") appears |
| N12 | PMEGP_2ND | Old loans -> "Yes, I still have an unpaid subsidy loan" | PMEGP_2ND | "Prior subsidy loan should be fully repaid" | |
| N13 | PMEGP | How registered -> "No firm yet - not registered" | PMEGP, MUDRA, AP_PARKS | PMEGP "Must be a registered sole owner, partnership, or company"; MUDRA "Must have a registered firm (not “no firm yet”)" | AP_CMEP still matches (no legal rule) |
| N14 | MUDRA | Project cost -> "₹50 lakh to ₹1 crore" | MUDRA | "MUDRA loan is up to ₹20 lakh" | |
| N15 | PMFME | Project cost -> "₹1 crore to ₹10 crore" | PMFME | "Project cost must be up to about ₹50 lakh" | |
| N16 | AP_EDP | Where located -> "From home (no shop or plot)" | AP_EDP, AP_PARKS | AP_EDP "The unit must be in a city, village, or APIIC park in Andhra Pradesh (not from home)"; AP_PARKS "Unit must be inside an APIIC industrial park" | |
| N17 | ZED | Support type -> "Bank loan or capital subsidy" (Quality card disappears) | ZED | "Looking for quality / certification support" | |
| N18 | AP_CMEP | Kind of work -> "Services (for example: salon, clinic, repair shop)" (sector card disappears) | AP_CMEP, AP_EDP | "AP CMEP is strictly for Manufacturing or Knowledge Economy ventures."; "Must make or produce goods" | |

Notes: Step-level strip: after each card the page shows newly failing schemes ("stepExclusions") using answers up to the previous card only, and the counter "remaining" (`ventureMatch.remaining`) shows 0 for N1.

### 3. Handoff check (run for every positive set)

1. On the results screen, find the card of the scheme under test; press **Know more & create** (bottom-right of the card). It is absent for under-18 answers and for CTA/cluster schemes (not in this list).
2. Browser URL must become exactly `/individual-dpr/create?new=true&scheme=<CODE>` (e.g. `...&scheme=PMFME`; `encodeURIComponent` leaves codes like `AP_CMEP`, `PMEGP_2ND` unchanged). `short`-route schemes (ZED, LEAN, MSME_IPR, ECLGS, SCST_HUB, ASPIRE, PMS, NHDP) use the same URL; `PMPDS` and others use `full`.
3. The page opens on the **scheme brief ("know more") phase**, not the form and not the scheme-picker cards (`setSetupPhase('brief')` when `scheme` is present). Step 1 form fields must be **empty** (no business name, sector, legal status, budget prefilled): `IndividualDPRCreation.tsx` only calls `setVentureMatchAnswers(answers)` (used for upload/MUDRA-band overlay rules) and `setMatchedSchemeCode(scheme)`; there is no prefill (`buildDprPrefill` is used only by `/dpr/builder`).
4. DevTools check: `localStorage` key `venture-match-handoff` (suffixed `:<userId>` when logged in) holds `{answers, matches}`; it is read with `peekHandoff` and is not deleted on open.
5. Footer **Create DPR** (not scheme-specific) must go to `/individual-dpr/create?new=true` (no `scheme`) and show the picker cards.
6. Back in the Finder, **Start again** clears answers and `venture-match-progress`; Previous on results returns to the last card with answers kept.
7. STANDUP: no card exists; verify by direct URL only (see 0.0 item 1).


---

# PART C — Scheme DPR test data (every step, every input)

## 1. Vanilla bank term loan — no scheme chosen (`VANILLA` = empty scheme code)
**Entry:** open `/individual-dpr/create?new=true` (no `scheme=` parameter). The page "Create DPR" shows the card grid "Choose how to draft this DPR". Click the card titled **"Bank term loan (no scheme overlay)"** (the first/vanilla card), read the brief page, then click **"Start DPR steps"**. The header scheme drop-down must read **"Vanilla bank term loan (standard individual DPR)"**. Header shows "Step 1 of 18". Pre-condition: the logged-in account has Privacy "AI assist" switched ON (Generate calls an AI-consent-protected endpoint; see Negative tests). **Total steps:** 18.

**Test persona (keep identical in every step):** Kolluri Srinivasa Rao (48) and his wife Kolluri Padmavathi (44) run M/s Sri Annapurna Aqua Industries, a partnership firm in **Tenali, Guntur district** (plot in the Chenchupet industrial area; mandal: Tenali). Srinivasa Rao worked 14 years as an RO-plant installer/service technician and now distributes 20-litre jars for another brand. They want a bank term loan from State Bank of India, Tenali Main Branch, to set up their own **packaged drinking water plant** (RO + UV + ozone, 12,000 litres/day) making 20-litre jars and 1-litre bottles under their own brand "Sri Annapurna Aqua". Unit is new (planning year 2026-27), manufacturing/processing, 9 direct jobs. Project cost ₹36.00 lakh, own 30%, bank 70%, no subsidy.

**Conventions used in all three sections of this document.**
- *Textarea* fields are read-only boxes with a small expand icon: click the box, an enlarged editor opens, type/paste the text, press **Confirm** (or Ctrl/Cmd+Enter). Nothing is saved until Confirm. Plain text inputs, numbers, dates and drop-downs are edited in place.
- Money fields say "₹ Lakhs" in the label (1 lakh = ₹1,00,000). Type 2-decimal values exactly as shown (e.g. `4.00`). Totals are shown with `toLocaleString` so `36.00` appears as "36" and `14.60` as "14.6".
- **Req?** column: `Yes` = empty value blocks **Next** ("Fill the required fields before continuing: …", red ring); `* (not enforced)` = red asterisk on screen but the code does not block; `No` = optional.
- Optional AI buttons ("Fill this step" strip on top of each step, "Match me", "Improve this") exist but this document is manual-input only. Step 1 is always manual. Do not use them while testing exact values.
- **Next** (bottom of the form) auto-saves the draft; the header also has **Save Draft**, **Check my answers**, and **Generate DPR** (enabled only on the last step). The right-hand pane is the live preview.
- Placeholder-like text (`test`, `na`, `xxx`, digits only) is flagged by "Check my answers". Every narrative below is at least the minimum length the data-checks want (nature ≥ 12 chars, intro ≥ 30, process ≥ 30) and no two narratives are identical.

### Step 1 — Your unit – basic details
Scheme-specific panels: none for vanilla. Header after this step: Next to Step 2.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | Sri Annapurna Aqua Packaged Water Plant | Becomes cover title (also stored as legacy clusterName). Optional button "Suggest title" needs Nature + Products filled first. |
| 2 | District * | Dropdown | Yes | Guntur | 26 AP districts in the list. Changing the district clears Location. |
| 3 | Location * | Dropdown | Yes | Tenali | Disabled until a district is chosen (shows "Select district first"). List for Guntur: Guntur, Tenali, Ponnur, Mangalagiri, Tadepalli, Prathipadu, Vatticherukuru. There is no village/mandal field on this step. |
| 4 | Nature of Business | Text input | No | Packaged drinking water manufacturing (RO + UV treated) | ≥ 12 characters or the data check says "very short". The "Match me" button would map it to a skill from a fixed list; type your own text, do not click it. |
| 5 | Major Products | Text input | No | 20-litre water jars, 1-litre bottles (cartons of 12) | Used (with Nature) to detect business kind = manufacturing in Step 12. |


### Step 2 — Sector overview

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / Industry Type * | Text input | Yes | Food and beverage – packaged drinking water | Label shows red *. |
| 2 | Sector Description * | Textarea (click opens enlarge dialog: type, then Confirm) | Yes | Packaged drinking water is a fast-growing segment of the food and beverage industry in Andhra Pradesh. Households, hospitals, hostels, offices, function halls and shops in towns like Tenali increasingly buy 20-litre jars and 1-litre bottles because borewell water in the Krishna delta is often high in TDS and hardness. A small RO plant with UV and ozone disinfection can serve a 25 km radius with daily doorstep delivery. | Required (≥ 30 chars). |
| 3 | National Importance | Textarea (click opens enlarge dialog: type, then Confirm) | No | Safe drinking water is a national priority under the Jal Jeevan Mission and the Swachh Bharat programme. Packaged water is regulated by the FSSAI and must follow BIS standard IS 14543, which has created steady demand for licensed small bottlers who can supply tested water to towns not yet fully covered by piped supply. |  |
| 4 | State-level Importance | Textarea (click opens enlarge dialog: type, then Confirm) | No | Andhra Pradesh has a large, fast-urbanising population along the Krishna-Guntur belt and many hostels, hospitals, wedding halls and offices. The state's MSME policy encourages food processing and agro-based units in district industrial areas, and Guntur district has a strong base of small manufacturers and dealers who can distribute the product. |  |
| 5 | Key Products – row 1 | Text input (click "Add Product") | No | 20-litre packaged drinking water jar (BIS IS 14543) | Click **Add Product** to create each new row (placeholder "Enter product name"). Trash icon removes a row. |
| 6 | Key Products – row 2 | Text input | No | 1-litre packaged drinking water bottle (carton of 12) |  |
| 7 | Key Products – row 3 | Text input | No | Reusable 20-litre PET jar (refundable deposit scheme) | Expect 3 rows listed in preview. |


### Step 3 — District & location

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Geography | Textarea (click opens enlarge dialog: type, then Confirm) | No | Tenali is a municipal town in Guntur district on the Krishna delta, about 25 km from Guntur and 40 km from Vijayawada. The unit site is a 400 sq. yd. plot in the Chenchupet industrial area, with flat land, a 30 ft internal road and a borewell of good yield. |  |
| 2 | Climate | Text input | No | Hot and humid; summer up to 42 C, rainfall about 900 mm a year; peak water demand March to June |  |
| 3 | Infrastructure | Textarea (click opens enlarge dialog: type, then Confirm) | No | Three-phase power from APSPDCL, own borewell so no dependence on municipal supply, all-weather road, mobile and broadband coverage, banks, transporters and packaging dealers within 5 km. |  |
| 4 | Key Economic Activities | Textarea (click opens enlarge dialog: type, then Confirm) | No | Paddy and banana farming, rice mills, chilli and cotton trading, small engineering workshops and retail trade serving the Krishna delta. |  |
| 5 | Raw Material Availability | Textarea (click opens enlarge dialog: type, then Confirm) | No | Raw water from the plot's own borewell; PET preforms, caps, labels, cartons and RO chemicals are available from packaging dealers in Vijayawada and Guntur with 1-2 day delivery. |  |
| 6 | Raw Material Quantity | Text input | No | About 20,000 litres of raw borewell water per day (60% RO recovery gives 12,000 litres treated) |  |
| 7 | Industrial Infrastructure | Textarea (click opens enlarge dialog: type, then Confirm) | No | Chenchupet industrial area has three-phase power, approach roads, a few engineering and packaging units and a drain for RO reject water. |  |
| 8 | Road (under heading "Connectivity") | Text input | No | NH-16 at about 20 km; Guntur-Tenali-Repalle state highway at 2 km | Three separate inputs under the "Connectivity" sub-heading. |
| 9 | Rail | Text input | No | Tenali Junction railway station, 3 km, on the Vijayawada-Chennai main line |  |
| 10 | Port | Text input | No | Machilipatnam port about 90 km; Krishnapatnam port about 190 km |  |


### Step 4 — Your unit profile

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present Activities | Textarea (click opens enlarge dialog: type, then Confirm) | No | The promoters have 14 years of experience installing and servicing RO plants and now distribute 20-litre jars for another brand. They propose to start their own licensed packaged drinking water plant in Tenali to supply jars and bottles directly to retailers and institutions. | ≥ 30 chars. |
| 2 | Year of Establishment | Number input | No | 2026 | Plain 4-digit year (not a date) for vanilla; min 1900, max current year (2026). Placeholder "YYYY". |
| 3 | Technology Level | Text input | No | Semi-automatic: multi-stage pre-treatment, reverse osmosis, ozonation and UV disinfection with semi-automatic jar and bottle filling |  |
| 4 | Production Capacity | Text input | No | 12,000 litres per day (about 600 jars of 20 litres) in one 8-hour shift |  |
| 5 | How your unit evolved | Textarea (click opens enlarge dialog: type, then Confirm) | No | The promoters started as RO service technicians in 2012 and built a customer base of about 150 households and shops. After running a jar distribution agency for three years they decided to manufacture their own brand to improve margins and quality control. |  |
| 6 | Type of unit | Text input | No | Micro manufacturing unit (partnership firm) |  |
| 7 | Stakeholders | Textarea (click opens enlarge dialog: type, then Confirm) | No | Partners, State Bank of India, APSPDCL, FSSAI, BIS, Pollution Control Board, jar and bottle distributors | Comma-separated; becomes 7 list items. |


### Step 5 — Value chain
Order of fields on screen: Raw Materials, Intermediate Products, Final Products, Value Addition Stages, Major Buyers. Enter in that order.

**Raw Materials (click **Add Raw Material** per row; two inputs per row)**

| Row | Input 1 (placeholder "Material name") | Input 2 (placeholder "Source") |
|---|---|---|
| 1 | Borewell water (raw water) | Own borewell, Chenchupet plot |
| 2 | PET preforms and 1-litre bottle caps | Packaging dealer, Vijayawada |
| 3 | 20-litre jar caps, seals and labels | Label printer, Guntur |
| 4 | RO membranes, antiscalant and filter cartridges | Aqua Tech Water Systems, Vijayawada |

**Final Products (click **Add Final Product**; one text input per row)**

| Row | Input (placeholder "Enter final product") |
|---|---|
| 1 | 20-litre packaged drinking water jar |
| 2 | 1-litre packaged drinking water bottle |

**Value Addition Stages (click **Add Value Addition Stage**; stage name + number)**

The label says "Selling price (₹ Lakhs)"; for the test treat it as yearly sales value created up to that stage.

| Row | Stage name | Selling price (₹ Lakhs) |
|---|---|---|
| 1 | Raw water pre-treatment and reverse osmosis (treated bulk water) | 18.00 |
| 2 | Disinfection, jar washing and filling | 42.00 |
| 3 | Branded sealing, coding and doorstep delivery | 51.00 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Intermediate Products | Textarea (click opens enlarge dialog: type, then Confirm) | No | Filtered water, RO treated water, ozonated and UV-disinfected water in storage tank | Comma-separated list (3 items). |
| 2 | Major Buyers | Textarea (click opens enlarge dialog: type, then Confirm) | No | Retail kirana and tea shops in Tenali, Hospitals and nursing homes, Student hostels, Function halls, Government and private offices | Comma-separated (5 items). |


### Step 6 — Market

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target Market | Textarea (click opens enlarge dialog: type, then Confirm) | No | Retail shops, hostels, hospitals, function halls and offices within 25 km of Tenali, served by two delivery autos on fixed daily routes. |  |
| 2 | Existing Demand | Textarea (click opens enlarge dialog: type, then Confirm) | No | A survey of 60 shops and 12 hostels done by the promoters shows a daily need of about 900 jars; existing suppliers from Guntur and Vijayawada deliver late and raise prices in summer. |  |
| 3 | Demand-Supply Gap | Textarea (click opens enlarge dialog: type, then Confirm) | No | Local plants meet only about 60% of summer demand; buyers complain about irregular delivery, TDS variation and leaking jars. |  |
| 4 | Competitor Analysis | Textarea (click opens enlarge dialog: type, then Confirm) | No | Four small plants in Tenali and branded jars from Guntur sell at Rs 25-35 per jar. Our edge is BIS-licensed quality, daily delivery and a refundable jar deposit. |  |
| 5 | Price Trends | Textarea (click opens enlarge dialog: type, then Confirm) | No | The price of a 20-litre jar in Tenali has risen from Rs 22 to Rs 30 over the last three years; 1-litre bottles retail at Rs 10-20. |  |
| 6 | Export Potential | Textarea (click opens enlarge dialog: type, then Confirm) | No | No direct export planned; supply is limited to Tenali and neighbouring mandals and the district headquarters. |  |


### Step 7 — Gaps

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Technology Gaps | Textarea (click opens enlarge dialog: type, then Confirm) | No | Most local suppliers use basic filters without ozone or regular TDS testing, so water quality varies from batch to batch. |  |
| 2 | Infrastructure Gaps | Textarea (click opens enlarge dialog: type, then Confirm) | No | Few plants have a covered filling hall, hygienic jar washing or a proper storage room; power cuts interrupt continuous operation. |  |
| 3 | Skill Gaps | Textarea (click opens enlarge dialog: type, then Confirm) | No | Trained RO operators and quality-control technicians are scarce in Tenali; the promoters will train the staff. |  |
| 4 | Marketing Gaps | Textarea (click opens enlarge dialog: type, then Confirm) | No | Small plants lack branding, regular institutional contracts and simple phone or online ordering. |  |
| 5 | Financial Gaps | Textarea (click opens enlarge dialog: type, then Confirm) | No | Small bottlers find it hard to raise a term loan for plant and working capital without a bank-ready project report. |  |
| 6 | Justification for Intervention | Textarea (click opens enlarge dialog: type, then Confirm) | No | A bank-financed licensed plant with proper treatment, testing and branded packaging will meet local demand, create nine jobs and give hospitals, hostels and offices in Tenali a safe and reliable supply of drinking water. |  |


### Step 8 — SWOT
The SWOT section exists only in the vanilla (18-step) path; PMEGP and PMEGP_2ND have no SWOT or value-chain step.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Strengths | Textarea (click opens enlarge dialog: type, then Confirm) | No | 14 years of RO technical experience, Own borewell with good yield, Plot with three-phase power, Existing customer base of about 150 shops and households | Each box is a comma-separated list (4 items each). Avoid commas inside an item. Preview shows them as a list. |
| 2 | Weaknesses | Textarea (click opens enlarge dialog: type, then Confirm) | No | New brand with no market share yet, Dependence on a single borewell, Limited working capital, Seasonal demand variation |  |
| 3 | Opportunities | Textarea (click opens enlarge dialog: type, then Confirm) | No | Rising demand from hostels and hospitals, Wedding and function season sales, Institutional contracts with offices and colleges, Government push for safe drinking water |  |
| 4 | Threats | Textarea (click opens enlarge dialog: type, then Confirm) | No | Competition from established brands, Water quality or licence violations, Power cost increases, Falling borewell yield in summer |  |


### Step 9 — What you plan to do

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Intervention Type * | Dropdown | Yes | Hard | Options: Select type / Hard / Soft / Both. Blocks Next when empty. (Preview/PDF calls this field "Activity type".) |
| 2 | Description | Textarea (click opens enlarge dialog: type, then Confirm) | No | Establish a new 12,000 litres per day packaged drinking water plant with RO, UV and ozone treatment, a jar washing-filling machine, a bottle filling machine, a storage room and a delivery system for jars and bottles. |  |
| 3 | Objectives | Textarea (click opens enlarge dialog: type, then Confirm) | No | Produce BIS-standard drinking water, Create nine direct jobs, Build a branded supply to 150 retail points, Repay the term loan within 7 years | Comma-separated (4 items). |
| 4 | Expected Benefits | Textarea (click opens enlarge dialog: type, then Confirm) | No | Safe water for local institutions, Annual sales of about Rs 51 lakh, Employment for nine persons, Steady income for two partners | Comma-separated (4 items). |


### Step 10 — Workplace / shed / unit

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / shed / workplace name * | Text input | Yes | Sri Annapurna Aqua plant shed, Chenchupet | Blocks Next if empty. |
| 2 | Location * | Text input | Yes | Chenchupet industrial area, Tenali | Free text here (not the Step-1 dropdown); blocks Next if empty. |
| 3 | Land Details | Textarea (click opens enlarge dialog: type, then Confirm) | No | 400 sq. yd. industrial plot in Chenchupet, Tenali, to be bought from the present owner (agreement of sale signed); land cost of Rs 4 lakh is included in the project cost. |  |
| 4 | Civil Works | Textarea (click opens enlarge dialog: type, then Confirm) | No | RCC-roof shed of 1,800 sq. ft. for the plant and filling hall, a 300 sq. ft. storage room, a 150 sq. ft. office and a 10,000-litre underground water sump. |  |
| 5 | Manufacturing Process | Textarea (click opens enlarge dialog: type, then Confirm) | No | Borewell water is pumped to a raw-water tank, passed through sand and carbon filters and a softener, and then reverse osmosis. The treated water is stored, ozonated and UV-sterilised; jars are washed, filled, capped and sealed, and bottles are filled and capped on a separate machine. Finished goods are date-coded and stored for dispatch. | ≥ 30 chars (data check). |
| 6 | Plant & Machinery | Textarea (click opens enlarge dialog: type, then Confirm) | No | RO plant 1,500 LPH with pre-filters, UV steriliser and ozone generator, 3-in-1 jar washing-filling machine, cap-sealing unit, bottle filling machine, SS storage tanks and a date coder. | Keep consistent with the machinery list in Step 12. |
| 7 | Capacity | Text input | No | 12,000 litres per day |  |
| 8 | Power Requirements | Text input | No | 18 kW connected load, three-phase |  |
| 9 | Water Requirements | Text input | No | 20,000 litres per day raw water from own borewell; RO reject water of about 8,000 litres is reused for floor cleaning and gardening |  |
| 10 | Manpower Requirements | Text input | No | 9 persons: 1 plant manager, 1 accountant-cum-salesman, 2 operators, 3 helpers, 2 drivers |  |


### Step 11 — Applicant / firm
AUTO (hidden for vanilla): the form also silently copies "Tenali, Guntur" into the step-11 address; this is what appears as "Address" in the grey box at the top of Steps 12 and 13. No "Correspondence address" input exists in the vanilla path.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Applicant / firm name * | Text input | * (not enforced) | M/s Sri Annapurna Aqua Industries | AUTO – on arrival it already shows "Sri Annapurna Aqua Packaged Water Plant" (copied from the unit name) with the note "Filled in from your unit details. Change it if the applicant is different." Overwrite it; the note disappears once you type a different value. |
| 2 | Legal Status | Text input | No | Partnership firm |  |
| 3 | GSTIN (optional) | Text input (masked, upper-case) | No | 37AAJFS4821M1ZQ | 15 characters; validated incl. check letter. Hint: "15 characters. Leave blank if the firm has no GST registration." |
| 4 | Firm PAN (optional) | Text input (masked) | No | AAJFS4821M | 4th letter F = firm (accepted). A PAN whose 4th letter is P is rejected as an individual PAN. |
| 5 | Udyam registration number (optional) | Text input (masked) | No | UDYAM-AP-11-0034821 | Type letters+digits; hyphens are added automatically as UDYAM-AP-11-0034821. |
| 6 | Contact mobile number (optional) | Text input (digits only) | No | 9440218365 | 10 digits starting 6-9. |
| 7 | Year of establishment | Number input | No | 2025 | Firm formed in 2025 (min 1900, max 2026). |
| 8 | Submitted To | Text input | No | The Branch Manager, State Bank of India, Tenali Main Branch |  |
| 9 | Objectives – row 1 | Text input (click "Add Objective") | No | Set up a 12,000 litres per day packaged drinking water plant at Tenali | Click **Add Objective** to create row 2. |
| 10 | Objectives – row 2 | Text input | No | Provide employment to nine persons and safe drinking water to local institutions |  |
| 11 | Owner(s) | Textarea (click opens enlarge dialog: type, then Confirm) | No | Kolluri Srinivasa Rao, Kolluri Padmavathi | Comma-separated names; stored as two owners. |


### Step 12 — Project cost
Header strip at top: "Not sure what to enter?" + button "Work out working capital".

**Order of entry (important)**

| Order | Action |
|---|---|
| 1 | In the grey box "Details carried to this schedule" verify (read-only): Promoter / applicant = **M/s Sri Annapurna Aqua Industries**; Unit = **Sri Annapurna Aqua Packaged Water Plant**; Address = **Tenali, Guntur**; GSTIN = **37AAJFS4821M1ZQ**. |
| 2 | Under "What kind of business is this?" the drop-down should already show **Making things** (guessed from Nature/Products). Help text: "You make or process something, so we ask for plant and machinery." Leave it. |
| 3 | Type Land and Building first (below). Reason: with a project total under ₹5 lakh the vanilla form hides the machinery list (see Discrepancies). |
| 4 | Then add the 7 machinery rows. After the last row the numeric field "Plant & machinery (₹ Lakhs)" must read **14.5** automatically (sum of Qty x Unit cost). |
| 5 | Then Utilities, Preliminary and Working Capital. |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Land / FCI land (₹ Lakhs) | Number input | No | 4.00 | ₹ lakh. |
| 2 | Building / shed (₹ Lakhs) | Number input | No | 8.00 | ₹ lakh. |
| 3 | Plant & machinery (₹ Lakhs) | Number input | No | (leave: auto) 14.50 | AUTO – verify shows 14.5 after the list is complete. If you type here instead of using the list, a later edit to the list overwrites it. |
| 4 | Utilities & Infrastructure (₹ Lakhs) | Number input | No | 3.00 | Borewell, piping, panel, 10,000 L sump fittings, water tanks. |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | 1.50 | Licences (BIS, FSSAI, Pollution Board), Udyam, trial run. |
| 6 | Working Capital Margin (₹ Lakhs) | Number input | No | 5.00 | About 1.5 months of running cost. |
| 7 | Total Project Cost | Read-only (auto) | – | ₹ 36 Lakhs | AUTO – 4.00+8.00+14.50+3.00+1.50+5.00 = 36.00. Displayed as "₹ 36 Lakhs". |

**Machinery list (click **Add machinery** per row; "Machinery list" block shown for manufacturing). Fields per row**

Condition is a New/Used drop-down (default New). Unit cost is in ₹ lakh per unit. The list total (not including GST/transport in this non-detailed table) feeds Plant & machinery.

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | RO plant 1,500 LPH with sand, carbon and softener pre-treatment | New | Aqua Tech Water Systems, Vijayawada | 1 | 5.20 | 5.20 |
| 2 | UV steriliser (2 x 55 W) and ozone generator | New | Aqua Tech Water Systems, Vijayawada | 1 | 0.90 | 0.90 |
| 3 | Semi-automatic 3-in-1 jar rinsing, filling and capping machine (300 jars/hr) | New | Sri Vinayaka Filling Machines, Coimbatore | 1 | 3.60 | 3.60 |
| 4 | Jar cap-sealing and shrink unit | New | Sri Vinayaka Filling Machines, Coimbatore | 1 | 0.35 | 0.35 |
| 5 | Semi-automatic 1-litre bottle rinsing, filling and capping machine (1,200 bottles/hr) | New | Sri Vinayaka Filling Machines, Coimbatore | 1 | 2.45 | 2.45 |
| 6 | SS 304 water storage tank, 2,000 litres | New | Hindustan Steel Fabricators, Guntur | 2 | 0.60 | 1.20 |
| 7 | Date coder and water quality testing kit (TDS, pH, microbial) | New | Sree Coding Systems, Hyderabad | 1 | 0.80 | 0.80 |
|  |  |  |  |  | TOTAL | 14.50 |

**Optional calculator check (do NOT click "Use these values")**: after Step 14 is filled, come back and click "Work out working capital", enter 1.5 months: expected result "About ₹5.03 lakh" (40.20/12 x 1.5). Close without applying; applying would overwrite Working Capital with 5.03 and unbalance Step 13.


### Step 13 — Means of finance

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Promoter contribution / equity (₹ Lakhs) | Number input | No | 10.80 | 30% of 36.00. Scheme rule for vanilla: own money ≥ 10% and bank debt ÷ (own + subsidy) ≤ 3 (here 25.20/10.80 = 2.33). |
| 2 | Government Grant (₹ Lakhs) | Number input | No | 0 | No subsidy for vanilla. |
| 3 | Bank Loan (₹ Lakhs) | Number input | No | 25.20 | Term loan + working-capital limit together (single field). |
| 4 | Other Sources (₹ Lakhs) | Number input | No | 0 |  |
| 5 | Total Finance | Read-only (auto) | – | ₹ 36 Lakhs | AUTO – 10.80+0+25.20+0 = 36.00. Must equal Total Project Cost exactly to the paisa-lakh (0.01 lakh). |

**Loan-terms path (vanilla has no Bank name / Interest rate / Tenure inputs; use the calculator so the projection uses 11% and 84 months)**

| Action | Value | Expected |
|---|---|---|
| Click "Loan instalment and DSCR" in the "Not sure what to enter?" strip | Bank loan (₹ Lakhs) prefilled **25.2** | — |
| Interest rate (% per year) | 11 (prefilled 11) | — |
| Repayment period (years) | change 5 → **7** | — |
| Money left each year (₹ Lakhs) | prefilled 10.8 (sales 51 − running costs 40.2) — only if Step 14 was already filled; otherwise type 10.8 | Result: "Monthly instalment: ₹0.43 lakh. Yearly: ₹5.18 lakh." "DSCR: 2.09" "Comfortable: your profit pays the instalments with room to spare." |
| Click **Use these values** | — | Writes interestRate = 11 and loanTenureMonths = 84 into the hidden step-13 data (no visible input changes). |
| (Optional alternative) "Split the funding" | own 30 %, subsidy 0 % | Result "Own money ₹10.8 lakh, subsidy ₹0 lakh, bank loan ₹25.2 lakh." → Use these values writes the same 10.8 / 0 / 25.2. |


### Step 14 — Operating cost & sales
Total running cost = 11.40+3.60+15.60+1.20+1.80+6.60 = 40.20; sales 51.00; so costs < sales (no "costs higher than sales" note).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | 11.40 | ₹ lakh per year (jars, caps, labels, preforms, cartons, chemicals). |
| 2 | Power Cost (₹ Lakhs) | Number input | No | 3.60 |  |
| 3 | Wages (₹ Lakhs) | Number input | No | 15.60 | 9 persons: manager 22,000 + accountant 24,000 + 2 operators x 14,000 + 3 helpers x 10,000 + 2 drivers x 13,000 = ₹1,30,000 a month = 15.60 lakh a year. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | 1.20 |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | 1.80 |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | 6.60 | Fuel and driver incentives for two delivery autos plus jar loss/commission. |
| 7 | Annual Production Volume | Number input | No | 126000 | No unit on screen: enter 20-litre jar equivalents per year (12,000 L/day = 600 jar-eq x 300 days = 180,000 at 100%; 70% = 126,000). |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | 51.00 | 126,000 jar-eq x about ₹40.4 = ₹50.9 lakh. |


### Step 15 — Financial viability
Header strip: button "Work out break-even".

**Year-wise table (header: Year | Sales | RM | Wages | Power | Net profit). 5 rows are pre-drawn; Year 1 sales/RM/wages/power are pre-filled from Step 14 for display only — type over every cell so all 5 rows are saved**

All ₹ lakh. Sales and costs grow 5% a year (the engine default); Net profit = projected profit after tax from the finance panel.

| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 51.00 | 11.40 | 15.60 | 3.60 | 3.43 |
| 2 | 53.55 | 11.97 | 16.38 | 3.78 | 4.39 |
| 3 | 56.23 | 12.57 | 17.20 | 3.97 | 5.34 |
| 4 | 59.04 | 13.20 | 18.06 | 4.17 | 6.31 |
| 5 | 61.99 | 13.86 | 18.96 | 4.38 | 7.29 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number input | No | 70 | Or click "Work out break-even" (sales 51, changing costs 15, fixed costs 25.2 → "Break-even at about 70% of capacity") then "Use these values". |

- AUTO – the two cards at top: **Project cost ₹ 36 Lakhs** and **Equity + loan + other ₹ 36 Lakhs**.
- AUTO – "Projected financial statements" panel (with interest 11% / 84 months applied): 7 green checks (funding equals cost; balance sheet balances; cash continuity; cash never negative; average DSCR ≥ 1.50; own money meets minimum; debt-equity within ceiling). Years selector shows 7. Headline tiles: Project IRR **23.49%**, Equity IRR **54.61%**, NPV at 12% **₹17.33 lakh**, Payback **3.89 years**, Average DSCR **2.01**, Break-even **87.31%** (of revenue; different definition from the 70% typed above). Profit and loss Year 1: Revenue 51.00, EBITDA 10.80, PAT 3.43; Year 7: Revenue 68.34, PAT 9.57.
- AUTO – the small DSCR card at the bottom (older formula: assumes 7-year loan at 12%): shows **Average DSCR: 1.38** and, in red, " — below 1.5; lenders may query this." This disagrees with the panel (2.01); see Discrepancies.
- If you skipped the Step-13 calculator, the panel assumes 11% / 60 months / 5 years and shows average DSCR 1.53, Project IRR 21.18%.


### Step 16 — Implementation schedule

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date picker | No | 2027-02-15 | Browser shows it in local format (15/02/2027 or 02/15/2027); pick via the calendar. |

**Milestones (3 pre-drawn rows: Activity text + start date + end date; no add/remove)**

Pre-filled defaults read "Machinery order / installation", "Power connection", "Trial run". All dates must be real calendar days (1990-2100); no check links these to CoD.

| Row | Activity (replace the pre-filled text) | Start date | End date |
|---|---|---|---|
| 1 | Order and install RO plant, filling machines and storage tanks | 2026-12-01 | 2027-01-20 |
| 2 | Three-phase power connection, BIS and FSSAI licences | 2026-12-10 | 2027-01-10 |
| 3 | Trial run and start of commercial production | 2027-01-25 | 2027-02-10 |


### Step 17 — Expected impact

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Direct employment (count) | Number input | No | 9 | Whole number. |
| 2 | Expected annual turnover (₹ Lakhs) | Number input | No | 51.00 | ₹ lakh; matches Year-1 sales. |


### Step 18 — Document uploads
Files must be real PDFs/images (content is sniffed): create each with any word processor's "Save as PDF" containing a few lines of text; max 50 MB for documents, 10 MB for images; an empty file is rejected.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Aadhaar / PAN | File input | No | VAN_aadhaar_pan_kyc.pdf | Accepts .pdf .doc .docx .jpg .jpeg .png. After upload the line "✓ Uploaded: <file name>" appears. |
| 2 | Udyam Certificate | File input | No | VAN_udyam_certificate.pdf |  |
| 3 | Bank Passbook | File input | No | VAN_bank_passbook_sbi_tenali.pdf |  |
| 4 | Machinery / Equipment Quotations | File input | No | VAN_machinery_quotations.pdf | Slot order on screen: Aadhaar / PAN, Udyam Certificate, Bank Passbook, Machinery / Equipment Quotations. No scheme-conditional slots in vanilla. |


**Money cross-check (vanilla).**
- Project cost = Land 4.00 + Building 8.00 + Machinery 14.50 (5.20+0.90+3.60+0.35+2.45+1.20+0.80) + Utilities 3.00 + Preliminary 1.50 + Working capital 5.00 = **36.00** lakh.
- Means of finance = Own 10.80 (30.0%) + Grant 0 + Bank 25.20 (70.0%) + Other 0 = **36.00**. Difference 0.00 (the app requires an exact match to 0.01 lakh, not 1%). Own 30.0% ≥ 10% minimum; debt ÷ (own + subsidy) = 25.20 ÷ 10.80 = 2.33 ≤ 3.
- Loan EMI (shown only in the Step-13 calculator): ₹25.2 lakh at 11% over 84 months = ₹0.43 lakh/month, ₹5.18 lakh/year; DSCR (calculator) 2.09; finance-model average DSCR 2.01 (min 1.86 in Year 1).
- Running cost 40.20 vs sales 51.00 gives EBITDA 10.80 (21.2% of sales).
- Wages cross-check: 9 persons, ₹1,30,000/month x 12 = ₹15.60 lakh.

**Uploads to prepare:** `VAN_aadhaar_pan_kyc.pdf` (Aadhaar / PAN slot), `VAN_udyam_certificate.pdf` (Udyam Certificate), `VAN_bank_passbook_sbi_tenali.pdf` (Bank Passbook), `VAN_machinery_quotations.pdf` (Machinery / Equipment Quotations). All four slots appear always for the vanilla path (no condition). The app stores only a reference (the Aadhaar/PAN file is a KYC upload; typed Aadhaar/PAN numbers are blanked on save).

**Generate & verify:**
1. On Step 18 the **Generate DPR** button becomes enabled. Click **Check my answers** first: expected list is empty (no missing / blockers). Then **Generate DPR** (if a review dialog still opens, record its items and press "Generate anyway"). Wait for "DPR generated successfully!" and the redirect to `/dpr/view/<id>`.
2. Cover: kicker "DETAILED PROJECT REPORT", "On", **"Establishment of"**, **Sri Annapurna Aqua Packaged Water Plant**, **under 'Bank Term Loan'**; District Guntur; Location Tenali. No scheme badge (only PMEGP / AP CMEP have skins).
3. Table of Contents lists **18 sections** in order: Your unit – basic details; Sector overview; District & location; Your unit profile; Value chain; Market; Gaps; SWOT; What you plan to do; Workplace / shed / unit; Applicant / firm; Project cost; Means of finance; Operating cost & sales; Financial viability; Implementation schedule; Expected impact; Document uploads (the TOC itself is numbered 0). A section is dropped if it has no answers, so a missing section means a lost answer.
4. Key numbers: Project-cost section shows the schedule-parties table (Promoter M/s Sri Annapurna Aqua Industries; Unit; Address Tenali, Guntur; GSTIN) and machinery table with 7 rows and the total 36 / 14.5; Means of finance 10.8 / 0 / 25.2 / 0; "Projected results (₹ Lakhs)" Year 1-7: Revenue 51.00 | 53.55 | 56.23 | 59.04 | 61.99 | 65.09 | 68.34; EBITDA 10.80 | 11.34 | 11.91 | 12.51 | 13.13 | 13.79 | 14.47; PAT 3.43 | 4.39 | 5.34 | 6.31 | 7.29 | 8.53 | 9.57; Closing cash 4.48 | 8.94 | 13.63 | 18.58 | 23.81 | 29.27 | 35.05; DSCR 1.86 | 1.91 | 1.96 | 2.01 | 2.07 | 2.11 | 2.18; "Returns and ratios": Project IRR 23.49%, Equity IRR 54.61%, NPV 17.33, Payback 3.89 years, Average DSCR 2.01, Break-even 87.31%. Step 15 also shows the 5-row Year / Sales / Raw material / Wages / Power / Net profit table. Step 18 lists the 4 uploaded files with status "Uploaded".
5. Step 9 field shows as "Activity type: Hard". Telugu toggle on the preview changes headings; typed values stay English. Download **PDF** and **DOCX** (and XLS) from the preview page; both are English only; open them and check the same cover title, 18 numbered sections and the figures above.

**Negative / boundary tests (vanilla).**
1. Step 1: leave Location empty, click Next → toast "Fill the required fields before continuing: Location", red outline on the Location select; cannot move on. Repeat for District (and for Unit / Project Name).
2. Step 9: leave "Intervention Type" at "Select type", Next → blocked ("Intervention Type"). Step 10: clear "Unit / shed / workplace name" or "Location" → blocked.
3. Step 13: set Bank Loan to 25.10 (funding 35.90 vs cost 36.00) → red "Must fix first" item on Check my answers / Generate: "The funding adds up to ₹35.90 lakh but the project cost is ₹36.00 lakh. They must match exactly (difference ₹0.10 lakh)." and Generate shows "The DPR cannot be generated yet. Fix the items marked "Must fix first"." Restore 25.20.
4. Step 13: Own 3.60, Bank 32.40 (sum still 36.00) → blocker "Bank debt is 9 times your own money plus subsidy. The most allowed is 3 to 1." (own is 10% so the minimum-equity rule passes). Own 1.50 / Bank 34.50 → blockers "Your own money is 4.17% of the project cost. The minimum for this scheme is 10%." (and the debt-equity blocker too).
5. Step 11: GSTIN `37AAJFS4821M1ZX` (wrong last letter) or Firm PAN `BKTPR4821M` (4th letter P) or mobile `5440218365` → Next blocked with "Correct these fields before continuing: …" and an inline message ("The last character does not match…", "Individual PANs are not stored. Enter the firm/company PAN or leave blank.", "An Indian mobile number starts with 6, 7, 8 or 9.").
6. Step 12: type Land `400000` (rupees instead of lakhs) → Check my answers shows an "Unclear" note "An amount of 400000 lakh is about ₹4000 crore. Did you type rupees instead of lakhs?" plus the funding-mismatch blocker; also Step 1 Nature of Business `test` → "This answer looks like a placeholder ("test")". Restore values.
7. Step 18: choose a text file renamed to `.pdf` or a 0-byte `.pdf` → toast "This kind of file is not accepted. Use a PDF, Word file, text file or a JPG, PNG or WebP picture." / "The file is empty."; the slot shows no "✓ Uploaded".
8. With account Privacy "AI assist" OFF, finish the form and click Generate DPR → request fails (403) with "AI features are off for your account…" even though the privacy text says you can still fill, save and download (see Discrepancies).

**Discrepancies spotted (vanilla).**
1. **Funding tolerance:** the brief and `docs/data-checks.md` describe a 1% advisory tolerance, but `lib/finance/rules.ts` + `server/src/lib/financeGuard.ts` block Generate unless funding equals cost to 0.01 lakh (documented correctly only in `financial-engine.md`).
2. **Page title:** `docs/create-new-dpr-business-logic.md` says the UI title is "Create New Latest DPR"; `en.json` (`individualDpr.title`) renders **"Create DPR"**.
3. **Label drift on Step 9:** form label and required-rule label are "Intervention Type", but the preview/PDF field model (`individualDocModel.ts`) calls it **"Activity type"**. (Same drift pattern exists for PMEGP extras, see section 2.)
4. **Step 11 asterisk:** "Applicant / firm name" shows a red * but `requiredStepFields.ts` does not require it (it is auto-copied from the unit name, so an empty value is only possible if the user clears it).
5. **Vanilla has no loan-term inputs:** Step 13 for vanilla shows no Bank name / Interest rate / Moratorium / Tenure fields (they exist for all "lean" schemes), yet the projection and DSCR use interest (default 11%) and tenure (default 60 months). They can only be set indirectly through the calculator, and the generated document never shows the loan terms.
6. **Two different DSCR answers:** Step 15's red/green DSCR card (fixed 7-year, 12%, only profit + 10% depreciation of machinery+building) shows 1.38 (below 1.5) while the finance panel and the generated report say 2.01 for the same data.
7. **Machinery list can vanish while typing:** for non-lean (vanilla) forms the machinery list is hidden when the running project total is under ₹5 lakh (`scaleOf` → "tiny"). Entering the first machinery row before land/building makes the editor disappear mid-entry.
8. **Dead data checks:** `dataChecks.ts` reads `step4.startDate` for the "production before commitment" check and `step4.manufacturingProcess` for the narrative-length check, but vanilla Step 4 has no such fields (manufacturing process lives in Step 10; dates exist only on lean schemes), so those two checks can never fire.
9. **Unit ambiguity:** Value Addition Stages "Selling price (₹ Lakhs)" and "Annual Production Volume" (no unit label) do not say what the number means.
10. **AI consent vs. privacy copy:** `/dpr/cluster/generate` is behind `requireAiConsent`, but the privacy text (`privacy.aiOffWarning`, AI_REFUSED_MESSAGE) says manual users "can still type, save, and download the DPR". A user with AI assist off cannot generate.
## 2. Prime Minister’s Employment Generation Programme (PMEGP) (`PMEGP`)
**Entry:** open `/individual-dpr/create?new=true&scheme=PMEGP`. The page goes straight to the scheme brief titled "Prime Minister's Employment Generation Programme (PMEGP)"; click **"Start DPR steps"**. Header scheme drop-down reads "Prime Minister’s Employment Generation Programme (PMEGP)"; header shows "Step 1 of 14"; a teal banner "PMEGP · KVIC unit pack" appears under the stepper. (If you reach the card grid instead, click the PMEGP card.) **Total steps:** 14. Same conventions as section 1 (textarea dialog, Req? column, auto-save on Next). Pre-condition: use a browser profile with no earlier Scheme Finder session (clear `localStorage` key `venture-match-handoff`), otherwise the Step-14 education slot can behave differently (see Discrepancies).

**Test persona:** Smt. Bandaru Naga Lakshmi (34), a woman entrepreneur and SHG member from **Kasimkota (mandal HQ), Anakapalli district**; 10th-class pass; trained in a DIC bakery course; has run a home-based snack and cake business for 5 years. She applies through the **DIC** for a **rural, special-category (woman)** PMEGP unit: **Sri Durga Bakery and Biscuits Unit** making sandwich bread, buns, tea rusk and cookies (250 kg/day capacity, 60% utilisation in year 1). Sole proprietorship, own workshed attached to her house on the Kasimkota main road. Project cost ₹14.60 lakh = own 5% + PMEGP margin money 35% + bank 60%. Bank: Andhra Pradesh Grameena Vikas Bank, Kasimkota Branch.

### Step 1 — Cover & entrepreneur

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | Sri Durga Bakery and Biscuits Unit | Cover title. |
| 2 | District * | Dropdown | Yes | Anakapalli | Anakapalli district list: Anakapalli, Narsipatnam, Elamanchili, Yelamanchili, Kasimkota, Pendurthi. |
| 3 | Location * | Dropdown | Yes | Kasimkota | Only towns are listed; the village/mandal go in free-text fields later (Step 3 and Step 7). |
| 4 | Nature of Business | Text input | No | Bakery products manufacturing | ≥ 12 characters. |
| 5 | Major Products | Text input | No | Sandwich bread, buns, tea rusk, cookies |  |
| 6 | Category (PMEGP panel "PMEGP — entrepreneur & subsidy inputs") | Dropdown | No | Special category (SC / ST / OBC / Minority / Women / Ex-serviceman / PwD) | Options: Select category / General category / Special category (…). Sets own % and margin-money %. |
| 7 | Area (rural / urban) | Dropdown | No | Rural | Options: Select area / Rural / Urban. |
| 8 | Implementing agency | Dropdown | No | DIC | Options: Select agency / KVIC / State KVIB / DIC. |
| 9 | Education | Dropdown | No | 8th class pass or higher | Options: Select education / Below 8th class / 8th class pass or higher. |
| 10 | Entrepreneur full name | Text input | No | Bandaru Naga Lakshmi | Placeholder "Full name as in Aadhaar". Also used as default firm name in Step 7 and in the cover "Entrepreneur name". |
| 11 | Entrepreneur age | Number input | No | 34 | Browser min 18 / max 100. Under 18 triggers the guardian notice (see Negative tests). |
| 12 | Indicative margin money banner | Read-only (auto) | – | Indicative margin money: 35% · Own contribution: 5% | AUTO – green box appears as soon as Category or Area is chosen. Rural+special = 35%, urban+special = 25%, rural+general = 25%, urban+general = 15%; own 5% special / 10% general. |


### Step 2 — Executive summary & process

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | Food processing – bakery and confectionery | Label shows red *. |
| 2 | Short intro — what the unit does * | Textarea (click opens enlarge dialog: type, then Confirm) | Yes | Bakery products such as sandwich bread, buns, tea rusk and cookies are bought every day by households, tea shops, hostels and small retailers in Kasimkota mandal and the nearby villages. At present most bread arrives from Anakapalli and Visakhapatnam after a delay of four to six hours. A village bakery will supply fresh products every morning. | ≥ 30 chars. Required. |
| 3 | Executive summary | Textarea (click opens enlarge dialog: type, then Confirm) | No | Smt. Bandaru Naga Lakshmi proposes a 250 kg per day bakery unit at Kasimkota, Anakapalli district, to make sandwich bread, buns, tea rusk and cookies. The project cost is Rs 14.60 lakh: own contribution Rs 0.73 lakh (5%), PMEGP margin money Rs 5.11 lakh (35%, special category woman, rural) and bank term loan plus working capital Rs 8.76 lakh (60%). The unit will employ 7 persons directly and is expected to reach sales of Rs 41 lakh in the first year at 60% capacity utilisation. | PMEGP-only box with teal border. ≥ 40 chars. Must not be word-for-word equal to the intro. |
| 4 | Process of manufacture | Textarea (click opens enlarge dialog: type, then Confirm) | No | 1. Weigh maida, sugar, yeast, salt and improvers. 2. Knead the dough in the spiral mixer for 12-15 minutes. 3. Divide and round the dough, rest it for 15 minutes, then mould loaves and buns. 4. Proof in the proofer cabinet for 45-60 minutes. 5. Bake in the rotary rack oven at 200-220 C for 25-30 minutes. 6. Cool, slice and pack bread in printed film; rusk is re-baked and cookies are baked on trays. 7. Dispatch the same morning to shops by three-wheeler. | ≥ 40 chars. |


### Step 3 — Location

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (click opens enlarge dialog: type, then Confirm) | No | Kasimkota is a mandal headquarters in Anakapalli district, about 25 km from Anakapalli town and 55 km from Visakhapatnam. The workshed is on the main road in Kasimkota village with bus service, a daily market and tea shops nearby; the catchment is Kasimkota mandal and 12 neighbouring villages. | Village and mandal are written here because the Step-1 location list has no village field. |


### Step 4 — Unit profile & capacity

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (click opens enlarge dialog: type, then Confirm) | No | Smt. Naga Lakshmi has run a small home-based snack and cake business for five years and completed a DIC-sponsored bakery training. She now proposes a regular bakery unit with an oven, mixer and divider to supply nearby villages. | ≥ 30 chars. |
| 2 | Start Date | Date picker | No | 2026-11-02 | Between 1990 and 2100. Must be on or before Commitment Date. |
| 3 | Commitment Date | Date picker | No | 2026-11-23 | Must be on or after Start Date (else toast "Commitment Date must be on or after Start Date"). |
| 4 | Tools / process level | Text input | No | Semi-automatic: spiral mixer, divider-rounder, proofer and rotary rack oven |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | 250 kg of bakery products per day (single 8-hour shift) | Also written to the hidden "Installed capacity" extra (AUTO). |
| 6 | Capacity utilisation Year 1 (%) | Number input | No | 60 | 0-100. Data check: over 100% is flagged; under 30% is "low". |

**Products, share of output and selling price (one blank row is pre-drawn; click **Add product** for more; labels per row: Product Name / Share of Output (%) / Selling Price (per unit))**

Enter prices as ₹ per kg equivalent. Shares add up to 100 (the app does not check this). Weighted average ≈ ₹91.15/kg; 250 kg x 300 days x 60% = 45,000 kg → about ₹41.0 lakh.

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | Sandwich bread (sold by weight) | 45 | 82 |
| 2 | Buns and pav | 20 | 80 |
| 3 | Tea rusk | 15 | 95 |
| 4 | Cookies and biscuits | 20 | 120 |


### Step 5 — Market & sales assumptions

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (click opens enlarge dialog: type, then Confirm) | No | Tea shops, kirana stores, school canteens and households in Kasimkota and 12 nearby villages, supplied by a three-wheeler on four fixed daily routes. |  |
| 2 | Demand / footfall note | Textarea (click opens enlarge dialog: type, then Confirm) | No | About 150 tea shops and 60 kirana stores in the catchment; the promoter already holds verbal orders from 35 shops for about 120 kg a day. |  |


### Step 6 — Workshed / premises & power

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | Own workshed attached to residence, Kasimkota main road | Required (blocks Next). Note: no "Premises — owned / rented" drop-down for PMEGP. |
| 2 | Premises note (own / lease / rent) | Textarea (click opens enlarge dialog: type, then Confirm) | No | Own site of 40 sq. yd. with a 600 sq. ft. workshed to be renovated; no rent is payable because it belongs to the promoter. |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | 9 kW, three-phase | Also written to the hidden "Power requirement" extra. |


### Step 7 — Applicant / firm

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | * (not enforced) | Sri Durga Bakery and Biscuits Unit (Prop. Bandaru Naga Lakshmi) | AUTO – arrives pre-filled with "Bandaru Naga Lakshmi" (the entrepreneur name) and the note "Filled in from your unit details…". Overwrite. |
| 2 | Legal status (sole / partnership / company) | Text input | No | Sole proprietorship |  |
| 3 | GSTIN (optional) | Text input (masked) | No | 37AZXPB4417L1ZV | Contains the proprietor's individual PAN (4th letter P) which is allowed inside a GSTIN. Valid check letter V. |
| 4 | Firm PAN (optional) | Text input (masked) | No | (leave blank) | A sole proprietor has no firm PAN; typing an individual PAN here is rejected (see Negative tests). |
| 5 | Udyam registration number (optional) | Text input (masked) | No | UDYAM-AP-03-0048215 |  |
| 6 | Contact mobile number (optional) | Text input (digits only) | No | 9505734128 |  |
| 7 | Correspondence address | Textarea (click opens enlarge dialog: type, then Confirm) | No | Door No. 2-41, Main Road, Kasimkota (V & M), Anakapalli District, Andhra Pradesh - 531031 | AUTO – arrives as "Kasimkota, Anakapalli" with the note "Started from your town and district. Add the full street address." Replace it. |


### Step 8 — Project cost
Header strip "Not sure what to enter?" + "Work out working capital" (optional: after Step 10 is filled, 1.5 months gives "About ₹4.45 lakh"; do not apply).

**Order of entry**

| Order | Action |
|---|---|
| 1 | Verify the read-only grey box "Details carried to this schedule": Promoter / applicant = **Bandaru Naga Lakshmi** (entrepreneur name wins over firm name); Unit = **Sri Durga Bakery and Biscuits Unit**; Address = **Door No. 2-41, Main Road, Kasimkota (V & M), Anakapalli District, Andhra Pradesh - 531031**; GSTIN = **37AZXPB4417L1ZV**. |
| 2 | "What kind of business is this?" should already show **Making things** (guessed from "Bakery products manufacturing"); leave it. |
| 3 | There is no numeric "Plant & machinery" box for PMEGP: add the 8 machinery rows below; the total is carried automatically. |
| 4 | Then fill the five amount fields. |

**Machinery list (click **Add machinery** per row)**

AUTO – the hidden machinery figure becomes 7.2 (also shown in the preview). Unit cost is per unit in ₹ lakh.

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Rotary rack oven, 12-tray, LPG/diesel fired | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 2.75 | 2.75 |
| 2 | Spiral dough mixer, 25 kg | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 1.10 | 1.10 |
| 3 | Dough divider-rounder | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 0.95 | 0.95 |
| 4 | Proofer cabinet, 16-tray | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 0.60 | 0.60 |
| 5 | Bread slicer | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 0.45 | 0.45 |
| 6 | Pouch sealing machine | New | Vizag Packaging Machines, Visakhapatnam | 2 | 0.20 | 0.40 |
| 7 | Baking trays, loaf pans and moulds (set) | New | Sri Balaji Bakery Equipments, Visakhapatnam | 1 | 0.75 | 0.75 |
| 8 | Electronic weighing scale, 30 kg | New | Vizag Weigh Systems, Visakhapatnam | 2 | 0.10 | 0.20 |
|  |  |  |  |  | TOTAL | 7.20 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Land / building / workshed — land (₹ Lakhs) | Number input | No | 0 | Own site; leave 0 or blank. |
| 2 | Land / building / workshed — building (₹ Lakhs) | Number input | No | 2.40 | Renovation and extension of workshed. |
| 3 | Furniture & fixtures (₹ Lakhs) | Number input | No | 0.90 | Display racks, tables, trays stand, electrical fittings. |
| 4 | Preliminary & pre-operative (₹ Lakhs) | Number input | No | 0.60 | Udyam, FSSAI, trial batches, training. |
| 5 | Working capital (₹ Lakhs) | Number input | No | 3.50 | About 1.2 months of running cost. |
| 6 | Total Project Cost | Read-only (auto) | – | ₹ 14.6 Lakhs | AUTO – 0 + 2.40 + 7.20 + 0.90 + 0.60 + 3.50 = 14.60. |


### Step 9 — Means of finance (critical)

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name (heading "Term loan terms") | Text input | No | Andhra Pradesh Grameena Vikas Bank, Kasimkota Branch |  |
| 2 | Interest rate (% per year) | Number input | No | 11 | Data check: below 6 or above 16 is "unusual". |
| 3 | Moratorium (months) | Number input | No | 6 | Must be less than tenure (else "grace period … as long as the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | 60 | Months, not years. Unusual under 12 or over 180. |
| 5 | Own contribution (₹ Lakhs) — typically 10% general / 5% special | Number input | No | 0.73 | 5% of 14.60. Minimum 5% for special category (10% general) is a blocker. |
| 6 | PMEGP margin money / subsidy (₹ Lakhs) | Number input | No | 5.11 | 35% of 14.60 (rural + special). Wrong % only gives a warning. |
| 7 | Bank term loan + / or WC (₹ Lakhs) | Number input | No | 8.76 | 60%. Debt ÷ (own + subsidy) = 8.76 ÷ 5.84 = 1.50 ≤ 3. |
| 8 | Other Sources (₹ Lakhs) | Number input | No | 0 |  |
| 9 | Total Finance | Read-only (auto) | – | ₹ 14.6 Lakhs | AUTO – 0.73 + 5.11 + 8.76 + 0 = 14.60 (must match cost exactly). |
| 10 | Info note | Read-only (auto) | – | Own + margin money + bank (+ other) must equal total project cost. Indicative subsidy: 35% (special / rural). | AUTO – grey note under the fields. |

Optional: calculators "Split the funding" (own 5 %, subsidy 35 %) → "Own money ₹0.73 lakh, subsidy ₹5.11 lakh, bank loan ₹8.76 lakh." and "Loan instalment and DSCR" (loan 8.76, 11%, 5 years, available 5.43) → "Monthly instalment: ₹0.19 lakh. Yearly: ₹2.29 lakh." "DSCR: 2.38" Comfortable. "Use these values" re-writes the same numbers.


### Step 10 — Operating cost & sales
Running cost = 21.15+3.00+8.52+0.50+0.80+1.60 = 35.57; sales 41.00.

**Raw materials (click **Add raw material** per row; labels Material / Use / How it is bought)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Maida (refined wheat flour) | Dough for bread, buns, rusk and cookies | 50 kg bags from a flour dealer at Anakapalli, every fortnight |
| 2 | Sugar and salt | Sweetening and dough conditioning | 50 kg bags from a Kasimkota wholesaler, monthly |
| 3 | Yeast, bread improver and milk powder | Fermentation and softness | Packed lots from Visakhapatnam bakery suppliers, monthly |
| 4 | Edible oil and margarine | Shortening for buns and cookies | 15 kg tins from an Anakapalli oil dealer, every fortnight |
| 5 | Packing film and labels | Packing bread, rusk and cookies | Printed rolls from Vizag Packaging, Visakhapatnam, quarterly |

**Staff by role and monthly pay (click **Add role** per row; labels Role / Number of people / Monthly pay (₹))**

Total 6 persons, ₹71,000 a month = ₹8.52 lakh a year. The table does NOT feed Wages automatically; type Wages yourself below.

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Head baker | 1 | 16000 |
| 2 | Baker's helper | 3 | 11000 |
| 3 | Packer | 1 | 10000 |
| 4 | Delivery-cum-salesman | 1 | 12000 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | 21.15 | 45,000 kg x ₹47/kg. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | 3.00 | Includes LPG/diesel for oven. |
| 3 | Wages (₹ Lakhs) | Number input | No | 8.52 | Equals 71,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | 0.50 |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | 0.80 |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | 1.60 | Three-wheeler fuel and shop incentives. |
| 7 | Annual Production Volume | Number input | No | 45000 | No unit on screen: enter kg per year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | 41.00 | 45,000 kg x ₹91.15. |


### Step 11 — Financial viability
Header strip: "Work out break-even".

**Year-wise table (Year | Sales | RM | Wages | Power | Net profit): type over all cells**

₹ lakh. 5% yearly growth; Net profit = PAT from the finance panel.

| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 41.00 | 21.15 | 8.52 | 3.00 | 2.21 |
| 2 | 43.05 | 22.21 | 8.95 | 3.15 | 2.67 |
| 3 | 45.20 | 23.32 | 9.39 | 3.31 | 3.16 |
| 4 | 47.46 | 24.48 | 9.86 | 3.47 | 3.66 |
| 5 | 49.84 | 25.71 | 10.36 | 3.65 | 4.18 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number input | No | 67.77 | From calculator "Work out break-even": sales 41, changing costs 24.15, fixed costs 11.42 → "Break-even at about 67.77% of capacity" → Use these values. |

- AUTO – cards: Project cost ₹ 14.6 Lakhs; Equity + loan + other ₹ 14.6 Lakhs.
- AUTO – finance panel: 7 green checks; Project IRR **27.23%**, Equity IRR **387.77%** (tiny own share), NPV at 12% **₹7.36 lakh**, Payback **3.23 years**, Average DSCR **2.16**, Break-even **82.49%**; Years selector 5 (60-month tenure).
- AUTO – bottom DSCR card: "Average DSCR: 2.15" in neutral colour (older formula, 7 yrs at 12%).


### Step 12 — Implementation schedule

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date picker | No | 2027-02-01 |  |

**Milestones (3 pre-drawn rows)**

| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | Order and install oven, mixer, divider and proofer | 2026-12-01 | 2027-01-15 |
| 2 | Workshed renovation and power connection | 2026-11-25 | 2027-01-10 |
| 3 | Trial batches and start of commercial production | 2027-01-20 | 2027-01-31 |


### Step 13 — Employment & impact

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Direct employment (count) | Number input | No | 7 | Proprietress + 6 workers. Also stored as "Direct employment" extra. |
| 2 | Indirect employment (count) | Number input | No | 5 | Flour, packing and delivery suppliers. |
| 3 | Short impact note (optional) | Textarea (click opens enlarge dialog: type, then Confirm) | No | Gives regular work to seven local women and youth and brings fresh bread to remote villages; the promoter will repay the bank loan from unit income. | Keep it short. |


### Step 14 — Documents & uploads
Real PDFs/images only (content sniffed); max 50 MB documents, 10 MB images.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Aadhaar / PAN | File input | No | PMEGP_aadhaar_pan_kyc.pdf | Slot order: Aadhaar / PAN; Machinery Quotations; Building / Workshed Estimate; Bank Passbook / Cancelled Cheque; Udyam Certificate (or application); Caste / Special-category Certificate. |
| 2 | Machinery Quotations | File input | No | PMEGP_quotation_machinery.pdf |  |
| 3 | Building / Workshed Estimate | File input | No | PMEGP_building_estimate.pdf |  |
| 4 | Bank Passbook / Cancelled Cheque | File input | No | PMEGP_bank_passbook_apgvb.pdf |  |
| 5 | Udyam Certificate (or application) | File input | No | PMEGP_udyam_certificate.pdf |  |
| 6 | Caste / Special-category Certificate | File input | No | PMEGP_special_category_certificate.pdf | Appears only because Category = Special (also appears if Scheme-Finder owner answers include sc/st/bc). |
| 7 | 8th-pass / education certificate (conditional slot) | File input | No | PMEGP_education_8th_pass.pdf | Expected by the gate rule for manufacturing cost above ₹10 lakh, but it does NOT appear in this direct-entry flow (see Discrepancies). If it does appear, upload it. |


**Money cross-check (PMEGP).**
- Project cost = Land 0 + Building 2.40 + Machinery 7.20 (2.75+1.10+0.95+0.60+0.45+0.40+0.75+0.20) + Furniture 0.90 + Preliminary 0.60 + Working capital 3.50 = **14.60** lakh.
- Margin money: rural + special category = **35%** x 14.60 = **5.11**. Own contribution: special category **5%** x 14.60 = **0.73**. Bank = 14.60 − 0.73 − 5.11 = **8.76** (60%). Means of finance = 0.73 + 5.11 + 8.76 + 0 = **14.60** (exact). Debt ÷ (own + subsidy) = 8.76 ÷ 5.84 = 1.50 (limit 3). No "pmegp.rate" warning because actual 35.0% equals expected 35%.
- EMI (calculator): ₹8.76 lakh, 11%, 60 months = ₹0.19 lakh/month (₹2.29 lakh/year), moratorium 6 months in the model; DSCR calculator 2.38; model average 2.16 (Year 1 2.73, Year 2 1.94).
- Running cost 35.57 vs sales 41.00; EBITDA 5.43. Wages 71,000 x 12 = 8.52. Education gate threshold (manufacturing above ₹10 lakh) is crossed (14.60).

**Uploads to prepare:** `PMEGP_aadhaar_pan_kyc.pdf` → "Aadhaar / PAN"; `PMEGP_quotation_machinery.pdf` → "Machinery Quotations"; `PMEGP_building_estimate.pdf` → "Building / Workshed Estimate"; `PMEGP_bank_passbook_apgvb.pdf` → "Bank Passbook / Cancelled Cheque"; `PMEGP_udyam_certificate.pdf` → "Udyam Certificate (or application)"; `PMEGP_special_category_certificate.pdf` → "Caste / Special-category Certificate" (shown because Category = Special); `PMEGP_education_8th_pass.pdf` → "8th-pass / education certificate" (only if the slot appears; condition in code: manufacturing/food/craft with cost > ₹10 lakh or service/trade with cost > ₹5 lakh **and** Scheme-Finder activity answer present).

**Generate & verify:**
1. On Step 14 click **Check my answers** (expect no items) then **Generate DPR**; wait for "DPR generated successfully!".
2. Cover (teal PMEGP skin): flag band, "KVIC — Khadi & Village Industries Commission", badge "PMEGP · KVIC unit pack", kicker "PMEGP DETAILED PROJECT REPORT", "On", "Establishment of", **Sri Durga Bakery and Biscuits Unit**, **under 'Prime Minister's Employment Generation Programme (PMEGP)'**, tagline "Credit-linked margin money · bank-style single-unit DPR"; meta: District Anakapalli, Location Kasimkota, Entrepreneur name Bandaru Naga Lakshmi.
3. TOC has **14 sections**: Cover & entrepreneur; Executive summary & process; Location; Unit profile & capacity; Market & sales assumptions; Workshed / premises & power; Applicant / firm; Project cost; Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Employment & impact; Documents & uploads. No value-chain, SWOT or CFC/SPV section anywhere.
4. Check: Step-1 section shows Category "Special category (SC / ST / OBC / Minority / Women / Ex-serviceman / PwD)", Area "Rural", Implementing agency "DIC", Education "8th class pass or higher"; Project cost section: schedule table (Promoter Bandaru Naga Lakshmi…), machinery table with 8 rows, building 2.4, furniture 0.9, preliminary 0.6, working capital 3.5, total 14.6; Means of finance 0.73 / 5.11 / 8.76 / 0 and bank terms (APGVB, 11, 6, 60); product-mix table (4 rows), raw-material table (5 rows), staff table (4 rows); Projected results: Revenue 41.00 | 43.05 | 45.20 | 47.46 | 49.84; EBITDA 5.43 | 5.70 | 5.98 | 6.28 | 6.61; PAT 2.21 | 2.67 | 3.16 | 3.66 | 4.18; Closing cash 2.97 | 5.12 | 7.39 | 9.79 | 12.33; DSCR 2.73 | 1.94 | 1.99 | 2.05 | 2.10; Returns: IRR 27.23%, Equity IRR 387.77%, NPV 7.36, payback 3.23 years, average DSCR 2.16, break-even 82.49%; milestones table (3 rows); Employment 7 / 5; Uploads list shows the 6 uploaded slots as "Uploaded".
5. Preview labels for extras differ slightly from form labels ("Entrepreneur name", "Age", "Category"); that is expected, see Discrepancies. Download PDF/DOCX (English only) and re-check cover, 14 sections and the figures.

**Negative / boundary tests (PMEGP).**
1. Step 9: own 0.50, bank 8.99 (sum 14.60) → blocker "Your own money is 3.42% of the project cost. The minimum for this scheme is 5%." with hint "You need at least ₹0.73 lakh of your own money." Generate refused. Restore 0.73 / 8.76.
2. Step 1: change Category to "General category" (leave funding) → banner becomes "Indicative margin money: 25% · Own contribution: 10%"; Check my answers shows blocker "Your own money is 5% of the project cost. The minimum for this scheme is 10%." and advisory "The subsidy is 35% of the cost but your category and area give 25%." Change Area to "Urban" with Special → advisory only: "…your category and area give 25%." Restore Special/Rural.
3. Step 9: margin money 4.00, bank 9.87 → no block; advisory "The subsidy is 27.4% of the cost but your category and area give 35%." (warning only, Generate anyway possible).
4. Step 1: age 17 → a red toast with the guardian message appears at once ("This site makes bank and scheme DPRs. The person named as the entrepreneur must be 18 or older. Ask a parent or guardian to register and create the DPR in their name."). **Save Draft** shows the same message and saves nothing; **Next** still changes step but nothing is saved (the save result is ignored); on the last step **Generate DPR** fails with "Failed to save data before generating DPR". The server also returns 403 for under-18 payloads. Age 18 passes. Age 120 is stopped only by the browser's max=100 attribute.
5. Step 4: Commitment Date 2026-10-30 (before Start Date 2026-11-02) → toast "Commitment Date must be on or after Start Date" and the value is not accepted; year 1985 → "Enter a valid date between 1990 and 2100".
6. Step 9: Moratorium 60 with tenure 60 → "Does not add up: The grace period (60 months) is as long as, or longer than, the whole loan period (60 months)." Interest 4 → "Unusual: An interest rate of 4% is unusual. Small-business loans are usually between 8% and 14%." Tenure 5 (years typed as months) → "A loan period of 5 months is unusual."
7. Step 7: Firm PAN `AZXPB4417L` → Next blocked "Correct these fields…: Firm PAN" + "Individual PANs are not stored. Enter the firm/company PAN or leave blank."
8. Step 1: choose Education "Below 8th class" while cost is 14.60 (above ₹10 lakh) → expected by spec: eligibility problem; actual: nothing happens (see Discrepancies).

**Discrepancies spotted (PMEGP).**
1. **Education gate never triggers in the direct flow:** `showPmegpEducationGate` needs `ventureMatchAnswers.activity` (Scheme Finder), which this form never asks; so for cost ₹14.60 lakh (manufacturing > ₹10 lakh) the "8th-pass / education certificate" upload never appears, and "Below 8th class" in Step 1 is not checked against cost at all. Spec (`pmegp.md` §5) says the gate is part of the app.
2. **Spec vs form, Step 10:** `pmegp.md` lists "Working-capital cycle notes (stock / debtor / creditor days)" for the operating step; the form has no such fields.
3. **Spec vs form, Step 12:** spec lists `startDate` / `endDate` / milestones; the form has only CoD plus exactly three fixed milestone rows (no end date, no add/remove row).
4. **No village/mandal field:** the persona needs a rural village/mandal, but the Location drop-down lists only towns/ULBs and no other field captures village or mandal; "Area: Rural" is independent of the chosen town (no consistency check).
5. **Label drift form vs preview/PDF:** form "Entrepreneur full name" / "Entrepreneur age" vs preview "Entrepreneur name" / "Age"; the hidden extras `pmegpSubsidyPercent` / `pmegpOwnPercent` are filled silently when Category/Area change and are excluded from the Step-1 preview list, so they appear nowhere in the report although spec §3 Step 9 lists "applied subsidy % / own %" as display/check fields.
6. **Staff table not linked to Wages:** Staff-by-role monthly pay is a separate table; Wages must be typed by hand and nothing cross-checks them.
7. **No PMEGP ceiling check:** nothing warns when a project exceeds the first-loan PMEGP ceilings (₹50 lakh manufacturing / ₹20 lakh service; confirm the live GO) — only an "unusual" note above ₹5 crore. Subsidy-rate mismatch is a warning, not a block.
8. **Age rule is soft in the UI:** the placeholder says "Must be 18 or older" but only HTML min/max attributes guard the field; the effective enforcement is the guardian toast plus the server 403, and **Next** still advances for an under-18 age.
## 3. 2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units (`PMEGP_2ND`)
**Entry:** open `/individual-dpr/create?new=true&scheme=PMEGP_2ND`; the brief page titled "2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units" opens; click **"Start DPR steps"**. Header scheme drop-down reads the same title; header shows "Step 1 of 14". Default (non-PMEGP) skin: no teal banner or badge. **Total steps:** 14. Same conventions as section 1. This pack is brownfield only: every amount is the **incremental upgrade project**, not the whole unit.

**Test persona:** Shaik Abdul Khadar (39), proprietor of **Khadar Engineering Works**, Industrial Estate Road, **Nandyal** (Nandyal district). The workshop fabricates MS gates and grills, farm-implement frames and roof trusses. It started in September 2021 with a first PMEGP loan of ₹9.8 lakh (through the DIC; margin money adjusted, loan repaid on time), has made a profit for 4 years and now has a turnover of ₹31.5 lakh. He now wants the **PMEGP 2nd loan** (manufacturing band, not NER/Hill) for an upgrade project of ₹24.00 lakh: press brake, shearing machine, plasma cutting table, MIG sets, painting booth and a crane. Capacity goes from 4.5 to 8.6 tonnes a month; staff from 5 to 8. Bank: Union Bank of India, Nandyal Main Branch.

### Step 1 — Cover & prior assistance

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | Khadar Engineering Works | Cover title; cover action line will be "Upgradation of". |
| 2 | District * | Dropdown | Yes | Nandyal | Nandyal list: Nandyal, Dhone, Nandikotkur, Allagadda, Atmakur, Banaganapalle. |
| 3 | Location * | Dropdown | Yes | Nandyal |  |
| 4 | Nature of Business | Text input | No | Steel fabrication and farm implements workshop | ≥ 12 characters. |
| 5 | Major Products | Text input | No | MS gates and grills, farm-implement frames, roof trusses |  |
| 6 | Prior scheme (panel "PMEGP 2nd loan — prior assistance") | Dropdown | No | PMEGP (1st loan) | Options: Select / PMEGP (1st loan) / REGP / MUDRA. |
| 7 | First sanction / project cost (₹ Lakhs) | Number input | No | 9.8 | ₹ lakh; placeholder "e.g. 12". |
| 8 | Year of first subsidy | Text input | No | 2021 | Plain text, no validation (placeholder "e.g. 2019"). |
| 9 | Implementing agency | Dropdown | No | DIC | Options: Select agency / KVIC / State KVIB / DIC. |
| 10 | Sector band | Dropdown | No | Manufacturing (ceiling ₹1 crore) | Options: Select / Manufacturing (ceiling ₹1 crore) / Business / Service / Trading (ceiling ₹25 lakh). |
| 11 | NER / Hill State? | Dropdown | No | No | Options: Select / Yes / No. Yes switches margin money from 15% to 20%. |
| 12 | First margin money adjusted? | Dropdown | No | Yes | Yes/No. |
| 13 | First loan repaid in time? | Dropdown | No | Yes | Yes/No. |
| 14 | Years of continuous profit | Number input | No | 4 | Placeholder "Expect ≥ 3"; not validated. |
| 15 | Latest annual turnover (₹ Lakhs) | Number input | No | 31.5 | ₹ lakh. |
| 16 | Entrepreneur full name | Text input | No | Shaik Abdul Khadar |  |
| 17 | Entrepreneur age | Number input | No | 39 | 18-100. |
| 18 | Indicative banner | Read-only (auto) | – | Indicative upgrade MM: 15% · Own: 10% · PMEGP / manufacturing | AUTO – green box under the fields (always visible). Changing NER/Hill to Yes shows 20%; before choosing, the tail reads "— / —". |


### Step 2 — Introduction & upgrade process

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | Engineering – metal fabrication | Red *. |
| 2 | Short intro — what the unit does * | Textarea (click opens enlarge dialog: type, then Confirm) | Yes | Khadar Engineering Works in Nandyal has fabricated gates, grills, roof trusses and farm-implement frames since 2021 with a first PMEGP loan that is fully adjusted and repaid on time. Demand from farmers, builders and schools in Nandyal and the Kurnool region now exceeds the capacity of the manual workshop, so the unit proposes an upgrade with cutting, bending and welding machines to raise output and quality. | Required, ≥ 30 chars. |
| 3 | Process of manufacture | Textarea (click opens enlarge dialog: type, then Confirm) | No | 1. Receive MS sheets, angles and pipes and stack them by size. 2. Mark and cut sheets on the plasma cutting table and the shearing machine. 3. Bend and form sections on the hydraulic press brake. 4. Weld frames with MIG sets on jigs and fixtures. 5. Grind, clean and fit hinges and locks. 6. Spray primer and paint in the painting booth and dry. 7. Inspect, load with the 2-tonne crane and deliver to the customer's site. | Placeholder says "Process after upgrade / modernisation". ≥ 40 chars. |
| 4 | Existing technology | Textarea (click opens enlarge dialog: type, then Confirm) | No | Manual gas cutting, hand-operated bending, two arc welding sets and a pedestal drilling machine; capacity of about 4.5 tonnes a month with 5 workers. |  |
| 5 | Proposed technology / upgrade | Textarea (click opens enlarge dialog: type, then Confirm) | No | Hydraulic press brake 40-ton, hydraulic shearing machine, CNC plasma cutting table, two MIG welding sets, a spray painting booth with compressor and a 2-tonne EOT crane; raises capacity to about 8.6 tonnes a month. |  |


### Step 3 — Location

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (click opens enlarge dialog: type, then Confirm) | No | Nandyal is a district headquarters on the Kurnool-Nandyal-Giddalur road, about 70 km from Kurnool. The workshop is on Industrial Estate Road with a ready customer base of farmers, builders and institutions in Nandyal, Atmakur and Banaganapalle mandals. |  |


### Step 4 — Unit profile & capacity (existing → proposed)

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (click opens enlarge dialog: type, then Confirm) | No | The unit fabricates MS gates and grills, farm-implement frames and roof trusses with 5 workers and a turnover of Rs 31.5 lakh. It has repaid the first PMEGP loan and now proposes an upgrade to nearly double capacity and improve finish. | ≥ 30 chars. |
| 2 | Start Date | Date picker | No | 2021-09-06 | UI label is just "Start Date"; the spec says original commencement, so enter the 2021 start. |
| 3 | Commitment Date | Date picker | No | 2026-11-20 | Date the upgrade investment is committed; must be on or after Start Date. |
| 4 | Tools / process level | Text input | No | Upgrade from manual cutting and bending to hydraulic and MIG-welded fabrication |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | 8.6 tonnes of fabricated products per month after upgrade | Proposed capacity; also written to hidden "Installed capacity" (AUTO). |
| 6 | Existing capacity (before upgrade) | Text input | No | 4.5 tonnes of fabricated products per month | Placeholder "e.g. 200 units/day". |
| 7 | Capacity utilisation Year 1 (%) | Number input | No | 60 | 8.6 t x 12 x 60% ≈ 62 t. |

**Products, share of output and selling price (click **Add product** for rows 2-3)**

Prices are ₹ per kg of fabricated steel; weighted average ≈ ₹99.75/kg; 62,000 kg → about ₹62 lakh.

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | MS gates and grills | 40 | 105 |
| 2 | Farm-implement frames and sprayer stands | 35 | 95 |
| 3 | Roof trusses and shed structures | 25 | 98 |


### Step 5 — Market & sales assumptions

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (click opens enlarge dialog: type, then Confirm) | No | Farmers, builders, school and hostel managements and contractors in Nandyal, Kurnool, Atmakur and Banaganapalle, reached through direct orders and local contractors. |  |
| 2 | Demand / footfall note | Textarea (click opens enlarge dialog: type, then Confirm) | No | Fourteen pending orders for gates and trusses worth about Rs 9 lakh are being turned away for lack of capacity; farm-implement orders peak before the kharif season. |  |


### Step 6 — Workshed / premises & power

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | Khadar Engineering Works shed, Industrial Estate Road, Nandyal | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea (click opens enlarge dialog: type, then Confirm) | No | Own shed of 2,400 sq. ft. on a 300 sq. yd. site; a 700 sq. ft. extension will be built on the same site for the new machines. |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | 30 kW three-phase (existing 15 kW, additional 15 kW required) |  |


### Step 7 — Applicant / firm

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | * (not enforced) | Khadar Engineering Works (Prop. Shaik Abdul Khadar) | AUTO – arrives pre-filled "Shaik Abdul Khadar" with the note "Filled in from your unit details…"; overwrite. |
| 2 | Legal status (sole / partnership / company) | Text input | No | Sole proprietorship |  |
| 3 | GSTIN (optional) | Text input (masked) | No | 37CMLPS5528Q1ZY | Valid check letter Y. |
| 4 | Firm PAN (optional) | Text input (masked) | No | (leave blank) | Proprietor's own PAN must not be typed here. |
| 5 | Udyam registration number (optional) | Text input (masked) | No | UDYAM-AP-17-0061042 | Udyam is mandatory for the 2nd loan per spec; the field itself is optional in the form. |
| 6 | Contact mobile number (optional) | Text input (digits only) | No | 9704861539 |  |
| 7 | Correspondence address | Textarea (click opens enlarge dialog: type, then Confirm) | No | H.No. 14-3-82, Industrial Estate Road, Nandyal, Nandyal District, Andhra Pradesh - 518501 | AUTO – arrives as "Nandyal, Nandyal"; replace. |


### Step 8 — Upgrade project cost
Optional calculator: "Work out working capital" at 1.5 months after Step 10 gives "About ₹6.75 lakh"; do not apply.

**Order of entry**

| Order | Action |
|---|---|
| 1 | Check the grey box: Promoter / applicant = **Shaik Abdul Khadar**; Unit = **Khadar Engineering Works**; Address = **H.No. 14-3-82, Industrial Estate Road, Nandyal, Nandyal District, Andhra Pradesh - 518501**; GSTIN = **37CMLPS5528Q1ZY**. |
| 2 | Business kind drop-down should show **Making things** (guessed from "fabrication"). |
| 3 | Add the 6 machinery rows (no numeric machinery box exists for this pack), then fill the amount fields. |

**Machinery list (click **Add machinery** per row)**

AUTO – machinery total 14.75 (all new; no used items).

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Hydraulic press brake, 40-ton x 2.5 m | New | Sri Sai Machine Tools, Hyderabad | 1 | 4.75 | 4.75 |
| 2 | Hydraulic shearing machine, 3 mm x 2 m | New | Sri Sai Machine Tools, Hyderabad | 1 | 3.25 | 3.25 |
| 3 | CNC plasma cutting machine with 1.5 m x 3 m table | New | Deccan CNC Systems, Hyderabad | 1 | 2.50 | 2.50 |
| 4 | MIG welding set, 400 A | New | Deccan Welding Equipments, Kurnool | 2 | 0.75 | 1.50 |
| 5 | Spray painting booth with 2 HP compressor | New | Deccan Welding Equipments, Kurnool | 1 | 1.50 | 1.50 |
| 6 | EOT crane, 2-tonne | New | Sri Sai Machine Tools, Hyderabad | 1 | 1.25 | 1.25 |
|  |  |  |  |  | TOTAL | 14.75 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Land / building / workshed — land (₹ Lakhs) | Number input | No | 0 | Land is normally excluded for the upgrade; leave 0 or blank. |
| 2 | Land / building / workshed — building (₹ Lakhs) | Number input | No | 3.50 | 700 sq. ft. shed extension. |
| 3 | Furniture & fixtures (₹ Lakhs) | Number input | No | 1.25 | Crane rails, electrical panel, tool racks, office furniture. |
| 4 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | 0.50 | Note capital P in the 2nd-loan label. |
| 5 | Working capital (₹ Lakhs) | Number input | No | 4.00 | Additional working capital for the doubled output. |
| 6 | Total Project Cost | Read-only (auto) | – | ₹ 24 Lakhs | AUTO – 0 + 3.50 + 14.75 + 1.25 + 0.50 + 4.00 = 24.00. |


### Step 9 — Means of finance (critical)

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name (heading "Term loan terms") | Text input | No | Union Bank of India, Nandyal Main Branch |  |
| 2 | Interest rate (% per year) | Number input | No | 11 |  |
| 3 | Moratorium (months) | Number input | No | 6 |  |
| 4 | Loan tenure (months) | Number input | No | 84 | Seven years including moratorium. |
| 5 | Own contribution (₹ Lakhs) — 10% for all categories | Number input | No | 2.40 | Exactly 10% of 24.00 = minimum allowed. |
| 6 | PMEGP 2nd-loan margin money (₹ Lakhs) — 15% / 20% NER-Hill | Number input | No | 3.60 | 15% of 24.00 (not NER/Hill). |
| 7 | Bank term loan + / or WC (₹ Lakhs) | Number input | No | 18.00 | 75%. Debt ÷ (own + MM) = 18.00 ÷ 6.00 = 3.00, exactly at the ceiling of 3, which is allowed. |
| 8 | Other Sources (₹ Lakhs) | Number input | No | 0 |  |
| 9 | Total Finance | Read-only (auto) | – | ₹ 24 Lakhs | AUTO – 2.40 + 3.60 + 18.00 + 0. |
| 10 | Info note | Read-only (auto) | – | Upgrade MoF: own 10% + uniform MM 15% (20% NER/Hill) + bank. Not first-PMEGP category rates. Indicative MM ≈ ₹3.6 Lakhs · PMEGP / manufacturing. | AUTO – grey note; the amount is capped at the sector-band ceiling (₹100 lakh mfg / ₹25 lakh service) then x15%. |

Optional calculators: "Split the funding" (own 10, subsidy 15) → "Own money ₹2.4 lakh, subsidy ₹3.6 lakh, bank loan ₹18 lakh."; "Loan instalment and DSCR" (18, 11%, 7 yrs, available 8) → "Monthly instalment: ₹0.31 lakh. Yearly: ₹3.70 lakh." "DSCR: 2.16" Comfortable.


### Step 10 — Operating cost & sales
Running cost = 35.50+3.40+11.40+1.00+1.20+1.50 = 54.00; sales 62.00.

**Raw materials (click **Add raw material**)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | MS sheets, 2-6 mm | Gates, grills, panels and trusses | Stockist at Kurnool, 5-tonne lots every month |
| 2 | MS angles, channels and square pipes | Frames and structures | Stockist at Nandyal, weekly |
| 3 | Welding wire, electrodes and gas | Welding and cutting | Local dealer, monthly |
| 4 | Primer, paint and consumables | Surface finish | Paint dealer in Nandyal, monthly |

**Staff by role and monthly pay (click **Add role**)**

8 persons, ₹95,000 a month = ₹11.40 lakh a year (not linked to Wages automatically).

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Master welder | 1 | 18000 |
| 2 | Welder-fabricator | 3 | 13000 |
| 3 | Helper | 3 | 9000 |
| 4 | Machine operator | 1 | 11000 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | 35.50 | 62 t x 1.03 x ₹55/kg ≈ ₹35.1 lakh plus consumables. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | 3.40 |  |
| 3 | Wages (₹ Lakhs) | Number input | No | 11.40 | 95,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | 1.00 |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | 1.20 |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | 1.50 |  |
| 7 | Annual Production Volume | Number input | No | 62000 | No unit shown: enter kg per year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | 62.00 | 62,000 kg x ₹100 per kg. |


### Step 11 — Financial viability
Header strip: "Work out break-even".

**Year-wise table (Year | Sales | RM | Wages | Power | Net profit): type over all cells**

₹ lakh. 5% yearly growth; Net profit = PAT from the finance panel.

| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 62.00 | 35.50 | 11.40 | 3.40 | 2.44 |
| 2 | 65.10 | 37.28 | 11.97 | 3.57 | 3.16 |
| 3 | 68.36 | 39.14 | 12.57 | 3.75 | 3.91 |
| 4 | 71.77 | 41.10 | 13.20 | 3.94 | 4.65 |
| 5 | 75.36 | 43.15 | 13.86 | 4.13 | 5.41 |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number input | No | 65.37 | Calculator "Work out break-even": sales 62, changing 38.9, fixed 15.1 → "Break-even at about 65.37% of capacity" → Use these values. |

- AUTO – cards: Project cost ₹ 24 Lakhs; Equity + loan + other ₹ 24 Lakhs.
- AUTO – finance panel: 7 green checks; Years selector 7; Project IRR **26.24%**, Equity IRR **165.44%**, NPV at 12% **₹14.19 lakh**, Payback **3.51 years**, Average DSCR **2.08**, Break-even **85.94%**.
- AUTO – bottom DSCR card (older formula) shows "Average DSCR: 1.46" in red with " — below 1.5; lenders may query this." while the panel says 2.08.


### Step 12 — Implementation schedule

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date picker | No | 2027-01-18 |  |

**Milestones (3 pre-drawn rows)**

| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | Order and install press brake, shear and plasma cutting table | 2026-11-25 | 2027-01-05 |
| 2 | Shed extension, additional power connection and crane | 2026-11-25 | 2026-12-31 |
| 3 | Trial production and start of upgraded production | 2027-01-06 | 2027-01-17 |


### Step 13 — Employment & impact

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Direct employment (count) | Number input | No | 8 | Total after upgrade (5 existing + 3 new). The label does not say whether to enter total or additional. |
| 2 | Indirect employment (count) | Number input | No | 6 |  |
| 3 | Short impact note (optional) | Textarea (click opens enlarge dialog: type, then Confirm) | No | Three new skilled jobs are added to the existing five; the upgrade is expected to double turnover to about Rs 62 lakh and improve finish quality for institutional buyers. | Placeholder "Modernisation / turnover growth from upgrade — short note". |


### Step 14 — Documents & uploads
Eight slots. No caste/special-category slot (not offered for the 2nd loan). The conditional "8th-pass / education certificate" slot is not expected (see Discrepancies).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Aadhaar / PAN | File input | No | PMEGP2_aadhaar_pan_kyc.pdf | Slot order: Aadhaar / PAN; Machinery Quotations; Building / Workshed Estimate; Bank Passbook / Cancelled Cheque; Udyam Certificate (or application); Prior PMEGP / REGP / MUDRA Sanction Letter; CA Certificate of Existing Investment; Last 3 Years Profit / ITR Statements. |
| 2 | Machinery Quotations | File input | No | PMEGP2_quotation_machinery.pdf |  |
| 3 | Building / Workshed Estimate | File input | No | PMEGP2_building_estimate.pdf |  |
| 4 | Bank Passbook / Cancelled Cheque | File input | No | PMEGP2_bank_passbook_union_nandyal.pdf |  |
| 5 | Udyam Certificate (or application) | File input | No | PMEGP2_udyam_certificate.pdf |  |
| 6 | Prior PMEGP / REGP / MUDRA Sanction Letter | File input | No | PMEGP2_prior_sanction_letter.pdf | 2nd-loan-only slot. |
| 7 | CA Certificate of Existing Investment | File input | No | PMEGP2_ca_certificate_existing_investment.pdf | 2nd-loan-only slot. |
| 8 | Last 3 Years Profit / ITR Statements | File input | No | PMEGP2_profit_itr_3years.pdf | 2nd-loan-only slot. |


**Money cross-check (PMEGP 2nd loan).**
- Upgrade project cost = Land 0 + Building 3.50 + Machinery 14.75 (4.75+3.25+2.50+1.50+1.50+1.25) + Furniture/fixtures 1.25 + Preliminary 0.50 + Working capital 4.00 = **24.00** lakh (manufacturing band, below the ₹100 lakh ceiling).
- Own contribution uniform **10%** = 2.40; margin money uniform **15%** (not NER/Hill) = 3.60 (the form's indicative MM = min(24, 100) x 15% = 3.6); bank = 24.00 − 2.40 − 3.60 = **18.00** (75%). Means of finance = 2.40 + 3.60 + 18.00 + 0 = **24.00** exact. Debt ÷ (own + subsidy) = 18 ÷ 6 = **3.00** exactly at the allowed maximum (passes). Own share 10.00% = the minimum (passes).
- EMI (calculator): ₹18 lakh, 11%, 84 months = ₹0.31 lakh/month = ₹3.70 lakh/year; DSCR calculator 2.16; finance-model average DSCR 2.08 (min 1.89).
- Running cost 54.00 vs sales 62.00 → EBITDA 8.00. Wages 95,000 x 12 = 11.40.

**Uploads to prepare:** `PMEGP2_aadhaar_pan_kyc.pdf` → "Aadhaar / PAN"; `PMEGP2_quotation_machinery.pdf` → "Machinery Quotations"; `PMEGP2_building_estimate.pdf` → "Building / Workshed Estimate"; `PMEGP2_bank_passbook_union_nandyal.pdf` → "Bank Passbook / Cancelled Cheque"; `PMEGP2_udyam_certificate.pdf` → "Udyam Certificate (or application)"; `PMEGP2_prior_sanction_letter.pdf` → "Prior PMEGP / REGP / MUDRA Sanction Letter"; `PMEGP2_ca_certificate_existing_investment.pdf` → "CA Certificate of Existing Investment"; `PMEGP2_profit_itr_3years.pdf` → "Last 3 Years Profit / ITR Statements". All eight always appear for this scheme (no condition).

**Generate & verify:**
1. On Step 14 click **Check my answers** (expect no items), then **Generate DPR**; wait for "DPR generated successfully!".
2. Cover: kicker "DETAILED PROJECT REPORT" (no PMEGP skin), "On", **"Upgradation of"**, **Khadar Engineering Works**, **under '2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units'**; meta District Nandyal, Location Nandyal, Entrepreneur name Shaik Abdul Khadar.
3. TOC has **14 sections**: Cover & prior assistance; Introduction & upgrade process; Location; Unit profile & capacity (existing → proposed); Market & sales assumptions; Workshed / premises & power; Applicant / firm; Upgrade project cost; Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Employment & impact; Documents & uploads.
4. Section 1 shows: Prior scheme "PMEGP (1st loan)", Prior sanction amount 9.8, Year of first subsidy 2021, Margin money already adjusted "Yes", First loan repaid in time? "Yes", Years of profit 4, Existing annual turnover 31.5, Implementing agency "DIC", NER / Hill State? "No", Sector band "Manufacturing (ceiling ₹1 crore)", Entrepreneur name, Age 39. Cost section: machinery table 6 rows (total 14.75), building 3.5, furniture 1.25, preliminary 0.5, working capital 4, total 24. MoF 2.4 / 3.6 / 18 / 0, bank terms (Union Bank of India, 11, 6, 84). Projected results: Revenue 62.00 | 65.10 | 68.36 | 71.77 | 75.36 | 79.13 | 83.09; EBITDA 8.00 | 8.39 | 8.82 | 9.26 | 9.73 | 10.21 | 10.72; PAT 2.44 | 3.16 | 3.91 | 4.65 | 5.41 | 6.26 | 7.06; Closing cash 4.25 | 7.50 | 10.91 | 14.51 | 18.31 | 22.29 | 26.53; DSCR 2.45 | 1.89 | 1.93 | 1.98 | 2.04 | 2.09 | 2.16; Returns: IRR 26.24%, Equity IRR 165.44%, NPV 14.19, payback 3.51 years, average DSCR 2.08, break-even 85.94%. Existing vs proposed capacity (4.5 → 8.6 t/month) and existing vs proposed technology paragraphs are present. Uploads list shows 8 "Uploaded".
5. Download PDF/DOCX (English only) and re-check cover, 14 sections and numbers.

**Negative / boundary tests (PMEGP 2nd loan).**
1. Step 9: own 2.00, bank 18.40 (sum 24.00) → blocker "Your own money is 8.33% of the project cost. The minimum for this scheme is 10%." hint "You need at least ₹2.40 lakh of your own money."
2. Step 9: own 2.40, MM 3.60, bank 18.10 (sum 24.10 vs cost 24.00) → blocker "The funding adds up to ₹24.10 lakh but the project cost is ₹24.00 lakh. They must match exactly (difference ₹0.10 lakh)." Own 1.20 / MM 3.60 / bank 19.20 → minimum-equity blocker (5%) and debt-equity blocker "Bank debt is 4 times your own money plus subsidy. The most allowed is 3 to 1."
3. Step 9: MM 4.80 (20%) with NER / Hill = No, own 2.40, bank 16.80 → expected by the rules "uniform 15%": a warning; actual: no warning or block (see Discrepancies). Set NER / Hill = Yes → banner and info note change to 20% / ≈ ₹4.8 Lakhs.
4. Step 1: set "First margin money adjusted?" = No, "First loan repaid in time?" = No and "Years of continuous profit" = 1 → spec says hard eligibility; actual: no message, Next and Generate still work.
5. Step 1: change "Sector band" to "Business / Service / Trading (ceiling ₹25 lakh)" while the unit still has machinery and cost 24.00 → no message (indicative MM stays 3.6 = min(24, 25) x 15%); nothing checks the band against the business kind or the cost, and a project above the band ceiling can only be funded by raising own money (see Discrepancies 2).
6. Step 1: age 17 → red guardian toast (same behaviour as section 2 test 4); Next still advances, Save Draft/Generate fail.
7. Step 1: leave District blank → Next blocked "Fill the required fields before continuing: District". Step 6: clear the shed name → blocked.
8. Step 7: Udyam `UDYAM-AP-17-006104` (too short) → Next blocked "Correct these fields before continuing: Udyam Registration No." and the inline message "Udyam number looks like UDYAM-AP-01-0001234."

**Discrepancies spotted (PMEGP 2nd loan).**
1. **Eligibility gates are not enforced:** spec §3/§4 and the in-app impact bullets say prior scheme, margin money adjusted, first loan repaid and ≥ 3 profitable years are "hard eligibility"; the code only stores them. "No / No / 1 year" generates normally.
2. **Margin-money rate and ceilings not validated for the 2nd loan:** the only subsidy-rate check (`pmegp.rate`) runs for first-loan `PMEGP` only; nothing checks 15% / 20% NER-Hill, the ₹100 lakh / ₹25 lakh band ceilings, or spec §6 "must not claim MM above the ceilings".
3. **Education-gate code includes `PMEGP_2ND`** (`showPmegpEducationGate`), but the 2nd-loan spec lists no education certificate, and the gate cannot fire without a Scheme-Finder `activity` answer anyway.
4. **Start Date ambiguity:** spec Step 4 says "Original commencement"; UI label is only "Start Date" next to "Commitment Date", so it is unclear whether to enter 2021 (original) or the upgrade start.
5. **Spec field naming:** spec Step 1 lists `sectorTypeHint` ("Manufacturing | Service/Trading"); the form calls it "Sector band" with ceiling text in the options.
6. **Label drift form vs preview/PDF:** form "First sanction / project cost (₹ Lakhs)", "First margin money adjusted?", "Years of continuous profit", "Latest annual turnover (₹ Lakhs)", "Entrepreneur full name/age" vs preview "Prior sanction amount", "Margin money already adjusted", "Years of profit", "Existing annual turnover", "Entrepreneur name"/"Age"; `firstProjectCost` / `firstMmAdjusted` labels exist in the preview model but are unused.
7. **"Direct employment (count)" ambiguity:** spec says "Additional jobs from upgrade"; the label does not say total vs additional.
8. **Two DSCR figures again:** inline card 1.46 (red) vs finance panel / report 2.08 for the same inputs.

---

## 4. Pradhan Mantri MUDRA Yojana — PMMY bank-unit pack (`MUDRA`)

**Entry:** `/individual-dpr/create?new=true&scheme=MUDRA` opens the scheme brief "Pradhan Mantri MUDRA Yojana (PMMY)"; click **Start DPR steps** to reach the form. Alternative: open `/individual-dpr/create?new=true`, click the card "Pradhan Mantri MUDRA Yojana", then **Start DPR steps**. Use **Next** / **Previous** between steps. Money fields are in **₹ Lakhs** unless the label says ₹ (product price, monthly pay are in ₹). Date inputs: type `dd-mm-yyyy` in an en-IN browser (ISO value is shown in the table).
**Total steps:** 12 (Cover & category · Business activity · Location · Unit profile · Market & sales assumptions · Premises · Applicant / firm · Project cost · Means of finance · Operating cost & sales · Financial viability · Documents & uploads).
**Test persona (main run = Tarun):** Ravuri Venkata Satish Kumar, 34, proprietor of **Sai Satish Steel Furniture Works**, an existing (since June 2019) steel-furniture workshop in the Ring Road industrial area, **Tenali** (Tenali mandal), **Guntur** district. He makes steel almirahs, office file racks and school desk-bench sets and wants a PMMY **Tarun** term loan of ₹5.25 lakh to add a hydraulic press, shearing machine, two MIG welders, a spray-painting set and a used bench drill. Entrepreneur: male, general category (category is not asked by this scheme). The same persona with scaled-down or scaled-up amounts is used in the variant table after the main steps.
**Before you start:** the "light" Shishu/Kishore screens depend on the Scheme Finder answer, not on the Step 1 category (see variant table and discrepancy D1). For the main Tarun run, open the URL directly with no Scheme Finder handoff (clear `venture-match-handoff` in localStorage if present).

### Step 1 — Cover & category
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes (blocks Next) | `Sai Satish Steel Furniture Works` | Red ring + "Required" if empty. Optional button **Suggest title** needs Nature of Business + Major Products first. |
| 2 | District * | Select (26 AP districts) | Yes | `Guntur` | Changing district clears Location. |
| 3 | Location * | Select (towns of chosen district; disabled until district chosen) | Yes | `Tenali` | List for Guntur: Guntur, Tenali, Ponnur, Mangalagiri, Tadepalli, Prathipadu, Vatticherukuru. |
| 4 | Nature of Business | Text input (+ **Match me** button, optional) | No | `Manufacturing steel almirahs, office file racks and school furniture on order and for retail` | Data check flags text under 12 characters or placeholders. |
| 5 | Major Products | Text input | No | `Steel almirahs, office file racks, school desk-bench sets` | Min 3 characters for the data check. |
| 6 | PMMY category | Select | No (not enforced) | `Tarun (above ₹5 lakh to ₹10 lakh)` | Options exactly: Shishu (up to ₹50,000) / Kishore (above ₹50,000 to ₹5 lakh) / Tarun (above ₹5 lakh to ₹10 lakh) / Tarun Plus (above ₹10 lakh to ₹20 lakh). Drives the bank-loan cap check (₹0.5 / 5 / 10 / 20 lakh) and the Tarun Plus upload. |
| 7 | Loan purpose | Select | No | `Term loan (machinery / fixed assets)` | Options: Term loan (machinery / fixed assets) / Working capital / Term loan + working capital. |
| 8 | Entrepreneur full name | Text input | No | `Ravuri Venkata Satish Kumar` | Placeholder "Full name as in Aadhaar". Feeds the Step 7 auto-fill. |
| 9 | Entrepreneur age | Number input, min 18, max 100 | No | `34` | Under 18 shows inline range error plus a guardian toast and blocks saving. |
| 10 | Experience in this line (years) | Number input, min 0, max 80 | No | `9` | |

### Step 2 — Business activity
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Steel fabrication - metal furniture manufacturing` | Blocks Next if empty. |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Sai Satish Steel Furniture Works has made steel almirahs, file racks and school furniture at Tenali since June 2019 for schools, hostels, government offices and households of Guntur, Palnadu and Krishna districts. The loan will add a hydraulic press, a shearing machine and welding capacity to lift output from about 20 to 30 pieces a month.` | Data check wants at least 30 characters. No "Process of manufacture" box is shown for MUDRA. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea | No | `The unit stands in the Ring Road industrial area of Tenali (Tenali mandal, Guntur district), 2 km from Tenali Junction railway station and about 30 km from Vijayawada by road. Steel sheet traders in Vijayawada deliver within a day and most customers are within 60 km.` | |

### Step 4 — Unit profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `Existing unit with one press and two welding sets. The loan adds a 25-tonne hydraulic press, a sheet shearing machine, two MIG welding sets, a spray-painting set and a used bench drill to raise output to 30 pieces a month.` | Data check wants 30+ characters. |
| 2 | Start Date | Date | No | `10-06-2019` (2019-06-10) | Must be a real date 1990–2100 and **not after** Commitment Date, else toast "Commitment Date must be on or after Start Date" and the value is rejected. |
| 3 | Commitment Date | Date | No | `20-11-2026` (2026-11-20) | Same rule. |
| 4 | Tools / process level | Text input | No | `Semi-mechanised: sheet cutting, pressing, MIG welding, spray painting` | |
| 5 | Capacity / throughput (if applicable) | Text input | No | `30 pieces per month (mixed steel furniture), single shift` | |

Sub-table "Products, share of output and selling price" (heading shown; first blank row is pre-shown; click **Add product** for rows 2 and 3):
| Row | Product Name | Share of Output (%) | Selling Price (per unit, ₹) |
|---|---|---|---|
| 1 | Steel almirah (2-door, 6 ft) | 56 | 11500 |
| 2 | Office file rack (5-shelf) | 24 | 4800 |
| 3 | School desk-bench set | 20 | 3900 |

Notes: shares add to 100 (no code check enforces it). Row basis: 185 almirahs + 80 racks + 65 sets = 330 units a year.

### Step 5 — Market & sales assumptions
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Government and private schools, hostels, small offices, furniture dealers and households in Guntur, Palnadu and Krishna districts.` | |
| 2 | Demand / footfall note | Textarea | No | `Schools and hostels buy before the June academic year; orders for 120 almirahs are already booked for 2026-27 and dealers reorder every month.` | |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Rented workshed, Ring Road Industrial Area, Tenali` | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea | No | `2,000 sq ft workshed rented at ₹8,000 per month on a registered five-year lease from Sri K. Subba Rao, valid till March 2031.` | |
| 3 | Premises — owned / rented | Select | No | `Rented` | Options: Owned / Rented. Stored as `premisesType`; never printed in the report (D3). |
| 4 | Power requirement (HP / kW) — optional | Text input | No | `15 kW, 3-phase industrial connection (APCPDCL)` | Never printed in the report (D3). |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | Star shown but not enforced | `Sai Satish Steel Furniture Works (Prop. Ravuri Venkata Satish Kumar)` | **AUTO – verify shows** `Ravuri Venkata Satish Kumar` before you type (copied from Step 1 entrepreneur name) with note "Filled in from your unit details…". Typing a different value stops the auto-follow. |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | Text input, format mask | No | `37BQKPR4821M1Z7` | 15 characters, check character verified (valid). |
| 4 | Firm PAN (optional) | Text input, format mask | No | leave blank | An individual PAN (4th letter P, e.g. BQKPR4821M) is rejected for this field; sole proprietors should leave it blank. |
| 5 | Udyam registration number (optional) | Text input, format mask | No | `UDYAM-AP-11-0034821` | Hyphens are added automatically; must be UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, 10 digits | No | `9440218365` | Must start 6–9. |
| 7 | Correspondence address | Textarea | No | `D.No. 11-4-27/B, Ring Road Industrial Area, Tenali, Guntur District, Andhra Pradesh 522201` | **AUTO – verify shows** `Tenali, Guntur` before typing (town, district). |

### Step 8 — Project cost
Top of page: read-only box "Details carried to this schedule" must show Promoter/applicant, Unit, Address, GSTIN from Steps 1 and 7. Optional calculator button **Work out working capital**. Select **What kind of business is this?** = `Making things` (Making things / A service / Buying and selling). With Making things the **Machinery list** is shown.

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select | No | `Making things` | Decides machinery list (Making things) vs assets list (service / trading). |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number | No | `0` | Hidden only in Shishu/Kishore light mode (needs Scheme Finder budget). |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number | No | `0` | Rented shed. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number | No | `0.45` | Stored as utilities & infrastructure (labelled differently in the report). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number | No | `0.22` | |
| 6 | Working capital (₹ Lakhs) | Number | No | `2.00` | |
| — | Plant & machinery | No direct box | — | see list | **AUTO – verify shows** machinery total `4.58` in the cost total below (the direct machinery box is hidden for this scheme). |

Machinery list (click **Add machinery** five times; each card has Description, Condition, Supplier, Qty, Unit cost (₹ Lakhs)):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Hydraulic power press, 25 tonne | New | Sri Lakshmi Engineering Works, Vijayawada | 1 | 1.65 | 1.65 |
| 2 | Sheet shearing machine, 4 ft x 3 mm | New | Kakatiya Machine Tools, Hyderabad | 1 | 1.20 | 1.20 |
| 3 | MIG welding set, 250 A | New | Weldmaster Agencies, Guntur | 2 | 0.45 | 0.90 |
| 4 | Spray-painting compressor and gun set | New | Sri Venkateswara Hardware, Guntur | 1 | 0.55 | 0.55 |
| 5 | Bench drilling machine, 16 mm | Used | Bharat Machinery Mart, Tenali | 1 | 0.28 | 0.28 |

**AUTO – verify shows** "Total Project Cost ₹ 7.25 Lakhs".

### Step 9 — Means of finance
Block "Term loan terms" (4 inputs) then the four money inputs. Optional calculators: **Split the funding**, **Loan instalment and DSCR**.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `State Bank of India, Tenali Main Branch` | |
| 2 | Interest rate (% per year) | Number | No | `10.5` | Data check calls rates outside 6–16% unusual. |
| 3 | Moratorium (months) | Number | No | `3` | Must be less than tenure. |
| 4 | Loan tenure (months) | Number | No | `60` | Under 12 or over 180 months is flagged unusual. |
| 5 | Own contribution (₹ Lakhs) | Number | Needed to generate | `2.00` | No minimum % for MUDRA. |
| 6 | Government grant (₹ Lakhs) — usually 0 for MUDRA | Number | No | `0` | |
| 7 | Bank term loan + / or WC (₹ Lakhs) | Number | Needed to generate | `5.25` | Capped by category: Tarun ≤ 10.00. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |

**AUTO – verify shows** "Total Finance ₹ 7.25 Lakhs" and the grey note "MUDRA is not a subsidy scheme… Category: tarun."

### Step 10 — Operating cost & sales
Click **Add raw material** three times and **Add role** twice (both lists start empty).
Raw materials:
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Cold-rolled steel sheets 0.6–1.0 mm | Body, doors and shelves of almirahs and racks | Monthly 3-tonne lots from Vijayawada steel traders on 15-day credit |
| 2 | Welding wire, powder paint and thinner | Joining and surface finish | Weekly from local hardware dealers, cash |
| 3 | Locks, hinges, handles and fittings | Almirah doors and drawers | Monthly bulk purchase from a Hyderabad hardware wholesaler |

Staff by role and monthly pay:
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Skilled welder-fabricator | 2 | 14000 |
| 2 | Helper and painter | 1 | 10000 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number | No | `17.00` | |
| 2 | Power Cost (₹ Lakhs) | Number | No | `0.90` | |
| 3 | Wages (₹ Lakhs) | Number | No | `4.56` | = (2×14,000 + 10,000) × 12 = ₹4.56 L. |
| 4 | Maintenance (₹ Lakhs) | Number | No | `0.30` | |
| 5 | Administrative Expenses (₹ Lakhs) | Number | No | `1.20` | Includes shed rent ₹0.96 L. |
| 6 | Marketing Expenses (₹ Lakhs) | Number | No | `0.45` | |
| 7 | Annual Production Volume | Number | No | `330` | Units a year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number | No | `27.65` | 185×11,500 + 80×4,800 + 65×3,900 = ₹27.65 L. |

### Step 11 — Financial viability
Read-only panels first: cards "Project cost ₹ 7.25 Lakhs" and "Equity + loan + other ₹ 7.25 Lakhs"; a "Projected financial statements" panel with seven check marks all green; DSCR card. No Nayak panel in this run.
Five-year table (all cells typed; Year column fixed 1–5):
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 27.65 | 17.00 | 4.56 | 0.90 | 1.45 |
| 2 | 29.03 | 17.85 | 4.79 | 0.95 | 1.72 |
| 3 | 30.48 | 18.74 | 5.03 | 0.99 | 1.99 |
| 4 | 32.01 | 19.68 | 5.28 | 1.04 | 2.29 |
| 5 | 33.61 | 20.66 | 5.54 | 1.09 | 2.56 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number | No | `80` | Model panel shows 80.22%. Values above 100 are flagged unusual. |

**AUTO – verify shows:** model panel Average DSCR `2.13`, Break-even `80.22%`, Project IRR `33.6%`, NPV at 12% `₹5.25 lakh`, Payback `2.74 years`, all seven checks green; the older DSCR card reads "Average DSCR: 2.14" (assumes 7 years at 12%) and is not red.

### Step 12 — Documents & uploads
Five file inputs (accept .pdf .doc .docx .jpg .jpeg .png; max 50 MB). After upload each shows "✓ Uploaded: <file name>".
| # | Slot (label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop Address Proof | File | No | `MUDRA_shop_address_proof_rent_agreement.pdf` | |
| 2 | Bank Statements | File | No | `MUDRA_bank_statements_6months_SBI.pdf` | |
| 3 | Machinery / Equipment Quotations | File | No | `MUDRA_quotation_machinery_press_shearing.pdf` | |
| 4 | Aadhaar / PAN | File | No | `MUDRA_aadhaar_pan_sample_masked.pdf` | Use a dummy file, never a real ID. |
| 5 | Udyam Certificate (or application) | File | No | `MUDRA_udyam_certificate.pdf` | |
| 6 | Previous Mudra Loan Repayment / Closure Certificate | File | No | `MUDRA_previous_mudra_closure_certificate.pdf` | Appears only when category = Tarun Plus (or Scheme Finder budget ₹50 lakh+, D2). Not shown in this run. |

### Variant table — Shishu / Kishore / Tarun / Tarun Plus
Same persona and steps; change only what is listed. "Light mode" needs a Scheme Finder run (budget answer) before **Know more & create**; without it every variant shows the full Tarun screens.
| Item | Shishu | Kishore | Tarun (main run) | Tarun Plus |
|---|---|---|---|---|
| Step 1 PMMY category | Shishu (up to ₹50,000) | Kishore (above ₹50,000 to ₹5 lakh) | Tarun (above ₹5 lakh to ₹10 lakh) | Tarun Plus (above ₹10 lakh to ₹20 lakh) |
| Step 1 Loan purpose | Working capital | Term loan (machinery / fixed assets) | Term loan (machinery / fixed assets) | Term loan (machinery / fixed assets) |
| Bank-loan cap enforced (Generate blocked above) | ₹0.50 L | ₹5.00 L | ₹10.00 L | ₹20.00 L |
| Scheme Finder budget answer for light mode | "Less than ₹2 lakh" or "₹2–5 lakh" | "₹2–5 lakh" | "₹5–10 lakh" (no light mode) | "₹10–20 lakh" (no light mode, and no extra upload — D2) |
| Step 8 fields shown | With light mode: only business-kind select, machinery list, Working capital, plus grey text "Heavy capex tables are hidden for Mudra Shishu / Kishore…". Land, building, Furniture & fixtures, Pre-operative hidden. Without it: full 5 fields | same as Shishu | full | full |
| Step 8 machinery rows | 1 row: Bench drilling machine, 16 mm · Used · Bharat Machinery Mart, Tenali · 1 · 0.35 | 3 rows: MIG welding set 250 A · New · Weldmaster Agencies, Guntur · 2 · 0.45; Spray-painting compressor and gun set · New · Sri Venkateswara Hardware, Guntur · 1 · 0.55; Bench drilling machine 16 mm · Used · Bharat Machinery Mart, Tenali · 1 · 0.28 | 5 rows as above (4.58) | 5 rows: Hydraulic power press 25 tonne · New · Sri Lakshmi Engineering Works, Vijayawada · 2 · 1.65; Sheet shearing machine 4 ft x 3 mm · New · Kakatiya Machine Tools, Hyderabad · 2 · 1.20; MIG welding set 250 A · New · Weldmaster Agencies, Guntur · 4 · 0.45; Spray-painting compressor and gun set · New · Sri Venkateswara Hardware, Guntur · 2 · 0.55; CNC press brake 40 tonne · New · Kakatiya Machine Tools, Hyderabad · 1 · 3.20 (total 11.80) |
| Step 8 other costs | WC 0.25 → total 0.60 | WC 1.20 → total 2.93 | furniture 0.45, pre-op 0.22, WC 2.00 → 7.25 | furniture 1.20, pre-op 0.80, WC 3.20 → total 17.00 |
| Step 9 own / grant / bank / other | 0.25 / 0 / 0.35 / 0 | 1.20 / 0 / 1.73 / 0 | 2.00 / 0 / 5.25 / 0 | 3.20 / 0 / 13.80 / 0 |
| Step 9 bank name, rate, moratorium, tenure | Union Bank of India, Tenali · 11 · 0 · 36 | State Bank of India, Tenali Main Branch · 10.5 · 3 · 48 | State Bank of India, Tenali Main Branch · 10.5 · 3 · 60 | State Bank of India, Tenali Main Branch · 10.5 · 6 · 72 |
| Step 10 RM / power / wages / maintenance / admin / marketing / volume / sales (₹ L) | 1.70 / 0.06 / 0.60 / 0.04 / 0.12 / 0.05 / 120 / 3.00 | 7.60 / 0.30 / 1.80 / 0.12 / 0.50 / 0.20 / 110 / 11.80 | 17.00 / 0.90 / 4.56 / 0.30 / 1.20 / 0.45 / 330 / 27.65 | 44.00 / 2.00 / 11.40 / 0.70 / 2.60 / 1.00 / 640 / 70.00 |
| Step 10 staff rows (role · people · ₹/month) | Helper · 1 · 5000 | Welder · 1 · 15000 | as main | Welder-fabricator · 3 · 14000; Helper and painter · 3 · 10000; Supervisor · 1 · 23000 (₹95,000 a month = ₹11.40 L a year) |
| Step 11 five rows (sales / RM / wages / power / net profit) | 3.00/1.70/0.60/0.06/0.26; 3.15/1.79/0.63/0.06/0.28; 3.31/1.87/0.66/0.07/0.32; 3.47/1.97/0.69/0.07/0.34; 3.65/2.07/0.73/0.07/0.37 | 11.80/7.60/1.80/0.30/0.64; 12.39/7.98/1.89/0.32/0.74; 13.01/8.38/1.98/0.33/0.85; 13.66/8.80/2.08/0.35/0.97; 14.34/9.24/2.19/0.36/1.06 | as main | 70.00/44.00/11.40/2.00/3.61; 73.50/46.20/11.97/2.10/4.27; 77.18/48.51/12.57/2.21/4.94; 81.03/50.94/13.20/2.32/5.62; 85.09/53.48/13.86/2.43/6.34 |
| Step 11 break-even | 72 | 78 | 80 | 80 |
| Step 11 Nayak panel (light mode only) | "Mudra Nayak working capital": turnover shows 3 → WC limit (20%) ₹0.60 Lakhs, promoter margin (5% of WC) ₹0.03 Lakhs | turnover 11.8 → limit ₹2.36, margin ₹0.12 | not shown | not shown |
| Step 12 upload slots | 5 | 5 | 5 | 6 (adds Previous Mudra Loan Repayment / Closure Certificate) |
| Money check | 0.25 + 0.35 = 0.60 | 1.20 + 1.73 = 2.93 | 2.00 + 5.25 = 7.25 | 3.20 + 13.80 = 17.00 |

Variant pass criteria: no "Must fix first" items at Generate; model DSCR 2.59 / 2.09 / 2.13 / 2.44 for Shishu / Kishore / Tarun / Tarun Plus.

### Money cross-check
- Project cost: machinery 1.65 + 1.20 + 0.90 + 0.55 + 0.28 = **4.58**; land 0 + building 0 + furniture 0.45 + pre-operative 0.22 + working capital 2.00. Total **7.25** (4.58 + 0.45 + 0.22 + 2.00).
- Means of finance: own 2.00 + grant 0 + bank 5.25 + other 0 = **7.25**; the app requires funding = cost to ₹1,000 (0.01 lakh), not 1% (D8).
- Own share 2.00 / 7.25 = 27.6% (no minimum for MUDRA). Bank loan 5.25 equals machinery + furniture + pre-operative (5.25), so the "term loan more than assets" advisory does not fire.
- Cap: 5.25 ≤ 10.00 (Tarun). Tarun band check by eye: above ₹5 L and up to ₹10 L.
- Loan instalment (calculator **Loan instalment and DSCR**: 5.25 L, 10.5%, 5 years): EMI ≈ ₹11,284 a month (0.11 lakh), ₹1.35 lakh a year; calculator DSCR ≈ 2.39 using yearly surplus 3.24 (sales 27.65 − running costs 24.41).
- Net profit year 1 (model): EBITDA 3.24, PAT 1.45.

### Uploads to prepare
Aadhaar / PAN → `MUDRA_aadhaar_pan_sample_masked.pdf`; Udyam Certificate → `MUDRA_udyam_certificate.pdf`; Shop Address Proof → `MUDRA_shop_address_proof_rent_agreement.pdf`; Bank Statements → `MUDRA_bank_statements_6months_SBI.pdf`; Machinery / Equipment Quotations → `MUDRA_quotation_machinery_press_shearing.pdf`; Previous Mudra Loan Repayment / Closure Certificate → `MUDRA_previous_mudra_closure_certificate.pdf` (Tarun Plus only).

### Generate & verify
- On Step 12 the **Generate DPR** button becomes enabled (only on the last step). Click **Check my answers** first: expect "All clear" with no findings. Generate then saves and opens `/dpr/view/<id>`.
- Live preview / final view: **12 sections** with titles Cover & category, Business activity, Location, Unit profile, Market & sales assumptions, Premises, Applicant / firm, Project cost, Means of finance, Operating cost & sales, Financial viability, Documents & uploads. Cover reads "Establishment of / Sai Satish Steel Furniture Works / under 'Pradhan Mantri MUDRA Yojana (PMMY)'".
- Numbers to find: PMMY category "Tarun (above ₹5 lakh to ₹10 lakh)", machinery list 5 rows (New / used column shows `new` / `used`), machinery 4.58, total project cost 7.25, own 2.00, bank 5.25, sales 27.65, product table 3 rows with 56 / 24 / 20, 5-year table, break-even 80, projected-results table with DSCR 2.30 for Year 1.
- Expected absent (D3): "Premises — owned / rented" and Power requirement do not appear anywhere. Applicant Aadhaar/PAN numbers are never stored.
- Uploads section lists each slot as "Uploaded (<file name>)" and unfilled slots as not uploaded.
- Download PDF (preview capture) and DOCX; in the server-built DOCX note whether option values print as labels or raw codes (suspected raw `tarun`, `term`; D9).

### Negative / boundary tests
1. Clear Unit / Project Name, District and Location, press **Next** on Step 1 → toast "Fill the required fields before continuing: Unit / Project Name, District, Location"; the three fields get a red ring and "Required"; step does not change.
2. Entrepreneur age `17` → inline "Enter a number from 18 to 100."; guardian toast ("The person named as the entrepreneur must be 18 or older…"); draft is not saved (Saved badge does not move) and **Generate DPR** fails with "Failed to save data before generating DPR". Restore `34`.
3. Switch PMMY category to Kishore with bank loan 5.25 → **Check my answers** shows "Must fix first": "The bank loan of ₹5.25 lakh is more than the ₹5.00 lakh allowed for the Mudra Kishore category." Generate refuses. (Shishu cap 0.50; clear category and the cap check silently disappears — D1.)
4. Step 9 bank loan `5.20` (own 2.00) → "Must fix first": "The funding adds up to ₹7.20 lakh but the project cost is ₹7.25 lakh. They must match exactly (difference ₹0.05 lakh)."
5. Step 7 Udyam `UDYAM-AP-11-34821` → red inline hint; **Next** shows toast "Correct these fields before continuing: Udyam Registration No." and stays. GSTIN `37BQKPR4821M1Z5` → "The last character does not match…"; mobile `5440218365` → "An Indian mobile number starts with 6, 7, 8 or 9."; Firm PAN `BQKPR4821M` → "individual's PAN (4th letter P)… leave this blank".
6. Step 4 set Commitment Date `01-06-2019` (before Start Date) → toast "Commitment Date must be on or after Start Date" and the field keeps its old value. Separately type Nature of Business `test` → at Generate the review dialog lists Unclear: "This answer looks like a placeholder ("test")" with **Generate anyway** available.
7. Product-mix shares 60 + 60 + 20 → accepted with no warning (gap: no 100% check).

### Discrepancies spotted
- **D1.** Spec/impact bullet say the Step 1 category "drives form depth and uploads", but the form never reads `mudraCategory` for depth. Shishu/Kishore light mode (hidden capex fields, Nayak WC panel) depends only on the Scheme Finder budget (`under2L`/`2to5L`); `isMudraLightCategory` is unused. Category only drives the lending cap and the Tarun Plus upload. The category is also optional, and with it empty no cap is enforced.
- **D2.** `isMudraTarunPlus` tests budgets `50Lto1Cr`, `1to10Cr`, `above10Cr`, but Tarun Plus is ₹10–20 lakh (budget `10to20L`). A ₹10–20 L Scheme Finder run gets no closure upload; a ₹50 L+ run (outside the MUDRA ₹20 L cap) gets one.
- **D3.** `premisesType` (Premises — owned / rented) and Power requirement are asked in Step 6 but are never shown in the preview, PDF or server DOCX (`premisesType` is skipped on Step 1 and the lean Step 6 field list omits both).
- **D4.** Spec Step 10 lists "WC cycle notes (stock / debtor / creditor days)"; the form has no such inputs.
- **D5.** Bank "term loan + / or WC" is one number; the finance check treats all of it as a term loan and raises the advisory "term loan more than the assets it pays for… enter it as a working capital loan" when bank loan exceeds machinery + furniture + pre-operative, but no screen has a working-capital-loan input.
- **D6.** Step 8 labels the 4th input "Furniture & fixtures" but it is stored as "Utilities & Infrastructure" and depreciated as a building in the model; the report prints "Utilities & Infrastructure".
- **D7.** Loan purpose `both` ("Term loan + working capital") prints in the preview as another scheme's label (the global value-label map is overridden by EPM Niryat "Both pre + post" / PMPDS "Both / allied").
- **D8.** The brief and data-check text allow a 1% tolerance, but generation blocks unless funding equals cost to 0.01 lakh.
- **D9.** The server DOCX/XLS value formatter maps only a few codes (yes, no, cov, first, woman, owned, rented…), so `tarun`, `term`, `second` etc. are expected to print raw.

## 5. Stand-Up India — bank-unit pack (`STANDUP`)

**Entry:** only by URL: `/individual-dpr/create?new=true&scheme=STANDUP` shows the "Stand-Up India" brief; click **Start DPR steps**. The scheme has **no card in the scheme picker and no entry in the header Scheme dropdown** (D1), so do not look for it there. Use **Next** / **Previous**. Money in **₹ Lakhs** unless the label says ₹. Dates: type `dd-mm-yyyy` (ISO shown in tables).
**Total steps:** 13 (Cover & eligibility · Business activity & process · Location · Unit profile & capacity · Market, buyers & competition · Premises · Applicant / firm · Project cost · Means of finance · Operating cost & sales · Financial viability · Implementation schedule · Documents & uploads).
**Test persona:** Kolla Venkata Durga Bhavani, 37, a woman entrepreneur setting up a new (greenfield) spice-processing unit, **Sri Durga Bhavani Chilli & Spice Products**, at **Chilakaluripet**, **Palnadu** district (Chilakaluripet mandal). Legal form: partnership firm "Sri Durga Bhavani Spices" with her husband Kolla Nageswara Rao (she holds 60%). Product: branded chilli, turmeric and coriander powders and sambar masala in 100 g–500 g pouches. Category: Woman. Composite loan ₹18.80 lakh with ₹5.20 lakh own money.
**Before you start:** open the URL directly (no Scheme Finder handoff needed; STANDUP is never offered by Scheme Finder).

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes (blocks Next) | `Sri Durga Bhavani Chilli & Spice Products` | |
| 2 | District * | Select | Yes | `Palnadu` | |
| 3 | Location * | Select (towns of district) | Yes | `Chilakaluripet` | Palnadu list: Narasaraopet, Chilakaluripet, Macherla, Piduguralla, Sattenapalle, Vinukonda, Dachepalle, Gurazala. |
| 4 | Nature of Business | Text input | No | `Manufacturing branded chilli, turmeric and coriander powders and sambar masala in retail packs` | 12+ characters for the data check. |
| 5 | Major Products | Text input | No | `Chilli powder, turmeric powder, coriander powder, sambar masala` | |
| 6 | Eligible category | Select | No (not enforced) | `Woman entrepreneur` | Options: Woman entrepreneur / Scheduled Caste (SC) / Scheduled Tribe (ST). SC/ST adds a caste-certificate upload. |
| 7 | Composite loan sought (₹ Lakhs) | Number | No | `18.8` | Placeholder "Above 10 and up to 100"; no check in the form. Keep equal to the Step 9 bank loan. |
| 8 | Entrepreneur full name | Text input | No | `Kolla Venkata Durga Bhavani` | |
| 9 | Entrepreneur age | Number, min 18 max 100 | No | `37` | Under 18 blocks saving. |
| 10 | Controlling stake % (if not sole prop) | Number, min 0 max 100 | No | `60` | Placeholder "Must be ≥ 51 for firms"; not enforced (D2). |

### Step 2 — Business activity & process
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Agro-processing - spice powders` | |
| 2 | Short intro — what the unit does * | Textarea | Yes | `The unit will clean, grind, blend and pack red chilli, turmeric, coriander and sambar masala powders under the brand "Durga Bhavani" for retail shops, supermarkets and wholesalers in Palnadu, Guntur and Krishna districts. Chilakaluripet sits beside the Guntur chilli belt so raw material is available all year.` | 30+ characters. |
| 3 | Process of manufacture | Textarea | No | `Dry red chillies, turmeric fingers and coriander seed are bought from the Guntur and Duggirala yards, cleaned and destemmed, roasted or dried where needed, ground in the hammer mill with a cyclone, blended in the ribbon blender, weighed and sealed in 100 g, 250 g and 500 g laminated pouches on the 4-head machine, then boxed and dispatched.` | Data check wants 40+ characters. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea | No | `Plot 14 on Narasaraopet Road, Chilakaluripet (Chilakaluripet mandal, Palnadu district), on the NH-16 corridor about 30 km from Guntur. Chilli yards of Guntur and turmeric markets of Duggirala are within 40 km; retail customers are in Guntur, Narasaraopet and Vijayawada.` | |

### Step 4 — Unit profile & capacity
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `Proposed greenfield spice-processing unit with one hammer mill, destemmer, roaster, ribbon blender and automatic pouch-filling machine, running a single 8-hour shift.` | 30+ characters. |
| 2 | Start Date | Date | No | `01-12-2026` (2026-12-01) | Not after Commitment Date. |
| 3 | Commitment Date | Date | No | `15-12-2026` (2026-12-15) | |
| 4 | Tools / process level | Text | No | `Mechanised: hammer-mill grinding, ribbon blending and automatic pouch filling` | |
| 5 | Capacity / throughput (if applicable) | Text | No | `120 kg of spice powder per day (single 8-hour shift)` | Also stored as installed capacity. |
| 6 | Capacity utilisation Year 1 (%) | Number 0–100 | No | `60` | 120 kg × 300 days × 60% = 21,600 kg a year (used in Step 10). Above 100 or below 30 raises a data-check note. |

Products, share of output and selling price (click **Add product** twice):
| Row | Product Name | Share of Output (%) | Selling Price (per unit, ₹ per kg) |
|---|---|---|---|
| 1 | Chilli powder | 55 | 350 |
| 2 | Turmeric powder | 25 | 290 |
| 3 | Coriander powder and sambar masala | 20 | 305 |

Weighted price ₹326 a kg × 21,600 kg = ₹70.42 lakh (Step 10 sales).

### Step 5 — Market, buyers & competition
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Kirana and supermarket chains in Guntur, Narasaraopet and Vijayawada, hotels and mess operators, and wholesalers who repack under their own labels.` | |
| 2 | Demand / footfall note | Textarea | No | `Branded chilli powder demand is steady all year; retailers reorder every two weeks and three Guntur wholesalers have given letters of intent for 800 kg a month.` | |
| 3 | Major competitors + your strengths / weaknesses | Textarea | No | `Competitors are Guntur-based Sri Lakshmi Masala and Vijaya Foods plus unbranded loose powder. Strengths: raw material 40 km away, women-led quality control and lower freight. Weakness: new brand with no shelf presence yet.` | Shown only for Stand-Up. |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text | Yes | `Leased factory shed, Narasaraopet Road, Chilakaluripet` | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea | No | `3,200 sq ft shed leased for nine years from Sri M. Veera Reddy at ₹15,000 per month from 1 December 2026.` | |
| 3 | Premises — owned / rented | Select | No | `Leased` | Options: Owned / Leased / Rented. Not printed in the report (D4). |
| 4 | Power requirement (HP / kW) — optional | Text | No | `20 kW, 3-phase industrial connection` | Not printed (D4). |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Star but not enforced | `Sri Durga Bhavani Spices (Partnership firm)` | **AUTO – verify shows** `Kolla Venkata Durga Bhavani` first. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Partnership firm (two partners)` | |
| 3 | GSTIN (optional) | Text mask | No | `37AAFFD3317K1ZG` | Valid check character. |
| 4 | Firm PAN (optional) | Text mask | No | `AAFFD3317K` | 4th letter F (firm) accepted. |
| 5 | Udyam registration number (optional) | Text mask | No | `UDYAM-AP-17-0051093` | |
| 6 | Contact mobile number (optional) | Text | No | `9347261184` | |
| 7 | Correspondence address | Textarea | No | `Plot 14, Narasaraopet Road, Chilakaluripet, Palnadu District, Andhra Pradesh 522616` | **AUTO – verify shows** `Chilakaluripet, Palnadu` first. |

### Step 8 — Project cost
Read-only "Details carried to this schedule" must show promoter, unit, address, GSTIN. Set **What kind of business is this?** = `Making things`.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select | No | `Making things` | |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number | No | `0` | Leased premises. |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number | No | `4.50` | Shed modification, flooring, dust control. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number | No | `1.80` | Electrical fittings and furniture. |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number | No | `1.20` | |
| 6 | Working capital (₹ Lakhs) | Number | No | `5.20` | |

Machinery list (click **Add machinery** seven times):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Hammer-mill pulveriser, 10 HP with cyclone | New | Sri Sai Agro Engineering, Guntur | 1 | 1.85 | 1.85 |
| 2 | Chilli destemmer and cleaner | New | Sri Sai Agro Engineering, Guntur | 1 | 1.20 | 1.20 |
| 3 | Drum roaster / dryer for turmeric and coriander | New | Vijaya Food Machinery, Vijayawada | 1 | 1.60 | 1.60 |
| 4 | Ribbon blender, 100 kg | New | Vijaya Food Machinery, Vijayawada | 1 | 1.45 | 1.45 |
| 5 | 4-head automatic pouch filling and sealing machine | New | Pack Tech Machinery, Hyderabad | 1 | 3.80 | 3.80 |
| 6 | Digital platform and table-top weighing scales | New | Sri Balaji Weighing Systems, Guntur | 2 | 0.25 | 0.50 |
| 7 | Storage racks, bins and pallets | New | Local fabricator, Chilakaluripet | 1 | 0.90 | 0.90 |

**AUTO – verify shows** machinery total 11.30 and "Total Project Cost ₹ 24 Lakhs" (the screen drops trailing zeros).

### Step 9 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Union Bank of India, Chilakaluripet Branch` | |
| 2 | Interest rate (% per year) | Number | No | `10.5` | |
| 3 | Moratorium (months) | Number | No | `6` | |
| 4 | Loan tenure (months) | Number | No | `84` | |
| 5 | Own contribution (₹ Lakhs) | Number | Needed to generate | `5.20` | Minimum 10% of project cost (₹2.40 L). |
| 6 | Other subsidy / grant if converging (₹ Lakhs) — else 0 | Number | No | `0` | |
| 7 | Bank composite loan TL + WC (₹ Lakhs) | Number | Needed to generate | `18.80` | Allowed range ₹10–100 L (block above 100, warning below 10). |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |

**AUTO – verify shows** "Total Finance ₹ 24 Lakhs" and note "Own contribution must be at least 10% of project cost… Category: woman · Min own 10%."

### Step 10 — Operating cost & sales
Raw materials (click **Add raw material** three times):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Dry red chillies (Teja and 334 varieties) | Chilli powder | Seasonal bulk buying (February–May) from the Guntur chilli yard, cash and 7-day credit |
| 2 | Turmeric fingers and coriander seed | Turmeric and coriander powders | Monthly from Duggirala and Chilakaluripet traders |
| 3 | Laminated pouches, cartons and labels | Retail packing | Quarterly orders from a Hyderabad packaging supplier |

Staff (click **Add role** three times):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Supervisor-cum-store keeper | 1 | 15000 |
| 2 | Machine operator | 2 | 11000 |
| 3 | Packing worker (women) | 3 | 8500 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number | No | `44.00` | |
| 2 | Power Cost (₹ Lakhs) | Number | No | `1.80` | |
| 3 | Wages (₹ Lakhs) | Number | No | `7.50` | (15,000 + 22,000 + 25,500) × 12 = ₹7.50 L. |
| 4 | Maintenance (₹ Lakhs) | Number | No | `0.96` | |
| 5 | Administrative Expenses (₹ Lakhs) | Number | No | `3.00` | Includes shed rent ₹1.80 L. |
| 6 | Marketing Expenses (₹ Lakhs) | Number | No | `2.40` | |
| 7 | Annual Production Volume | Number | No | `21600` | kg a year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number | No | `70.42` | |

### Step 11 — Financial viability
Cards "Project cost ₹ 24 Lakhs" and "Equity + loan + other ₹ 24 Lakhs"; model panel with 7 green checks.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 70.42 | 44.00 | 7.50 | 1.80 | 4.68 |
| 2 | 73.94 | 46.20 | 7.88 | 1.89 | 5.47 |
| 3 | 77.64 | 48.51 | 8.27 | 1.98 | 6.29 |
| 4 | 81.52 | 50.94 | 8.68 | 2.08 | 7.11 |
| 5 | 85.60 | 53.48 | 9.12 | 2.19 | 7.96 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number | No | `75` | Model shows 74.65%. |

**AUTO – verify shows:** model panel (7 years because tenure 84 months) Average DSCR `2.64`, Break-even `74.65%`, Project IRR `36.22%`, NPV at 12% `₹25.11 lakh`, Payback `2.71 years`; older DSCR card "Average DSCR: 1.91" (not red: it is above 1.5).

### Step 12 — Implementation schedule
Three milestone cards are pre-shown (activity names are editable; there is no add button, D5).
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date | No | `01-03-2027` (2027-03-01) | |
| 2 | Milestone 1: activity / start / end | Text + 2 dates | No | `Machinery order and installation` · `15-12-2026` · `05-02-2027` | Replace default text "Machinery order / installation". |
| 3 | Milestone 2: activity / start / end | Text + 2 dates | No | `Power connection (20 kW)` · `01-12-2026` · `15-01-2027` | Replace "Power connection". |
| 4 | Milestone 3: activity / start / end | Text + 2 dates | No | `Trial run, FSSAI licence and first batch` · `06-02-2027` · `28-02-2027` | Replace "Trial run". |

### Step 13 — Documents & uploads
| # | Slot (label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Aadhaar / PAN | File | No | `STANDUP_aadhaar_pan_sample_masked.pdf` | Dummy file only. |
| 2 | Machinery Quotations | File | No | `STANDUP_quotation_pulveriser_filling_machine.pdf` | |
| 3 | Building Estimate / Premises Lease | File | No | `STANDUP_premises_lease_deed.pdf` | |
| 4 | Udyam Certificate (or application) | File | No | `STANDUP_udyam_certificate.pdf` | |
| 5 | Bank Passbook / Cancelled Cheque | File | No | `STANDUP_passbook_cancelled_cheque.pdf` | |
| 6 | 51% Controlling Stake Proof (if not sole proprietor) | File | No | `STANDUP_partnership_deed_51pct_stake.pdf` | Always shown. |
| 7 | Caste Certificate (SC / ST) | File | No | `STANDUP_caste_certificate.pdf` | Only if Step 1 category = SC or ST; not shown in this run. |

### Money cross-check
- Project cost: machinery 1.85 + 1.20 + 1.60 + 1.45 + 3.80 + 0.50 + 0.90 = **11.30**; building 4.50; land 0; furniture 1.80; pre-operative 1.20; working capital 5.20. Total 11.30 + 4.50 + 0 + 1.80 + 1.20 + 5.20 = **24.00**.
- Means of finance: own 5.20 + grant 0 + bank 18.80 + other 0 = **24.00** (exact match required).
- Own share 5.20 / 24.00 = 21.67% (minimum 10% = 2.40). Debt ÷ (own + subsidy) = 18.80 / 5.20 = 3.62 (Stand-Up ceiling 9). Bank loan 18.80 within ₹10–100 L. Bank loan equals machinery + building + furniture + pre-operative (18.80), so no "term loan more than assets" advisory.
- EMI (calculator, 18.8 L, 10.5%, 7 years): ₹31,698 a month (0.32 lakh), ₹3.80 lakh a year; calculator DSCR 2.83 on surplus 10.76 (sales 70.42 − running costs 59.66).
- Year 1 model: EBITDA 10.76, PAT 4.68, DSCR 3.08.

### Uploads to prepare
`STANDUP_aadhaar_pan_sample_masked.pdf`, `STANDUP_quotation_pulveriser_filling_machine.pdf`, `STANDUP_premises_lease_deed.pdf`, `STANDUP_udyam_certificate.pdf`, `STANDUP_passbook_cancelled_cheque.pdf`, `STANDUP_partnership_deed_51pct_stake.pdf` (always), `STANDUP_caste_certificate.pdf` (only when category SC / ST).

### Generate & verify
- **Generate DPR** is enabled on Step 13. **Check my answers** should say "All clear". Generate opens `/dpr/view/<id>`.
- **13 sections** in order: Cover & eligibility, Business activity & process, Location, Unit profile & capacity, Market, buyers & competition, Premises, Applicant / firm, Project cost, Means of finance, Operating cost & sales, Financial viability, Implementation schedule, Documents & uploads.
- Cover: "Establishment of / Sri Durga Bhavani Chilli & Spice Products / under 'Stand-Up India'".
- Find: Eligible category "Woman entrepreneur", Controlling stake 60, Loan amount sought 18.8, process text on Step 2, capacity utilisation 60, machinery table (7 rows), project cost 24, own 5.2, bank 18.8, sales 70.42, competitor text, milestone table (Activity / Time / Start / End; the Time column is blank, D5), uploads.
- Absent by design (D4): premises type, power requirement.

### Negative / boundary tests
1. Clear "Shop / shed / workplace" on Step 6 and press **Next** → toast "Fill the required fields before continuing: Shop / shed / workplace"; red ring.
2. Step 9 own `2.00` and bank `22.00` → "Must fix first": "Your own money is 8.33% of the project cost. The minimum for this scheme is 10%." plus "Bank debt is 11 times your own money plus subsidy. The most allowed is 9 to 1."
3. Step 9 own `16.00`, bank `8.00` → generation allowed but review lists Unusual: "The bank loan of ₹8.00 lakh is below the ₹10.00 lakh this scheme usually starts at." (**Generate anyway**).
4. Step 4 Capacity utilisation `120` → inline "Enter a number from 0 to 100." and review note "Using 120% of capacity is not possible."
5. Controlling stake `40` and Composite loan sought `150` → accepted silently (gap, D2); only a bank loan above ₹100 L blocks (set bank 105 with matching own to see "more than the ₹100.00 lakh allowed").
6. Entrepreneur age `17` → inline range error, guardian toast, save blocked; Generate fails with "Failed to save data before generating DPR".
7. Step 4 Commitment Date `01-11-2026` (before Start Date) → toast "Commitment Date must be on or after Start Date", value rejected.

### Discrepancies spotted
- **D1.** `STANDUP` is not in the Scheme Finder scheme list (`SCHEMES`), which feeds both the picker cards and the header dropdown. The scheme is reachable only through `?scheme=STANDUP`; on the form the dropdown has no matching option. Scheme Finder can never recommend it.
- **D2.** Spec: woman/SC/ST, stake ≥ 51 and loan band ₹10 L–₹1 Cr are "hard eligibility". Code validates none of these on the form: category, stake % and "Composite loan sought" are optional and unchecked; only the bank loan is range-checked (block > ₹100 L, warning < ₹10 L). "Greenfield only" is not asked at all.
- **D3.** The bank loan is labelled "composite TL + WC" but is one number treated as a term loan; the advisory "term loan more than assets… enter it as a working-capital loan" has no input to act on (the working-capital-loan field exists in the finance code only). A realistic composite loan with working capital above own funds triggers this note.
- **D4.** Premises type (Owned / Leased / Rented) and power requirement are asked in Step 6 but never appear in the report.
- **D5.** Spec Step 12 lists start/end dates and milestones; the form offers CoD plus exactly three fixed milestone rows, no add/remove, and the report table has a "Time" column that can never be filled.
- **D6.** Client report labels the extra "Loan amount sought" while the server DOCX/XLS labels it "Loan amount sought (₹ Lakhs)".
- **D7.** Same value-label limitation as other schemes: server DOCX maps only some codes, so category/premises codes may print raw in server-built downloads.

## 6. PM SVANidhi — street-vendor working-capital pack (`SVANIDHI`)

**Entry:** `/individual-dpr/create?new=true&scheme=SVANIDHI` opens the brief "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)"; click **Start DPR steps**. Or pick the card "PM SVANidhi" in the picker. Use **Next** / **Previous**. Money in **₹ Lakhs** except where the label says ₹ (daily sales, product price, monthly pay). Tiny amounts are held to 0.01 lakh (₹1,000), so use multiples of 0.01.
**Total steps:** **11** (the spec, scheme brief and impact bullets all say 10; the step catalog has 11 — D1): Cover & vending eligibility · Vending activity · Location / pitch · Vendor profile · Market & daily sales · Pitch / workplace · Applicant · Working capital need · Means of finance (critical) · Operating cost & sales · Documents & uploads. There is no Financial viability step.
**Test persona:** Bhimavarapu Satyanarayana, 43, sells fresh fruit juices and cut-fruit plates from a fixed stall near the RTC complex road in **Rajamahendravaram**, **East Godavari** district, for 11 years. He holds a Certificate of Vending from the municipal corporation, banks with Union Bank, repaid his first ₹15,000 loan and now applies for the **2nd tranche (₹25,000, 18 months)** to upgrade the stall and stock more fruit. Daily sales about ₹2,820.
**Before you start:** open the URL directly; no Scheme Finder handoff is needed.

### Step 1 — Cover & vending eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text | Yes (blocks Next) | `Satyanarayana Fresh Juice Stall` | |
| 2 | District * | Select | Yes | `East Godavari` | |
| 3 | Location * | Select | Yes | `Rajamahendravaram` | East Godavari list: Rajamahendravaram, Kovvur, Nidadavole, Gokavaram, Rajanagaram, Korukonda. |
| 4 | Nature of Business | Text | No | `Street vending of fresh fruit juices and cut fruit from a fixed stall near the town bus stand` | |
| 5 | Major Products | Text | No | `Fresh juices (sweet lime, pineapple, watermelon) and cut-fruit plates` | |
| 6 | Vending proof | Select | No (not enforced) | `Certificate of Vending / Vendor ID (ULB / TVC)` | Options: that, or "Letter of Recommendation (portal digital only)". |
| 7 | Loan tranche | Select | No, but see note | `2nd tranche — up to ₹25,000 (18 months)` | Options: 1st tranche — up to ₹15,000 (12 months) / 2nd tranche — up to ₹25,000 (18 months) / 3rd tranche — up to ₹50,000 (36 months). Left blank, the bank-loan cap silently defaults to ₹15,000 (D5). |
| 8 | Vending type / pitch | Select | No | `Fixed stall / kiosk` | Options: Footpath / pavement pitch, Mobile cart / thela, Fixed stall / kiosk, Weekly / municipal market, Hawking / door-to-door, Other. Same stored value as the Step 6 "Premises" select. |
| 9 | UPI ID (linked to bank account) — mandatory | Text | Label says mandatory, not enforced | `bsatyanarayana43@oksbi` | Placeholder "e.g. vendor@upi". Blank is accepted (D3). |
| 10 | Vendor full name | Text | No | `Bhimavarapu Satyanarayana` | |
| 11 | Age (≥ 18) | Number min 18 max 100 | No | `43` | |
| 12 | Years in street vending | Number | No | `11` | |
| 13 | Approx daily sales (₹) | Number | No | `2820` | 70 glasses × ₹30 + 18 plates × ₹40. |

**AUTO – verify shows** the green line: "Indicative WC loan: ₹25,000 · 18 months · 7% interest subsidy · Certificate of Vending / Vendor ID (ULB / TVC) / 2nd tranche — up to ₹25,000 (18 months)."

### Step 2 — Vending activity
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text | Yes | `Street vending - fresh fruit juices and cut fruit` | |
| 2 | Short intro — what the unit does * | Textarea | Yes | `Fixed street stall selling freshly pressed sweet lime, pineapple and watermelon juice and plates of cut fruit to bus passengers, office staff and shoppers around the RTC complex road in Rajamahendravaram, open 9 am to 9 pm every day.` | 30+ characters. |
| 3 | Process of manufacture | Textarea | No | `Fruit is bought each morning at 5.30 am from the Rajamahendravaram wholesale fruit market, washed, cut and pressed to order at the stall from 9 am to 9 pm; ice comes from a local ice plant; customers pay by UPI QR or cash; unsold fruit is used for next-day cut-fruit plates.` | 40+ characters for the data check. |

### Step 3 — Location / pitch
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea | No | `Stall is on the footpath side of the RTC complex road in Rajamahendravaram (Rajahmundry urban), beside the main bus stand with about 20,000 passengers a day and two government offices within 300 m.` | |

### Step 4 — Vendor profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `Existing stall run by the vendor with one part-time helper; the second-tranche loan will fund a new steel stall with canopy, a commercial juicer, display trays and more fruit stock.` | 30+ characters. |
| 2 | Start Date | Date | No | `14-09-2015` (2015-09-14) | Not after Commitment Date. |
| 3 | Commitment Date | Date | No | `10-11-2026` (2026-11-10) | |
| 4 | Tools / process level | Text | No | `Hand-cut fruit with one electric juicer and an ice box` | |
| 5 | Capacity / throughput (if applicable) | Text | No | `About 75 glasses of juice and 20 fruit plates a day` | |

Products table (click **Add product** once):
| Row | Product Name | Share of Output (%) | Selling Price (per unit, ₹) |
|---|---|---|---|
| 1 | Fresh fruit juice (glass) | 80 | 30 |
| 2 | Cut-fruit plate | 20 | 40 |

Basis: 21,000 glasses + 5,400 plates a year = 26,400 units; sales 6.30 + 2.16 = ₹8.46 lakh.

### Step 5 — Market & daily sales
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Bus passengers, college students, office staff and shoppers who want a quick fresh drink; repeat customers pay by UPI.` | |
| 2 | Demand / footfall note | Textarea | No | `Peak footfall 4 pm to 8 pm and in summer (March–June); lean during heavy monsoon days. Daily sales average ₹2,820 and reach ₹4,500 in May.` | |

### Step 6 — Pitch / workplace
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text | Yes | `Fruit juice stall, RTC complex road, Rajamahendravaram` | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea | No | `Vending spot allotted by Rajamahendravaram Municipal Corporation (Zone 3) and shown on the Certificate of Vending; no rent, annual vending fee ₹1,200.` | |
| 3 | Premises — owned / rented | Select (shows the vending options) | No | `Fixed stall / kiosk` | **AUTO – verify shows** the Step 1 choice already selected; changing it here also changes Step 1 "Vending type / pitch". |
| 4 | Power requirement (HP / kW) — optional | Text | No | `0.5 kW, shared shop connection` | Not printed in the report. |

### Step 7 — Applicant
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Star but not enforced | `Bhimavarapu Satyanarayana` | **AUTO – verify shows** the same name already filled (copied from Step 1 vendor name). |
| 2 | Legal status (sole / partnership / company) | Text | No | `Sole proprietorship (individual vendor)` | |
| 3 | GSTIN (optional) | Text mask | No | leave blank | Vendor is below the GST limit; blank is valid. |
| 4 | Firm PAN (optional) | Text mask | No | leave blank | |
| 5 | Udyam registration number (optional) | Text mask | No | `UDYAM-AP-05-0072816` | |
| 6 | Contact mobile number (optional) | Text | No | `9885120473` | |
| 7 | Correspondence address | Textarea | No | `Door No. 41-3-17, Jampet, Rajamahendravaram, East Godavari District, Andhra Pradesh 533101` | **AUTO – verify shows** `Rajamahendravaram, East Godavari` first. |

### Step 8 — Working capital need
Only the **Working capital** input, the business-kind select and the machinery list are shown (land, building, furniture and pre-operative are hidden for SVANIDHI). A grey line says "Heavy capex tables are hidden for Mudra Shishu / Kishore…" (wording is wrong for this scheme, D6). The "Details carried to this schedule" box must show promoter, unit, address.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select | No | `Making things` | Not detected automatically for this text; choose it. |
| 2 | Working capital (₹ Lakhs) | Number | No | `0.12` | About 7 days of fruit stock. |

Machinery list (click **Add machinery** five times):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Stainless steel juice stall with canopy and shelves | New | Sri Ganesh Fabricators, Rajamahendravaram | 1 | 0.12 | 0.12 |
| 2 | Commercial electric juicer, 1 HP | New | Kitchen World, Rajamahendravaram | 1 | 0.05 | 0.05 |
| 3 | Fruit display trays and insulated ice box | New | Kitchen World, Rajamahendravaram | 1 | 0.04 | 0.04 |
| 4 | Digital weighing scale and UPI QR stand | New | Sai Electronics, Rajamahendravaram | 1 | 0.02 | 0.02 |
| 5 | Knife set, jars and serving glasses | New | Local steel utensils mart, Rajamahendravaram | 1 | 0.03 | 0.03 |

**AUTO – verify shows** "Total Project Cost ₹ 0.38 Lakhs" (machinery 0.26 + working capital 0.12).

### Step 9 — Means of finance (critical)
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Union Bank of India, Rajamahendravaram Main Branch` | |
| 2 | Interest rate (% per year) | Number | No | `10` | |
| 3 | Moratorium (months) | Number | No | `0` | |
| 4 | Loan tenure (months) | Number | No | `18` | Matches the 2nd-tranche tenor. |
| 5 | Own contribution (₹ Lakhs) | Number | Needed to generate | `0.13` | No minimum for this scheme. |
| 6 | Government grant (₹ Lakhs) — usually 0 (guarantee ≠ capital) | Number | No | `0` | The 7% interest subsidy is not a grant. |
| 7 | WC term loan tranche (₹ Lakhs) | Number | Needed to generate | `0.25` | Capped at ₹0.25 L for the 2nd tranche. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |

**AUTO – verify shows** "Total Finance ₹ 0.38 Lakhs" and the note "Own + bank WC tranche (+ other) = total. Cap ₹25,000 · 18 months · 7% interest subsidy (quarterly, not capital grant) · cov / second."

### Step 10 — Operating cost & sales
Raw materials (click **Add raw material** twice):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Seasonal fruits (sweet lime, pineapple, watermelon, papaya) | Fresh juice and cut-fruit plates | Daily at 5.30 am from the Rajamahendravaram wholesale fruit market, cash |
| 2 | Ice blocks, disposable glasses and plates | Serving | Daily from a local ice plant and weekly from a stationery wholesaler |

Staff (click **Add role** once):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Part-time helper (family member) | 1 | 6000 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number | No | `5.20` | Fruit 4.60 + ice and packing 0.60. |
| 2 | Power Cost (₹ Lakhs) | Number | No | `0.12` | |
| 3 | Wages (₹ Lakhs) | Number | No | `0.72` | 6,000 × 12. |
| 4 | Maintenance (₹ Lakhs) | Number | No | `0.05` | |
| 5 | Administrative Expenses (₹ Lakhs) | Number | No | `0.10` | Vending fee, UPI charges, licence. |
| 6 | Marketing Expenses (₹ Lakhs) | Number | No | `0.03` | |
| 7 | Annual Production Volume | Number | No | `26400` | Glasses + plates a year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number | No | `8.46` | |

### Step 11 — Documents & uploads
| # | Slot (label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Certificate of Vending / Vendor ID or Portal LoR | File | No | `SVANIDHI_certificate_of_vending_RJY.pdf` | |
| 2 | Aadhaar | File | No | `SVANIDHI_aadhaar_sample_masked.pdf` | Dummy file only. |
| 3 | Savings Bank Passbook / Statement | File | No | `SVANIDHI_savings_passbook_UnionBank.pdf` | |
| 4 | UPI ID / QR Screenshot (linked to same account) | File | No | `SVANIDHI_upi_qr_screenshot.png` | Optional despite "mandatory UPI". |

### Money cross-check
- Project cost: machinery 0.12 + 0.05 + 0.04 + 0.02 + 0.03 = **0.26**; working capital 0.12. Total **0.38**.
- Means of finance: own 0.13 + grant 0 + bank 0.25 + other 0 = **0.38**.
- Bank loan 0.25 = cap for the 2nd tranche (₹25,000). Own share 34.2% (no minimum). Bank loan ≤ assets (0.25 ≤ 0.26), so the "term loan more than assets" advisory stays silent.
- EMI (calculator, ₹0.25 L at 10% for 1.5 years): ₹15,010 a month (0.02 lakh), ₹0.18 lakh a year; calculator DSCR 12.43 on surplus 2.24 (sales 8.46 − running costs 6.22).
- Interest subsidy 7% a year is text only; it is not part of the arithmetic.
- The Financial viability screen does not exist here, so no DSCR panel appears.

### Uploads to prepare
`SVANIDHI_certificate_of_vending_RJY.pdf` (slot "Certificate of Vending / Vendor ID or Portal LoR"), `SVANIDHI_aadhaar_sample_masked.pdf`, `SVANIDHI_savings_passbook_UnionBank.pdf`, `SVANIDHI_upi_qr_screenshot.png`. All four slots always appear.

### Generate & verify
- **Generate DPR** enabled on Step 11. **Check my answers** expected: "All clear". Generate opens `/dpr/view/<id>`.
- **11 sections**: Cover & vending eligibility, Vending activity, Location / pitch, Vendor profile, Market & daily sales, Pitch / workplace, Applicant, Working capital need, Means of finance (critical), Operating cost & sales, Documents & uploads.
- Cover: "Establishment of / Satyanarayana Fresh Juice Stall / under 'PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)'".
- Find: Vending proof, UPI ID, age 43, years 11, daily sales 2820, Process of manufacture in section 2, product table (2 rows), machinery table (5 rows), project cost 0.38, own 0.13, bank 0.25, sales 8.46, 4 uploads.
- Expected label **check:** Loan tranche should read "2nd tranche — up to ₹25,000 (18 months)". In the web preview the shared value-label map is expected to print "Second tranche (up to ₹2 lakh)" instead (D4) — record what you see. "Vending type / pitch" and "Workplace" both print "Fixed stall / kiosk" (duplicate lines). Power requirement is not printed.

### Negative / boundary tests
1. Step 9 bank loan `0.30` and own `0.08` → "Must fix first": "The bank loan of ₹0.30 lakh is more than the ₹0.25 lakh allowed for this PM SVANidhi loan tranche."
2. Set Step 1 Loan tranche back to the blank "Select" option and keep bank loan 0.25 → "Must fix first": "…more than the ₹0.15 lakh allowed…" (hidden default of the 1st tranche, D5). Restore the 2nd tranche.
3. Step 7 mobile `98851204` (8 digits) → inline "Mobile number has 10 digits (2 more)" on blur; **Next** shows toast "Correct these fields before continuing: Contact mobile". Udyam `UDYAM-AP-05-72816` → same blocking behaviour.
4. Clear UPI ID and finish the form → accepted (label says mandatory, D3); **Check my answers** shows no UPI finding.
5. Step 1 vendor age `17` → inline "Enter a number from 18 to 100.", guardian toast, save blocked; Generate fails with "Failed to save data before generating DPR".
6. Leave "Shop / shed / workplace" empty on Step 6 and press **Next** → "Fill the required fields before continuing: Shop / shed / workplace".
7. Step 9 own `0.10` and bank `0.25` (cost 0.38) → "Must fix first": funding ₹0.35 vs cost ₹0.38, difference ₹0.03 lakh.

### Discrepancies spotted
- **D1.** Step count: `SVANIDHI_STEPS` has 11 steps (an Operating cost & sales step exists); the spec, the scheme brief ("10-step vendor pack"), `SVANIDHI_IMPACT_BULLETS`, `svanidhiQuestions.ts` header and the business-logic table all say 10, and the spec has no operating-cost step.
- **D2.** Spec places `dailySales` on Step 4 (Vendor profile), `marketingStrategy` on Step 5 and `applicantName` on Step 7. In code `dailySales` is on Step 1, there is no `marketingStrategy` input and the applicant name is the generic "Firm / proprietor name".
- **D3.** UPI ID is labelled "mandatory" and the spec calls it a hard rule, but nothing validates or requires it (and the UPI proof upload is optional).
- **D4.** Value-label collision: SVANIDHI tranche values `first`/`second` are overwritten by PM Vishwakarma's labels in the web preview ("Second tranche (up to ₹2 lakh)" for a ₹25,000 tranche); the server-built DOCX maps only `first` (to "1st tranche") and prints `second`/`third` raw.
- **D5.** With no tranche chosen the lending cap silently defaults to ₹15,000 (`svanidhiTrancheCapLakhs` fallback) though no tranche is shown as selected.
- **D6.** The Step 8 note "Heavy capex tables are hidden for Mudra Shishu / Kishore…" is shown for every scheme that hides capex, including SVANIDHI and Vishwakarma.
- **D7.** The Step 6 "Premises — owned / rented" select is the same stored value as Step 1 "Vending type / pitch", so the report prints both "Vending type / pitch" and "Workplace" with the same text.
- **D8.** Rule "Tranche 2 only after full repayment of Tranche 1" and CoV vs LoR conditions are not enforced; LoR choice does not change any upload.

## 7. PM Vishwakarma — artisan pack (`VISHWAKARMA`)

**Entry:** `/individual-dpr/create?new=true&scheme=VISHWAKARMA` opens the brief "PM Vishwakarma"; click **Start DPR steps**. Or pick the card "PM Vishwakarma" in the picker. Use **Next** / **Previous**. Money in **₹ Lakhs** unless the label says ₹ (product price, monthly pay). Dates: type `dd-mm-yyyy` (ISO in tables).
**Total steps:** 12 (Cover & craft eligibility · Trade story & process · Location · Craft profile · Market & sales assumptions · Workplace / premises · Applicant / firm · Project cost (tools + WC) · Means of finance (critical) · Operating cost & sales · Financial viability · Documents & uploads).
**Test persona:** Chintala Gopala Krishna, 46, a traditional **Etikoppaka lacquered-toy maker** (trade: Doll & Toy Maker) working from his home workshop in **Etikoppaka village**, Yelamanchili mandal, **Anakapalli** district (town selected: Yelamanchili). 22 years in the craft, basic PM Vishwakarma training completed, no similar loan in 5 years. He applies for the **first tranche (₹1 lakh)** plus the ₹15,000 toolkit e-voucher to buy an electric lathe, bandsaw and sanders.
**Before you start:** open the URL directly; no Scheme Finder handoff is needed.

### Step 1 — Cover & craft eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text | Yes (blocks Next) | `Sri Venkateswara Etikoppaka Toys` | |
| 2 | District * | Select | Yes | `Anakapalli` | |
| 3 | Location * | Select | Yes | `Yelamanchili` | Anakapalli list: Anakapalli, Narsipatnam, Elamanchili, Yelamanchili, Kasimkota, Pendurthi. |
| 4 | Nature of Business | Text | No | `Traditional Etikoppaka lacquer-turned wooden toys and dolls making` | |
| 5 | Major Products | Text | No | `Lacquered toy sets, dolls, pen stands and kitchen play sets` | |
| 6 | Craft / trade (18 notified) | Select | No (not enforced) | `Doll & Toy Maker (Traditional)` | The 18 options exactly: Carpenter (Suthar/Badhai); Boat Maker; Armourer; Blacksmith (Lohar); Hammer and Tool Kit Maker; Locksmith; Goldsmith (Sonar); Potter (Kumhaar); Sculptor (Moortikar, stone carver) / Stone breaker; Cobbler (Charmkar) / Shoesmith / Footwear artisan; Mason (Rajmistri); Basket/Mat/Broom Maker / Coir Weaver; Doll & Toy Maker (Traditional); Barber (Naai); Garland maker (Malakaar); Washerman (Dhobi); Tailor (Darzi); Fishing Net Maker. |
| 7 | Training stage | Select | No | `Basic training completed` | Options: Not started / awaiting skill assessment; Basic training completed; Advanced training completed. |
| 8 | Enterprise loan tranche | Select | No, but sets the cap | `First tranche (up to ₹1 lakh)` | Options: None yet (toolkit / training first); First tranche (up to ₹1 lakh); Second tranche (up to ₹2 lakh). "None yet" or blank means no bank-loan cap at all (D1). |
| 9 | Similar self-employment loan in last 5 years? | Select | No | `No — eligible (no similar loan in last 5 years)` | Other option "Yes — similar loan taken (usually ineligible)" is accepted silently (D1). |
| 10 | Entrepreneur full name | Text | No | `Chintala Gopala Krishna` | |
| 11 | Age (≥ 18) | Number min 18 max 100 | No | `46` | |
| 12 | Years practising this craft | Number min 0 max 80 | No | `22` | |
| 13 | Current tools | Textarea | No | `Hand-operated wooden lathe (kunda), chisels, scrapers, lac sticks and hand brushes` | |
| 14 | New tools needed (₹15,000 toolkit voucher) | Textarea | No | `1 HP electric wood-turning lathe, 14-inch bandsaw, orbital and belt sander set, lac-colour melting stove set, chisel and gouge toolkit, dust extractor with workbench` | |

**AUTO – verify shows** the green line: "Indicative support: toolkit ₹15,000 · loan cap ₹1,00,000 · 5% interest · Doll & Toy Maker (Traditional) / basicDone" (the training stage appears as the raw code `basicDone`, D6).

### Step 2 — Trade story & process
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text | Yes | `Traditional craft - lacquered wooden toys (Doll & Toy Maker)` | |
| 2 | Short intro — what the unit does * | Textarea | Yes | `Gopala Krishna turns and lacquers wooden toys and dolls in the traditional Etikoppaka style, a Geographical Indication craft of Yelamanchili mandal, and sells them to craft emporia, tourist shops and online buyers.` | 30+ characters. |
| 3 | Process of manufacture | Textarea | No | `Ankudu (Wrightia tinctoria) wood is cut into blocks and turned into toy shapes on the lathe; heated natural lac sticks are pressed against the spinning piece so the lac melts and polishes it; vegetable-dye lac colours are layered, scraped for patterns and finished by hand, then the toys are packed in cartons.` | 40+ characters for the data check. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea | No | `Workshop is in Etikoppaka village, Yelamanchili mandal, about 55 km from Visakhapatnam. Buyers are craft emporia in Visakhapatnam and Vijayawada, tourist shops at Araku and the beach road, and online customers.` | |

### Step 4 — Craft profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `Practising artisan making about 20 toy pieces a day on a hand lathe with two helpers; the toolkit and loan will add an electric lathe, bandsaw and sanders to raise quality and speed.` | 30+ characters. |
| 2 | Start Date | Date | No | `01-06-2004` (2004-06-01) | Not after Commitment Date. |
| 3 | Commitment Date | Date | No | `25-11-2026` (2026-11-25) | |
| 4 | Tools / process level | Text | No | `Traditional hand lathe, moving to electric lathe and bandsaw` | |
| 5 | Capacity / throughput (if applicable) | Text | No | `About 20 toy pieces a day (one artisan and two helpers)` | |

Products table (click **Add product** twice):
| Row | Product Name | Share of Output (%) | Selling Price (per unit, ₹) |
|---|---|---|---|
| 1 | Lacquer toy set (6 pieces) | 40 | 175 |
| 2 | Lacquered doll | 35 | 70 |
| 3 | Kitchen play set and pen stand | 25 | 60 |

Basis: 6,000 units a year = 2,400 sets × 175 + 2,100 dolls × 70 + 1,500 others × 60 = ₹6.57 lakh.

### Step 5 — Market & sales assumptions
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `State handicraft emporia (Lepakshi outlets), tourist gift shops, schools and online buyers who want non-toxic traditional toys.` | |
| 2 | Demand / footfall note | Textarea | No | `Orders rise from October to January (festival and tourist season); an emporia buyer in Visakhapatnam already orders 300 sets every quarter.` | No marketing-strategy input exists (D4). |

### Step 6 — Workplace / premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text | Yes | `Home-cum-workshop, Etikoppaka village` | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea | No | `Own family house with a 400 sq ft workshed attached; no rent.` | |
| 3 | Premises — owned / rented | Select (workplace list) | No | `Home / household workplace` | Options: Home / household workplace; Rented shop / stall; Own shop / workshed; Other. |
| 4 | Power requirement (HP / kW) — optional | Text | No | `3 kW, domestic-plus-workshop connection` | Not printed in the report. |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Star but not enforced | `Sri Venkateswara Etikoppaka Toys (Prop. Chintala Gopala Krishna)` | **AUTO – verify shows** `Chintala Gopala Krishna` first. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Sole proprietor (artisan)` | |
| 3 | GSTIN (optional) | Text mask | No | leave blank | |
| 4 | Firm PAN (optional) | Text mask | No | leave blank | |
| 5 | Udyam registration number (optional) | Text mask | No | `UDYAM-AP-02-0013356` | |
| 6 | Contact mobile number (optional) | Text | No | `9490617234` | |
| 7 | Correspondence address | Textarea | No | `D.No. 3-58, Etikoppaka village, Yelamanchili Mandal, Anakapalli District, Andhra Pradesh 531055` | **AUTO – verify shows** `Yelamanchili, Anakapalli` first. |

### Step 8 — Project cost (tools + WC)
Land, building, furniture and pre-operative are hidden for this scheme; a grey line says "Heavy capex tables are hidden for Mudra Shishu / Kishore…" (D5, wording wrong here). "Details carried to this schedule" shows promoter, unit, address, GSTIN (blank).
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select | No | `Making things` | |
| 2 | Working capital (₹ Lakhs) | Number | No | `0.45` | |

Machinery list (tools; click **Add machinery** six times):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Electric wood-turning lathe, 1 HP with chuck set | New | Sri Sai Machine Tools, Visakhapatnam | 1 | 0.48 | 0.48 |
| 2 | Bandsaw, 14 inch | New | Sri Sai Machine Tools, Visakhapatnam | 1 | 0.36 | 0.36 |
| 3 | Orbital and belt sander set | New | Sri Sai Machine Tools, Visakhapatnam | 1 | 0.14 | 0.14 |
| 4 | Lac-colour melting stove and stirring set | New | Local fabricator, Etikoppaka | 1 | 0.12 | 0.12 |
| 5 | Chisel, gouge and scraper toolkit (e-voucher) | New | PM Vishwakarma designated centre, Anakapalli | 1 | 0.15 | 0.15 |
| 6 | Dust extractor with sturdy workbench | New | Sri Sai Machine Tools, Visakhapatnam | 1 | 0.25 | 0.25 |

**AUTO – verify shows** "Total Project Cost ₹ 1.95 Lakhs" (tools 1.50 + working capital 0.45).

### Step 9 — Means of finance (critical)
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Andhra Pradesh Grameena Vikas Bank, Yelamanchili Branch` | |
| 2 | Interest rate (% per year) | Number | No | `5` | Scheme rate; the data check calls anything under 6% unusual (D3). Left blank the model assumes 11%. |
| 3 | Moratorium (months) | Number | No | `0` | |
| 4 | Loan tenure (months) | Number | No | `18` | First-tranche tenor. Left blank the model assumes 60 months. |
| 5 | Own contribution (₹ Lakhs) | Number | Needed to generate | `0.80` | |
| 6 | Toolkit e-voucher (₹ Lakhs) — usually 0.15 | Number | No | `0.15` | Entered in the grant field; no cap check (D1). |
| 7 | Enterprise development loan tranche (₹ Lakhs) | Number | Needed to generate | `1.00` | Capped at ₹1.00 L for the first tranche. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |

**AUTO – verify shows** "Total Finance ₹ 1.95 Lakhs" and the note "Own + toolkit voucher (usually 0.15 L) + enterprise loan tranche (+ other) = total. Interest 5% · tranche cap ₹1 L · Doll & Toy Maker (Traditional) / first."

### Step 10 — Operating cost & sales
Raw materials (click **Add raw material** three times):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Ankudu (Wrightia) wood blocks | Turned toy bodies | Monthly from a Narsipatnam wood depot, cash |
| 2 | Natural lac sticks and vegetable dyes | Lacquer colouring and polish | Directly from Etikoppaka lac suppliers, monthly |
| 3 | Cartons, paper and bubble wrap | Packing for emporia and couriers | Quarterly from a Visakhapatnam packaging dealer |

Staff (click **Add role** twice):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Assistant turner | 1 | 5000 |
| 2 | Lac-colour painter (part-time) | 2 | 1500 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number | No | `2.40` | |
| 2 | Power Cost (₹ Lakhs) | Number | No | `0.30` | |
| 3 | Wages (₹ Lakhs) | Number | No | `0.96` | (5,000 + 2 × 1,500) × 12. |
| 4 | Maintenance (₹ Lakhs) | Number | No | `0.12` | |
| 5 | Administrative Expenses (₹ Lakhs) | Number | No | `0.24` | |
| 6 | Marketing Expenses (₹ Lakhs) | Number | No | `0.30` | Fair stall and online listing. |
| 7 | Annual Production Volume | Number | No | `6000` | Pieces a year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number | No | `6.57` | |

### Step 11 — Financial viability
Cards "Project cost ₹ 1.95 Lakhs" and "Equity + loan + other ₹ 1.95 Lakhs"; model panel with 7 green checks.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 6.57 | 2.40 | 0.96 | 0.30 | 1.48 |
| 2 | 6.90 | 2.52 | 1.01 | 0.32 | 1.62 |
| 3 | 7.24 | 2.65 | 1.06 | 0.33 | 1.73 |
| 4 | 7.61 | 2.78 | 1.11 | 0.35 | 1.84 |
| 5 | 7.99 | 2.92 | 1.17 | 0.36 | 1.96 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number | No | `49` | Model shows 48.86%. |

**AUTO – verify shows:** model panel (5 years) Average DSCR `3.85` (counted over years 1–2 because the 18-month loan ends in year 2), Break-even `48.86%`, Project IRR `90.85%`, NPV at 12% `₹5.46 lakh`, Payback `1.12 years`; older DSCR card "Average DSCR: 8.56".

### Step 12 — Documents & uploads
| # | Slot (label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Aadhaar | File | No | `VISHWAKARMA_aadhaar_sample_masked.pdf` | Dummy file only. |
| 2 | Savings Bank Passbook | File | No | `VISHWAKARMA_savings_passbook_APGVB.pdf` | |
| 3 | Ration Card (family verification) | File | No | `VISHWAKARMA_ration_card_family.pdf` | |
| 4 | PM Vishwakarma Certificate / ID (if issued) | File | No | `VISHWAKARMA_pm_vishwakarma_id_card.jpg` | |
| 5 | Toolkit List / Designated-centre Quote | File | No | `VISHWAKARMA_toolkit_quote_designated_centre.pdf` | |

### Money cross-check
- Project cost: tools 0.48 + 0.36 + 0.14 + 0.12 + 0.15 + 0.25 = **1.50**; working capital 0.45. Total **1.95**.
- Means of finance: own 0.80 + toolkit voucher 0.15 + bank tranche 1.00 + other 0 = **1.95**.
- Voucher 0.15 = ₹15,000 (scheme maximum). Bank loan 1.00 = first-tranche cap (₹1,00,000). Own share 41.0% (no minimum). Bank loan ≤ tools + set-up (1.00 ≤ 1.50), so no "term loan more than assets" note.
- EMI (calculator, ₹1.00 L at 5% for 1.5 years): ₹5,778 a month (0.06 lakh), ₹0.69 lakh a year; calculator DSCR 3.25 on surplus 2.25 (sales 6.57 − running costs 4.32).
- Year 1 model: EBITDA 2.25, PAT 1.48, DSCR 2.50.

### Uploads to prepare
Aadhaar → `VISHWAKARMA_aadhaar_sample_masked.pdf`; Savings Bank Passbook → `VISHWAKARMA_savings_passbook_APGVB.pdf`; Ration Card (family verification) → `VISHWAKARMA_ration_card_family.pdf`; PM Vishwakarma Certificate / ID (if issued) → `VISHWAKARMA_pm_vishwakarma_id_card.jpg`; Toolkit List / Designated-centre Quote → `VISHWAKARMA_toolkit_quote_designated_centre.pdf`. All five slots always appear.

### Generate & verify
- **Generate DPR** enabled on Step 12. **Check my answers** is expected to list **one** finding under Unusual: "An interest rate of 5% is unusual. Small-business loans are usually between 8% and 14%." (D3). Click **This is correct** to dismiss it or **Generate anyway**. No other finding is expected.
- **12 sections**: Cover & craft eligibility, Trade story & process, Location, Craft profile, Market & sales assumptions, Workplace / premises, Applicant / firm, Project cost (tools + WC), Means of finance (critical), Operating cost & sales, Financial viability, Documents & uploads.
- Cover: "Establishment of / Sri Venkateswara Etikoppaka Toys / under 'PM Vishwakarma'".
- Find: Craft / trade "Doll & Toy Maker (Traditional)", Training stage "Basic training completed", Loan tranche "First tranche (up to ₹1 lakh)" (check it is not shown as "1st tranche"), Similar loan answer "No", current/new tools text, Process of manufacture in section 2, machinery table 6 rows, project cost 1.95, voucher 0.15, bank 1.00, own 0.80, sales 6.57.
- Label checks (D2): "Workplace" should read "Home / household workplace"; the web preview is expected to show another scheme's text for the value `home` ("Home-based coir unit"). Power requirement is not printed.

### Negative / boundary tests
1. Step 9 own `0.45`, bank `1.35` (cost 1.95) → "Must fix first": "The bank loan of ₹1.35 lakh is more than the ₹1.00 lakh allowed for this PM Vishwakarma loan tranche."
2. Step 1 tranche = `None yet (toolkit / training first)` with bank `1.00` → no cap finding at all (gap, D1); with the 1st tranche reselected the cap returns.
3. Step 1 "Similar self-employment loan in last 5 years?" = Yes, and training = Not started with tranche = Second → nothing blocks or warns (D1).
4. Step 9 voucher `0.20`, own `0.75` → accepted; there is no ₹15,000 cap check (D1).
5. Age `17` → inline "Enter a number from 18 to 100.", guardian toast, save blocked; Generate fails with "Failed to save data before generating DPR".
6. Step 9 moratorium `18` with tenure `18` → review lists Does not add up: "The grace period (18 months) is as long as, or longer than, the whole loan period (18 months)."
7. Clear Step 6 "Shop / shed / workplace" and press **Next** → "Fill the required fields before continuing: Shop / shed / workplace".

### Discrepancies spotted
- **D1.** Eligibility rules in the spec are not enforced: prior loan = Yes, training stage vs tranche, and the ₹15,000 toolkit cap have no checks; tranche "None yet" or blank gives `vishwakarmaTrancheCapLakhs = 0`, which switches the bank-loan cap off entirely.
- **D2.** Web preview value labels: workplace `home` prints another scheme's label ("Home-based coir unit" from the CVY list, overriding ASPIRE/NHDP/Vishwakarma); tranche `first`/`second` collide with SVANIDHI. Server DOCX prints most Vishwakarma codes raw (`basicDone`, `rentedShop`, `noneYet`) and maps `first` to "1st tranche".
- **D3.** The scheme's own concessional 5% interest rate triggers the generic "interest rate is unusual" advisory (rule: below 6% or above 16%).
- **D4.** Spec lists `marketingStrategy` (Step 5), furniture / utilities on Step 8 and tranche tenors of 18 / 30 months. The form has no marketing-strategy input, hides furniture entirely and never defaults tenure (blank tenure becomes 60 months and blank rate 11% in the model, giving misleading DSCR).
- **D5.** Step 8 grey note refers to "Mudra Shishu / Kishore" for this scheme.
- **D6.** The green "Indicative support" line prints raw option codes (`basicDone`) instead of the training-stage label.
- **D7.** Power requirement (Step 6) is stored but never printed in the report.

## 8. CGTMSE — credit guarantee for micro and small enterprises (`CGTMSE`)

**Entry:** `/individual-dpr/create?new=true&scheme=CGTMSE` opens the brief "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)"; click **Start DPR steps**. Or pick the card with that name in the picker. The header chip may read "CGTMSE (MUDRA-adjacent)". Use **Next** / **Previous**. Money in **₹ Lakhs** unless the label says ₹. Dates: type `dd-mm-yyyy` (ISO in tables).
**Total steps:** 12 (Cover & eligibility · Business / activity story · Location · Unit profile · Market & sales · Premises · Applicant / firm · Project cost · Means of finance · Operating cost & sales · Financial viability · Documents & uploads).
**Test persona:** Gaddam Padmaja, woman entrepreneur and sole proprietor of **Padmaja Silk Handlooms**, an existing (since August 2016) Dharmavaram silk-saree weaving and finishing unit at **Dharmavaram** (Dharmavaram mandal), **Sri Sathya Sai** district, with six Jacquard handlooms. She seeks a collateral-free term loan of ₹15 lakh from Canara Bank, covered by CGTMSE, to add looms, a warping machine, twisting and finishing machines and a shed extension.
**Before you start:** open the URL directly; no Scheme Finder handoff is needed. This form has no age field and no premises owned/rented select.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text | Yes (blocks Next) | `Padmaja Silk Handlooms` | |
| 2 | District * | Select | Yes | `Sri Sathya Sai` | |
| 3 | Location * | Select | Yes | `Dharmavaram` | Sri Sathya Sai list: Dharmavaram, Hindupur, Kadiri, Puttaparthi, Penukonda, Madakasira, Bukkapatnam. |
| 4 | Nature of Business | Text | No | `Weaving and finishing of Dharmavaram pure silk sarees and half-saree fabric on Jacquard handlooms` | |
| 5 | Major Products | Text | No | `Pure silk sarees, silk half-saree sets, silk dupattas` | |
| 6 | Loan purpose | Select | No | `Term loan (P&M / shed)` | Options: Term loan (P&M / shed) / Working capital / Composite (term + WC). Stored as `termLoan`. |
| 7 | Women-owned | Select | No | `Yes — women-owned (higher cover %)` | Options: Yes — women-owned (higher cover %) / No. No cover % is calculated anywhere (D1). |
| 8 | Proposed limit (₹ Lakhs) | Number | No | `15` | Not compared with the Step 9 bank loan (D1). |
| 9 | Entrepreneur name | Text | No | `Gaddam Padmaja` | |

### Step 2 — Business / activity story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text | Yes | `Handloom textiles - pure silk sarees` | |
| 2 | Short intro — what the unit does * | Textarea | Yes | `Padmaja Silk Handlooms weaves pure silk sarees, half-saree fabric and silk dupattas on six Jacquard handlooms at Dharmavaram and sells to saree showrooms in Dharmavaram, Hyderabad, Bengaluru and Chennai. Yarn is bought from Bengaluru and finishing is done in-house.` | 30+ characters. No process box on this scheme. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea | No | `Dharmavaram town (Dharmavaram mandal, Sri Sathya Sai district) is a silk-saree cluster with a railway junction, about 50 km from Anantapur; yarn dealers and dyers are in the town and the main buyers are showrooms in Hyderabad, Bengaluru and Chennai.` | |

### Step 4 — Unit profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `Existing unit with six Jacquard handlooms, hand finishing and one steam vat. The loan adds a warping machine, twisting machines, finishing machine and a shed extension to lift output from 30 to 40 sarees a month.` | 30+ characters. |
| 2 | Start Date | Date | No | `15-08-2016` (2016-08-15) | Not after Commitment Date. |
| 3 | Commitment Date | Date | No | `05-12-2026` (2026-12-05) | |
| 4 | Tools / process level | Text | No | `Jacquard pit handlooms with steam degumming and hand finishing` | |
| 5 | Capacity / throughput (if applicable) | Text | No | `40 sarees per month on 6 Jacquard handlooms` | |

Products table (click **Add product** twice):
| Row | Product Name | Share of Output (%) | Selling Price (per unit, ₹) |
|---|---|---|---|
| 1 | Pure silk saree (pattu) | 65 | 12000 |
| 2 | Silk half-saree fabric set | 20 | 9000 |
| 3 | Silk dupatta and stole | 15 | 4500 |

Basis: 480 pieces a year = 312 × 12,000 + 96 × 9,000 + 72 × 4,500 = ₹49.32 lakh.

### Step 5 — Market & sales
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Saree showrooms and wholesalers in Dharmavaram, Hyderabad, Bengaluru and Chennai, plus bridal orders from families in Anantapur and Kurnool districts.` | |
| 2 | Demand / footfall note | Textarea | No | `Peak demand October–February (wedding and festival season); two Hyderabad showrooms have placed standing orders for 15 sarees a month.` | |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text | Yes | `Weaving shed, Handloom Park Road, Dharmavaram` | Blocks Next if empty. |
| 2 | Premises note (own / lease / rent) | Textarea | No | `Own 2,400 sq ft weaving shed on a 600 sq yd plot in the proprietor's name (registered sale deed 2014); an 800 sq ft extension is planned.` | Ownership is stated here because there is no owned/rented select (D4). |
| 3 | Power requirement (HP / kW) — optional | Text | No | `12 kW, 3-phase handloom tariff connection` | Not printed in the report. |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Star but not enforced | `Padmaja Silk Handlooms (Prop. Gaddam Padmaja)` | **AUTO – verify shows** the **unit name** `Padmaja Silk Handlooms` first (for CGTMSE the auto-fill does not use the entrepreneur name, D3). |
| 2 | Legal status (sole / partnership / company) | Text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | Text mask | No | `37AEHPB2290L1ZF` | Valid check character. |
| 4 | Firm PAN (optional) | Text mask | No | leave blank | Individual PAN (4th letter P) is rejected here. |
| 5 | Udyam registration number (optional) | Text mask | No | `UDYAM-AP-03-0066274` | |
| 6 | Contact mobile number (optional) | Text | No | `9618403925` | |
| 7 | Correspondence address | Textarea | No | `D.No. 6-112, Handloom Park Road, Dharmavaram, Sri Sathya Sai District, Andhra Pradesh 515671` | **AUTO – verify shows** `Dharmavaram, Sri Sathya Sai` first. |

### Step 8 — Project cost
"Details carried to this schedule" must show promoter (Gaddam Padmaja), unit, address, GSTIN. Set **What kind of business is this?** = `Making things`.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select | No | `Making things` | |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number | No | `0` | |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number | No | `3.20` | Shed extension. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number | No | `0.80` | |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number | No | `0.50` | |
| 6 | Working capital (₹ Lakhs) | Number | No | `6.50` | |

Machinery list (click **Add machinery** five times):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | Jacquard handloom with accessories | New | Sri Sai Loom Works, Dharmavaram | 6 | 0.95 | 5.70 |
| 2 | Warping and sizing machine | New | Venkateswara Textile Machinery, Salem | 1 | 1.10 | 1.10 |
| 3 | Silk twisting machine | New | Venkateswara Textile Machinery, Salem | 2 | 0.65 | 1.30 |
| 4 | Steam degumming and dyeing vats | New | Sri Sai Loom Works, Dharmavaram | 1 | 1.40 | 1.40 |
| 5 | Calendering and finishing machine | New | Venkateswara Textile Machinery, Salem | 1 | 1.00 | 1.00 |

**AUTO – verify shows** "Total Project Cost ₹ 21.5 Lakhs" (machinery 10.50 + building 3.20 + furniture 0.80 + pre-operative 0.50 + working capital 6.50).

### Step 9 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Canara Bank, Dharmavaram Branch` | |
| 2 | Interest rate (% per year) | Number | No | `10.75` | |
| 3 | Moratorium (months) | Number | No | `6` | |
| 4 | Loan tenure (months) | Number | No | `72` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | Needed to generate | `6.50` | Generic CGTMSE rule: at least 10% of cost. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `0` | |
| 7 | Bank Loan (₹ Lakhs) | Number | Needed to generate | `15.00` | Debt ÷ (own + subsidy) must stay ≤ 3 (D2). |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |

**AUTO – verify shows** "Total Finance ₹ 21.5 Lakhs" and the grey note "CGTMSE is a bank-side guarantee (MUDRA-adjacent) — governmentGrant usually 0… · termLoan · women-owned · proposed 15 L." (the loan purpose appears as the raw code `termLoan`, D5).

### Step 10 — Operating cost & sales
Raw materials (click **Add raw material** three times):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | Mulberry silk yarn (20/22 denier) and zari | Warp, weft and borders | Monthly from Bengaluru silk-yarn dealers on 30-day credit |
| 2 | Dyes, chemicals and soap-nut | Degumming and colouring | Quarterly from a Salem dye supplier, cash |
| 3 | Cartons, saree covers and labels | Packing for showrooms | Quarterly from a Hyderabad packaging dealer |

Staff (click **Add role** once):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | Master weaver | 6 | 14000 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number | No | `26.40` | |
| 2 | Power Cost (₹ Lakhs) | Number | No | `0.60` | |
| 3 | Wages (₹ Lakhs) | Number | No | `10.08` | 6 × 14,000 × 12. |
| 4 | Maintenance (₹ Lakhs) | Number | No | `0.60` | |
| 5 | Administrative Expenses (₹ Lakhs) | Number | No | `1.50` | |
| 6 | Marketing Expenses (₹ Lakhs) | Number | No | `1.40` | |
| 7 | Annual Production Volume | Number | No | `480` | Pieces a year. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number | No | `49.32` | |

### Step 11 — Financial viability
Cards "Project cost ₹ 21.5 Lakhs" and "Equity + loan + other ₹ 21.5 Lakhs"; model panel with 7 green checks.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | 49.32 | 26.40 | 10.08 | 0.60 | 3.80 |
| 2 | 51.79 | 27.72 | 10.58 | 0.63 | 4.49 |
| 3 | 54.38 | 29.11 | 11.11 | 0.66 | 5.20 |
| 4 | 57.09 | 30.56 | 11.67 | 0.69 | 5.92 |
| 5 | 59.95 | 32.09 | 12.25 | 0.73 | 6.67 |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number | No | `77` | Model shows 77.29%. |

**AUTO – verify shows:** model panel (6 years, tenure 72 months) Average DSCR `2.35`, Break-even `77.29%`, Project IRR `31.55%`, NPV at 12% `₹16.3 lakh`, Payback `3.02 years`; older DSCR card "Average DSCR: 2.00" (approximately; not red).

### Step 12 — Documents & uploads
| # | Slot (label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File | No | `CGTMSE_udyam_certificate.pdf` | |
| 2 | Aadhaar / PAN | File | No | `CGTMSE_aadhaar_pan_sample_masked.pdf` | Dummy file only. |
| 3 | Quotations / WC Evidence | File | No | `CGTMSE_quotations_looms_machinery.pdf` | |
| 4 | Bank Passbook | File | No | `CGTMSE_bank_passbook_Canara.pdf` | Spec lists only three uploads (D6). |

### Money cross-check
- Project cost: machinery 5.70 + 1.10 + 1.30 + 1.40 + 1.00 = **10.50**; building 3.20; land 0; furniture 0.80; pre-operative 0.50; working capital 6.50. Total 10.50 + 3.20 + 0 + 0.80 + 0.50 + 6.50 = **21.50**.
- Means of finance: own 6.50 + grant 0 + bank 15.00 + other 0 = **21.50**.
- Own share 6.50 / 21.50 = 30.2% (minimum 10%). Debt ÷ equity = 15.00 / 6.50 = 2.31 (ceiling 3). The bank loan equals machinery + building + furniture + pre-operative (15.00), so no "term loan more than assets" note. Proposed limit 15 = bank loan 15.00.
- EMI (calculator, ₹15 L at 10.75% for 6 years): ₹28,359 a month (0.28 lakh), ₹3.40 lakh a year; calculator DSCR 2.57 on surplus 8.74 (sales 49.32 − running costs 40.58).
- Year 1 model: EBITDA 8.74, PAT 3.80, DSCR 2.85.

### Uploads to prepare
Udyam Certificate → `CGTMSE_udyam_certificate.pdf`; Aadhaar / PAN → `CGTMSE_aadhaar_pan_sample_masked.pdf`; Quotations / WC Evidence → `CGTMSE_quotations_looms_machinery.pdf`; Bank Passbook → `CGTMSE_bank_passbook_Canara.pdf`. Four slots, always shown.

### Generate & verify
- **Generate DPR** enabled on Step 12. **Check my answers** expected: "All clear". Generate opens `/dpr/view/<id>`.
- **12 sections**: Cover & eligibility, Business / activity story, Location, Unit profile, Market & sales, Premises, Applicant / firm, Project cost, Means of finance, Operating cost & sales, Financial viability, Documents & uploads.
- Cover: "Establishment of / Padmaja Silk Handlooms / under 'Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)'".
- Find: Loan purpose "Term loan (P&M / shed)", Women-owned (expected "Yes — women-owned (higher cover %)"; the web preview may show only "Yes"), Proposed limit 15, Entrepreneur name, 3-row product table, machinery 5 rows, cost 21.5, own 6.5, bank 15, sales 49.32, bank terms (bank name, 10.75, 6, 72), staff table (Master weaver, 6, 14000), uploads.
- Absent by design: power requirement; no cover-percentage figure anywhere (D1).

### Negative / boundary tests
1. Step 9 own `3.00`, bank `18.50` (cost 21.50) → "Must fix first": "Bank debt is 6.17 times your own money plus subsidy. The most allowed is 3 to 1." (own share 13.95% passes the 10% rule).
2. Step 9 own `1.50`, bank `20.00` → "Must fix first": "Your own money is 6.98% of the project cost. The minimum for this scheme is 10%." with hint "You need at least ₹2.15 lakh of your own money." plus the 3:1 message (13.33 times).
3. Step 1 Proposed limit `5` with bank loan 15.00 → accepted, no finding (D1). There is also no upper cap on the bank loan except advisory "project cost bigger than most micro and small units" above ₹500 lakh.
4. Clear "Sector / industry type" and "Short intro — what the unit does" on Step 2, press **Next** → "Fill the required fields before continuing: Sector / industry type, Short intro — what the unit does".
5. Step 7 GSTIN `37AEHPB2290L1ZG` → "The last character does not match…"; **Next** shows "Correct these fields before continuing: GSTIN". Firm PAN `AEHPB2290L` → individual-PAN message.
6. Step 4 Commitment Date `01-06-2016` before Start Date → toast "Commitment Date must be on or after Start Date", value rejected.
7. Step 8 reduce working capital to `3.50` without changing Step 9 → "Must fix first": "The funding adds up to ₹21.50 lakh but the project cost is ₹18.50 lakh. They must match exactly (difference ₹3.00 lakh)."

### Discrepancies spotted
- **D1.** Spec: guarantee cover depends on loan amount and women-owned. The form only stores Loan purpose, Women-owned and Proposed limit; no cover % is computed, `proposedLimit` is never compared with the bank loan, and `lendingLimit` returns no cap for CGTMSE (the ₹5 crore guarantee ceiling is not checked).
- **D2.** CGTMSE has no scheme rule in `ruleFor`, so it falls to the generic default: own money must be at least 10% and bank debt at most 3 × (own money + subsidy), both blocking. A collateral-free guaranteed loan can legitimately be 80–90% bank money; the spec states no such limit.
- **D3.** `contextReuse` lists the proprietor-style schemes but not `CGTMSE`, so Step 7 "Firm / proprietor name" auto-fills with the unit name while MUDRA, Stand-Up, SVANIDHI and Vishwakarma use the entrepreneur name.
- **D4.** Unlike MUDRA / Stand-Up, Step 6 has no "owned / rented" select and Step 1 has no age field, so the under-18 rule cannot be exercised and ownership is only free text.
- **D5.** The Step 9 grey note prints the raw loan-purpose code (`termLoan`) and server-built DOCX/XLS are expected to print `termLoan` raw (the server maps only a few codes).
- **D6.** Spec Step 12 lists three uploads (Udyam, Aadhaar/PAN, quotations / WC evidence); code adds a fourth, Bank Passbook.
- **D7.** The scheme brief is titled with the long official name but the impact bar says "CGTMSE (MUDRA-adjacent)", and the spec calls it a "MUDRA-adjacent guarantee path"; CGTMSE is not tied to MUDRA anywhere in the logic.

---

## 9. PM Formalisation of Micro Food Processing Enterprises (`PMFME`)

**Entry:** `/individual-dpr/create?new=true&scheme=PMFME` (or Create New Latest DPR, pick the card "PM Formalisation of Micro Food Processing Enterprises (PMFME)"). The scheme brief opens first; click **Start DPR steps**. **Total steps:** 14 (Step 1 to Step 14; header on each step reads "Step n: <title>").

**Test persona:** Mrs. Kommineni Bhavani (38), proprietor of **Sri Durga Chilli Foods**, an existing 60 kg/day hand-fed spice grinding unit at Prathipadu, Guntur district (Guntur red chilli is the district ODOP product). She has an FSSAI licence and Udyam, rents a 2,400 sq ft shed, and is upgrading to a 150 kg/day mechanised line (destalker, cooled pulveriser, blender, pouch packing). Products: red chilli, turmeric, coriander powders and sambar masala sold under the "Durga" brand in 100 g, 250 g and 1 kg pouches. Project cost ₹15.00 lakh: own 15%, PMFME grant 35%, SBI term loan 50%. Same persona on every step.

General notes for the tester (apply to every step): ignore the AI suggestion panel at the top of each step, the "Suggest title" and "Match me" buttons (optional). All money fields are **₹ Lakhs** unless stated. Date boxes: values are given as yyyy-mm-dd; type them in your browser's date order. Numeric boxes accept only digits and one decimal point. **Next** is blocked only by the required fields marked "Yes" below and by invalid GSTIN / Firm PAN / Udyam / mobile formats; money rules are enforced at **Generate DPR** on the last step.

### Step 1 — Cover & formalisation
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Durga Chilli Foods` | Becomes the cover title. Blank blocks Next ("Unit / Project Name"). |
| 2 | District * | select (26 AP districts) | Yes | `Guntur` | Changing district later clears Location. |
| 3 | Location * | select (towns of chosen district; disabled until district chosen) | Yes | `Prathipadu` | Option list for Guntur includes Prathipadu. |
| 4 | Nature of Business | text (+ "Match me") | No | `Spice / pickle processing` | Must be 12+ characters or the data check calls it very short. This value is a listed business skill. |
| 5 | Major Products | text | No | `Red chilli powder, turmeric powder, coriander powder, sambar masala` | |
| | *Card: "PMFME — formalisation & eligibility"* | | | | |
| 6 | Unit stage | select | No | `Existing unit — upgrade / expansion` | Other option: "New micro food processing unit". Choosing Existing reveals row 11 and the upload slot "Photos of Existing Unit" (Step 14). |
| 7 | ODOP aligned? | select | No | `Yes — district ODOP product` | Other option: "No — non-ODOP (still eligible)". |
| 8 | FSSAI | select (placeholder "FSSAI status") | No | `Already have FSSAI` | Other option: "Will obtain / draft FSSAI". |
| 9 | Entrepreneur full name | text | No | `Kommineni Bhavani` | Feeds cover "Entrepreneur name" and auto-fills Step 7 firm name. |
| 10 | Entrepreneur age | number, min 18, max 100 | No | `38` | Below 18 shows "Enter a number from 18 to 100." and a guardian toast. |
| 11 | Existing annual turnover (₹ Lakhs) | number (only when Unit stage = Existing) | No | `36.5` | ₹ lakh, not rupees. |

### Step 2 — Introduction & process
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Food processing — spices and condiments` | Blank blocks Next. |
| 2 | Short intro — what the unit does | textarea | Yes | `Sri Durga Chilli Foods cleans, dries, grinds and packs red chilli, turmeric and coriander into branded spice powders sold to Guntur kirana shops, hostels and caterers.` | Blank blocks Next. Under 30 characters or "test" raises a data-check note. |
| 3 | Process of manufacture | textarea | No | `Dry chillies are bought at the Guntur yard, cleaned and destalked, tray dried to 10% moisture, ground in the cooled pulveriser, sieved, blended to colour and pungency grade, packed in 100 g, 250 g and 1 kg laminated pouches, batch-coded and held in the dry room before dispatch.` | 40+ characters expected; must not repeat any other answer word for word. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is on the Prathipadu to Guntur road, 28 km from the Guntur Mirchi Yard, with 3-phase power and a tar road; the market catchment covers Guntur, Palnadu and Krishna districts.` | Only one input on this step. |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Existing hand-fed grinding line of 60 kg/day will be replaced by a 150 kg/day mechanised line with destalker, cooled pulveriser, blender and pouch packing so that the unit meets FSSAI hygiene norms.` | 30+ characters expected. |
| 2 | Start Date | date | No | `2021-08-02` | Must be between 1990 and 2100, else toast "Enter a valid date between 1990 and 2100". Enter this before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-12-01` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not saved. |
| 4 | Tools / process level | text | No | `Semi-automatic, single shift, hygienic pouch packing` | |
| 5 | Capacity / throughput (if applicable) | text | No | `150 kg/day` | Also stored as installed capacity. |
| 6 | Capacity utilisation Year 1 (%) | number, 0 to 100 | No | `60` | Over 100 shows range error; under 30 or over 100 raises a data-check note. |

Sub-table: **Products, share of output and selling price** (starts with one blank row; use **Add product** for rows 2 to 4). Selling price is ₹ per kg.
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Red chilli powder` | `55` | `280` |
| 2 | `Turmeric powder` | `20` | `220` |
| 3 | `Coriander powder` | `15` | `190` |
| 4 | `Sambar masala` | `10` | `340` |

Weighted price = 0.55x280 + 0.20x220 + 0.15x190 + 0.10x340 = ₹260.5 per kg. The shares add to 100 (not enforced by the app).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 7 | Proposed workers (nos.) | number | No | `6` | PMFME only. Matches the 6 staff roles in Step 10. |

### Step 5 — Market, buyers & raw material
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Kirana shops and supermarket shelves in Guntur, Tenali and Narasaraopet, hostels, hotels and caterers, weekly orders from two Vijayawada wholesalers, and online sales under the Durga brand.` | |
| 2 | Demand / footfall note | textarea | No | `Spice demand is steady all year; existing customers already ask for 250 g packs that the old line cannot supply, and 14 repeat buyers place monthly orders.` | |
| 3 | Sources of raw material | textarea | No | `Dry red chillies (Teja and 334 varieties) from the Guntur Mirchi Yard and two farmer producer groups at Prathipadu and Vinukonda; turmeric from Duggirala growers; coriander from Kurnool dealers on contract.` | PMFME only; MoFPI DPR requirement. |

### Step 6 — Premises & utilities
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace | text | Yes | `Rented processing shed of 2,400 sq ft with attached dry room, Industrial Road, Prathipadu` | Blank blocks Next. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Shed taken on a registered 9-year lease from Sri K. Venkata Rao at Rs 18,000 per month; the lease runs beyond the 5-year loan period.` | |
| 3 | Premises — owned / rented | select | No | `Leased` | Options: Owned, Leased, Rented. |
| 4 | Power requirement (HP / kW) — optional | text | No | `35 HP connected load (26 kW), 3-phase` | |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name | text | No | AUTO prefilled `Kommineni Bhavani`; replace with `Kommineni Bhavani (Proprietor), Sri Durga Chilli Foods` | AUTO: copied from Step 1 Entrepreneur full name; note "Filled in from your unit details" shows until edited. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | masked text, 15 chars | No | `37BKQPK7316D1ZZ` | Valid check character. Auto upper-case. |
| 4 | Firm PAN (optional) | masked text, 10 chars | No | leave blank | A proprietor's PAN has 4th letter P and is rejected here (see negative tests). |
| 5 | Udyam registration number (optional) | masked text | No | `UDYAM-AP-10-0048215` | Type letters and digits; hyphens added automatically. |
| 6 | Contact mobile number (optional) | masked, 10 digits | No | `9849062318` | Must start 6 to 9. |
| 7 | Correspondence address | textarea | No | `D.No. 3-118, Industrial Road, Prathipadu, Guntur District, Andhra Pradesh - 522019` | AUTO prefilled `Prathipadu, Guntur`; overwrite with the full address. |

### Step 8 — Project cost
Top of page (read-only): card "Details carried to this schedule" must show Promoter/applicant = the Step 7 firm name or entrepreneur name, Unit = `Sri Durga Chilli Foods`, Address = Step 7 address, GSTIN = `37BKQPK7316D1ZZ`. Optional **Work out working capital** calculator button exists; skip it.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | Should already show Making things; set it explicitly. Options: Making things / A service / Buying and selling. |

Sub-table: **Machinery list** (click **Add machinery** for each row). Columns: Description, Condition (New/Used select), Supplier, Qty, Unit cost (₹ Lakhs).
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Chilli cleaning and destalking machine` | New | `Sri Sai Agro Engineers, Guntur` | `1` | `1.40` | 1.40 |
| 2 | `Cooled pulveriser, 20 HP with cyclone` | New | `Sri Sai Agro Engineers, Guntur` | `1` | `2.35` | 2.35 |
| 3 | `Ribbon blender, 100 kg` | New | `Venkateswara Food Machinery, Vijayawada` | `1` | `1.15` | 1.15 |
| 4 | `Vibro sifter, 24 inch` | New | `Venkateswara Food Machinery, Vijayawada` | `1` | `0.65` | 0.65 |
| 5 | `Semi-automatic pouch filling and sealing machine` | New | `Sri Lakshmi Packaging Machines, Hyderabad` | `1` | `1.30` | 1.30 |
| 6 | `Electronic platform scale, 100 kg` | New | `Balaji Weighing Systems, Guntur` | `2` | `0.12` | 0.24 |
| 7 | `Electric tray dryer, 48 tray` | New | `Venkateswara Food Machinery, Vijayawada` | `1` | `0.91` | 0.91 |

Machinery total = 8.00 (AUTO, no separate field; it feeds the Total Project Cost box).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | leave blank (0) | Premises are leased. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `1.50` | Hygienic flooring, wall tiling, ventilation for FSSAI. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `0.80` | Stainless steel tables, racks. |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `0.50` | FSSAI renewal, brand design, trials. |
| 6 | Working capital (₹ Lakhs) | number | No | `4.20` | |

**Total Project Cost** box (AUTO) must read `₹ 15 Lakhs`.

### Step 9 — Means of finance (critical)
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `State Bank of India, Prathipadu branch` | Block "Term loan terms". |
| 2 | Interest rate (% per year) | number | No | `10.5` | Data check treats under 6 or over 16 as unusual. |
| 3 | Moratorium (months) | number | No | `6` | Must be shorter than tenure. |
| 4 | Loan tenure (months) | number | No | `60` | 12 to 180 expected. |
| 5 | Own contribution (₹ Lakhs) | number | No (guard) | `2.25` | 15% of cost; minimum 10%. |
| 6 | PMFME capital grant (₹ Lakhs) — 35%, cap ₹10 L | number | No (guard) | `5.25` | 35% of 15.00. |
| 7 | Bank term loan + / or WC (₹ Lakhs) | number | No (guard) | `7.50` | |
| 8 | Other Sources (₹ Lakhs) | number | No | leave blank (0) | |

Grey note under the fields (AUTO): "Credit-linked grant 35% capped at ₹10 L. Min own 10%. Indicative grant for current project cost fields ≈ ₹5.25 Lakhs · Existing / ODOP Yes." **Total Finance** box must read `₹ 15 Lakhs`. Optional calculators "Split the funding" (own 15, subsidy 35 gives own 2.25, subsidy 5.25, loan 7.5) and "Loan instalment and DSCR".

### Step 10 — Operating cost & sales
Sub-table **Raw materials** (button "Add raw material"): columns Material, Use, How it is bought.
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Dry red chilli (Teja and 334)` | `Main raw material for chilli powder` | `Cash purchase at Guntur Mirchi Yard, about 60 days of stock in season` |
| 2 | `Turmeric fingers` | `Turmeric powder` | `Monthly rate from Duggirala growers` |
| 3 | `Coriander seed` | `Coriander powder and sambar masala` | `Quarterly lots on contract with a Kurnool dealer` |
| 4 | `Laminated pouches and cartons` | `Packing` | `Monthly order from a Hyderabad packaging supplier` |

Sub-table **Staff by role and monthly pay** (button "Add role"): columns Role, Number of people, Monthly pay (₹). Not summed automatically into Wages.
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Supervisor-cum-operator` | `1` | `14000` |
| 2 | `Machine operator` | `1` | `12000` |
| 3 | `Helper and packer` | `3` | `9000` |
| 4 | `Sales and dispatch assistant` | `1` | `11000` |

Monthly payroll 14,000 + 12,000 + 27,000 + 11,000 = ₹64,000; yearly ₹7,68,000 = 7.68 lakh.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `48.5` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `2.4` | |
| 3 | Wages (₹ Lakhs) | number | No | `7.68` | |
| 4 | Maintenance (₹ Lakhs) | number | No | `0.9` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `1.5` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `2.4` | |
| 7 | Annual Production Volume | number (kg) | No | `27000` | 150 kg x 300 days x 60%. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `70.34` | 27,000 kg x ₹260.5 = 70.335, rounded. Must be at least the sum of the six costs (63.38) or "costs higher than sales" appears. |

### Step 11 — Financial viability
Top: optional calculator "Work out break-even". Then read-only **Projected financial statements** panel (AUTO). Expected: 7 check marks all green; Years = `5`; Average DSCR about `3.20`; Project IRR about 35%; payback about 2.65 years. The panel's assumption boxes (Yearly sales growth 5, cost increase 5, tax 25, discount 12, depreciation 10/15/10) may stay at defaults.
Tiles (AUTO): "Project cost" `₹ 15 Lakhs` and "Equity + loan + other" `₹ 15 Lakhs`.

Yearly table (columns Year, Sales, RM, Wages, Power, Net profit; all ₹ Lakhs). Year 1 sales/RM/wages/power are AUTO-prefilled from Step 10; editing any cell saves the whole table. Type the following:
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `70.34` | `48.5` | `7.68` | `2.4` | `3.49` |
| 2 | `73.86` | `50.93` | `8.06` | `2.52` | `4.0` |
| 3 | `77.55` | `53.47` | `8.47` | `2.65` | `4.51` |
| 4 | `81.43` | `56.14` | `8.89` | `2.78` | `5.05` |
| 5 | `85.5` | `58.95` | `9.34` | `2.92` | `5.6` |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `38.5` | Fixed costs 12.48 / (sales 70.34 minus RM+power 50.9) = 64.2% of Year-1 sales, times 60% utilisation = 38.5% of full capacity. Must be 100 or less. |

Below it, a DSCR box (AUTO) says "Assumed 7-year term at 12%. Average DSCR: 3.33" and is not red.

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | date | No | `2027-02-15` | |

Milestones: exactly three rows are shown (no "add" button). Each row has an Activity text box and two date boxes (start, end). Overwrite the default activity names:
| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | `Machinery order and advance payment` | `2026-12-01` | `2026-12-15` |
| 2 | `Shed civil works and power load enhancement` | `2026-12-10` | `2027-01-15` |
| 3 | `Installation, trial run and FSSAI inspection` | `2027-01-20` | `2027-02-10` |

### Step 13 — Employment & impact
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Direct employment (count) | number | No | `6` | More than 250 raises a note. |
| 2 | Indirect employment (count) | number | No | `15` | Farmers, transporters, packaging vendors. |
| 3 | Short impact note (optional) | textarea | No | `The upgrade formalises a 6-person spice unit under FSSAI, gives 40 chilli growers in Prathipadu a steady buyer and brings branded Guntur chilli powder to local shelves.` | |

### Step 14 — Documents & uploads
Seven upload boxes (accept .pdf .doc .docx .jpg .jpeg .png); after a successful upload "✓ Uploaded: <file name>" appears.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Machinery Quotations | file | No | `PMFME_machinery_quotations_SriSaiAgroEngineers.pdf` | |
| 2 | Land / Premises Lease or Ownership Proof | file | No | `PMFME_premises_lease_deed_Prathipadu.pdf` | |
| 3 | FSSAI Licence / Draft Registration | file | No | `PMFME_FSSAI_licence_SriDurgaChilliFoods.pdf` | |
| 4 | Aadhaar / PAN | file | No | `PMFME_aadhaar_pan_KommineniBhavani.pdf` | App blanks Aadhaar/PAN on save. |
| 5 | Udyam Certificate (or application) | file | No | `PMFME_udyam_certificate.pdf` | |
| 6 | Bank Passbook / Cancelled Cheque | file | No | `PMFME_cancelled_cheque_SBI_Prathipadu.pdf` | |
| 7 | Photos of Existing Unit | file | No | `PMFME_existing_unit_photos.jpg` | Appears only because Step 1 Unit stage = Existing. |

- **Money cross-check:** Project cost = land 0 + building 1.50 + machinery 8.00 + furniture & fixtures 0.80 + pre-operative 0.50 + working capital 4.20 = **15.00**. Means of finance = own 2.25 + PMFME grant 5.25 + bank 7.50 + other 0 = **15.00** (exact match required, difference 0.00). Own 2.25 / 15.00 = 15.0% (minimum 10%). Grant limit = min(35% x 15.00 = 5.25, 10) = 5.25, entered 5.25. Debt-equity = 7.50 / (2.25 + 5.25) = 1.00 (ceiling 3). Term loan 7.50 is below assets plus pre-operative (10.80), so no "term loan high" note. Loan instalment (calculator, 60 months at 10.5%): about ₹0.16 lakh per month, ₹1.93 lakh per year, DSCR 3.60 "Comfortable"; the projection model (6 months moratorium) gives average DSCR 3.20, minimum 2.85.
- **Uploads to prepare:** Machinery Quotations: `PMFME_machinery_quotations_SriSaiAgroEngineers.pdf`; Land / Premises Lease or Ownership Proof: `PMFME_premises_lease_deed_Prathipadu.pdf`; FSSAI Licence / Draft Registration: `PMFME_FSSAI_licence_SriDurgaChilliFoods.pdf`; Aadhaar / PAN: `PMFME_aadhaar_pan_KommineniBhavani.pdf`; Udyam Certificate (or application): `PMFME_udyam_certificate.pdf`; Bank Passbook / Cancelled Cheque: `PMFME_cancelled_cheque_SBI_Prathipadu.pdf`; Photos of Existing Unit (only when Unit stage = Existing): `PMFME_existing_unit_photos.jpg`.
- **Generate & verify:** On the last step the **Check my answers** count should be 0 and **Generate DPR** should go straight through (no "Must fix first" and no review list). Preview/PDF cover: kicker `DETAILED PROJECT REPORT`, "On", `Establishment of`, `Sri Durga Chilli Foods`, `under 'PM Formalisation of Micro Food Processing Enterprises (PMFME)'`, meta District `Guntur`, Location `Prathipadu`, Entrepreneur name `Kommineni Bhavani`. Table of Contents should list exactly 14 numbered sections in step order: Cover & formalisation; Introduction & process; Location; Unit profile & capacity; Market, buyers & raw material; Premises & utilities; Applicant / firm; Project cost; Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Employment & impact; Documents & uploads. A section is shown only if it has at least one answer, so upload at least one file or the Documents & uploads section is omitted. Key numbers: total project cost 15, own 2.25, grant 5.25, bank 7.5, Year-1 sales 70.34, average DSCR 3.2, machinery rows (7), product mix (4 rows), staff roles (4 rows).
- **Negative / boundary tests:**
  1. Step 1, leave District empty and press Next: red ring on District, toast "Fill the required fields before continuing: District"; Location select stays disabled. Choose Guntur then pick Prathipadu, then change District to Krishna: Location resets to empty.
  2. Step 9, set Bank term loan + / or WC to `7.40` (total finance 14.90): Next still works, but Generate DPR is refused with "The funding adds up to ₹14.900 lakh but the project cost is ₹15.00 lakh. They must match exactly (difference ₹0.10 lakh)". A 0.01 difference also blocks (the code does not allow a 1% tolerance).
  3. Step 9, set own `1.00`, grant `5.25`, bank `8.75` (total 15.00): Generate blocked with "Your own money is 6.67% of the project cost. The minimum for this scheme is 10%." (needs at least ₹1.5 lakh). Also set own `1.50`, grant `0`, bank `13.50`: blocked "Bank debt is 9 times your own money plus subsidy. The most allowed is 3 to 1."
  4. Step 9, set grant `6.00`, own `2.25`, bank `6.75`: blocked "The PMFME grant of ₹6.00 lakh is above the most allowed, ₹5.25 lakh (35% of cost, up to ₹10 lakh)."
  5. Step 7, GSTIN `37BKQPK7316D1ZA` (wrong last character): red message "The last character does not match..." and Next refused with "Correct these fields before continuing: GSTIN". Firm PAN `BKQPK7316D` shows "This looks like an individual's PAN (4th letter P)..." and also blocks Next. Mobile `5849062318` shows "An Indian mobile number starts with 6, 7, 8 or 9."
  6. Step 4, Commitment Date `2021-01-01` (before Start Date 2021-08-02): toast "Commitment Date must be on or after Start Date" and the date is not kept. Capacity utilisation `110`: range error, and at Generate the check list shows "Using 110% of capacity is not possible". Age `17` in Step 1: "Enter a number from 18 to 100." plus the guardian toast.
- **Discrepancies spotted:**
  1. Spec (pmfme.md section 2/Step 11) asks for a 7-year projection; the form has a fixed 5-row yearly table and the model length follows tenure (5 years for 60 months, 7 maximum).
  2. Spec Step 12 lists startDate and endDate; the form has one CoD date plus three fixed milestone rows, no end date and no way to add milestones.
  3. The brief and docs/data-checks.md speak of a 1% tolerance for funding versus cost; client `reviewFinance` and server `financeGuard` require an exact match to 0.01 lakh and block Generate.
  4. Cover action line says "Establishment of" for an existing-unit upgrade; PMFME is not in the UPGRADE_SCHEMES set in `coverTitle.ts`.
  5. Data check `dates.order` reads `step4.startDate`, a field the lean-unit form never writes (it writes `yearOfEstablishment`), so it can never fire; its direction (flags start earlier than commitment) is also opposite to the form's own rule (commitment must not be earlier than start).
  6. Three different break-even numbers exist: the Step 11 field (capacity %), the calculator (percent of the sales figure typed, default Year-1 sales: 64.2%) and the projection model (percent of revenue incl. depreciation and interest: 76.03%).
  7. The Net profit column of the Step 11 table is not read by the projection model (model uses Step 10 inputs and a 5% growth assumption), so the table can disagree with the model without any warning.
  8. PMFME grant cap is computed on the whole project cost including working capital, while the spec says "eligible project cost".

---

## 10. Special Credit Linked Capital Subsidy Scheme for SC/ST MSEs (`SCLCSS`)

**Entry:** `/individual-dpr/create?new=true&scheme=SCLCSS` (or pick "Special Credit Linked Capital Subsidy Scheme (SCLCSS) for SC/ST MSEs" in Create New Latest DPR); read the brief and click **Start DPR steps**. **Total steps:** 13.

**Test persona:** Mr. Gedela Suresh Babu (41, Scheduled Caste) holds 60% of **M/s Sri Sai Balaji Precision Works**, a partnership (second partner Mr. Dwarampudi Kishore, 40%) running an existing engineering workshop since 2016 at the APIIC Industrial Estate, Samalkota, Kakinada district. It turns pump shafts, bushes and tractor implement pins on three old centre lathes and now buys a CNC turning centre and a vertical machining centre (new, ₹65.00 lakh of P&M) to cut rejection and cycle time. Project cost ₹80.00 lakh: own 15%, SCLCSS subsidy 25% of machinery, Union Bank term loan for the rest.

General notes: ignore the AI panel, "Suggest title" and "Match me" (optional). Money is **₹ Lakhs** unless stated. Dates as yyyy-mm-dd in your browser's date order. **Next** is blocked only by fields marked "Yes" and by invalid GSTIN / Firm PAN / Udyam / mobile; funding rules are enforced at **Generate DPR**.

### Step 1 — Cover & SC/ST eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Sai Balaji Precision Works` | Cover title. |
| 2 | District * | select | Yes | `Kakinada` | |
| 3 | Location * | select | Yes | `Samalkota` | Enabled after district. |
| 4 | Nature of Business | text | No | `Engineering workshop` | 12+ characters. |
| 5 | Major Products | text | No | `CNC-turned pump shafts, bushes and tractor implement pins` | |
| | *Card: "SCLCSS — SC/ST capital subsidy"* | | | | |
| 6 | SC / ST category | select | No | `Scheduled Caste (SC)` | Other option "Scheduled Tribe (ST)". |
| 7 | Unit stage | select | No | `Existing MSE — tech upgrade / expansion` | Other option "New SC/ST MSE — first plant & machinery". Existing (or blank) shows the CA-certificate upload slot in Step 13. |
| 8 | SC/ST controlling stake % (if not sole prop) | number, 0 to 100 | No | `60` | Placeholder says must be at least 51 for firms; not enforced. |
| 9 | Udyam status / number | text (free, no format check) | No | `UDYAM-AP-07-0045218` | |
| 10 | Entrepreneur full name | text | No | `Gedela Suresh Babu` | Appears on cover. |
| 11 | Entrepreneur age | number, 18 to 100 | No | `41` | |

Green note (AUTO): "Indicative capital subsidy: 25% capped at ₹25 L · sc / existing".

### Step 2 — Technology upgrade story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Engineering goods — precision machined components` | Blank blocks Next. |
| 2 | Short intro — what the unit does | textarea | Yes | `Sri Sai Balaji Precision Works makes turned and milled steel components for pump manufacturers and tractor implement makers around Kakinada and Rajamahendravaram.` | Blank blocks Next; 30+ characters. |
| 3 | Process of manufacture | textarea | No | `Bright bars and forged blanks are cut to length, rough and finish turned on the CNC turning centre, milled and drilled on the machining centre, checked with digital gauges every tenth piece, deburred, oiled and packed in crates for dispatch to pump and implement makers.` | Placeholder: "Process after new plant & machinery (manufacturing)". |
| 4 | Existing technology | textarea | No | `Three conventional centre lathes, one radial drilling machine and one shaper run by skilled turners; manual vernier measurement; about 9% rejection and 22 minutes per shaft.` | |
| 5 | Proposed technology / upgrade | textarea | No | `One CNC turning centre with 8-station turret and 20 HP spindle, one vertical machining centre, a tool and cutter grinder, digital height gauge and micrometer set, and a 7.5 HP screw air compressor; all new with OEM warranty.` | Subsidy base text. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Plot 14 in the Samalkota Industrial Estate, 2 km from Samalkota railway station and 14 km from Kakinada; customers are within 120 km in Kakinada, East Godavari, Konaseema and Eluru districts.` | |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `The workshop will install a CNC turning centre and a vertical machining centre to replace three conventional lathes and cut rejection and cycle time.` | 30+ characters. |
| 2 | Start Date | date | No | `2016-03-14` | 1990 to 2100. Enter before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-12-10` | Not before Start Date, else toast and value rejected. |
| 4 | Tools / process level | text | No | `Conventional centre lathes today; CNC turning and machining after upgrade` | |
| 5 | Capacity / throughput (if applicable) | text | No | `600 components per day (two shifts) after new machinery` | |
| 6 | Capacity utilisation Year 1 (%) | number 0 to 100 | No | `55` | Under 30 or over 100 raises a note. |

Sub-table **Products, share of output and selling price** (use **Add product**); selling price is ₹ per piece.
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Pump shafts and bushes` | `50` | `185` |
| 2 | `Tractor implement pins and couplings` | `30` | `260` |
| 3 | `Job-work turning and milling` | `20` | `95` |

Weighted price = 0.5x185 + 0.3x260 + 0.2x95 = ₹189.5 per piece. (No "Proposed workers" box for SCLCSS.)

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Pump set manufacturers at Rajamahendravaram and Samalkota, tractor implement makers in Kakinada district, three Visakhapatnam engineering firms on monthly job orders, and Government agro-engineering supply through the SC/ST Hub vendor list.` | |
| 2 | Demand / footfall note | textarea | No | `About 3,500 pieces a month are declined today for lack of CNC accuracy; two buyers have written to place 4,000 pieces a month once the CNC line is ready.` | |

### Step 6 — Premises
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace | text | Yes | `Own workshed of 3,200 sq ft, Plot 14, APIIC Industrial Estate, Samalkota` | Blank blocks Next. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Plot and shed owned by the firm through an APIIC allotment registered in 2016; no rent is payable.` | |
| 3 | Premises — owned / rented | select | No | `Owned` | Options Owned, Leased, Rented. |
| 4 | Power requirement (HP / kW) — optional | text | No | `45 HP connected load (33 kW), 3-phase LT` | |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name | text | No | AUTO prefilled `Gedela Suresh Babu`; replace with `M/s Sri Sai Balaji Precision Works` | AUTO copy of Step 1 entrepreneur name until edited. |
| 2 | Legal status (sole / partnership / company) | text | No | `Partnership firm` | |
| 3 | GSTIN (optional) | masked, 15 | No | `37AAKFS4417H1Z0` | Valid check character; PAN inside has 4th letter F. |
| 4 | Firm PAN (optional) | masked, 10 | No | `AAKFS4417H` | Firm PAN (4th letter F) is accepted; app does not store individual PANs. |
| 5 | Udyam registration number (optional) | masked | No | `UDYAM-AP-07-0045218` | |
| 6 | Contact mobile number (optional) | masked, 10 | No | `9440218734` | |
| 7 | Correspondence address | textarea | No | `Plot 14, APIIC Industrial Estate, Samalkota, Kakinada District, Andhra Pradesh - 533440` | AUTO prefilled `Samalkota, Kakinada`; overwrite. |

### Step 8 — Project cost (machinery-led)
Read-only card "Details carried to this schedule": Promoter/applicant, Unit `Sri Sai Balaji Precision Works`, Address, GSTIN `37AAKFS4417H1Z0`.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | Should be preselected; set explicitly. |

Sub-table **Machinery list** (Add machinery per row; Condition select New/Used; Qty; Unit cost in ₹ Lakhs):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `CNC turning centre, 8-station turret, 20 HP spindle` | New | `Sri Vijaya Machine Tools, Hyderabad` | `1` | `24.00` | 24.00 |
| 2 | `CNC vertical machining centre, 850 x 500 mm table` | New | `Sri Vijaya Machine Tools, Hyderabad` | `1` | `34.50` | 34.50 |
| 3 | `Tool and cutter grinder` | New | `Godavari Tooling Corporation, Rajamahendravaram` | `1` | `3.50` | 3.50 |
| 4 | `Digital height gauge, micrometer and bore gauge set` | New | `Precision Metrology Traders, Visakhapatnam` | `1` | `1.20` | 1.20 |
| 5 | `Screw air compressor 7.5 HP with dryer` | New | `Kakinada Air Systems, Kakinada` | `1` | `1.80` | 1.80 |

Machinery total = 65.00 (AUTO; this is the subsidy base).
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | leave blank | Land is not subsidy-eligible; own plot already held. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `3.00` | Machine foundations and flooring. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `1.50` | Tool racks and workbenches. |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `1.50` | Commissioning, operator training, trial material. |
| 6 | Working capital (₹ Lakhs) | number | No | `9.00` | |

**Total Project Cost** (AUTO) must read `₹ 80 Lakhs`.

### Step 9 — Means of finance (critical)
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Union Bank of India, Samalkota branch` | |
| 2 | Interest rate (% per year) | number | No | `10.5` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `84` | |
| 5 | Own contribution (₹ Lakhs) | number | No (guard) | `12.00` | 15% of 80.00. |
| 6 | SCLCSS capital subsidy (₹ Lakhs) — 25%, cap ₹25 L | number | No (guard) | `16.25` | 25% of machinery 65.00. |
| 7 | Bank term loan for P&M (₹ Lakhs) | number | No (guard) | `51.75` | |
| 8 | Other Sources (₹ Lakhs) | number | No | leave blank | |

Grey note (AUTO): "SCLCSS is 25% capital subsidy on eligible new P&M (cap ₹25 L)... Indicative on machinery field ≈ ₹16.25 Lakhs · sc / stake 60%." **Total Finance** must read `₹ 80 Lakhs`.

### Step 10 — Operating cost & sales
Sub-table **Raw materials** (Material / Use / How it is bought):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `EN8 and EN24 bright steel bars` | `Shafts, bushes and pins` | `Monthly purchase from a Visakhapatnam steel stockist` |
| 2 | `Forged blanks` | `Couplings and implement pins` | `Quarterly lots from a Rajamahendravaram forging unit` |
| 3 | `Carbide inserts and cutting coolant` | `CNC tooling consumables` | `Monthly order from Hyderabad tooling dealer` |
| 4 | `Anti-rust oil and packing crates` | `Packing and dispatch` | `Local purchase at Kakinada` |

Sub-table **Staff by role and monthly pay** (Role / Number of people / Monthly pay (₹)):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `CNC programmer-operator` | `2` | `22000` |
| 2 | `Conventional turner` | `3` | `16000` |
| 3 | `Quality inspector` | `1` | `15000` |
| 4 | `Helper` | `3` | `10000` |
| 5 | `Accountant-cum-store keeper` | `1` | `14000` |

Monthly payroll 44,000 + 48,000 + 15,000 + 30,000 + 14,000 = ₹1,51,000; yearly ₹18,12,000 = 18.12 lakh.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `108` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `9.6` | |
| 3 | Wages (₹ Lakhs) | number | No | `18.12` | |
| 4 | Maintenance (₹ Lakhs) | number | No | `3.6` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `4.8` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `2.4` | |
| 7 | Annual Production Volume | number (pieces) | No | `99000` | 600 x 300 days x 55%. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `187.61` | 99,000 x 189.5 = 187.605, rounded. Must exceed total costs 146.52. |

### Step 11 — Financial viability
Read-only projection panel (AUTO): Years `7`, all 7 checks green, Average DSCR about `3.63` (minimum 3.25), Project IRR about 42%. Tiles: Project cost `₹ 80 Lakhs`, Equity + loan + other `₹ 80 Lakhs`.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `187.61` | `108` | `18.12` | `9.6` | `18.91` |
| 2 | `196.99` | `113.4` | `19.03` | `10.08` | `21.97` |
| 3 | `206.84` | `119.07` | `19.98` | `10.58` | `25.09` |
| 4 | `217.18` | `125.02` | `20.98` | `11.11` | `28.15` |
| 5 | `228.04` | `131.27` | `22.02` | `11.67` | `31.27` |

(Year 1 sales/RM/wages/power are AUTO-prefilled from Step 10; editing any cell saves the full table.)
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `22.7` | Fixed costs 28.92 / (sales 187.61 minus RM+power 117.60 = 70.01) = 41.31% of Year-1 sales (this is what the calculator shows by default), times 55% utilisation = 22.7% of full capacity. |

Form DSCR box (AUTO): "Assumed 7-year term at 12%. Average DSCR: 2.81", not red.

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | date | No | `2027-03-10` | |

Milestones (three fixed rows; Activity, start, end):
| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | `Place order for CNC machines and pay advance` | `2026-12-10` | `2026-12-24` |
| 2 | `Foundation work and power load raised to 45 HP` | `2026-12-15` | `2027-01-31` |
| 3 | `Installation, trial run and operator training` | `2027-02-10` | `2027-03-05` |

### Step 13 — Documents & uploads
Seven upload boxes (because Unit stage is not "New").
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | SC / ST Caste Certificate | file | No | `SCLCSS_caste_certificate_SC_GedelaSureshBabu.pdf` | |
| 2 | Machinery Quotations (tech specs) | file | No | `SCLCSS_machinery_quotations_CNC_VMC.pdf` | |
| 3 | Udyam Certificate | file | No | `SCLCSS_udyam_certificate.pdf` | |
| 4 | Aadhaar / PAN | file | No | `SCLCSS_aadhaar_pan_GedelaSureshBabu.pdf` | |
| 5 | Term Loan Sanction / In-principle | file | No | `SCLCSS_term_loan_inprinciple_UnionBank.pdf` | |
| 6 | CA Certificate of Existing FCI | file | No | `SCLCSS_CA_certificate_existing_FCI.pdf` | Shown when Unit stage is Existing or not yet chosen. |
| 7 | 51% SC/ST Shareholding Proof (if not sole proprietor) | file | No | `SCLCSS_partnership_deed_shareholding.pdf` | Always shown. |

- **Money cross-check:** Project cost = land 0 + building 3.00 + machinery 65.00 + furniture & fixtures 1.50 + pre-operative 1.50 + working capital 9.00 = **80.00**. Means of finance = own 12.00 + subsidy 16.25 + bank 51.75 + other 0 = **80.00** (exact). Subsidy limit = min(25% x 65.00 = 16.25, 25) = 16.25. Own 12.00 / 80.00 = 15% (default minimum 10%). Debt-equity = 51.75 / (12.00 + 16.25) = 1.83 (ceiling 3). Term loan 51.75 is below assets plus pre-operative (69.50 + 1.50 = 71.00). Instalment (calculator, 84 months at 10.5%): about ₹0.87 lakh per month, ₹10.47 lakh per year, DSCR 3.92 "Comfortable"; model (6 months moratorium) average DSCR 3.63.
- **Uploads to prepare:** SC / ST Caste Certificate: `SCLCSS_caste_certificate_SC_GedelaSureshBabu.pdf`; Machinery Quotations (tech specs): `SCLCSS_machinery_quotations_CNC_VMC.pdf`; Udyam Certificate: `SCLCSS_udyam_certificate.pdf`; Aadhaar / PAN: `SCLCSS_aadhaar_pan_GedelaSureshBabu.pdf`; Term Loan Sanction / In-principle: `SCLCSS_term_loan_inprinciple_UnionBank.pdf`; CA Certificate of Existing FCI (unit stage Existing or blank): `SCLCSS_CA_certificate_existing_FCI.pdf`; 51% SC/ST Shareholding Proof: `SCLCSS_partnership_deed_shareholding.pdf`.
- **Generate & verify:** Check my answers shows 0 and Generate DPR goes straight through. Cover: `DETAILED PROJECT REPORT`, "On", `Upgradation of`, `Sri Sai Balaji Precision Works`, `under 'Special Credit Linked Capital Subsidy Scheme (SCLCSS) for SC/ST MSEs'`, District `Kakinada`, Location `Samalkota`, Entrepreneur name `Gedela Suresh Babu`. Table of Contents lists exactly 13 sections: Cover & SC/ST eligibility; Technology upgrade story; Location; Unit profile & capacity; Market & offtake; Premises; Applicant / firm; Project cost (machinery-led); Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Documents & uploads (needs at least one uploaded file to appear). Key numbers: project cost 80, subsidy 16.25, own 12, bank 51.75, Year-1 sales 187.61, average DSCR 3.63, 5 machinery rows, 3 product rows, 5 staff roles.
- **Negative / boundary tests:**
  1. Step 9, subsidy `20.00`, bank `47.75` (total still 80.00): Generate blocked "The SCLCSS subsidy of ₹20.00 lakh is above the most allowed, ₹16.25 lakh (25% of machinery cost, up to ₹25 lakh)."
  2. Step 9, own `6.00`, bank `57.75`: blocked "Your own money is 7.5% of the project cost. The minimum for this scheme is 10%." (the app applies its default 10% margin to SCLCSS).
  3. Step 9, bank `51.00` (total 79.25): blocked as funding mismatch of ₹0.75 lakh.
  4. Step 1, stake `40` (below 51): accepted silently, no warning (gap, see discrepancies). Age `17`: range error and guardian toast.
  5. Step 2, leave Short intro empty: Next blocked "Fill the required fields before continuing: Short intro — what the unit does". Type `test` instead: Next allowed, but Generate shows a review list "This answer looks like a placeholder".
  6. Step 9, moratorium `84` with tenure `84`: Generate shows the advisory "The grace period (84 months) is as long as, or longer than, the whole loan period"; choose Generate anyway or fix. Step 7 Udyam `UDYAM-AP-07-004521` (6 digits): red "Udyam number looks like UDYAM-AP-01-0001234" and Next refused.
- **Discrepancies spotted:**
  1. SC/ST category and stake are never validated: leaving "SC / ST category" blank, or stake 40, generates normally although the spec says the stake must be at least 51% and a general-category promoter must not claim SCLCSS.
  2. Spec says new P&M only (second-hand ineligible); the machinery table accepts Condition = Used and counts it toward the subsidy base with no warning.
  3. Spec Step 12 lists start and end dates; the form has one CoD plus three fixed milestone rows.
  4. The Step 8 field `utilitiesAndInfrastructure` (spec: "Other fixed (₹ L)") is labelled "Furniture & fixtures (₹ Lakhs)" on this lean form.
  5. The CA Certificate of Existing FCI slot appears whenever Unit stage is not "New", including when it was never chosen.
  6. Funding must equal project cost exactly (0.01 lakh) per `reviewFinance` and `financeGuard`; the data-checks doc and the QA brief describe a 1% tolerance.
  7. The SCLCSS margin rule is the generic default (10% minimum, debt-equity 3:1), which the SCLCSS spec does not define; `ruleFor` has no SCLCSS case.
  8. The break-even calculator and the model's break-even (63.98%) use different bases from the "Break-even (capacity %)" field.

---

## 11. AP Technology Upgradation Subsidy (`AP_TECH_UPGRADE`)

**Entry:** `/individual-dpr/create?new=true&scheme=AP_TECH_UPGRADE` (or pick "AP Technology Upgradation Subsidy"); read the brief and click **Start DPR steps**. **Total steps:** 13.

**Test persona:** Smt. Gummadi Lakshmi Prasanna (36), wholly owner (woman, AP domicile) of **Sri Padmavathi Plastic Industries**, a small enterprise running since 2018 at Renigunta, Tirupati district, moulding household stools, buckets, mugs and jugs. She replaces three 15-year-old hydraulic moulding machines with two servo-hydraulic injection moulding machines (150 T and 250 T), a chiller, loaders and new moulds, doubling monthly capacity from 30,000 to 60,000 pieces. Latest turnover ₹285 lakh. Upgrade FCI ₹94.50 lakh, project cost ₹110.00 lakh: own 15%, AP tech-upgrade subsidy 40% of FCI (special category, small), Indian Bank term loan for the rest.

General notes: ignore AI panel and the "Suggest title"/"Match me" buttons. Money is **₹ Lakhs** unless stated. Dates as yyyy-mm-dd in browser date order. **Next** is blocked only by "Yes" fields and invalid GSTIN / Firm PAN / Udyam / mobile; funding rules apply at **Generate DPR**.

### Step 1 — Cover & AP eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Padmavathi Plastic Industries` | Cover title. |
| 2 | District * | select | Yes | `Tirupati` | |
| 3 | Location * | select | Yes | `Renigunta` | |
| 4 | Nature of Business | text | No | `Plastic products` | 12+ characters. |
| 5 | Major Products | text | No | `Injection-moulded plastic stools, buckets, mugs and jugs` | |
| | *Card: "AP Technology Upgradation — eligibility"* | | | | |
| 6 | Enterprise size | select | No | `Small` | Options Micro, Small, Medium; drives subsidy hint. |
| 7 | Special category (wholly owned, AP domicile)? | select | No | `Yes` | Yes shows the "Special-category Ownership Proof" upload in Step 13 and raises the rate to 40%. |
| 8 | AP domicile confirmed? | select | No | `Yes` | |
| 9 | Years in operation | number 0 to 100 | No | `8` | |
| 10 | Latest annual turnover (₹ Lakhs) | number | No | `285` | |
| 11 | Entrepreneur full name | text | No | `Gummadi Lakshmi Prasanna` | Cover "Entrepreneur name". |
| 12 | Entrepreneur age | number 18 to 100 | No | `36` | |

Green note (AUTO): "Indicative tech-upgrade subsidy: 40% of FCI, cap ₹400 L · small / special yes."

### Step 2 — Technology upgrade story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Plastic products — injection moulded household goods` | Blank blocks Next. |
| 2 | Short intro — what the unit does | textarea | Yes | `Sri Padmavathi Plastic Industries moulds household plastic stools, buckets and mugs for wholesalers in Tirupati, Chittoor and Nellore districts.` | Blank blocks Next; 30+ characters. |
| 3 | Process of manufacture | textarea | No | `PP and HDPE granules are dried and fed through the loader into the injection moulding machine, moulded in multi-cavity moulds, cooled by the chiller, trimmed and inspected, and finished goods are packed in poly-bags and cartons for dispatch.` | |
| 4 | Existing technology | textarea | No | `Three 15-year-old toggle-type hydraulic moulding machines of 90 to 150 tonne with high power draw, manual material feeding and 6.5% rejection; 48 seconds cycle time for a 16-litre bucket.` | |
| 5 | Proposed technology / upgrade | textarea | No | `Two servo-hydraulic injection moulding machines (150 T and 250 T), a 10 TR water chiller, two hopper-dryer-loader units and two new multi-cavity moulds; all new with one-year OEM warranty and energy meters.` | |
| 6 | Expected productivity / quality / cost gain | textarea | No | `Cycle time falls to 32 seconds, power per kg of moulded product drops about 35%, rejection falls below 2% and monthly capacity doubles from 30,000 to 60,000 pieces.` | AP Tech only. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Plot in the Renigunta industrial area on the Tirupati to Chennai highway, 12 km from Tirupati railway station; Chennai port is 135 km away and granule suppliers at Chennai and Hyderabad deliver in two days.` | |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Three old hydraulic moulding machines will be replaced by two servo-hydraulic injection moulding machines with chiller, loaders and new moulds to double output and cut power use.` | 30+ characters. |
| 2 | Start Date | date | No | `2018-09-05` | Enter before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-12-05` | Not before Start Date. |
| 4 | Tools / process level | text | No | `Servo-hydraulic injection moulding with auto loaders and chiller after upgrade` | |
| 5 | Capacity / throughput (if applicable) | text | No | `60,000 pieces per month after upgrade` | |
| 6 | Existing capacity (before upgrade) | text | No | `30,000 pieces per month` | AP Tech and PMEGP 2nd only. |
| 7 | Capacity utilisation Year 1 (%) | number 0 to 100 | No | `65` | |

Sub-table **Products, share of output and selling price** (Add product; price in ₹ per piece):
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Plastic stools` | `30` | `165` |
| 2 | `Buckets, 16 litre` | `35` | `110` |
| 3 | `Mugs and jugs` | `35` | `38` |

Weighted price = 0.30x165 + 0.35x110 + 0.35x38 = ₹101.3 per piece.

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Wholesale dealers in Tirupati, Chittoor, Nellore and Kadapa districts, private-label orders from Hyderabad supermarket chains, and SHG-run household stores; 14 regular distributors place weekly orders.` | |
| 2 | Demand / footfall note | textarea | No | `Distributors ask for more 16-litre buckets and stools than the present 30,000 pieces a month; two supermarket private-label buyers have requested sample lots.` | |

### Step 6 — Premises
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace | text | Yes | `Own factory shed of 5,500 sq ft with 75 kVA connection, Renigunta industrial area` | Blank blocks Next. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Plot bought in 2018 and shed built on it; sale deed is in the proprietress's name; an 800 sq ft extension is needed for the new machines.` | |
| 3 | Premises — owned / rented | select | No | `Owned` | |
| 4 | Power requirement (HP / kW) — optional | text | No | `90 HP (67 kW) after upgrade, 75 kVA transformer` | |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name | text | No | AUTO prefilled `Gummadi Lakshmi Prasanna`; replace with `Gummadi Lakshmi Prasanna (Proprietress), Sri Padmavathi Plastic Industries` | AUTO copy of Step 1 entrepreneur name. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | masked, 15 | No | `37CPRPG5528L1Z8` | Valid check character. |
| 4 | Firm PAN (optional) | masked, 10 | No | leave blank | Personal PAN (4th letter P) is rejected here. |
| 5 | Udyam registration number (optional) | masked | No | `UDYAM-AP-24-0061937` | |
| 6 | Contact mobile number (optional) | masked, 10 | No | `9701553826` | |
| 7 | Correspondence address | textarea | No | `Plot 27, Industrial Area, Renigunta, Tirupati District, Andhra Pradesh - 517520` | AUTO prefilled `Renigunta, Tirupati`; overwrite. |

### Step 8 — Upgrade project cost (FCI)
Read-only card "Details carried to this schedule": Promoter, Unit `Sri Padmavathi Plastic Industries`, Address, GSTIN `37CPRPG5528L1Z8`.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | Set explicitly. |

Sub-table **Machinery list** (new equipment of the upgrade):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Servo-hydraulic injection moulding machine, 150 tonne` | New | `Hyderabad Injection Systems, Hyderabad` | `1` | `24.50` | 24.50 |
| 2 | `Servo-hydraulic injection moulding machine, 250 tonne` | New | `Hyderabad Injection Systems, Hyderabad` | `1` | `38.00` | 38.00 |
| 3 | `Water chiller 10 TR` | New | `Coolwell Industrial Chillers, Chennai` | `1` | `4.50` | 4.50 |
| 4 | `Hopper dryer with auto loader` | New | `Sri Balaji Polymer Equipments, Chennai` | `2` | `1.75` | 3.50 |
| 5 | `Multi-cavity mould set (16 L bucket and stool)` | New | `Annapurna Tool Room, Hyderabad` | `2` | `9.00` | 18.00 |

Machinery total = 88.50 (AUTO).
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | leave blank | Own plot already held. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `4.00` | Foundations and 800 sq ft shed extension. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `2.00` | Enter the electrical panel and cabling here (label mismatch, see discrepancies). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `1.50` | |
| 6 | Working capital (₹ Lakhs) | number | No | `14.00` | |

**Total Project Cost** (AUTO) must read `₹ 110 Lakhs`. Fixed capital investment (building 4.00 + machinery 88.50 + furniture/utilities 2.00) = 94.50.

### Step 9 — Means of finance (critical)
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Indian Bank, Renigunta branch` | |
| 2 | Interest rate (% per year) | number | No | `10.75` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `72` | |
| 5 | Own contribution (₹ Lakhs) | number | No (guard) | `16.50` | 15% of 110. |
| 6 | AP tech-upgrade subsidy (₹ Lakhs) — % of FCI by size | number | No (guard) | `37.80` | 40% x FCI 94.50. |
| 7 | Bank term loan for P&M (₹ Lakhs) | number | No (guard) | `55.70` | |
| 8 | Other Sources (₹ Lakhs) | number | No | leave blank | |

Grey note (AUTO) will show "Indicative ≈ ₹44 Lakhs (40% / cap ₹400 L)": the app multiplies 40% by the whole project cost 110.00, not by FCI 94.50 (see discrepancies). Either figure passes the guard; use 37.80 for a policy-correct DPR. **Total Finance** must read `₹ 110 Lakhs`.

### Step 10 — Operating cost & sales
Sub-table **Raw materials**:
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `PP copolymer granules` | `Stools, buckets and mugs` | `Truck lots from Chennai dealer on 15-day credit` |
| 2 | `HDPE granules` | `Jugs and bucket handles` | `Monthly lots from Hyderabad supplier` |
| 3 | `Colour masterbatch` | `Product colouring` | `Quarterly purchase from a Chennai trader` |
| 4 | `Poly-bags and cartons` | `Packing` | `Local supplier at Tirupati` |

Sub-table **Staff by role and monthly pay**:
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Machine operator` | `6` | `14000` |
| 2 | `Mould and maintenance technician` | `2` | `20000` |
| 3 | `Quality and packing worker` | `6` | `10000` |
| 4 | `Production supervisor` | `1` | `25000` |
| 5 | `Accounts and dispatch staff` | `2` | `15000` |

Monthly payroll 84,000 + 40,000 + 60,000 + 25,000 + 30,000 = ₹2,39,000; yearly ₹28,68,000 = 28.68 lakh.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `310` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `24` | |
| 3 | Wages (₹ Lakhs) | number | No | `28.68` | |
| 4 | Maintenance (₹ Lakhs) | number | No | `6` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `7.2` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `9.6` | |
| 7 | Annual Production Volume | number (pieces) | No | `468000` | 60,000 x 12 x 65%. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `474.08` | 468,000 x 101.3 = 474.08. Total costs are 385.48. |

### Step 11 — Financial viability
Read-only projection panel (AUTO): Years `6`, 7 checks green, Average DSCR about `6.19` (minimum 5.51), Project IRR about 65%. Tiles: Project cost `₹ 110 Lakhs`, Equity + loan + other `₹ 110 Lakhs`.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `474.08` | `310` | `28.68` | `24` | `51.39` |
| 2 | `497.78` | `325.5` | `30.11` | `25.2` | `56.8` |
| 3 | `522.67` | `341.78` | `31.62` | `26.46` | `62.29` |
| 4 | `548.81` | `358.86` | `33.2` | `27.78` | `67.86` |
| 5 | `576.25` | `376.81` | `34.86` | `29.17` | `73.53` |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `23.9` | Fixed costs 51.48 / (sales 474.08 minus RM+power 334.00 = 140.08) = 36.75% of Year-1 sales (the calculator default), times 65% utilisation = 23.9% of full capacity. |

Form DSCR box (AUTO): "Assumed 7-year term at 12%. Average DSCR: 5.87", not red.

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | date | No | `2027-03-20` | |

Milestones (three fixed rows):
| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | `Order injection moulding machines and moulds` | `2026-12-05` | `2026-12-20` |
| 2 | `Shed extension, foundations and 90 HP power upgrade` | `2026-12-15` | `2027-02-10` |
| 3 | `Installation, trial run and mould trials` | `2027-02-20` | `2027-03-15` |

### Step 13 — Documents & uploads
Eight upload boxes (the last appears because Special category = Yes).
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | file | No | `APTECH_udyam_certificate.pdf` | |
| 2 | New Machinery Quotations / Invoices | file | No | `APTECH_new_machinery_quotations_injection_moulding.pdf` | |
| 3 | List of Existing Machinery | file | No | `APTECH_existing_machinery_list.pdf` | |
| 4 | CA Statement of Upgrade FCI | file | No | `APTECH_CA_statement_upgrade_FCI.pdf` | |
| 5 | AP Domicile Proof | file | No | `APTECH_AP_domicile_proof.pdf` | |
| 6 | Aadhaar / PAN | file | No | `APTECH_aadhaar_pan_GummadiLakshmiPrasanna.pdf` | |
| 7 | Term Loan Sanction (if credit-linked) | file | No | `APTECH_term_loan_sanction_IndianBank.pdf` | |
| 8 | Special-category Ownership Proof (women / SC/ST / BC / PwD / etc.) | file | No | `APTECH_special_category_proof_woman_owned.pdf` | Only when Step 1 Special category = Yes. |

- **Money cross-check:** Project cost = land 0 + building 4.00 + machinery 88.50 + furniture/utilities 2.00 + pre-operative 1.50 + working capital 14.00 = **110.00**. Means of finance = own 16.50 + subsidy 37.80 + bank 55.70 + other 0 = **110.00** (exact). FCI = 4.00 + 88.50 + 2.00 = 94.50; subsidy = 40% x 94.50 = 37.80 (cap ₹400 L for small/special not binding); guard ceiling 75% x 94.50 = 70.88. Own 16.50 / 110.00 = 15%. Debt-equity = 55.70 / (16.50 + 37.80) = 1.03. Term loan 55.70 is below assets plus pre-operative (96.00). Instalment (calculator, 72 months at 10.75%): about ₹1.05 lakh per month, ₹12.64 lakh per year, DSCR 7.01 "Comfortable"; model (6 months moratorium) average DSCR 6.19.
- **Uploads to prepare:** Udyam Certificate: `APTECH_udyam_certificate.pdf`; New Machinery Quotations / Invoices: `APTECH_new_machinery_quotations_injection_moulding.pdf`; List of Existing Machinery: `APTECH_existing_machinery_list.pdf`; CA Statement of Upgrade FCI: `APTECH_CA_statement_upgrade_FCI.pdf`; AP Domicile Proof: `APTECH_AP_domicile_proof.pdf`; Aadhaar / PAN: `APTECH_aadhaar_pan_GummadiLakshmiPrasanna.pdf`; Term Loan Sanction (if credit-linked): `APTECH_term_loan_sanction_IndianBank.pdf`; Special-category Ownership Proof (only when Special category = Yes): `APTECH_special_category_proof_woman_owned.pdf`.
- **Generate & verify:** Check my answers shows 0; Generate DPR proceeds directly. Cover: `DETAILED PROJECT REPORT`, "On", `Upgradation of`, `Sri Padmavathi Plastic Industries`, `under 'AP Technology Upgradation Subsidy'`, District `Tirupati`, Location `Renigunta`, Entrepreneur name `Gummadi Lakshmi Prasanna`. Table of Contents lists exactly 13 sections: Cover & AP eligibility; Technology upgrade story; Location; Unit profile & capacity; Market & offtake; Premises; Applicant / firm; Upgrade project cost (FCI); Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Documents & uploads (shown only after at least one upload). Key numbers: project cost 110, subsidy 37.80, own 16.50, bank 55.70, Year-1 sales 474.08, average DSCR 6.19, 5 machinery rows, 3 product rows, 5 staff roles.
- **Negative / boundary tests:**
  1. Step 9, subsidy `75.00`, bank `18.50` (total 110.00): Generate blocked "Subsidy is more than 75% of the fixed capital cost (₹70.88 lakh). Combined incentives cannot go above that."
  2. Step 9, subsidy `44.00`, bank `49.50` (total 110.00): accepted (matches the on-screen hint) although it is above 40% of FCI; there is no rate check (see discrepancies).
  3. Step 9, bank `55.00` (total 109.30): Generate blocked as funding mismatch of ₹0.70 lakh.
  4. Step 1, Enterprise size `Medium` with Special category `Yes`: hint changes to 30% / cap ₹500 L; set Special category `No` and size `Micro`: hint becomes 20% / cap ₹20 L. Age `17`: range error plus guardian toast.
  5. Step 7, GSTIN `37CPRPG5528L1Z9` (wrong check character): red message and Next refused "Correct these fields before continuing: GSTIN". Mobile `4701553826`: "An Indian mobile number starts with 6, 7, 8 or 9."
  6. Step 4, Commitment Date `2018-01-01` (before Start Date): toast "Commitment Date must be on or after Start Date" and the value is dropped. Step 10, Raw Material Cost `520` (total costs 595.48 against sales 474.08): Generate shows "Your yearly costs (₹595.48 lakh) are higher than your yearly sales (₹474.08 lakh)" and the projection check "Cash never goes negative" may turn red; restore `310` afterwards.
- **Discrepancies spotted:**
  1. The indicative subsidy hint on Step 9 multiplies the rate by the whole project cost (incl. working capital and pre-operative), but the scheme (and the field label) is "% of FCI"; the app shows about ₹44 L while FCI-based is ₹37.80 L.
  2. Only the 75%-of-FCI ceiling is enforced; the size/category rate (20/40/30%) and caps (₹20 L, ₹2 Cr, ₹5 Cr, etc.) are hints only, so an over-rate subsidy (e.g. 44.00) generates.
  3. Enterprise size, special category and AP domicile have no gating: "AP domicile confirmed? = No" or a blank size still generates; mutual exclusivity with AP_EDP is not checkable.
  4. Step 8 is titled "Upgrade project cost (FCI)" but there is no FCI subtotal; working capital and pre-operative sit in the same total.
  5. The `utilitiesAndInfrastructure` input is labelled "Furniture & fixtures (₹ Lakhs)" although the spec calls it other fixed assets / utilities.
  6. Spec Step 12 lists start and end dates; the form has one CoD plus three fixed milestone rows.
  7. Funding must equal cost exactly (0.01 lakh) in `reviewFinance` / `financeGuard`; the data-checks doc and QA brief describe a 1% tolerance.
  8. Data check `dates.order` reads `step4.startDate`, which this form never writes, so it never fires.

---

## 12. AP MSME & Entrepreneur Development Policy 4.0 — new-unit capital subsidy (`AP_EDP`)

**Entry:** `/individual-dpr/create?new=true&scheme=AP_EDP` (or pick the card "AP MSME-EDP 4.0"); the brief title reads "AP MSME & Entrepreneur Development Policy 4.0 (2024–29)"; click **Start DPR steps**. **Total steps:** 13.

**Test persona:** Mr. Muppidi Naga Raju (34, Scheduled Caste, AP domicile) starts **Sri Ramalingeswara Steel Furniture Works**, a new micro unit on APIIC-allotted Plot 41, APIIC Industrial Park, Gannavaram, Krishna district. It makes powder-coated steel almirahs, hostel cots, school bench-desk sets and filing racks for welfare hostels, schools and dealers. Greenfield FCI ₹87.40 lakh, project cost ₹100.00 lakh: own 15%, AP EDP capital subsidy 45% of FCI (micro, special category), SBI term loan for the rest; APIIC land rebate eligible (SC/ST, micro, in an APIIC park).

General notes: ignore AI panel and the "Suggest title"/"Match me" buttons. Money is **₹ Lakhs** unless stated. Dates as yyyy-mm-dd in browser date order. **Next** is blocked only by "Yes" fields and invalid GSTIN / Firm PAN / Udyam / mobile; funding rules apply at **Generate DPR**.

### Step 1 — Cover & AP eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Ramalingeswara Steel Furniture Works` | Cover title (under 56 characters). |
| 2 | District * | select | Yes | `Krishna` | |
| 3 | Location * | select | Yes | `Gannavaram` | |
| 4 | Nature of Business | text | No | `Furniture making` | 12+ characters. |
| 5 | Major Products | text | No | `Steel almirahs, hostel cots, school bench-desk sets and office filing racks` | |
| | *Card: "AP MSME-EDP 4.0 — new-unit eligibility"* | | | | |
| 6 | Enterprise size | select | No | `Micro` | Options Micro, Small, Medium. |
| 7 | Special category (wholly owned, AP domicile)? | select | No | `Yes` | Adds "Special-category Ownership Proof" upload; rate 45%. |
| 8 | SC/ST wholly owned? | select | No | `Yes` | Needed with APIIC park = Yes for the land-rebate upload slot. |
| 9 | AP domicile confirmed? | select | No | `Yes` | |
| 10 | Unit inside an APIIC park / estate? | select | No | `Yes — SC/ST micro/small may get land rebate` | Other option `No`. |
| 11 | Entrepreneur full name | text | No | `Muppidi Naga Raju` | Cover "Entrepreneur name". |
| 12 | Entrepreneur age | number 18 to 100 | No | `34` | |

Green note (AUTO): "Indicative capital subsidy: 45% of FCI, cap ₹45 L · micro / special yes. · APIIC land rebate 75% cap ₹25 L."

### Step 2 — Introduction & process
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Engineering goods — sheet-metal and steel furniture` | Blank blocks Next. |
| 2 | Short intro — what the unit does | textarea | Yes | `Sri Ramalingeswara Steel Furniture Works will make powder-coated steel almirahs, hostel cots and school furniture for government hostels, schools and dealers in the Krishna and NTR districts.` | Blank blocks Next; 30+ characters. |
| 3 | Process of manufacture | textarea | No | `CRCA steel sheets are sheared and punched, bent on the press brake, welded and ground, de-greased and phosphated, powder-coated and cured in the oven, then assembled with locks and fittings, inspected and packed in cartons with corner guards.` | Placeholder: "Process of manufacture for the new greenfield unit". |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Plot 41 in the APIIC Industrial Park at Gannavaram, 4 km from Vijayawada airport and NH-16 with water, 33/11 kV power and internal roads; steel stockists at Vijayawada are 22 km away.` | |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `A new greenfield sheet-metal furniture unit in the APIIC Industrial Park at Gannavaram with shearing, bending, welding and powder-coating lines in one shed.` | 30+ characters. |
| 2 | Start Date | date | No | `2026-11-02` | Project start (new unit). Enter before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-11-25` | Not before Start Date. |
| 4 | Tools / process level | text | No | `Semi-automatic sheet-metal line with powder-coating oven` | |
| 5 | Capacity / throughput (if applicable) | text | No | `4,800 pieces per year (single shift)` | |
| 6 | Capacity utilisation Year 1 (%) | number 0 to 100 | No | `60` | |

Sub-table **Products, share of output and selling price** (Add product; price in ₹ per piece):
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Steel almirah, 2-door` | `40` | `9800` |
| 2 | `Hostel cot, double-decker` | `25` | `7200` |
| 3 | `School bench-desk set` | `20` | `3900` |
| 4 | `Office filing rack` | `15` | `5400` |

Weighted price = 0.40x9,800 + 0.25x7,200 + 0.20x3,900 + 0.15x5,400 = ₹7,310 per piece. (No "Proposed workers" box for AP EDP.)

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Government social-welfare and BC-welfare hostels, Zilla Parishad and private schools, and office-furniture dealers in Krishna, NTR, Eluru and Guntur districts; empanelment for welfare-hostel supply is planned.` | |
| 2 | Demand / footfall note | textarea | No | `Hostel and school furniture is bought in bulk every June and January; Vijayawada dealers have quoted indicative orders of about 1,200 pieces a year.` | |

### Step 6 — Premises & utilities
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace | text | Yes | `APIIC Plot 41 of 1,200 sq m with a 7,200 sq ft production shed, Gannavaram` | Blank blocks Next. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Plot allotted by APIIC on lease-cum-sale basis (allotment letter dated 2026-09-18 in the promoter's name); the shed will be built by the unit.` | |
| 3 | Premises — owned / rented | select | No | `Leased` | |
| 4 | Power requirement (HP / kW) — optional | text | No | `60 HP (45 kW) 3-phase LT connection, 100 kVA transformer` | |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name | text | No | AUTO prefilled `Muppidi Naga Raju`; replace with `Muppidi Naga Raju (Proprietor), Sri Ramalingeswara Steel Furniture Works` | AUTO copy of Step 1 name. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | masked, 15 | No | `37DLWPM3316K1ZG` | Valid check character. |
| 4 | Firm PAN (optional) | masked, 10 | No | leave blank | Individual PAN rejected here. |
| 5 | Udyam registration number (optional) | masked | No | `UDYAM-AP-05-0072164` | |
| 6 | Contact mobile number (optional) | masked, 10 | No | `9885307642` | |
| 7 | Correspondence address | textarea | No | `Door No. 2-61, Ramalingeswara Colony, Gannavaram, Krishna District, Andhra Pradesh - 521101` | AUTO prefilled `Gannavaram, Krishna`; overwrite. |

### Step 8 — Project cost (FCI)
Read-only card "Details carried to this schedule": Promoter, Unit `Sri Ramalingeswara Steel Furniture Works`, Address, GSTIN `37DLWPM3316K1ZG`.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | Set explicitly. |

Sub-table **Machinery list**:
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Hydraulic press brake, 80 tonne, 2.5 m` | New | `Sri Lakshmi Machine Tools, Vijayawada` | `1` | `11.50` | 11.50 |
| 2 | `Sheet shearing machine, 6 ft` | New | `Sri Lakshmi Machine Tools, Vijayawada` | `1` | `6.20` | 6.20 |
| 3 | `Spot welding machine, 25 kVA` | New | `Auto Nagar Welding Supplies, Vijayawada` | `2` | `1.10` | 2.20 |
| 4 | `MIG welding set, 350 A` | New | `Auto Nagar Welding Supplies, Vijayawada` | `3` | `0.85` | 2.55 |
| 5 | `Powder-coating booth with curing oven` | New | `Kakatiya Coating Systems, Hyderabad` | `1` | `9.50` | 9.50 |
| 6 | `Pipe cutting and bending machine` | New | `Sri Lakshmi Machine Tools, Vijayawada` | `1` | `1.85` | 1.85 |
| 7 | `Air compressor, 5 HP` | New | `Auto Nagar Welding Supplies, Vijayawada` | `1` | `1.40` | 1.40 |

Machinery total = 35.20 (AUTO).
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | `18.00` | APIIC allotment value of the plot; the rebate hint uses this. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `28.00` | 7,200 sq ft shed. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `3.50` | Enter the electrical, transformer and utility connection cost here (this input is the generic utilities field, labelled Furniture & fixtures). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `2.00` | |
| 6 | Furniture and fixtures (₹ Lakhs) | number | No | `1.50` | Second furniture-type box, AP EDP only (office furniture). |
| 7 | Security deposits (₹ Lakhs) | number | No | `1.20` | Power and APIIC deposits. |
| 8 | Working capital (₹ Lakhs) | number | No | `10.60` | |

**Total Project Cost** (AUTO) must read `₹ 100 Lakhs`. FCI = land 18.00 + building 28.00 + machinery 35.20 + utilities 3.50 + furniture 1.50 + deposits 1.20 = 87.40.

### Step 9 — Means of finance (critical)
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `State Bank of India, Gannavaram branch` | |
| 2 | Interest rate (% per year) | number | No | `10.5` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `84` | |
| 5 | Own contribution (₹ Lakhs) | number | No (guard) | `15.00` | 15%. |
| 6 | AP EDP capital subsidy (₹ Lakhs) — % of FCI by size | number | No (guard) | `39.33` | 45% x FCI 87.40 = 39.33. |
| 7 | Bank term loan for P&M (₹ Lakhs) | number | No (guard) | `45.67` | |
| 8 | Other Sources (₹ Lakhs) | number | No | leave blank | |

Grey note (AUTO): "Indicative ≈ ₹45 Lakhs (45% / cap ₹45 L) · APIIC land rebate ≈ ₹13.5 L." (45% is applied to the full project cost 100.00, see discrepancies; 39.33 is the FCI-based figure and is the one to enter.) The APIIC land rebate (75% x 18.00 = 13.50, cap 25) has no input field; it is shown as a hint only. **Total Finance** must read `₹ 100 Lakhs`.

### Step 10 — Operating cost & sales
Sub-table **Raw materials**:
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `CRCA steel sheet, 0.8 to 1.2 mm` | `Almirahs, cots and racks` | `Monthly truck lots from Vijayawada steel stockist` |
| 2 | `MS pipes and angles` | `Cots, benches and frames` | `Fortnightly purchase from Auto Nagar dealer` |
| 3 | `Powder-coating powder and phosphating chemicals` | `Surface finish` | `Quarterly order from Hyderabad supplier` |
| 4 | `Locks, hinges and packing cartons` | `Fittings and packing` | `Monthly local purchase` |

Sub-table **Staff by role and monthly pay**:
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Foreman` | `1` | `25000` |
| 2 | `Welder` | `4` | `18000` |
| 3 | `Press-brake and shearing operator` | `2` | `16000` |
| 4 | `Powder-coating operator` | `2` | `14000` |
| 5 | `Helper` | `4` | `10000` |
| 6 | `Store and accounts assistant` | `1` | `15000` |

Monthly payroll 25,000 + 72,000 + 32,000 + 28,000 + 40,000 + 15,000 = ₹2,12,000; yearly ₹25,44,000 = 25.44 lakh.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `122` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `6.5` | |
| 3 | Wages (₹ Lakhs) | number | No | `25.44` | |
| 4 | Maintenance (₹ Lakhs) | number | No | `2.4` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `4.2` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `5` | |
| 7 | Annual Production Volume | number (pieces) | No | `2880` | 4,800 x 60%. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `210.53` | 2,880 x 7,310 = 210.53. Total costs 165.54. |

### Step 11 — Financial viability
Read-only projection panel (AUTO): Years `7`, 7 checks green, Average DSCR about `4.45` (minimum 3.96), Project IRR about 37%. Tiles (AUTO): "Project cost" shows `₹ 97.3 Lakhs` (this tile leaves out furniture 1.50 and deposits 1.20) and "Equity + loan + other" shows `₹ 100 Lakhs`; this visible gap is a known display issue, not a funding error.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `210.53` | `122` | `25.44` | `6.5` | `23.45` |
| 2 | `221.06` | `128.1` | `26.71` | `6.83` | `26.32` |
| 3 | `232.11` | `134.5` | `28.05` | `7.17` | `29.29` |
| 4 | `243.71` | `141.23` | `29.45` | `7.52` | `32.26` |
| 5 | `255.9` | `148.29` | `30.92` | `7.9` | `35.32` |

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `27.1` | Fixed costs 37.04 / (sales 210.53 minus RM+power 128.50 = 82.03) = 45.15% of Year-1 sales (calculator default) x 60% = 27.1% of capacity. |

Form DSCR box (AUTO): "Assumed 7-year term at 12%. Average DSCR: 3.56", not red.

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | date | No | `2027-06-15` | |

Milestones (three fixed rows):
| Row | Activity | Start date | End date |
|---|---|---|---|
| 1 | `Plan approval and civil construction of shed` | `2026-11-25` | `2027-03-31` |
| 2 | `Machinery order, power connection and installation` | `2027-03-01` | `2027-05-20` |
| 3 | `Trial production and CFE/CFO clearances` | `2027-05-25` | `2027-06-10` |

### Step 13 — Documents & uploads
Ten upload boxes (the last two appear because of Step 1 answers).
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | file | No | `APEDP_udyam_certificate.pdf` | |
| 2 | Land / Shed Allotment or Lease | file | No | `APEDP_APIIC_land_allotment_letter_Gannavaram.pdf` | |
| 3 | Single Desk Pollution Clearances (CFE/CFO) | file | No | `APEDP_single_desk_CFE_application.pdf` | |
| 4 | CA-certified FCI Statement | file | No | `APEDP_CA_certified_FCI_statement.pdf` | |
| 5 | AP Domicile Proof | file | No | `APEDP_AP_domicile_proof.pdf` | |
| 6 | Aadhaar / PAN | file | No | `APEDP_aadhaar_pan_MuppidiNagaRaju.pdf` | |
| 7 | Machinery Quotations / Invoices | file | No | `APEDP_machinery_quotations_sheet_metal.pdf` | |
| 8 | Term Loan Sanction (if credit-linked) | file | No | `APEDP_term_loan_sanction_SBI.pdf` | |
| 9 | Special-category Ownership Proof (women / SC/ST / BC / PwD / etc.) | file | No | `APEDP_special_category_proof_SC.pdf` | Only when Special category = Yes. |
| 10 | SC/ST Ownership Proof (APIIC land-rebate claim) | file | No | `APEDP_SC_ownership_proof_land_rebate.pdf` | Only when SC/ST wholly owned = Yes and APIIC park = Yes. |

- **Money cross-check:** Project cost = land 18.00 + building 28.00 + machinery 35.20 + furniture/utilities 3.50 + pre-operative 2.00 + furniture 1.50 + security deposits 1.20 + working capital 10.60 = **100.00**. Means of finance = own 15.00 + subsidy 39.33 + bank 45.67 + other 0 = **100.00** (exact). FCI = 87.40; subsidy = 45% x 87.40 = 39.33 (cap ₹45 L, not binding); guard ceiling 75% x 87.40 = 65.55; land rebate 75% x 18.00 = 13.50, so subsidy plus rebate 52.83 is under the 65.55 combined limit. Own 15.00 / 100.00 = 15%. Debt-equity = 45.67 / (15.00 + 39.33) = 0.84. Term loan 45.67 is below assets plus pre-operative (89.40). Instalment (calculator, 84 months at 10.5%): about ₹0.77 lakh per month, ₹9.24 lakh per year, DSCR 4.87 "Comfortable"; model (6 months moratorium) average DSCR 4.45.
- **Uploads to prepare:** Udyam Certificate: `APEDP_udyam_certificate.pdf`; Land / Shed Allotment or Lease: `APEDP_APIIC_land_allotment_letter_Gannavaram.pdf`; Single Desk Pollution Clearances (CFE/CFO): `APEDP_single_desk_CFE_application.pdf`; CA-certified FCI Statement: `APEDP_CA_certified_FCI_statement.pdf`; AP Domicile Proof: `APEDP_AP_domicile_proof.pdf`; Aadhaar / PAN: `APEDP_aadhaar_pan_MuppidiNagaRaju.pdf`; Machinery Quotations / Invoices: `APEDP_machinery_quotations_sheet_metal.pdf`; Term Loan Sanction (if credit-linked): `APEDP_term_loan_sanction_SBI.pdf`; Special-category Ownership Proof (when Special category = Yes): `APEDP_special_category_proof_SC.pdf`; SC/ST Ownership Proof (when SC/ST wholly owned = Yes and APIIC park = Yes): `APEDP_SC_ownership_proof_land_rebate.pdf`.
- **Generate & verify:** Check my answers shows 0; Generate DPR proceeds directly. Cover: `DETAILED PROJECT REPORT`, "On", `Establishment of`, `Sri Ramalingeswara Steel Furniture Works`, `under 'AP MSME & Entrepreneur Development Policy 4.0 (2024–29)'`, District `Krishna`, Location `Gannavaram`, Entrepreneur name `Muppidi Naga Raju`. Table of Contents lists exactly 13 sections: Cover & AP eligibility; Introduction & process; Location; Unit profile & capacity; Market & offtake; Premises & utilities; Applicant / firm; Project cost (FCI); Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Documents & uploads (appears only after at least one upload). Key numbers: project cost 100, subsidy 39.33, own 15, bank 45.67, Year-1 sales 210.53, average DSCR 4.45, 7 machinery rows, 4 product rows, 6 staff roles.
- **Negative / boundary tests:**
  1. Step 9, subsidy `66.00`, bank `19.00` (total 100.00): Generate blocked "Subsidy is more than 75% of the fixed capital cost (₹65.55 lakh)..."; subsidy `45.00`, bank `40.00` is accepted (matches the on-screen hint but exceeds 45% of FCI; no rate check).
  2. Step 9, own `4.00`, bank `56.67`: Generate blocked "Your own money is 4% of the project cost. The minimum for this scheme is 10%."; the advisory "Your own money is only 4% of the project cost" also appears in the review list.
  3. Step 8, clear the second "Furniture and fixtures" box (0): total cost 98.50 against finance 100.00, so Generate is blocked with a mismatch of ₹1.50 lakh; restore `1.50`. Step 11 tile still shows the 97.3 versus 100 gap even when everything is correct.
  4. Step 1, set "Unit inside an APIIC park / estate?" to `No`: the green note loses the land-rebate line, the Step 13 slot "SC/ST Ownership Proof (APIIC land-rebate claim)" disappears and the rebate text in Step 9 vanishes; set it back to `Yes`. Set Special category to `No`: hint falls to 25% / cap ₹25 L and the special-category upload disappears.
  5. Step 4, Capacity utilisation Year 1 `25`: no field error, but Generate lists "Using only 25% of capacity is low. Banks usually expect 50% to 70%". Value `110`: red range error "Enter a number from 0 to 100." and "Using 110% of capacity is not possible".
  6. Step 7, Udyam `UDYAM-AP-05-007216` (6 digits): red "Udyam number looks like UDYAM-AP-01-0001234" and Next refused ("Correct these fields before continuing: Udyam Registration No."). GSTIN `37DLWPM3316K1ZH`: check-character error.
- **Discrepancies spotted:**
  1. Step 8 shows two similar boxes, "Furniture & fixtures (₹ Lakhs)" (really the generic utilities field `utilitiesAndInfrastructure`) and "Furniture and fixtures (₹ Lakhs)" (`furniture`, AP EDP only); the spec says only furniture and security deposits were added.
  2. Step 11 "Project cost" tile (and Step 18/uploads cost helper) omit furniture and security deposits, so for AP EDP it shows 97.3 while Step 8 total and Step 9 finance are 100.00.
  3. The Step 9 hint applies the 45% rate to the whole project cost (incl. working capital and pre-operative), not FCI; the guard checks only the 75%-of-FCI ceiling, so size/category rates and caps are not enforced.
  4. The APIIC land rebate is only a hint (no input, not in means of finance, not checked against the 75% combined limit); `apEdpLandRebateEligible` also treats a blank enterprise size as eligible.
  5. Special category, SC/ST ownership and AP domicile answers never block (e.g. AP domicile = No still generates).
  6. Spec Step 12 lists start and end dates; the form has one CoD and three fixed milestones.
  7. Funding must equal cost exactly (0.01 lakh) in `reviewFinance` / `financeGuard`; the data-checks doc and QA brief describe a 1% tolerance.
  8. Data check `dates.order` reads `step4.startDate`, which this form never writes, so it never fires.

---

## 13. Emergency Credit Line Guarantee Scheme 5.0 (`ECLGS`)

**Entry:** `/individual-dpr/create?new=true&scheme=ECLGS` (or pick "Emergency Credit Line Guarantee Scheme (ECLGS)"); read the brief and click **Start DPR steps**. **Total steps:** 7 (Step 1 to Step 7; the app does not show sector, location, market, premises or schedule steps for ECLGS).

**Test persona:** Mr. Chintalapati Satyanarayana (52), managing partner of **M/s Sri Lakshmi Ganapathi Rice Industries**, an existing 4 tonne per hour rice mill since 2012 at Tadepalligudem, West Godavari district, producing Sona Masoori raw rice, broken rice and bran. Existing fund-based cash credit limit ₹150 lakh, peak Q4 FY2025-26 outstanding ₹140 lakh, account Standard. He seeks ₹25 lakh additional working-capital term loan under ECLGS 5.0 (20% of 140 = 28.00 is the ceiling), 100% guaranteed, interest 9%, 5 years including a 12-month moratorium. No machinery or land is purchased.

General notes: ignore AI panel and the "Suggest title"/"Match me" buttons. Money is **₹ Lakhs** unless stated. Dates as yyyy-mm-dd in browser date order. **Next** is blocked only by the Step 1 required fields and invalid GSTIN / Firm PAN / Udyam / mobile on Step 3; funding rules apply at **Generate DPR**.

### Step 1 — Cover & existing facility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Lakshmi Ganapathi Rice Industries` | Cover title. |
| 2 | District * | select | Yes | `West Godavari` | |
| 3 | Location * | select | Yes | `Tadepalligudem` | |
| 4 | Nature of Business | text | No | `Rice / flour mill` | 12+ characters. |
| 5 | Major Products | text | No | `Sona Masoori raw rice, broken rice, rice bran` | |
| | *Card: "ECLGS 5.0 — existing WC facility"* | | | | |
| 6 | Existing fund-based WC limit (₹ Lakhs) | number | No | `150` | |
| 7 | Peak Q4 WC outstanding (₹ Lakhs) | number | No | `140` | Drives the 20% ceiling and the bank-loan limit check. |
| 8 | Additional ECLGS WC sought (₹ Lakhs) | number | No | `25` | |
| 9 | Account status | select | No | `Standard (eligible)` | Other options "SMA-1 (confirm with bank)", "Other / not eligible". |
| 10 | Authorised signatory | text | No | `Chintalapati Satyanarayana` | Saved as the entrepreneur name; shown on the cover as "Entrepreneur name". |
| 11 | Why additional liquidity is needed | textarea | No | `Paddy procurement prices rose about 9% this season and Hyderabad buyers now take 45 days to pay, so the 150 lakh cash credit limit stays fully drawn for four months of the year; 25 lakh of additional working capital lets the mill buy paddy at harvest without delaying payment to farmers.` | |

Green note (AUTO): "Indicative quantum 20% ≈ ₹28 L · ROI cap 9% · tenor 5 yrs."

### Step 2 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Existing 4 tonne per hour modern rice mill with boiler-cum-dryer, sheller, polisher and colour sorter running two shifts in the paddy season.` | 30+ characters. |
| 2 | Start Date | date | No | `2012-04-16` | Between 1990 and 2100; enter before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-11-05` | Not before Start Date. |
| 4 | Tools / process level | text | No | `Modern mill with colour sorter, two shifts in season` | |
| 5 | Capacity / throughput (if applicable) | text | No | `4 tonnes of paddy per hour` | |

(No "Capacity utilisation Year 1" or "Proposed workers" box for ECLGS.) Sub-table **Products, share of output and selling price** (Add product; price in ₹ per quintal):
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Sona Masoori raw rice` | `68` | `4350` |
| 2 | `Broken rice` | `12` | `2350` |
| 3 | `Rice bran` | `10` | `2150` |
| 4 | `Rice husk` | `10` | `400` |

Weighted price = 0.68x4,350 + 0.12x2,350 + 0.10x2,150 + 0.10x400 = ₹3,495 per quintal of output.

### Step 3 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name | text | No | AUTO prefilled `Chintalapati Satyanarayana`; replace with `M/s Sri Lakshmi Ganapathi Rice Industries` | AUTO copy of the Step 1 signatory until edited. |
| 2 | Legal status (sole / partnership / company) | text | No | `Partnership firm` | |
| 3 | GSTIN (optional) | masked, 15 | No | `37AAEFS2958Q1ZD` | Valid check character; PAN inside has 4th letter F. |
| 4 | Firm PAN (optional) | masked, 10 | No | `AAEFS2958Q` | Firm PAN accepted. |
| 5 | Udyam registration number (optional) | masked | No | `UDYAM-AP-28-0029481` | |
| 6 | Contact mobile number (optional) | masked, 10 | No | `9848760321` | |
| 7 | Correspondence address | textarea | No | `Door No. 6-24, Eluru Road, Tadepalligudem, West Godavari District, Andhra Pradesh - 534101` | AUTO prefilled `Tadepalligudem, West Godavari`; overwrite. |

### Step 4 — Additional WC need
Read-only card "Details carried to this schedule" (Promoter, Unit `Sri Lakshmi Ganapathi Rice Industries`, Address, GSTIN `37AAEFS2958Q1ZD`). A grey line about hidden heavy capex appears (its wording mentions Mudra; see discrepancies). Optional calculator **Work out working capital**; skip it.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | Set explicitly. |
| 2 | Machinery list | repeating rows (Add machinery) | No | add no rows | Leave empty; any row you add is added to the project cost. |
| 3 | Working capital (₹ Lakhs) | number | No | `25.00` | Land, building, furniture and pre-operative boxes are hidden for ECLGS. |

**Total Project Cost** (AUTO) must read `₹ 25 Lakhs`.

### Step 5 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Union Bank of India, Tadepalligudem branch` | Block "Term loan terms". |
| 2 | Interest rate (% per year) | number | No | `9` | ECLGS cap 9%. |
| 3 | Moratorium (months) | number | No | `12` | |
| 4 | Loan tenure (months) | number | No | `60` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No (guard) | `0` | Margin nil for MSME ECLGS. |
| 6 | Government grant (₹ Lakhs) — usually 0 (guarantee ≠ capital) | number | No (guard) | `0` | |
| 7 | ECLGS working-capital term loan (₹ Lakhs) | number | No (guard) | `25.00` | Must not exceed 20% of Step 1 peak outstanding. |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

Grey note (AUTO): "ECLGS is a guaranteed WCTL... Indicative 20% of peak ≈ ₹28 L · sought 25 · ROI cap 9%." **Total Finance** must read `₹ 25 Lakhs`. Optional calculators "Split the funding" and "Loan instalment and DSCR".

### Step 6 — Operating cost & sales
Sub-table **Raw materials**:
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Paddy (BPT 5204 and MTU 1010)` | `Milling into rice` | `Direct purchase from farmers and Tadepalligudem market yard at harvest` |
| 2 | `HDPE and PP packing bags` | `Packing of rice` | `Monthly order from Eluru bag supplier` |
| 3 | `Rice husk` | `Boiler and dryer fuel` | `Own by-product, topped up from nearby mills` |

Sub-table **Staff by role and monthly pay**:
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Mill manager` | `1` | `30000` |
| 2 | `Boiler, dryer and machine operator` | `4` | `17000` |
| 3 | `Loader and helper` | `8` | `11000` |
| 4 | `Accountant` | `1` | `18000` |
| 5 | `Weighbridge clerk` | `1` | `12000` |

Monthly payroll 30,000 + 68,000 + 88,000 + 18,000 + 12,000 = ₹2,16,000; yearly ₹25,92,000 = 25.92 lakh.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `830` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `22` | |
| 3 | Wages (₹ Lakhs) | number | No | `25.92` | |
| 4 | Maintenance (₹ Lakhs) | number | No | `9` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `12` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `6` | |
| 7 | Annual Production Volume | number (quintals) | No | `27470` | |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `960.08` | 27,470 x 3,495 = 960.08. Total costs 904.92. |

### Step 7 — Documents & uploads
Five upload boxes.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | file | No | `ECLGS_udyam_certificate.pdf` | |
| 2 | GST Returns / ITR | file | No | `ECLGS_GST_returns_ITR_FY2025-26.pdf` | |
| 3 | Bank Statements | file | No | `ECLGS_bank_statements_CC_account_12months.pdf` | |
| 4 | Existing Sanction Letter | file | No | `ECLGS_existing_sanction_letter_CC150L.pdf` | |
| 5 | CA Turnover Certificate | file | No | `ECLGS_CA_turnover_certificate.pdf` | |

- **Money cross-check:** Project cost = additional working capital 25.00 (no land, building, machinery or pre-operative) = **25.00**. Means of finance = own 0 + grant 0 + bank WCTL 25.00 + other 0 = **25.00** (exact). Lending ceiling = 20% x 140 = 28.00; 25.00 is within it (additional WC sought 25 also equals the loan). No minimum own-money or debt-equity rule applies to ECLGS in the app. Instalment (calculator, 60 months at 9%, ignoring moratorium): about ₹0.52 lakh per month, ₹6.23 lakh per year, DSCR 8.86 "Comfortable"; the projection model (12 months moratorium, then 48 months) gives average DSCR 8.78 over 5 years (Year-1 DSCR 18.64 because only interest is due).
- **Uploads to prepare:** Udyam Certificate: `ECLGS_udyam_certificate.pdf`; GST Returns / ITR: `ECLGS_GST_returns_ITR_FY2025-26.pdf`; Bank Statements: `ECLGS_bank_statements_CC_account_12months.pdf`; Existing Sanction Letter: `ECLGS_existing_sanction_letter_CC150L.pdf`; CA Turnover Certificate: `ECLGS_CA_turnover_certificate.pdf`. All five always appear.
- **Generate & verify:** Check my answers shows 0; Generate DPR proceeds directly. Cover: `DETAILED PROJECT REPORT`, "On", `Working Capital Proposal for`, `Sri Lakshmi Ganapathi Rice Industries`, `under 'Emergency Credit Line Guarantee Scheme (ECLGS)'`, District `West Godavari`, Location `Tadepalligudem`, Entrepreneur name `Chintalapati Satyanarayana`. Table of Contents lists exactly 7 sections: Cover & existing facility; Unit profile; Applicant / firm; Additional WC need; Means of finance; Operating cost & sales; Documents & uploads (this one needs at least one uploaded file). Key numbers: existing limit 150, peak outstanding 140, sought 25, project cost 25, bank 25, Year-1 sales 960.08, average DSCR 8.78, 4 product rows, 5 staff roles; no machinery table.
- **Negative / boundary tests:**
  1. Step 4 Working capital `30.00` and Step 5 loan `30.00` (balanced at 30.00): Generate blocked "The bank loan of ₹30.00 lakh is more than the ₹28.00 lakh allowed for 20% of peak working-capital outstanding under ECLGS."
  2. Step 1 Peak Q4 WC outstanding `100` (green note drops to ≈ ₹20 L) with loan `25.00`: Generate blocked "The bank loan of ₹25.00 lakh is more than the ₹20.00 lakh allowed...". Restore `140`.
  3. Step 4 add one machinery row (Qty `1`, Unit cost `5.00`): Total Project Cost becomes ₹30 Lakhs; Generate blocked because funding 25.00 differs from cost 30.00 by ₹5.00 lakh (shows that FCI tables are not hidden); delete the row.
  4. Step 1 Account status `Other / not eligible`, and Additional ECLGS WC sought `40`: both accepted without any message, and the DPR generates (no eligibility gate, no 20% check on "sought").
  5. Step 5 Interest rate `18` and Moratorium `60` with tenure `60`: Generate review list shows "An interest rate of 18% is unusual" and "The grace period (60 months) is as long as, or longer than, the whole loan period". An interest rate of 12% raises nothing although the ECLGS cap is 9%.
  6. Step 3 GSTIN `37AAEFS2958Q1ZE` (wrong check character): red message and Next refused "Correct these fields before continuing: GSTIN"; Firm PAN `AAEPS2958Q` (4th letter P) is refused as an individual PAN. Step 2 Commitment Date `2011-01-01` (before Start Date 2012-04-16): toast "Commitment Date must be on or after Start Date".
- **Discrepancies spotted:**
  1. The spec's Step 2 includes a short operations note (sectorDescription) and year established; the app's "Unit profile" step has the generic activity/dates/tools/capacity/product-mix inputs and no sector or intro field, so ECLGS has no required field after Step 1.
  2. Spec says land and building are hidden because ECLGS has no FCI; the app hides them but still shows the machinery list / asset list on "Additional WC need", and anything entered there inflates the project cost.
  3. The grey line on Step 4 says "Heavy capex tables are hidden for Mudra Shishu / Kishore" for ECLGS too (wording not scheme-specific); the grey note on Step 5 prints the raw field name "governmentGrant".
  4. Account status "SMA-1" and "Other / not eligible" do not block or warn although the spec calls account status a hard gate.
  5. "Additional ECLGS WC sought" is never compared with the 20% quantum or with the bank loan; only the bank loan is checked against 20% of peak outstanding.
  6. Interest cap 9% and tenor 5 years with 1-year moratorium are hints only; 12% interest or an 84-month tenure generate without comment (data checks only flag rates outside 6 to 16% and tenures outside 12 to 180 months).
  7. Funding must equal cost exactly (0.01 lakh) in `reviewFinance` / `financeGuard`; the data-checks doc and QA brief describe a 1% tolerance.
  8. Data check `dates.order` reads `step4.startDate`, which this form never writes, so it never fires.

---

## 14. AP Food Processing Policy 4.0 (`AP_FPP`)
**Entry:** `/individual-dpr/create?new=true&scheme=AP_FPP` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 13. Step titles on screen: Step 1: Cover & eligibility; Step 2: Upgrade / process story; Step 3: Location; Step 4: Unit profile & capacity; Step 5: Market & offtake; Step 6: Premises & utilities; Step 7: Applicant / firm; Step 8: Upgrade project cost; Step 9: Means of finance (critical); Step 10: Operating cost & sales; Step 11: Financial viability; Step 12: Implementation schedule; Step 13: Documents & uploads.
**Test persona:** Kasireddy Hari Krishna Reddy (age 44, MSc Agriculture, managing partner with his brother Kasireddy Sai Prasad) runs **Sri Manikanta Fruit Pulp Industries**, a partnership firm at **Puthalapattu mandal, Chittoor district**. Since June 2020 it has made mango pulp (Totapuri and Banganapalli) in 210 kg aseptic drums for juice makers. The project adds a pasteuriser, a retort pouch line and a 10 MT cold room to sell branded retail pouches. The unit is a Small enterprise on leased premises, not in a special category, not an FPO or SHG. Mandal / village is not an input; it goes only in the Step 7 address.

Conventions for this whole section: **Req?** = blocks Next or Generate in the code. **AUTO** = value the app fills or computes; verify it. Money fields are **₹ Lakhs** unless the label says (₹). Do not click the optional AI / "Fill this step" buttons, "Match me", "Suggest title" or the "Not sure what to enter" calculators; all data below is typed by hand. **Decimal tip:** a few table inputs (machinery unit cost, asset unit cost, Qty) are coded `value={x || ''}`; if a typed leading `0` disappears (as in `0.62`), keep typing and check the box finally reads 0.62 (potential bug, see Discrepancies). Enter Start Date before Commitment Date.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Manikanta Fruit Pulp Industries` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Chittoor` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Puthalapattu` | Town must belong to the district. Options: Chittoor, Palamaner, Nagari, Kuppam, Puthalapattu, Bangarupalem. |
| 4 | Nature of Business | Text input | No | `Mango pulp processing and retort pouch packing` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Totapuri mango pulp, Banganapalli mango pulp, retort pouch pulp` | Data check flags fewer than 3 characters. |
| 6 | Enterprise size | Select (Select / Micro / Small / Medium) | No | `Small` | Stored as `small`. Preview shows "Small". Not used by any subsidy calculation in the code. |
| 7 | Special category | Select (Select / Yes / No) | No | `No` | Stored `no`. Choosing Yes changes nothing else (no extra upload slot, see Discrepancies). |
| 8 | FPO / SHG | Select (Select / Yes / No) | No | `No` |  |
| 9 | AP domicile | Select (Select / Yes / No) | No | `Yes` |  |
| 10 | Premises | Select (Select / Own land / building / Lease / rent / APIIC / industrial park / Other) | No | `Lease / rent` | Stored `lease`. See Discrepancies: this answer is not shown in the preview. |
| 11 | Entrepreneur name | Text input | No | `Kasireddy Hari Krishna Reddy` | Shown on the cover ("Entrepreneur name") and used as "Promoter / applicant" in the schedules of Steps 8-9. |

### Step 2 — Upgrade / process story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Agro and food processing – fruit pulp` | Required: blocks Next. Placeholder "Enter sector type". |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Chittoor district is the largest mango pulp cluster in Andhra Pradesh. The unit buys Totapuri and Banganapalli mangoes from farmers around Puthalapattu and sells aseptic pulp in drums to juice makers. The upgrade adds a pasteuriser, a retort pouch line and a cold room for branded retail packs.` | Required: blocks Next. Data check flags fewer than 30 characters. |

Only these two inputs exist on this step (no executive-summary or process box for AP_FPP; see Discrepancies).

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (expandable) | No | `The unit is 9 km from Chittoor town on the Chittoor–Tirupati road, about 150 km from Chennai port and 160 km from Bengaluru. Mango orchards within 40 km supply fruit from April to July, and refrigerated trucks reach Chennai markets overnight.` | Placeholder "Site, roads, nearby markets — brief feasibility note". |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `Season-based mango pulping for about 90 days a year with 12 workers. Pulp is filled hot into 210 kg aseptic drums and sold to juice makers in Chennai and Bengaluru.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2020-06-01` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-09-21` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Semi-automatic: pulper-finisher, tubular steam heater and manual drum filling` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `2 MT of pulp per hour; 180 MT per season` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Totapuri mango pulp (210 kg aseptic drum)` | `60` | `85` |
| 2 | `Banganapalli mango pulp (210 kg aseptic drum)` | `25` | `105` |
| 3 | `Mango pulp retort pouch (1 kg)` | `15` | `130` |

Selling price unit used in this test: ₹ per kg. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `Juice and beverage makers in Chennai and Bengaluru, ice cream makers and, from this project, modern retail chains and institutional kitchens in Tirupati and Vijayawada.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `Buyers have asked for 1 kg and 5 kg retort pouches. Two Chennai dairies placed trial orders for 12 MT in 2025 that the unit could not pack in pouches.` |  |

### Step 6 — Premises & utilities
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Leased processing shed, Puthalapattu` | Required: blocks Next. Placeholder "Shop or shed name / brief description". |
| 2 | Premises note (own / lease / rent) | Textarea (expandable) | No | `Registered nine-year lease of 0.60 acre with a 6,400 sq.ft. shed at Puthalapattu; rent ₹38,000 per month; lease deed dated 2024-02-12.` |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | `75 HP three-phase` | Stored as `powerRequirements`. See Discrepancies: this answer is not listed in the preview. |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Manikanta Fruit Pulp Industries` | AUTO: the box is already pre-filled with exactly this text (copied from the unit name in Step 1); verify it and leave it. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Partnership firm` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37AAFFM4821K1Z4` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 8-9). |
| 4 | Firm PAN (optional) | Text input, masked | No | `AAFFM4821K` | Firm PAN: 4th letter must NOT be P (personal PAN is rejected). This value has 4th letter F. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-06-0034821` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9440218735` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `Plot 214/3, Industrial Area, Puthalapattu, Chittoor district, Andhra Pradesh – 517 126` | AUTO: starts as "<Location>, <District>" (for example "Puthalapattu, Chittoor"); replace it with the full address. |

### Step 8 — Upgrade project cost
Top of the step shows a read-only block "Details carried to this schedule" (Promoter / applicant, Unit, Address, GSTIN) and a button "Work out working capital" (optional).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Making things` | Auto-guess is usually "Making things" for this text; still select it explicitly so the machinery table is shown. |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number input | No | `0` | 0: leased premises, no land purchase. |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number input | No | `12` | Shed extension and cold-room civil work. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number input | No | `4.5` | Saved as "utilitiesAndInfrastructure" (the preview calls it "Utilities & Infrastructure"). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | `2.5` | Written off over 5 years in the finance model. |
| 6 | Working capital (₹ Lakhs) | Number input | No | `14` | The "Work out working capital" calculator is optional; type the figure. |


**Machinery list (starts empty: click "Add machinery" once per row; Condition select = New / Used)**

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Fruit washing and roller sorting conveyor` | `New` | `Sri Lakshmi Food Engineers, Coimbatore` | `1` | `3.8` | 3.80 |
| 2 | `Pulper-finisher (SS 304, 2 MT per hour)` | `New` | `Shree Ganesh Agro Machinery, Rajkot` | `1` | `6.5` | 6.50 |
| 3 | `Tubular pasteuriser with steam heat exchanger` | `New` | `Sri Lakshmi Food Engineers, Coimbatore` | `1` | `9.2` | 9.20 |
| 4 | `Retort pouch filling and sealing machine` | `New` | `Hosur Packaging Systems, Hosur` | `1` | `4.6` | 4.60 |
| 5 | `Biomass steam boiler (300 kg per hour)` | `New` | `Thermax dealer, Vijayawada` | `1` | `5.4` | 5.40 |
| 6 | `Cold room (10 MT, panel type)` | `New` | `Blue Star dealer, Tirupati` | `1` | `7.5` | 7.50 |

Machinery total = 37.00 lakh. AUTO: as soon as any row has a description or unit cost the hidden "machinery" amount is set to this total (the direct machinery input is hidden for these schemes), so it is included in "Total Project Cost".

AUTO – "Total Project Cost" at the bottom must read **₹ 70 Lakhs** (0 + 12 + 37 + 4.5 + 2.5 + 14).

### Step 9 — Means of finance (critical)
Top shows the same "Details carried to this schedule" block and two optional buttons ("Split the funding", "Loan instalment and DSCR").

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `State Bank of India, Chittoor main branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `10.75` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `6` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `84` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `17.5` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `13` | Test value is about 24% of the fixed capital (building 12 + furniture 4.5 + machinery 37 = 53.5; 25% would be 13.38). The app has no FPP grant formula or cap; the line is simply a source of funds. |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `39.5` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" at the bottom must read **₹ 70 Lakhs** and equal the project cost exactly (hundredths of a lakh).

### Step 10 — Operating cost & sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Mango – Totapuri and Banganapalli` | `Fruit for pulp` | `Bought direct from farmers and Puthalapattu mandi in season` |
| 2 | `Aseptic bags and 210 kg drums` | `Bulk packing` | `Annual rate contract with a Hosur supplier` |
| 3 | `Retort pouches and cartons` | `Retail packing` | `Ordered quarterly from a Chennai converter` |
| 4 | `Citric acid and ascorbic acid` | `Preservation` | `Bought monthly from an Anakapalli distributor` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Plant manager` | `1` | `28000` |
| 2 | `Production supervisors` | `2` | `18000` |
| 3 | `Machine operators` | `6` | `13500` |
| 4 | `Helpers and loaders` | `10` | `9500` |
| 5 | `QC chemist` | `1` | `22000` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | `104` | Mango fruit about 80.0 plus drums, pouches, cartons and chemicals about 24.0. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `6` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `15.72` | Annual: ₹2,62,000 a month x 6 season months = ₹15.72 lakh (the unit runs about six months a year). |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `2.4` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `3` |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `4` |  |
| 7 | Annual Production Volume | Number input | No | `180000` | Unit used in this test: kg of pulp.  |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `174.15` | Matches product mix: volume x weighted price. |

Operating check: yearly costs 135.12 lakh against sales 174.15 lakh, so no "costs higher than sales" note (EBITDA 39.03 lakh).

### Step 11 — Financial viability
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Years (select in "Projected financial statements" panel) | Select 5 / 6 / 7 | No | `leave default` | AUTO: default = ceil(loan tenure / 12) = 7 years. All the assumption boxes (Yearly sales growth 5, Yearly cost increase 5, Income tax rate 25, Discount rate 12, Building depreciation 10, Machinery depreciation 15, Furniture depreciation 10) are optional: leave the defaults so the expected numbers below hold. |
| 2 | Year table: Year 1 to Year 5 (Sales, RM, Wages, Power, Net profit) | Number inputs, 5 rows x 5 columns | No | see sub-table below | Rows start prefilled for Year 1 only from the Operating cost step; type every cell anyway (typing in any cell saves all five rows). |
| 3 | Break-even (capacity %) | Number input | No | `57.71` | Equals the "Break-even" tile of the projected statements panel (57.71% of revenue). Data check flags above 100. |


**Year table (₹ Lakhs). Sales / RM / Wages / Power grow 5% a year from the Operating cost step; Net profit = model PAT of the panel**

| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| Year 1 | `174.15` | `104.00` | `15.72` | `6.00` | `20.35` |
| Year 2 | `182.86` | `109.20` | `16.51` | `6.30` | `22.86` |
| Year 3 | `192.00` | `114.66` | `17.33` | `6.62` | `25.44` |
| Year 4 | `201.60` | `120.39` | `18.20` | `6.95` | `28.05` |
| Year 5 | `211.68` | `126.41` | `19.11` | `7.29` | `30.71` |


AUTO – verify the panel shows (with the defaults): Project cost tile ₹ 70 Lakhs and "Equity + loan + other" tile ₹ 70 Lakhs; all seven integrity checks ticked green (funding equals cost exactly, balance sheet balances, cash never negative, average DSCR 1.50 or more, own money at the scheme minimum, debt within debt-equity ceiling); Average DSCR **4.43** (minimum 3.94); Project IRR 45.41%; Equity IRR 148.69%; NPV at 12% ₹102.86 lakh; Payback 2.21 years; Break-even 57.71%. The older "DSCR (profit + depreciation vs EMI)" box also appears (assumes a 7-year loan at 12%).

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date input | No | `2027-04-05` | No date validation on this field. |


**Milestones (3 rows are shown by default with the placeholder activities "Machinery order / installation", "Power connection", "Trial run"; there is no add-row button, so overwrite these three)**

| Row | Activity (placeholder "Activity") | Start date | End date |
|---|---|---|---|
| 1 | `Order, deliver and install pasteuriser, retort line and cold room` | `2026-11-02` | `2027-02-15` |
| 2 | `Power load increase to 75 HP and boiler licence` | `2026-12-01` | `2027-01-20` |
| 3 | `Trial run, FSSAI licence update and first retort pouch batches` | `2027-02-22` | `2027-03-31` |


### Step 13 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_udyam_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | FSSAI Licence | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_fssai_licence.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | CFE / CFO | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_cfe_cfo_consent.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 4 | Machinery Quotations | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_machinery_quotations.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 5 | CA FCI Statement | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_ca_fci_statement.pdf` | Always shown (AP_EDP / AP_TECH show a special-category slot when "Special category" = Yes; AP_FPP does not). |
| 6 | AP Domicile Proof | File (.pdf .doc .docx .jpg .jpeg .png) | No | `FPP_ap_domicile_proof.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = land 0.00 + building 12.00 + furniture & fixtures 4.50 + machinery 37.00 (3.80 + 6.50 + 9.20 + 4.60 + 5.40 + 7.50) + pre-operative 2.50 + working capital 14.00 = **₹70.00 lakh**. Means of finance = own 17.50 + grant 13.00 + bank loan 39.50 + other 0.00 = **₹70.00 lakh** (difference 0.00; the code needs an exact match, stricter than the brief's 1%). Own money 17.50 / cost = 25.00% (minimum 10% applies because a loan exists); debt-equity = 39.50 / (17.50 + 13.00) = 1.30 (ceiling 3.00). Indicative FCI subsidy check (not computed by the app): FCI 53.50 x 25% = 13.38, test grant 13.00. Repayment months = 84 - 6 = 78; EMI at 10.75% = 0.71 lakh a month (about ₹70,595), 8.47 lakh a year. Loan 39.50 is below the 53.50 of assets and set-up costs, so no "term loan too high" note; working-capital figure 14.00 is not funded by a WC loan, so no WC note. Sales check: 180,000 kg x weighted price 96.75 = 174.15 lakh.
- **Uploads to prepare:** Udyam Certificate -> `FPP_udyam_certificate.pdf`; FSSAI Licence -> `FPP_fssai_licence.pdf`; CFE / CFO -> `FPP_cfe_cfo_consent.pdf`; Machinery Quotations -> `FPP_machinery_quotations.pdf`; CA FCI Statement -> `FPP_ca_fci_statement.pdf`; AP Domicile Proof -> `FPP_ap_domicile_proof.pdf`. All six slots are always shown; none is conditional and none is required.
- **Generate & verify:** Review: no "Must fix first" items and no advisory notes (the Check my answers button shows no count). The live preview and the final DPR have **13 sections**, titled as the 13 steps, after a cover and a "Table of Contents" (a section appears only if it has answers). Cover: kicker "DETAILED PROJECT REPORT", "On", "Establishment of", unit name `Sri Manikanta Fruit Pulp Industries`, "under 'AP Food Processing Policy 4.0 (2024–29)'", then District Chittoor, Location Puthalapattu, Entrepreneur name Kasireddy Hari Krishna Reddy. Step 1 section lists Enterprise size Small, Special category No, FPO / SHG No, AP domicile Yes, Entrepreneur name (Premises is missing, see Discrepancies). Step 8 lists Land 0, Building / shed 12, Utilities & Infrastructure 4.5, Machinery / equipment 37, Working capital 14 and the six-row machinery list; Step 9 lists 17.5 / 13 / 39.5 / 0 and the bank terms; Step 11 shows the "Projected results" table (Year 1 to Year 7) with Revenue 174.15 in Year 1 and the "Returns and ratios" table (average DSCR 4.43). Step 12 shows CoD 2027-04-05 and the 3 milestones. Step 13 lists the 6 uploads as "Uploaded". Generate DPR redirects to the DPR view; PDF and DOCX downloads carry the same numbers.
- **Negative / boundary tests:**
  1. Step 9: Bank Loan `40.5` (funding 71.00 vs cost 70.00) -> blocker "The funding adds up to ₹71.00 lakh but the project cost is ₹70.00 lakh. They must match exactly (difference ₹1.00 lakh).". Generate DPR is refused with "The DPR cannot be generated yet. Fix the items marked "Must fix first"".
  2. Step 9: Promoter `5`, Bank Loan `52` (grant 13, total still 70.00) -> blockers: "Your own money is 7.14% of the project cost. The minimum for this scheme is 10%.". Debt-equity here is 52 / 18 = 2.89, so only the 10% rule fires.
  3. Step 9: Promoter `10`, Grant `5`, Bank Loan `55` (total 70.00, own 14.29%) -> blocker "Bank debt is 3.67 times your own money plus subsidy. The most allowed is 3 to 1.".
  4. Step 9: Grant `40` and Bank Loan `12.5` (total 70.00) -> no FPP cap exists, so there is no blocker. Only the advisory appears ("The subsidy is 57.14% of the project cost. Subsidy rates under most schemes are well below half."), then own money 25% passes. Shows the missing FPP grant limit.
  5. Step 4: Commitment Date `2020-01-01` (before Start Date 2020-06-01) -> toast "Commitment Date must be on or after Start Date" and the date is not stored; Start Date `1985-03-01` -> toast "Enter a valid date between 1990 and 2100".
  6. Step 7: Firm PAN `BKTPR4821M` (4th letter P) -> inline "This looks like an individual’s PAN..." error and Next is blocked ("Correct these fields before continuing: Firm PAN"); GSTIN `37AAFFM4821K1Z5` (wrong check character) -> "The last character does not match..."; mobile `5440218735` -> "An Indian mobile number starts with 6, 7, 8 or 9". Also clear Unit / Project Name on Step 1 and press Next -> "Fill the required fields before continuing: Unit / Project Name".
- **Discrepancies spotted:**
  1. `AP_FPP_EXTRA_FIELDS` and the spec list `processOfManufacture` and `installedCapacity`, but the form has no control for either on Step 2 or Step 4 for AP_FPP (Step 2 "Upgrade / process story" is only Sector type and Short intro). Step 4 capacity feeds `productionCapacity` only.
  2. Spec says Step 1 size / special-category / FPO-SHG inputs drive an "indicative grant", but no FPP grant line, cap or percentage exists anywhere in the code (AP_TECH / AP_EDP show one). The grant is a free number; AP_FPP is not in the 75%-of-FCI grant cap that `rules.ts` applies to AP_EDP and AP_TECH_UPGRADE.
  3. Premises (`premisesType`) is asked on Step 1 but is in the preview skip list (`skipOnStep1`) and is never added on another step, so the answer never appears in the DPR. The Step 6 "Premises — owned / rented" dropdown that older schemes have is not shown for AP_FPP.
  4. Step 6 "Power requirement" is saved to `powerRequirements`, but the field list the preview uses for the premises section has no such field, so it does not appear in the preview or PDF.
  5. Uploads: `Special category` = Yes adds a proof slot for AP_EDP and AP_TECH_UPGRADE but not AP_FPP, although AP_FPP policy benefits depend on special-category ownership.
  6. Step 7: the label "Firm / proprietor name *" shows an asterisk but `missingIndividualRequired` has no rule for this applicant step; and the auto-fill uses the unit name (AP_FPP is not in `LEAN_FIRM` in `contextReuse.ts`, so the proprietor name is not used).
  7. Preview labels differ from form labels: Step 8 form says "Furniture & fixtures (₹ Lakhs)" but the preview says "Utilities & Infrastructure (₹ Lakhs)"; Step 9 form says "Promoter contribution / equity" but the preview says "Own / promoter contribution".
  8. `dataChecks.ts` rule `dates.order` reads `step4.startDate`, but the form stores Start Date as `yearOfEstablishment`, so it never fires (and its logic is the opposite of the form rule).

## 15. AP Chief Minister's Entrepreneur Programme (AP CMEP) (`AP_CMEP`)
**Entry:** `/individual-dpr/create?new=true&scheme=AP_CMEP` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 13. Step titles on screen: Step 1: Cover & eligibility; Step 2: Executive summary & process; Step 3: Location; Step 4: Unit profile & capacity; Step 5: Market & offtake; Step 6: Premises & utilities; Step 7: Applicant / firm; Step 8: Upgrade project cost; Step 9: Means of finance (critical); Step 10: Operating cost & sales; Step 11: Financial projections (actuals and estimates); Step 12: Implementation schedule; Step 13: Documents & uploads.
**Test persona:** Pothuri Naga Durga Bhavani (age 38, B.Com, woman entrepreneur) is setting up **Sri Durga Handloom Fabrics**, a sole proprietorship at **Mangalagiri, Guntur district**. Since 2022 she has woven cotton fabric on three home looms for local master weavers. The project is a credit-linked manufacturing unit with 12 semi-automatic looms, warping, winding and hank dyeing in a rented 3,600 sq.ft. shed, a ₹40.00 lakh bank term loan and an expected CMEP subsidy (woman booster). This is the longest pack: it also has the cost-phasing table, the detailed machinery list, the working-capital build-up, the 3 + 8 year projection grid and the bank sections. The planning year is 2026-27, so the projection grid shows previous years 2023-2024 to 2025-2026 and projected years 2026-2027 to 2033-2034 (the labels follow the browser date; on another date they shift).

Conventions as in 14. Extra for this scheme: the Step 8 (cost) inputs are interdependent. **Fill in the order given** (machinery list, then working-capital build-up, then the cost-phasing table) so the totals stay consistent; see Discrepancies 3.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Durga Handloom Fabrics` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Guntur` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Mangalagiri` | Town must belong to the district. Options: Guntur, Tenali, Ponnur, Mangalagiri, Tadepalli, Prathipadu, Vatticherukuru. |
| 4 | Nature of Business | Text input | No | `Handloom and power-assisted cotton fabric manufacturing` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Cotton dress material, handloom sarees, dyed cotton yardage` | Data check flags fewer than 3 characters. |
| 6 | Activity band | Select (Select / Manufacturing / Knowledge / service enterprise) | No | `Manufacturing` | Stored `manufacturing`. |
| 7 | Booster category | Select (Select / General (no booster) / Woman entrepreneur / PwD / Ex-serviceman / Transgender) | No | `Woman entrepreneur` | Stored `woman`. |
| 8 | AP domicile | Select (Select / Yes / No) | No | `Yes` |  |
| 9 | Entrepreneur name | Text input | No | `Pothuri Naga Durga Bhavani` | Shown on the cover and used as "Promoter / applicant" in the Step 8-9 schedules. |
| 10 | Urban or rural | Select (Select / Urban / Rural) | No | `Urban` |  |
| 11 | EDP training | Select (Select / EDP completed / EDP still pending) | No | `EDP completed` | Stored `completed`. Preview prints the raw word `completed` (see Discrepancies). |
| 12 | Earlier government subsidy | Select (Select / Yes / No) | No | `No` |  |
| 13 | Only one person in the family for this scheme | Select (Select / Yes / No) | No | `Yes` |  |

### Step 2 — Executive summary & process
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Handloom and textiles – cotton fabric manufacturing` | Required: blocks Next. Placeholder "Enter sector type". |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Mangalagiri in Guntur district is a well known centre for handloom cotton fabric and sarees. The unit will weave, dye and sell cotton dress material and sarees to wholesalers and boutiques.` | Required: blocks Next. Data check flags fewer than 30 characters. |
| 3 | Executive summary | Textarea (expandable, in an indigo box) | No | `Sri Durga Handloom Fabrics is a new woman-owned manufacturing unit at Mangalagiri with 12 semi-automatic looms plus warping, winding and dyeing facilities. The project costs ₹64.44 lakh, funded by ₹14.68 lakh own money, ₹9.76 lakh subsidy and a ₹40.00 lakh bank term loan, and will employ 21 people.` | Data check flags fewer than 40 characters. The figures quoted must match Steps 8-9 (64.44 / 14.68 / 9.76 / 40.00). |
| 4 | Process of manufacture | Textarea (expandable) | No | `Cotton yarn is hank-dyed, wound on pirns, warped on the sectional warping machine and woven on the semi-automatic looms. The fabric is then inspected, folded, calendered and packed in poly covers before dispatch to wholesale buyers.` | Data check flags fewer than 40 characters and a copy of another answer. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (expandable) | No | `The unit stands in a rented 3,600 sq.ft. industrial shed on the Mangalagiri–Tadepalli road, 18 km from Guntur and 14 km from Vijayawada railway station. Yarn comes from Tirupur, Salem and Guntur dealers, and fabric is sold in the Vijayawada and Hyderabad markets.` | Placeholder "Site, roads, nearby markets — brief feasibility note". |

### Step 4 — Unit profile & capacity
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The promoter has woven cotton fabric on three home looms since 2022 and sells through local master weavers. The new unit scales this to twelve semi-automatic looms with its own dyeing and warping.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2026-06-15` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-08-20` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Semi-automatic power looms with sectional warping and hank dyeing` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `360 metres of fabric per day on one shift` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |
| 6 | Number of looms / machines | Number input | No | `12` | Shown after the product mix table. |
| 7 | Shifts per day | Number input | No | `1` |  |

Order on screen: the five text/date inputs, then the product-mix editor, then these two number inputs.

**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Cotton dress material` | `55` | `210` |
| 2 | `Handloom-style cotton sarees (price per metre equivalent)` | `30` | `260` |
| 3 | `Dyed cotton yardage` | `15` | `215` |

Selling price unit used in this test: ₹ per metre. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

Weighted price = 0.55 x 210 + 0.30 x 260 + 0.15 x 215 = ₹225.75 per metre (Step 10 uses ₹226).

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `Wholesale textile merchants in Vijayawada and Hyderabad, saree boutiques in Guntur and school-uniform tailors.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `Two Vijayawada wholesalers have given written enquiries for 4,000 metres a month of cotton dress material, and boutique owners ask for dyed yardage that local weavers cannot supply regularly.` |  |

### Step 6 — Premises & utilities
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Rented weaving shed, Mangalagiri` | Required: blocks Next. Placeholder "Shop or shed name / brief description". |
| 2 | Premises note (own / lease / rent) | Textarea (expandable) | No | `Rented industrial shed of 3,600 sq.ft. on a registered five-year lease from a private owner at Mangalagiri; rent ₹25,000 per month.` |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | `25 HP three-phase` | Stored as `powerRequirements`. See Discrepancies: this answer is not listed in the preview. |
| 4 | Workshop area (sq.ft.) | Number input | No | `3600` | Total built-up area. |
| 5 | Production floor (sq.ft.) | Number input | No | `2400` |  |
| 6 | Storage / packing area (sq.ft.) | Number input | No | `800` |  |
| 7 | Office area (sq.ft.) | Number input | No | `400` | 2,400 + 800 + 400 = 3,600, equal to the workshop area. |
| 8 | Lease period (years) | Number input | No | `5` |  |
| 9 | Water use and dye wastewater | Textarea | No | `Dyeing uses about 2,000 litres of water a day. Dye wastewater goes to a settling and neutralising tank before it is sent to the municipal drain, and only azo-free reactive dyes are used.` |  |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Durga Handloom Fabrics` | AUTO: the box is already pre-filled with exactly this text (copied from the unit name in Step 1); verify it and leave it. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Sole proprietorship` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37BKTPP4821M1ZC` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 8-9). |
| 4 | Firm PAN (optional) | Text input, masked | No | (leave blank) | Leave blank: a sole proprietor has only a personal PAN (4th letter P), which the app refuses to store. Typing a P-type PAN here shows an error. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-11-0071538` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9848076215` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `D.No. 5-62, Ramalayam Street, Mangalagiri, Guntur district, Andhra Pradesh – 522 503` | AUTO: starts as "<Location>, <District>" (for example "Mangalagiri, Guntur"); replace it with the full address. |


**Promoters (one row is shown by default; every box is a plain text input; "Add promoter" is optional and not used)**

| Row | Name | Father's / husband's name | Age | Date of birth | Education | Experience (years) | Phone | Residential address |
|---|---|---|---|---|---|---|---|---|
| 1 | `Pothuri Naga Durga Bhavani` | `Pothuri Venkata Subba Rao` | `38` | `1988-07-14` | `B.Com` | `9` | `9849123450` | `D.No. 5-62, Ramalayam Street, Mangalagiri, Guntur district – 522 503` |


Placeholders are used as labels in this table (the boxes have no separate labels). Age 38 agrees with date of birth 1988-07-14 on 2026-10-16.

### Step 8 — Upgrade project cost
Top of the step: read-only "Details carried to this schedule" block and the optional "Work out working capital" button. For AP_CMEP the business-kind picker is not shown and Land, Building, Machinery and Working capital have no separate inputs; they come from the three editors below.

**8a. Machinery list first** (detailed boxes; start empty, "Add machinery" per row):

**Machinery list (starts empty: click "Add machinery" once per row; Condition select = New / Used)**

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | GST (₹ Lakhs) | Transport (₹ Lakhs) | Installation (₹ Lakhs) | Expected life (years) | Yearly maintenance (₹ Lakhs) | Row total (qty × (unit + GST + transport + installation)) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `Semi-automatic power loom (60 inch)` | `New` | `Sri Venkata Sai Textile Machinery, Salem` | `12` | `1.5` | `0.27` | `0.03` | `0.05` | `15` | `0.04` | 22.20 |
| 2 | `Sectional warping machine` | `New` | `Sri Venkata Sai Textile Machinery, Salem` | `1` | `4.2` | `0.76` | `0.12` | `0.1` | `15` | `0.12` | 5.18 |
| 3 | `Pirn winding machine (12 spindle)` | `New` | `Lakshmi Winding Works, Coimbatore` | `2` | `0.85` | `0.15` | `0.02` | `0.03` | `12` | `0.05` | 2.10 |
| 4 | `Hank dyeing machine` | `New` | `Lakshmi Winding Works, Coimbatore` | `1` | `3.1` | `0.56` | `0.08` | `0.1` | `12` | `0.1` | 3.84 |
| 5 | `Hydro-extractor and yarn drying frame` | `New` | `Lakshmi Winding Works, Coimbatore` | `1` | `1.2` | `0.22` | `0.03` | `0.04` | `10` | `0.05` | 1.49 |
| 6 | `Diesel generator set (25 kVA)` | `New` | `Kirloskar dealer, Vijayawada` | `1` | `3.4` | `0.61` | `0.1` | `0.12` | `15` | `0.15` | 4.23 |

Machinery total = 39.04 lakh. AUTO: as soon as any row has a description or unit cost the hidden "machinery" amount is set to this total (the direct machinery input is hidden for these schemes), so it is included in "Total Project Cost".

**8b. Working capital build-up second** (box "Working capital buildup"; each entry rewrites Working capital):
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw material stock (₹ Lakhs) | Number input | No | `4` | About 20 days of yarn and dyes. |
| 2 | Work in progress (₹ Lakhs) | Number input | No | `1.5` |  |
| 3 | Finished goods (₹ Lakhs) | Number input | No | `2.5` |  |
| 4 | Receivables (₹ Lakhs) | Number input | No | `6` | About 15 days of credit sales. |
| 5 | Supplier credit (₹ Lakhs) | Number input | No | `2` | Subtracted. |
| 6 | Cash (₹ Lakhs) | Number input | No | `1` |  |

AUTO: Working capital = 4.00 + 1.50 + 2.50 + 6.00 + 1.00 - 2.00 = **13.00** (stored in the hidden working-capital amount).

**8c. Cost already incurred and still to be incurred** (table "Particulars / Already incurred / To be incurred / Total"; Total column is AUTO). Enter after 8a and 8b; the Machinery and Working capital rows must be given the same totals, otherwise the table overwrites the totals from 8a / 8b:

**Cost already incurred and still to be incurred (₹ Lakhs)**

| Particulars | Already incurred | To be incurred | Total (AUTO) | Notes |
|---|---|---|---|---|
| Land | `0` | `0` | 0.00 | Leased premises: nothing. |
| Building / shed | `3` | `5` | 8.00 | Shed flooring, roof sheets, partitions and the dye wastewater tank. |
| Machinery / equipment | `6` | `33.04` | 39.04 | 6.00 advance paid to the loom supplier; must total 39.04 (= 8a). |
| Furniture and fixtures | `0.5` | `1.5` | 2.00 | Desks, racks, cutting and folding tables. |
| Security deposits | `1.2` | `0` | 1.20 | Power deposit and three months of rent deposit. |
| Working capital | `0` | `13` | 13.00 | Must total 13.00 (= 8b). |


**8d. Remaining inputs in the grid below the editors** (the grid also shows two fields that the phasing table does not cover):
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Furniture & fixtures (₹ Lakhs) | Number input | No | `0` | Leave empty / 0. This is a second furniture-labelled input (saved as "utilitiesAndInfrastructure") that is added to the total on top of the phasing-table furniture; entering furniture here as well would double count (see Discrepancies 4). |
| 2 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | `1.2` | Registration, consultancy and trial costs; written off over 5 years in the finance model. |

AUTO – "Total Project Cost" must read **₹ 64.44 Lakhs** (land 0 + building 8.00 + machinery 39.04 + utilities 0 + pre-operative 1.20 + working capital 13.00 + furniture 2.00 + deposits 1.20).

### Step 9 — Means of finance (critical)
Top: "Details carried to this schedule" block and optional buttons "Split the funding" / "Loan instalment and DSCR".

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Cash credit / working capital limit (₹ Lakhs) | Number input | No | `10` | In the "Term loan and subsidy terms" box. Information only: it is not part of the means-of-finance total. |
| 2 | Bank name | Text input | No | `State Bank of India, Mangalagiri branch` |  |
| 3 | Interest rate (% per year) | Number input | No | `10.5` |  |
| 4 | Moratorium (months) | Number input | No | `6` |  |
| 5 | Loan tenure (months) | Number input | No | `84` |  |
| 6 | Subsidy rate (%) | Number input | No | `25` | Information only (illustrative rate; confirm the live CMEP GO). Not linked to the Government Grant box. |
| 7 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `14.68` | At least 10% of cost. |
| 8 | Government Grant (₹ Lakhs) | Number input | No | `9.76` | 25% of machinery 39.04 = 9.76 (the back-ended subsidy is shown as a source; the app has no CMEP cap). |
| 9 | Bank Loan (₹ Lakhs) | Number input | No | `40` | The pack is meant to be bank-linked, but the code does not enforce a loan (see Discrepancies). |
| 10 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 64.44 Lakhs**.

### Step 10 — Operating cost & sales
**10a. Projection assumptions** (box "Projection assumptions"):
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Installed capacity per day | Number input | No | `360` | Metres of fabric. |
| 2 | Working days in a year | Number input | No | `300` |  |
| 3 | Capacity utilisation (%) | Number input | No | `60` | Read by the data check (flags above 100 or below 30). |
| 4 | Selling price per unit (₹) | Number input | No | `226` | Per metre. |
| 5 | Rent per month (₹) | Number input | No | `25000` |  |
| 6 | Salaries per month (₹) | Number input | No | `36000` | Supervisor 20,000 + accountant 16,000. |
| 7 | Power per month (₹) | Number input | No | `28000` | 28,000 x 12 = 3.36 lakh a year. |
| 8 | Annual expense increase (%) | Number input | No | `5` |  |


**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Cotton yarn (40s and 60s count)` | `Warp and weft` | `Bought from Salem, Tirupur and Guntur dealers with 30-day credit` |
| 2 | `Reactive dyes and chemicals` | `Hank dyeing` | `Monthly from a Vijayawada dye dealer` |
| 3 | `Poly covers, cartons and labels` | `Packing` | `Quarterly from a Guntur packaging supplier` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Weavers` | `12` | `11500` |
| 2 | `Warping and winding operators` | `3` | `11000` |
| 3 | `Dyer` | `1` | `14000` |
| 4 | `Helpers` | `3` | `8500` |
| 5 | `Production supervisor` | `1` | `20000` |
| 6 | `Accountant and sales executive` | `1` | `16000` |


**10b. Capacity utilisation by projected year** (eight small boxes, labelled by year):

**Capacity utilisation by projected year**

| Year | 2026-2027 | 2027-2028 | 2028-2029 | 2029-2030 | 2030-2031 | 2031-2032 | 2032-2033 | 2033-2034 |
|---|---|---|---|---|---|---|---|---|
| % | `60` | `65` | `70` | `75` | `80` | `80` | `80` | `80` |


**10c. Money fields:**
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | `83.5` | 57% of sales. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `3.36` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `25.26` | Annual. Production staff only: (12 x 11,500 + 3 x 11,000 + 14,000 + 3 x 8,500) x 12 = 25.26 lakh. Supervisor and accountant are in Administrative Expenses. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `1.8` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `9` | Includes salaries 4.32 + rent 3.00 + other office costs 1.68 (the finance model has no separate rent / salary line). |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `3` |  |
| 7 | Annual Production Volume | Number input | No | `64800` | Unit used in this test: metres. 360 m x 300 days x 60% = 64,800 metres. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `146.45` | 64,800 m x ₹226 = 146.45 lakh. |

Operating check: yearly costs 125.92 lakh against sales 146.45 lakh, so no "costs higher than sales" note (EBITDA 20.53 lakh).

### Step 11 — Financial projections (actuals and estimates)
Top: "Work out break-even" button (optional) and the read-only "Projected financial statements" panel (with its seven check marks, assumptions boxes left at default).

Financial projections grid: a table with 12 rows and 11 year columns. Under the heading "Previous" are 2023-2024, 2024-2025, 2025-2026 (actuals of the existing home looms); under "Projected" are the eight estimate years. Every cell is a number input; enter all 132 values below (blank = 0).

**Financial projections grid (₹ Lakhs)**

| Sl. | Particulars (Rs. In Lakhs) | 2023-2024 | 2024-2025 | 2025-2026 | 2026-2027 | 2027-2028 | 2028-2029 | 2029-2030 | 2030-2031 | 2031-2032 | 2032-2033 | 2033-2034 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sales realisation | `16.8` | `20.4` | `24.3` | `146.45` | `163.41` | `181.26` | `200.03` | `219.77` | `226.36` | `233.16` | `240.15` |
| 2 | Raw material | `9.6` | `11.6` | `13.8` | `83.51` | `93.18` | `103.35` | `114.06` | `125.31` | `129.07` | `132.95` | `136.93` |
| 3 | Wages | `3.6` | `4.3` | `5.1` | `25.26` | `26.52` | `27.85` | `29.24` | `30.7` | `32.24` | `33.85` | `35.54` |
| 4 | Power | `0.3` | `0.34` | `0.4` | `3.36` | `3.82` | `4.32` | `4.86` | `5.45` | `5.72` | `6` | `6.3` |
| 5 | Salaries | `0` | `0` | `0` | `4.32` | `4.54` | `4.76` | `5` | `5.25` | `5.51` | `5.79` | `6.08` |
| 6 | Rent | `0` | `0` | `0` | `3` | `3.15` | `3.31` | `3.47` | `3.65` | `3.83` | `4.02` | `4.22` |
| 7 | Maintenance | `0.2` | `0.22` | `0.25` | `1.8` | `1.89` | `1.98` | `2.08` | `2.19` | `2.3` | `2.41` | `2.53` |
| 8 | Administrative expenses | `0.3` | `0.34` | `0.4` | `1.68` | `1.76` | `1.85` | `1.94` | `2.04` | `2.14` | `2.25` | `2.36` |
| 9 | Interest | `0` | `0` | `0` | `4.15` | `3.74` | `3.22` | `2.63` | `1.98` | `1.26` | `0.47` | `0` |
| 10 | Depreciation | `0.3` | `0.27` | `0.24` | `6.86` | `5.88` | `5.04` | `4.33` | `3.72` | `3.19` | `2.75` | `2.36` |
| 11 | Income tax | `0` | `0` | `0.15` | `3.13` | `4.73` | `6.4` | `8.11` | `9.87` | `10.28` | `10.67` | `10.96` |
| 12 | Net profit | `2.5` | `3.33` | `3.96` | `9.38` | `14.2` | `19.18` | `24.31` | `29.61` | `30.82` | `32` | `32.87` |


How the numbers were built (so the tester can spot typing errors): projected sales = 360 m x 300 days x utilisation (60, 65, 70, 75, 80, 80, 80, 80%) x ₹226 with a 3% yearly price rise; raw material = 57.02% of sales; wages, salaries, rent, maintenance and admin grow 5% a year; power scales with utilisation; interest follows the loan schedule (4.15 in the first year, nil in 2033-2034); depreciation is on the written-down value (machinery 15%, building 10%, furniture 10%); tax is 25% of profit; Net profit = Sales less every other row.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | Number input | No | `63.55` | Equals the "Break-even capacity (%)" line of the derived sheets under the grid (63.55). Data check flags above 100. |

AUTO – below the grid verify the derived sheets: Repayment summary: Term loan 40, Interest rate 10.50, Moratorium 6, Loan tenure 84, Indicative EMI 0.71 lakh; Break-even: break-even sales 93.07 lakh, break-even capacity 63.55%, Average DSCR 3.58; three depreciation tables (Machinery 15%, Building 10%, Furniture and fixtures 10%) with 2026-2027 additions 39.04 / 8 / 2 and depreciation 5.86 / 0.80 / 0.20 in year one. The separate "Projected financial statements" panel (from Step 10 figures) shows its own Break-even 84.42% and average DSCR 2.42 (two different break-even figures on one screen; see Discrepancies).

### Step 12 — Implementation schedule
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | Date input | No | `2027-01-20` | No date validation on this field. |


**Milestones (3 rows are shown by default with the placeholder activities "Machinery order / installation", "Power connection", "Trial run"; there is no add-row button, so overwrite these three)**

| Row | Activity (placeholder "Activity") | Start date | End date |
|---|---|---|---|
| 1 | `Pay balance to loom supplier and install 12 looms and warping machine` | `2026-10-20` | `2026-12-10` |
| 2 | `Shed renovation, 25 HP power connection and dye wastewater tank` | `2026-10-25` | `2026-12-05` |
| 3 | `Trial weaving and first dispatch to Vijayawada wholesalers` | `2026-12-14` | `2027-01-19` |



**Risks and how they will be handled (starts empty; click "Add risk" for each row; the second box is labelled "How it will be handled")**

| Row | Risk | How it will be handled |
|---|---|---|
| 1 | `Cotton yarn price rise` | `Keep 20 days of yarn stock and take fixed-rate quotes from two dealers` |
| 2 | `Delay in loom delivery` | `Penalty clause with the supplier and weaving on the three home looms in the meantime` |
| 3 | `Dye wastewater compliance` | `Settling tank built before dyeing starts; consent applied through the Single Desk portal` |


### Step 13 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Udyam Certificate (or application) | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_udyam_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | Machinery / Capex Quotations | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_machinery_capex_quotations.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | AP Domicile Proof | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_ap_domicile_proof.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 4 | Bank Passbook / Cancelled Cheque | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_bank_passbook_cancelled_cheque.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 5 | Education certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_education_certificate_bcom.pdf` | Always shown for AP_CMEP (also when EDP is pending). |
| 6 | EDP certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_edp_certificate.pdf` | Always shown (not tied to the EDP training answer). |
| 7 | Lease deed / premises proof | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_lease_deed_shed.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 8 | Yarn, dye and packing rate sheets | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_yarn_dye_packing_rate_sheets.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 9 | Dealer enquiries or purchase orders | File (.pdf .doc .docx .jpg .jpeg .png) | No | `CMEP_dealer_enquiries_vijayawada.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = building 8.00 + machinery 39.04 (12 x 1.85 = 22.20; 5.18; 2 x 1.05 = 2.10; 3.84; 1.49; 4.23) + furniture 2.00 + security deposits 1.20 + pre-operative 1.20 + working capital 13.00 (4.00 + 1.50 + 2.50 + 6.00 + 1.00 - 2.00) + land 0 + utilities 0 = **₹64.44 lakh**. Means of finance = own 14.68 + grant 9.76 + bank loan 40.00 + other 0 = **₹64.44 lakh** (exact). Subsidy 25% x 39.04 = 9.76. Own money 14.68 / cost = 22.78% (minimum 10% applies because a loan exists); debt-equity = 40.00 / (14.68 + 9.76) = 1.64 (ceiling 3.00). Repayment months = 84 - 6 = 78; EMI at 10.5% = 0.71 lakh a month (about ₹70,973), 8.52 lakh a year. The Cash credit limit 10.00 is not in the total. Finance model: average DSCR 2.42, positive cash every year, no warnings.
- **Uploads to prepare:** Udyam Certificate (or application) -> `CMEP_udyam_certificate.pdf`; Machinery / Capex Quotations -> `CMEP_machinery_capex_quotations.pdf`; AP Domicile Proof -> `CMEP_ap_domicile_proof.pdf`; Bank Passbook / Cancelled Cheque -> `CMEP_bank_passbook_cancelled_cheque.pdf`; Education certificate -> `CMEP_education_certificate_bcom.pdf`; EDP certificate -> `CMEP_edp_certificate.pdf`; Lease deed / premises proof -> `CMEP_lease_deed_shed.pdf`; Yarn, dye and packing rate sheets -> `CMEP_yarn_dye_packing_rate_sheets.pdf`; Dealer enquiries or purchase orders -> `CMEP_dealer_enquiries_vijayawada.pdf`. Nine slots, all always shown, none required.
- **Generate & verify:** No "Must fix first" and no advisory notes. The preview uses the indigo AP CMEP template: a badge "AP CMEP · State credit-linked", kicker "AP CMEP DETAILED PROJECT REPORT", "On", "Establishment of", `Sri Durga Handloom Fabrics`, "under 'AP Chief Minister's Entrepreneur Programme (AP CMEP)'", tagline "Andhra Pradesh CMEP · bank loan required · manufacturing / knowledge", then District Guntur, Location Mangalagiri, Entrepreneur name Pothuri Naga Durga Bhavani. Table of Contents lists **13 sections** in the order of the 13 steps (stacked section-and-answer layout). Check: Step 1 section (activity band, booster, domicile, urban/rural, EDP, earlier subsidy, family); Step 2 executive summary and process; Step 4 product mix, Number of looms 12, Shifts 1; Step 6 area boxes 3600 / 2400 / 800 / 400, lease 5; Step 7 promoter table; Step 8 cost phasing, the 6-row detailed machinery list and the six working-capital lines; Step 9 loan terms (cash credit 10, SBI, 10.5, 6, 84, subsidy rate 25); Step 10 assumptions and the eight utilisation values; **Step 11 renders the projection grid as a bank-style sheet** with 3 Previous and 8 Projected columns, plus Repayment summary (EMI 0.71), Break-even (63.55%), Average DSCR 3.58 and three depreciation tables; Step 12 CoD 2027-01-20, the 3 milestones and the 3-row risk table; Step 13 the 9 uploads. PDF and DOCX show the same sheets.
- **Negative / boundary tests:**
  1. Step 9: Bank Loan `39` (funding 63.44 vs cost 64.44) -> blocker "The funding adds up to ₹63.44 lakh but the project cost is ₹64.44 lakh. They must match exactly (difference ₹1.00 lakh).".
  2. Step 9: Promoter `54.68`, Bank Loan `0` (grant 9.76, total 64.44, no loan) -> **no blocker** (no finance findings at all). The scheme text says zero-loan projects are out of scope, but the code accepts it (bug).
  3. Step 9: Moratorium `84` with Loan tenure `84` -> advisory "The grace period (84 months) is as long as, or longer than, the whole loan period (84 months).".
  4. Step 8: after completing 8c, go back to 8a and change the first loom unit cost from `1.5` to `1.6` -> Machinery total changes (12 x 1.95 = 23.40, so 23.40 + 5.18 + 2.10 + 3.84 + 1.49 + 4.23 = 40.24, and the "Total Project Cost" tile goes up by 1.20), but the cost-phasing "Machinery / equipment" row and the depreciation table stay at 39.04 (stale). Change the phasing Machinery "To be incurred" instead and the machinery total is overwritten while the machinery list is not. Restore `1.5` / `33.04` afterwards.
  5. Step 4: Commitment Date `2026-05-01` (before Start Date 2026-06-15) -> toast "Commitment Date must be on or after Start Date" and the date is not stored. Step 7: Firm PAN `BKTPR4821M` -> rejected as an individual PAN; GSTIN `37BKTPP4821M1ZD` -> "The last character does not match".
  6. Step 10: Capacity utilisation (%) `120` -> advisory "Using 120% of capacity is not possible. It cannot be above 100%."; Step 9 Interest rate `22` -> advisory "An interest rate of 22% is unusual..."; neither blocks. Restore 60 and 10.5.
- **Discrepancies spotted:**
  1. Step 11 helper text says "Enter actuals for the three previous financial years and estimates for the **next five**", but the grid has **8** projected columns (`CMEP_PROJECTED_YEARS = 8`, as the spec also says).
  2. Step 11 tiles "Project cost" and "Equity + loan + other" disagree for AP_CMEP: the cost tile shows 61.24 (it omits furniture 2.00 and security deposits 1.20) while the funding tile shows 64.44 and Step 8 totals 64.44.
  3. Cost-phasing totals and the machinery / working-capital editors write the same hidden amounts without updating each other: editing the phasing table overwrites `machinery` / `workingCapitalMargin`; editing the machinery list or the working-capital build-up afterwards leaves `costPhasing` (and the depreciation sheets that read it) stale.
  4. Step 8 has two furniture inputs for AP_CMEP: the phasing row "Furniture and fixtures" (`furniture`) and the grid field "Furniture & fixtures (₹ Lakhs)" (really `utilitiesAndInfrastructure`); both count in the total.
  5. Rent, salaries, power per month, capacity per day, working days, selling price and expense growth (Step 10) and the projection grid (Step 11) do not feed Step 10 money fields or the finance model; the model ignores rent and salaries, so its break-even (84%) differs from the derived-sheet break-even (63.55%) on the same step. The Cash credit limit and Subsidy rate (%) inputs are not part of the means-of-finance total.
  6. Spec says "bank loan required / zero-loan out of scope" but no rule blocks a zero bank loan (the equity and debt-equity rules only run when debt > 0). No CMEP subsidy percent, booster rate or cap is calculated or checked, although Step 1 collects the booster category.
  7. `premisesType` is declared for AP_CMEP (`AP_CMEP_EXTRA_FIELDS`) but no control collects it; the Step 6 "Premises — owned / rented" dropdown is not shown for CMEP.
  8. `AP_CMEP_EDP_OPTIONS` and `AP_CMEP_AREA_OPTIONS` are not in `OPTION_LISTS` of `individualDocModel.ts`, so the preview prints the raw stored word `completed` / `pending` instead of "EDP completed" / "EDP still pending".
  9. The Step 6 "Power requirement" answer is not in the field list the preview uses for the premises section, so it does not appear in the preview; the Step 7 name auto-fill uses the unit name because AP_CMEP is not in `LEAN_FIRM`; "Firm / proprietor name *" shows an asterisk that is not enforced.
  10. `dataChecks.ts` rule `dates.order` reads `step4.startDate` (not a form field), so it never fires.

## 16. AP MSME-PARKS land rebate (`AP_PARKS`)
**Entry:** `/individual-dpr/create?new=true&scheme=AP_PARKS` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 11 (code `AP_PARKS_STEPS`; spec and brief say 10). Step titles on screen: Step 1: Cover & eligibility; Step 2: Activity story; Step 3: Location; Step 4: Unit profile; Step 5: Market & offtake; Step 6: Premises; Step 7: Applicant; Step 8: Project / land cost; Step 9: Means of finance; Step 10: Operating cost & sales; Step 11: Documents & uploads.
**Test persona:** Mekala Rajeswari (age 36, MBA, woman entrepreneur and managing director) is setting up **Sri Rajeswari Apparels Private Limited** on an allotted 600 sq.yd plot in the **APIIC MSME Park at Naidupeta, Tirupati district**. After four years of running a rented 10-machine tailoring workshop at Gudur she will stitch school uniforms, formal shirts and track pants on 24 machines. She claims the women-entrepreneur land rebate; land is shown net of the rebate. The unit is new on its own plot. Mandal / village is not an input.

Conventions as in 14. The code has **11** steps for this scheme (spec and brief say 10; see Discrepancies 1).

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Rajeswari Apparels` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Tirupati` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Naidupeta` | Town must belong to the district. Options: Tirupati, Srikalahasti, Puttur, Sullurpeta, Naidupeta, Venkatagiri, Renigunta. |
| 4 | Nature of Business | Text input | No | `Readymade garment stitching and finishing unit` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `School uniforms, formal shirts, track pants` | Data check flags fewer than 3 characters. |
| 6 | APIIC / park name | Text input | No | `APIIC MSME Park, Naidupeta` |  |
| 7 | Plot area | Text input (free text) | No | `600 sq.yd` | Placeholder "e.g. 500 sq.yd". Free text, no unit check. |
| 8 | Land rebate claim | Select (Select / General rebate / SC / ST rebate / Women entrepreneur rebate / Other notified category) | No | `Women entrepreneur rebate` | Stored `women`. |
| 9 | AP domicile | Select (Select / Yes / No) | No | `Yes` |  |
| 10 | Entrepreneur name | Text input | No | `Mekala Rajeswari` | Shown on the cover. |

The spec and `AP_PARKS_EXTRA_FIELDS` also list "SC/ST or women category" (`scStOrWomen`), but there is no such control (see Discrepancies).

### Step 2 — Activity story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Textiles and apparel – readymade garments` | Required: blocks Next. Placeholder "Enter sector type". |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Readymade garment stitching is a major source of work for women in Tirupati district. The unit will stitch school uniforms and formal shirts for institutional buyers and wholesale dealers from a 3,000 sq.ft. shed on an APIIC MSME Park plot at Naidupeta.` | Required: blocks Next. Data check flags fewer than 30 characters. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (expandable) | No | `The plot lies near the Chennai–Kolkata national highway at Naidupeta, about 70 km from Tirupati and 100 km from Chennai. Fabric comes from Chennai and Erode mills, and a pool of women stitchers lives within 10 km of the park.` | Placeholder "Site, roads, nearby markets — brief feasibility note". |

### Step 4 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The promoter has run a rented 10-machine tailoring workshop at Gudur for four years and now plans a full 24-machine unit on an allotted APIIC plot. This pack covers the new plot, shed and machines.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2026-07-01` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-09-10` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Servo-motor industrial sewing machines with a straight-knife cutting table` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `24 machines, about 360 garments per day on one shift; 100,800 garments a year at full capacity` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `School uniform sets` | `50` | `540` |
| 2 | `Formal shirts` | `35` | `310` |
| 3 | `Track pants` | `15` | `260` |

Selling price unit used in this test: ₹ per piece or set. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `School and college managements in Tirupati, Nellore and Chittoor districts, uniform wholesalers in Chennai and corporate staff-uniform buyers.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `Three private school groups have shared uniform needs of about 18,000 sets a year, and a Chennai wholesaler has asked for 2,500 shirts a month.` |  |

### Step 6 — Premises
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Own APIIC plot and shed, Naidupeta` | Required: blocks Next. Placeholder "Shop or shed name / brief description". |
| 2 | Premises note (own / lease / rent) | Textarea (expandable) | No | `600 sq.yd plot on allotment at the APIIC MSME Park, Naidupeta; land cost is shown net of the women-entrepreneur rebate; a 3,000 sq.ft. shed will be built.` |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | `40 HP three-phase` | Stored as `powerRequirements`. See Discrepancies: this answer is not listed in the preview. |

### Step 7 — Applicant
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Rajeswari Apparels Private Limited` | AUTO: the box is pre-filled with the unit name "Sri Rajeswari Apparels"; select all and overwrite with this exact text. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Private limited company` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37AAGCS3956R1ZF` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 8-9). |
| 4 | Firm PAN (optional) | Text input, masked | No | `AAGCS3956R` | Firm PAN: 4th letter must NOT be P (personal PAN is rejected). This value has 4th letter C. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-04-0212576` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9908451672` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `Plot 14, APIIC MSME Park, Naidupeta, Tirupati district, Andhra Pradesh – 524 126` | AUTO: starts as "<Location>, <District>" (for example "Naidupeta, Tirupati"); replace it with the full address. |

### Step 8 — Project / land cost
Top: read-only "Details carried to this schedule" block and the optional "Work out working capital" button.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Making things` | Auto-guess is usually "Making things" for this text; still select it explicitly so the machinery table is shown. |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number input | No | `18` | Land cost NET of the park rebate: gross 24.00 (600 sq.yd x ₹4,000) less illustrative 25% women rebate 6.00 = 18.00. The app has no gross-land or rebate field (see Discrepancies). |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number input | No | `24` | 3,000 sq.ft. shed at about ₹800 per sq.ft. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number input | No | `3` | Saved as "utilitiesAndInfrastructure" (the preview calls it "Utilities & Infrastructure"). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | `1.5` | Written off over 5 years in the finance model. |
| 6 | Working capital (₹ Lakhs) | Number input | No | `10` | The "Work out working capital" calculator is optional; type the figure. |


**Machinery list (starts empty: click "Add machinery" once per row; Condition select = New / Used)**

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Single-needle lockstitch machine (servo motor)` | `New` | `Jaya Sewing Machines, Chennai` | `24` | `0.58` | 13.92 |
| 2 | `4-thread overlock machine` | `New` | `Jaya Sewing Machines, Chennai` | `4` | `0.72` | 2.88 |
| 3 | `Buttonhole machine` | `New` | `Sri Ganesh Garment Machinery, Tirupur` | `1` | `2.94` | 2.94 |
| 4 | `Button-attaching machine` | `New` | `Sri Ganesh Garment Machinery, Tirupur` | `1` | `1.65` | 1.65 |
| 5 | `Straight-knife cutting machine` | `New` | `Jaya Sewing Machines, Chennai` | `2` | `0.48` | 0.96 |
| 6 | `Steam generator with ironing table` | `New` | `Sri Ganesh Garment Machinery, Tirupur` | `3` | `0.55` | 1.65 |

Machinery total = 24.00 lakh. AUTO: as soon as any row has a description or unit cost the hidden "machinery" amount is set to this total (the direct machinery input is hidden for these schemes), so it is included in "Total Project Cost".

AUTO – "Total Project Cost" must read **₹ 80.5 Lakhs** (18 + 24 + 24 + 3 + 1.5 + 10).

### Step 9 — Means of finance
Top: "Details carried to this schedule" block and the optional buttons.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `Union Bank of India, Naidupeta branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `10.5` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `6` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `84` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `21` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `0` | Keep 0: the rebate is already netted off the land cost, so no grant line is needed (spec: "land cost net of rebate"). |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `59.5` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 80.5 Lakhs**.

### Step 10 — Operating cost & sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Cotton and polyester-blend fabric` | `Uniform and shirt cloth` | `Bought from Chennai and Erode mills on 30-day credit` |
| 2 | `Thread, buttons, zips and labels` | `Trims` | `Monthly from a Chennai trims wholesaler` |
| 3 | `Poly bags and cartons` | `Packing` | `Quarterly from a Tirupati packaging dealer` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Sewing machine operators` | `24` | `11500` |
| 2 | `Finishing and packing helpers` | `8` | `9000` |
| 3 | `Floor supervisors` | `2` | `20000` |
| 4 | `Cutting master` | `1` | `24000` |
| 5 | `Unit manager` | `1` | `30000` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | `125` | About 55% of sales. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `4.8` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `53.04` | Annual: ₹4,42,000 a month x 12 = ₹53.04 lakh. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `3` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `6` |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `4.5` |  |
| 7 | Annual Production Volume | Number input | No | `54000` | Unit used in this test: garments.  |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `225.45` | 54,000 garments x weighted price ₹417.50 = 225.45 lakh. |

Operating check: yearly costs 196.34 lakh against sales 225.45 lakh, so no "costs higher than sales" note (EBITDA 29.11 lakh).

### Step 11 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | APIIC / Park Allotment Application | File (.pdf .doc .docx .jpg .jpeg .png) | No | `PARKS_apiic_allotment_application.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | AP Domicile Proof | File (.pdf .doc .docx .jpg .jpeg .png) | No | `PARKS_ap_domicile_proof.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | SC/ST / Women Category Proof (if claimed) | File (.pdf .doc .docx .jpg .jpeg .png) | No | `PARKS_women_category_proof.pdf` | Always shown (the label says "if claimed"); upload it because the women rebate is claimed. |
| 4 | Aadhaar / PAN | File (.pdf .doc .docx .jpg .jpeg .png) | No | `PARKS_aadhaar_pan.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Land: 600 sq.yd x ₹4,000 = 24.00 gross, women rebate 25% (illustrative, confirm the GO) = 6.00, net land 18.00 entered in Step 8. Project cost = land 18.00 + building 24.00 + furniture & fixtures 3.00 + machinery 24.00 (13.92 + 2.88 + 2.94 + 1.65 + 0.96 + 1.65) + pre-operative 1.50 + working capital 10.00 = **₹80.50 lakh**. Means of finance = own 21.00 + grant 0.00 + bank loan 59.50 + other 0.00 = **₹80.50 lakh** (exact). Own money 21.00 / cost = 26.09% (minimum 10% applies because a loan exists); debt-equity = 59.50 / (21.00 + 0.00) = 2.83 (ceiling 3.00). Repayment months = 84 - 6 = 78; EMI at 10.5% = 1.06 lakh a month (about ₹1,05,572), 12.67 lakh a year. Loan 59.50 is below assets and set-up costs (70.50), so no "term loan too high" note. Model check (not shown on screen: this scheme has no viability step): average DSCR 2.26, cash positive.
- **Uploads to prepare:** APIIC / Park Allotment Application -> `PARKS_apiic_allotment_application.pdf`; AP Domicile Proof -> `PARKS_ap_domicile_proof.pdf`; SC/ST / Women Category Proof (if claimed) -> `PARKS_women_category_proof.pdf`; Aadhaar / PAN -> `PARKS_aadhaar_pan.pdf`. Four slots, all always shown, none required.
- **Generate & verify:** No "Must fix first", no advisory notes. Preview has **11 sections** (no Financial viability or Implementation schedule section). Cover: "DETAILED PROJECT REPORT", "Establishment of", `Sri Rajeswari Apparels`, "under 'AP MSME Parks — land-cost concession'", District Tirupati, Location Naidupeta, Entrepreneur name Mekala Rajeswari. Step 1 section: APIIC / park name, Plot area, Land rebate claim = "Women entrepreneur rebate", AP domicile Yes, Entrepreneur name (no SC/ST-or-women row has an answer). Step 8 shows Land 18, Building 24, Utilities & Infrastructure 3, Machinery 24, Working capital 10 plus the machinery list; Step 9 shows 21 / 0 / 59.5 / 0 and the bank terms; Step 4 shows Start Date 2026-07-01 and Commitment Date 2026-09-10. PDF and DOCX match.
- **Negative / boundary tests:**
  1. Step 8: Land `24` (gross land, forgetting the rebate) -> cost 86.50 vs funding 80.50: blocker "The funding adds up to ₹80.50 lakh but the project cost is ₹86.50 lakh. They must match exactly (difference ₹6.00 lakh).".
  2. Step 9: Promoter `20`, Bank Loan `60.5` (total 80.50) -> debt-equity 60.50 / 20 = 3.03: blocker "Bank debt is 3.03 times your own money plus subsidy. The most allowed is 3 to 1.". Back to `21` / `59.5` clears it (2.83).
  3. Step 9: Promoter `6`, Bank Loan `74.5` (total 80.50, own 7.45%) -> blockers: "Your own money is 7.45% of the project cost. The minimum for this scheme is 10%."; "Bank debt is 12.42 times your own money plus subsidy. The most allowed is 3 to 1." (plus the generic term-loan advisory).
  4. Step 1: set Land rebate claim to `SC / ST rebate` while the unit is a women-owned company -> accepted; nothing links the rebate category to the land amount or to the category proof upload (gap). Also leave the "Plot area" as `600` (no unit) -> accepted (free text).
  5. Step 6: clear "Shop / shed / workplace" and press Next -> "Fill the required fields before continuing: Shop / shed / workplace". Step 2: clear Sector / industry type -> "Fill the required fields before continuing: Sector / industry type".
  6. Step 7: mobile `99084516` (8 digits) -> "Mobile number has 10 digits (2 more)." and Next is blocked; Udyam `UDYAM-AP-04-021257` -> "Use the form UDYAM-AP-00-0000000" style error; Step 4 Start Date `2101-01-01` -> toast "Enter a valid date between 1990 and 2100".
- **Discrepancies spotted:**
  1. Step count: `AP_PARKS_STEPS` has **11** steps (cover, story, location, unit, market, premises, applicant, cost, finance, operating, uploads); `apParks.md`, the header of `apParksQuestions.ts`, `AP_PARKS_IMPACT_BULLETS` and the brief say 10, and the spec puts uploads at Step 10.
  2. `scStOrWomen` is in `AP_PARKS_EXTRA_FIELDS` and the spec says Step 1 asks it, but the form has no such control; the only category control is "Land rebate claim".
  3. Spec: "MoF shows land cost net of APIIC / GO rebate" and the impact bullet repeat this, but there is no gross land, rebate % or rebate amount field and no rebate calculation or cap: the person must net the rebate by hand. The rebate category is not linked to the category-proof upload.
  4. Step 8 title is "Project / land cost" but the form is the generic lean cost page (land, building, furniture, pre-operative, machinery list, working capital); there is no plot-cost or allotment-price input.
  5. `premisesType` is not collected for AP_PARKS and the Step 6 "Premises — owned / rented" dropdown is not shown; "Power requirement" is saved but not printed in the preview.
  6. Step 7 "Firm / proprietor name *" asterisk is not enforced and the auto-fill copies the unit name (AP_PARKS missing from `LEAN_FIRM`).
  7. Default finance rules (10% own money, debt-equity 3:1) apply; no park-scheme rule exists, so a land-heavy 100% loan-funded plan is judged by the generic rules only. `dates.order` never fires (reads `step4.startDate`).

## 17. AP OBMMS welfare self-employment (`OBMMS`)
**Entry:** `/individual-dpr/create?new=true&scheme=OBMMS` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 11 (code `OBMMS_STEPS`; spec and brief say 10). Step titles on screen: Step 1: Cover & eligibility; Step 2: Activity story; Step 3: Location; Step 4: Unit profile; Step 5: Market & offtake; Step 6: Premises; Step 7: Applicant; Step 8: Project / land cost; Step 9: Means of finance; Step 10: Operating cost & sales; Step 11: Documents & uploads.
**Test persona:** Gollapalli Venkata Ramana (age 34, Intermediate pass, Backward Class) will open **Sri Sai Ramana Kirana Stores**, a sole-proprietor grocery shop at **Amudalavalasa, Srikakulam district**, funded by a BC Corporation self-employment subsidy plus a bank loan. After six years as a salesman in a wholesale grocery outlet at Srikakulam he will sell rice, pulses, spices, sugar, soaps and biscuits from a rented 400 sq.ft. shop. He holds a white rice card. The business kind is **Buying and selling**, so the cost step shows an Assets list instead of machinery. Mandal / village is not an input; it goes only in the Step 7 address.

Conventions as in 14. Cost step note: for OBMMS the form hides Land, Building, Furniture and Pre-operative (simple-capex scheme), so only the assets list and Working capital are asked.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Sai Ramana Kirana Stores` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Srikakulam` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Amudalavalasa` | Town must belong to the district. Options: Srikakulam, Amudalavalasa, Palasa, Kasibugga, Ichchapuram, Tekkali, Narasannapeta. |
| 4 | Nature of Business | Text input | No | `Retail kirana and grocery shop` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Rice, pulses, spices, sugar, soaps, biscuits` | Data check flags fewer than 3 characters. |
| 6 | Welfare corporation | Select (Select / SC Corporation / ST Corporation / BC Corporation / Kapu Corporation / Minority Corporation / Other welfare corp) | No | `BC Corporation` | Stored `bc`. Preview shows "BC Corporation". |
| 7 | White rice card | Select (Select / Yes / No) | No | `Yes` |  |
| 8 | Activity / trade | Text input | No | `Retail grocery (kirana) shop` |  |
| 9 | Age | Number input (min 18, max 100) | No | `34` | Below 18 shows the inline range message and the guardian toast; see negative test 3 for what it does to saving. |
| 10 | Entrepreneur name | Text input | No | `Gollapalli Venkata Ramana` | Shown on the cover. |

### Step 2 — Activity story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Retail – grocery and general stores` | Required: blocks Next. Placeholder "Enter sector type". |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Neighbourhood kirana shops supply daily groceries to families in Amudalavalasa town and nearby villages. The beneficiary will open a general store near the market road with a visi-cooler, a billing computer and a stock of rice, pulses and daily-use items.` | Required: blocks Next. Data check flags fewer than 30 characters. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (expandable) | No | `The shop is on the Amudalavalasa–Srikakulam road near the vegetable market, within 2 km of about 4,000 households. Wholesale stock comes from Srikakulam by weekly tempo delivery over 20 km.` | Placeholder "Site, roads, nearby markets — brief feasibility note". |

### Step 4 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The applicant has worked six years as a salesman in a grocery wholesale outlet at Srikakulam and now plans to set up his own retail store with a corporation subsidy and a bank loan.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2026-10-05` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-10-12` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Counter sales with electronic scales and computer billing` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `About 48 customer bills a day, 14,400 bills a year` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Rice, pulses and sugar` | `45` | `270` |
| 2 | `Oil, spices and masalas` | `25` | `310` |
| 3 | `Biscuits, soaps and daily-use items` | `30` | `170` |

Selling price unit used in this test: ₹ average value per customer bill. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

Weighted value per bill = 0.45 x 270 + 0.25 x 310 + 0.30 x 170 = ₹250; 14,400 bills x ₹250 = ₹36.00 lakh sales in Step 10.

### Step 5 — Market & offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `Households within 2 km of the market road in Amudalavalasa, small tiffin centres and tea stalls buying in bulk, and villagers from three nearby hamlets.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `About 4,000 households live within 2 km. The two existing shops close by 8 pm and none offers home delivery, so evening and bulk demand is not being met.` |  |

### Step 6 — Premises
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Rented shop, Market Road, Amudalavalasa` | Required: blocks Next. Placeholder "Shop or shed name / brief description". |
| 2 | Premises note (own / lease / rent) | Textarea (expandable) | No | `Rented 400 sq.ft. shop at ₹4,000 per month under a one-year rent agreement signed on 2026-09-28.` |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | `2 kW` | Stored as `powerRequirements`. See Discrepancies: this answer is not listed in the preview. |

### Step 7 — Applicant
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Sai Ramana Kirana Stores (proprietor Gollapalli Venkata Ramana)` | AUTO: the box is pre-filled with the unit name "Sri Sai Ramana Kirana Stores"; select all and overwrite with this exact text. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Sole proprietorship` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | (leave blank) | Leave blank (shop is below the GST threshold). Optional. |
| 4 | Firm PAN (optional) | Text input, masked | No | (leave blank) | Leave blank: a sole proprietor has only a personal PAN (4th letter P), which the app refuses to store. Typing a P-type PAN here shows an error. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-24-0123456` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9490654312` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `D.No. 3-18, Market Road, Amudalavalasa, Srikakulam district, Andhra Pradesh – 532 185` | AUTO: starts as "<Location>, <District>" (for example "Amudalavalasa, Srikakulam"); replace it with the full address. |

### Step 8 — Project / land cost
Top: read-only "Details carried to this schedule" block, the optional "Work out working capital" button, a grey note "Heavy capex tables are hidden for Mudra Shishu / Kishore..." (wrong wording for OBMMS; see Discrepancies) and the business-kind picker.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Buying and selling` | The auto-guess may show another kind: change it to "Buying and selling". This replaces the machinery table with an Assets list and renames the labels on the Operating cost step. |
| 2 | Working capital (₹ Lakhs) | Number input | No | `2.25` | Opening stock of goods. The only direct money input on this step. |


**Assets list (shown instead of machinery because kind = Buying and selling; if it shows only a button "Add a list of your assets (optional)", click it first; then "Add asset" per row; Type select = Equipment & tools / Furniture & fixtures / Vehicle / Computers & software / Other)**

| Row | Asset | Type | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|
| 1 | `Wall racks and shelving for grocery` | `Furniture & fixtures` | `1` | `1` | 1.00 |
| 2 | `Visi-cooler / deep freezer (200 L)` | `Equipment & tools` | `1` | `0.62` | 0.62 |
| 3 | `Electronic counter weighing scale (30 kg)` | `Equipment & tools` | `2` | `0.12` | 0.24 |
| 4 | `Computer with billing software and barcode scanner` | `Computers & software` | `1` | `0.54` | 0.54 |
| 5 | `Shop signboard, shutter fitting and grain storage bins` | `Furniture & fixtures` | `1` | `0.35` | 0.35 |

Assets total = 2.75 lakh. AUTO: written to the hidden machinery amount and counted in "Total Project Cost" (shown under the editor as "Total: ₹2.75 lakh").

AUTO – "Total Project Cost" must read **₹ 5 Lakhs** (assets 2.75 + working capital 2.25).

### Step 9 — Means of finance
Top: "Details carried to this schedule" block and optional buttons.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `Andhra Pradesh Grameena Vikas Bank, Amudalavalasa branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `9` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `3` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `60` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `0.5` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `2.5` | 50% of the unit cost (illustrative: the real subsidy % and unit cost depend on the BC Corporation GO; confirm on apobmms.apcfss.in). Advisory note appears only above 50%. |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `2` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 5 Lakhs**.

### Step 10 — Operating cost & sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Rice, pulses and sugar` | `Daily staples for resale` | `Weekly from Srikakulam wholesale market` |
| 2 | `Edible oils, spices and masalas` | `Cooking needs for resale` | `Fortnightly from a Srikakulam distributor` |
| 3 | `Biscuits, soaps and daily-use items` | `Fast-moving goods for resale` | `Company van-sales route every week` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Shop assistant` | `1` | `10000` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Cost of goods bought for resale (₹ Lakhs) | Number input | No | `31.68` | About 88% of sales (12% gross margin). |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `0.36` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `1.2` | Annual: 10,000 x 12 = 1.20 lakh (one shop assistant). |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `0.12` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `0.6` | Rent 4,000 x 12 = 0.48 plus other office costs 0.12. |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `0.24` |  |
| 7 | Annual sales volume (units) | Number input | No | `14400` | Unit used in this test: customer bills.  |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `36` | 14,400 bills x ₹250 = 36.00 lakh. |

Operating check: yearly costs 34.20 lakh against sales 36.00 lakh, so no "costs higher than sales" note (EBITDA 1.80 lakh).

### Step 11 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Caste / Corporation Eligibility Proof | File (.pdf .doc .docx .jpg .jpeg .png) | No | `OBMMS_bc_eligibility_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | White Rice Card | File (.pdf .doc .docx .jpg .jpeg .png) | No | `OBMMS_white_rice_card.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | Aadhaar | File (.pdf .doc .docx .jpg .jpeg .png) | No | `OBMMS_aadhaar.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 4 | Bank Passbook | File (.pdf .doc .docx .jpg .jpeg .png) | No | `OBMMS_bank_passbook.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = assets 2.75 (1.00 + 0.62 + 2 x 0.12 + 0.54 + 0.35) + working capital 2.25 = **₹5.00 lakh**. Means of finance = own 0.50 + subsidy 2.50 + bank loan 2.00 + other 0.00 = **₹5.00 lakh** (exact). Own money 0.50 / 5.00 = 10.00% (exactly the 10% minimum, passes); subsidy 2.50 / 5.00 = 50% (advisory only above 50%); debt-equity = 2.00 / (0.50 + 2.50) = 0.67. Repayment months = 60 - 3 = 57; EMI at 9% = 0.04 lakh a month (about ₹4,325), 0.52 lakh a year. Model check (not shown: no viability step): average DSCR 3.18.
- **Uploads to prepare:** Caste / Corporation Eligibility Proof -> `OBMMS_bc_eligibility_certificate.pdf`; White Rice Card -> `OBMMS_white_rice_card.pdf`; Aadhaar -> `OBMMS_aadhaar.pdf`; Bank Passbook -> `OBMMS_bank_passbook.pdf`. Four slots, all always shown, none required.
- **Generate & verify:** No "Must fix first", no advisory notes. Preview has **11 sections**. Cover: "Establishment of", `Sri Sai Ramana Kirana Stores`, "under 'AP Welfare Corporation self-employment loan (OBMMS)'", District Srikakulam, Location Amudalavalasa, Entrepreneur name Gollapalli Venkata Ramana. Step 1 section: Welfare corporation "BC Corporation", White rice card Yes, Activity / trade, Age 34, Entrepreneur name. Step 8 shows Working capital 2.25 and the Assets list (5 rows, total 2.75; the heading says "Assets list"); Step 9: 0.5 / 2.5 / 2 / 0; Step 10 labels read "Cost of goods bought for resale" and "Annual sales volume (units)". PDF and DOCX match.
- **Negative / boundary tests:**
  1. Step 9: Promoter `0.4`, Bank Loan `2.1` (total 5.00, own 8%) -> blocker "Your own money is 8% of the project cost. The minimum for this scheme is 10%." (OBMMS gets the generic 10% rule; welfare loans are often funded with little own money).
  2. Step 9: Grant `3`, Bank Loan `1.5` (60% subsidy) -> no blocker; advisory "The subsidy is 60% of the project cost. Subsidy rates under most schemes are well below half.". No OBMMS corporation cap exists.
  3. Step 1: Age `17` -> inline "Enter a number from 18 to 100." and a toast "This site makes bank and scheme DPRs. The person named as the entrepreneur must be 18 or older. Ask a parent or guardian to register and create the DPR in their name." Next still moves to the next step, but each save is refused with the same toast (nothing is stored; the server also answers 403), and on Step 11 Generate DPR fails with "Failed to save data before generating DPR". Restore `34`.
  4. Step 8: change Business kind to `Making things` -> the Assets list is replaced by an empty "Machinery list" editor; the old asset total stays in the hidden machinery amount, so the cost tile still shows 5 until you edit the amounts. Restore `Buying and selling`.
  5. Step 7: Udyam `UDYAM-AP-24-12345` -> "Use the form UDYAM-AP-00-0000000" style error and Next is blocked; mobile `4490654312` -> "An Indian mobile number starts with 6, 7, 8 or 9".
  6. Step 4: Start Date `2026-10-12` and Commitment Date `2026-10-05` -> toast "Commitment Date must be on or after Start Date" (the second date is not stored). Clear Unit / Project Name and press Next -> "Fill the required fields before continuing: Unit / Project Name".
- **Discrepancies spotted:**
  1. Step count: `OBMMS_STEPS` has **11** steps; `obmms.md`, the header of `obmmsQuestions.ts`, `OBMMS_IMPACT_BULLETS` and the brief say 10, and the spec puts uploads at Step 10.
  2. Step title "Project / land cost" and spec "light cost", but OBMMS is in `hideComplexCapex`, so Land, Building, Furniture and Pre-operative are hidden; there is no land cost input at all. The grey note on Step 8 still says "Heavy capex tables are hidden for Mudra Shishu / Kishore".
  3. OBMMS is treated with the generic finance rules (10% own money, debt-equity 3:1, no subsidy cap). Corporation-wise subsidy %, unit-cost ceilings and age / income limits (spec: "confirm corporation-wise ceilings") are not modelled; "Age" shows an inline range message and, when below 18, a guardian toast; Next still moves on while saving silently fails, so the draft is not stored (no explicit stop at the step).
  4. The business-kind auto-guess is unreliable for a shop whose products contain words such as "oil" or "packaged" (the making-words rule wins), so the form can open on "Making things"; the picker must be set by hand.
  5. Step 6 "Power requirement" is not printed in the preview; Step 7 auto-fill uses the unit name (OBMMS missing from `LEAN_FIRM`) and the "Firm / proprietor name *" asterisk is not enforced; in the preview, a Welfare corporation of `Other welfare corp` (value `other`) would print as "Other notified category" because `AP_PARKS_REBATE_OPTIONS` overwrites `OBMMS_CORP_OPTIONS` in `EXTRA_VALUE_LABELS`.
  6. `dates.order` in `dataChecks.ts` never fires (reads `step4.startDate`).

## 18. RAMP MSE-SPICE (Circular Economy) (`MSE_SPICE`)
**Entry:** `/individual-dpr/create?new=true&scheme=MSE_SPICE` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 12. Step titles on screen: Step 1: Cover & eligibility; Step 2: Business / activity story; Step 3: Location; Step 4: Unit profile; Step 5: Market & sales; Step 6: Premises; Step 7: Applicant / firm; Step 8: Project cost; Step 9: Means of finance; Step 10: Operating cost & sales; Step 11: Financial viability; Step 12: Documents & uploads.
**Test persona:** Dronamraju Venkata Satyanarayana (age 47, B.Tech Chemical, managing partner) runs **Sri Lakshmi Narasimha Polymers LLP**, a plastic recycling unit at **Anakapalli, Anakapalli district**. Since August 2019 it has crushed and cold-washed PET bottles into loose flakes on a 150 kg per hour line. The project upgrades to a 300 kg per hour hot-wash line with a pelletiser, all new equipment of Rs 52 lakh, to sell hot-washed flakes and recycled pellets. It is an existing (brownfield) unit on its own shed, so no land or shed purchase is included. Mandal / village is not an input.

Conventions as in 14. The cover action line for this scheme reads "Upgradation of".

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Lakshmi Narasimha Polymers` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Anakapalli` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Anakapalli` | Town must belong to the district. Options: Anakapalli, Narsipatnam, Elamanchili, Yelamanchili, Kasimkota, Pendurthi. |
| 4 | Nature of Business | Text input | No | `PET bottle recycling and flake manufacturing` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Hot-washed PET flakes, recycled PET pellets` | Data check flags fewer than 3 characters. |
| 6 | Circular sector | Select (Select / Plastic recycling / circular / E-waste / Textile waste / circular fashion / Other circular economy) | No | `Plastic recycling / circular` | Stored `plastic`. |
| 7 | Existing unit years | Number input (min 0, max 100) | No | `7` | Brownfield only per spec; the code does not require a value above 0. |
| 8 | Proposed P&M cost (₹ Lakhs) | Number input | No | `52` | Must agree with the machinery list total in Step 8 (52.00); the two are not compared by the code. |
| 9 | Entrepreneur name | Text input | No | `Dronamraju Venkata Satyanarayana` | Shown on the cover. |

### Step 2 — Business / activity story
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Sector / industry type * | Text input | Yes | `Circular economy – plastic recycling` | Required: blocks Next. Placeholder "Enter sector type". |
| 2 | Short intro — what the unit does * | Textarea (expandable) | Yes | `Post-consumer PET bottles collected around Visakhapatnam and Anakapalli are washed, crushed and sold as flakes to fibre and sheet makers. The upgrade adds a hot-wash line and a pelletiser so the unit can sell higher-value recycled pellets and meet buyers' quality norms.` | Required: blocks Next. Data check flags fewer than 30 characters. |

### Step 3 — Location
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | Textarea (expandable) | No | `The unit stands in the Anakapalli industrial belt, about 35 km from Visakhapatnam port and close to the Chennai–Kolkata highway. Waste PET bales come from collectors within 150 km, and buyers in Hyderabad and Chennai collect by truck.` | Placeholder "Site, roads, nearby markets — brief feasibility note". |

### Step 4 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The unit has crushed and cold-washed PET bottles since 2019 on a 150 kg per hour line and sells loose flakes. It has 14 workers on one shift.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2019-08-12` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-09-28` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Cold wash, crusher and baling; no hot wash or pelletising yet` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `300 kg per hour after the upgrade (150 kg per hour before); about 720 MT a year at full capacity` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Hot-washed PET flakes` | `70` | `60` |
| 2 | `Recycled PET pellets` | `30` | `84` |

Selling price unit used in this test: ₹ per kg. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

Weighted price = 0.70 x 60 + 0.30 x 84 = ₹67.20 per kg; 432,000 kg x 67.20 = ₹290.30 lakh.

### Step 5 — Market & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `Polyester fibre and strapping-sheet manufacturers in Hyderabad, Chennai and Vijayawada, and packaging converters that need recycled pellets.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `Two Hyderabad buyers have asked for 40 MT a month of hot-washed flakes and a Chennai strapping maker for 25 MT a month of pellets, none of which the unit can supply today.` |  |

### Step 6 — Premises
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | Text input | Yes | `Own recycling shed, Anakapalli` | Required: blocks Next. Placeholder "Shop or shed name / brief description". |
| 2 | Premises note (own / lease / rent) | Textarea (expandable) | No | `Own freehold shed of 8,000 sq.ft. on 0.75 acre bought in 2019. No land or shed purchase is part of this project; the new line uses the existing 150 kW connection.` |  |
| 3 | Power requirement (HP / kW) — optional | Text input | No | `150 kW` | Stored as `powerRequirements`. See Discrepancies: this answer is not listed in the preview. |

### Step 7 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Lakshmi Narasimha Polymers LLP` | AUTO: the box is pre-filled with the unit name "Sri Lakshmi Narasimha Polymers"; select all and overwrite with this exact text. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Limited liability partnership` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37AAKFL6173Q1ZF` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 8-9). |
| 4 | Firm PAN (optional) | Text input, masked | No | `AAKFL6173Q` | Firm PAN: 4th letter must NOT be P (personal PAN is rejected). This value has 4th letter F. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-02-0156342` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9885123407` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `Survey No. 88/2, Industrial Estate Road, Anakapalli, Anakapalli district, Andhra Pradesh – 531 001` | AUTO: starts as "<Location>, <District>" (for example "Anakapalli, Anakapalli"); replace it with the full address. |

### Step 8 — Project cost
Top: read-only "Details carried to this schedule" block and the optional "Work out working capital" button.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Making things` | Auto-guess is usually "Making things" for this text; still select it explicitly so the machinery table is shown. |
| 2 | Land / building / workshed — land (₹ Lakhs) | Number input | No | `0` | 0: existing own shed, no land in this project. |
| 3 | Land / building / workshed — building (₹ Lakhs) | Number input | No | `4.5` | Shed modification for the new line. |
| 4 | Furniture & fixtures (₹ Lakhs) | Number input | No | `1.5` | Saved as "utilitiesAndInfrastructure" (the preview calls it "Utilities & Infrastructure"). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | Number input | No | `1.5` | Written off over 5 years in the finance model. |
| 6 | Working capital (₹ Lakhs) | Number input | No | `20` | The "Work out working capital" calculator is optional; type the figure. |


**Machinery list (starts empty: click "Add machinery" once per row; Condition select = New / Used)**

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `PET label remover and pre-wash drum` | `New` | `Shree Plastic Machinery, Ahmedabad` | `1` | `6.8` | 6.80 |
| 2 | `Hot-wash friction washer line` | `New` | `Shree Plastic Machinery, Ahmedabad` | `1` | `14.2` | 14.20 |
| 3 | `Granulator / crusher (300 kg per hour)` | `New` | `Nirmal Recycling Systems, Coimbatore` | `1` | `9.5` | 9.50 |
| 4 | `Float-sink separation tank` | `New` | `Nirmal Recycling Systems, Coimbatore` | `1` | `4.6` | 4.60 |
| 5 | `Centrifugal dryer` | `New` | `Shree Plastic Machinery, Ahmedabad` | `1` | `5.4` | 5.40 |
| 6 | `Flake pelletiser (extruder with melt filter)` | `New` | `Nirmal Recycling Systems, Coimbatore` | `1` | `11.5` | 11.50 |

Machinery total = 52.00 lakh. AUTO: as soon as any row has a description or unit cost the hidden "machinery" amount is set to this total (the direct machinery input is hidden for these schemes), so it is included in "Total Project Cost".

All rows are Condition `New` (second-hand machinery is ineligible; see negative test 4). AUTO – "Total Project Cost" must read **₹ 79.5 Lakhs** (0 + 4.5 + 52 + 1.5 + 1.5 + 20).

### Step 9 — Means of finance
Top: "Details carried to this schedule" block and optional buttons. A grey note under the fields repeats the scheme rule: "MSE-SPICE: governmentGrant ≈ 25% of new P&M (cap ₹12.5 L). Second-hand machinery ineligible. Brownfield only. · Plastic recycling / circular · P&M 52 L." (shown with the stored values; the sector appears as the stored word `plastic`).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `State Bank of India, Anakapalli main branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `10.25` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `6` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `84` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `17.5` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `12.5` | 25% of new P&M 52.00 = 13.00 is capped at 12.50 (scheme rule in the note); the code does not enforce the cap. |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `49.5` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 79.5 Lakhs**.

### Step 10 — Operating cost & sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Waste PET bottle bales` | `Main feedstock` | `Bought from collectors on a weekly rate at about ₹38 per kg` |
| 2 | `Caustic soda and detergent` | `Hot-wash chemicals` | `Monthly from a Visakhapatnam chemical dealer` |
| 3 | `HDPE woven bags` | `Flake and pellet packing` | `Quarterly from a Vijayawada bag maker` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Plant supervisor` | `1` | `26000` |
| 2 | `Machine operators` | `6` | `14000` |
| 3 | `Sorting labour` | `12` | `10500` |
| 4 | `Maintenance fitter` | `1` | `18000` |
| 5 | `Accountant` | `1` | `18000` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | `195` | About 67% of sales (waste PET at about ₹38 per kg). |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `14.4` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `32.64` | Annual: ₹2,72,000 a month x 12 = ₹32.64 lakh. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `4.2` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `6` |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `3` |  |
| 7 | Annual Production Volume | Number input | No | `432000` | Unit used in this test: kg.  |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `290.3` | 432,000 kg x ₹67.20 = 290.30 lakh. |

Operating check: yearly costs 255.24 lakh against sales 290.30 lakh, so no "costs higher than sales" note (EBITDA 35.06 lakh).

### Step 11 — Financial viability
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Years (select in "Projected financial statements" panel) | Select 5 / 6 / 7 | No | `leave default` | AUTO: default = ceil(loan tenure / 12) = 7 years. All the assumption boxes (Yearly sales growth 5, Yearly cost increase 5, Income tax rate 25, Discount rate 12, Building depreciation 10, Machinery depreciation 15, Furniture depreciation 10) are optional: leave the defaults so the expected numbers below hold. |
| 2 | Year table: Year 1 to Year 5 (Sales, RM, Wages, Power, Net profit) | Number inputs, 5 rows x 5 columns | No | see sub-table below | Rows start prefilled for Year 1 only from the Operating cost step; type every cell anyway (typing in any cell saves all five rows). |
| 3 | Break-even (capacity %) | Number input | No | `73.62` | Equals the "Break-even" tile of the projected statements panel (73.62% of revenue). Data check flags above 100. |


**Year table (₹ Lakhs). Sales / RM / Wages / Power grow 5% a year from the Operating cost step; Net profit = model PAT of the panel**

| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| Year 1 | `290.30` | `195.00` | `32.64` | `14.40` | `16.00` |
| Year 2 | `304.82` | `204.75` | `34.27` | `15.12` | `18.62` |
| Year 3 | `320.06` | `214.99` | `35.99` | `15.88` | `21.26` |
| Year 4 | `336.06` | `225.74` | `37.78` | `16.67` | `23.91` |
| Year 5 | `352.86` | `237.02` | `39.67` | `17.50` | `26.59` |


AUTO – verify the panel shows (with the defaults): Project cost tile ₹ 79.5 Lakhs and "Equity + loan + other" tile ₹ 79.5 Lakhs; all seven integrity checks ticked green (funding equals cost exactly, balance sheet balances, cash never negative, average DSCR 1.50 or more, own money at the scheme minimum, debt within debt-equity ceiling); Average DSCR **3.27** (minimum 2.92); Project IRR 35.54%; Equity IRR 124.35%; NPV at 12% ₹80.89 lakh; Payback 2.76 years; Break-even 73.62%. The older "DSCR (profit + depreciation vs EMI)" box also appears (assumes a 7-year loan at 12%).

### Step 12 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `SPICE_udyam_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | New P&M Quotations (second-hand ineligible) | File (.pdf .doc .docx .jpg .jpeg .png) | No | `SPICE_new_pm_quotations.pdf` | Always shown; upload quotations for new machines only. |
| 3 | Bank Passbook / Sanction Path | File (.pdf .doc .docx .jpg .jpeg .png) | No | `SPICE_bank_passbook_sanction.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = building 4.50 + furniture & fixtures 1.50 + machinery 52.00 (6.80 + 14.20 + 9.50 + 4.60 + 5.40 + 11.50) + pre-operative 1.50 + working capital 20.00 + land 0 = **₹79.50 lakh**. Means of finance = own 17.50 + grant 12.50 + bank loan 49.50 + other 0 = **₹79.50 lakh** (exact). Subsidy: 25% x 52.00 = 13.00, capped at 12.50 -> 12.50 entered. Own money 17.50 / cost = 22.01% (minimum 10% applies because a loan exists); debt-equity = 49.50 / (17.50 + 12.50) = 1.65 (ceiling 3.00). Repayment months = 84 - 6 = 78; EMI at 10.25% = 0.87 lakh a month (about ₹87,193), 10.46 lakh a year. Loan 49.50 is below assets and set-up costs (59.50), so no "term loan too high" note. Finance model: average DSCR 3.27, cash positive every year.
- **Uploads to prepare:** Udyam Certificate -> `SPICE_udyam_certificate.pdf`; New P&M Quotations (second-hand ineligible) -> `SPICE_new_pm_quotations.pdf`; Bank Passbook / Sanction Path -> `SPICE_bank_passbook_sanction.pdf`. Three slots, all always shown, none required.
- **Generate & verify:** No "Must fix first", no advisory notes. Preview has **12 sections** (no Implementation schedule). Cover: "DETAILED PROJECT REPORT", **"Upgradation of"**, `Sri Lakshmi Narasimha Polymers`, "under 'RAMP MSE-SPICE (Circular Economy)'", District Anakapalli, Location Anakapalli, Entrepreneur name Dronamraju Venkata Satyanarayana. Step 1 section: Circular sector "Plastic recycling / circular", Existing unit years 7, Proposed P&M cost (₹ Lakhs) 52, Entrepreneur name. Step 8: Land 0, Building / shed 4.5, Utilities & Infrastructure 1.5, Machinery / equipment 52, Working capital 20 and the 6-row machinery list; Step 9: 17.5 / 12.5 / 49.5 / 0 and bank terms; Step 11 "Projected results" table (Year 1 to Year 7, Revenue 290.3 in Year 1) and "Returns and ratios" (average DSCR 3.27). PDF and DOCX match.
- **Negative / boundary tests:**
  1. Step 9: Government Grant `25` with Bank Loan `37` (total 79.50) -> **no blocker** although the scheme cap is 12.5 lakh (no finance findings); Government Grant `45`, Bank Loan `17` -> only the advisory "The subsidy is 56.6% of the project cost. Subsidy rates under most schemes are well below half.". Restore 12.5 / 49.5.
  2. Step 9: Bank Loan `50.5` (funding 80.50 vs cost 79.50) -> blocker "The funding adds up to ₹80.50 lakh but the project cost is ₹79.50 lakh. They must match exactly (difference ₹1.00 lakh)."
  3. Step 1: Existing unit years `0` -> accepted (brownfield not checked); `120` -> inline "Enter a number from 0 to 100.". Proposed P&M cost `40` (not equal to the Step 8 machinery total 52.00) -> accepted, no comparison.
  4. Step 8: set the first machinery row Condition to `Used` -> accepted, no warning, although second-hand machinery is ineligible (gap). Restore `New`.
  5. Step 4: Commitment Date `2019-01-01` (before Start Date 2019-08-12) -> toast "Commitment Date must be on or after Start Date". Step 7: GSTIN `37AAKFL6173Q1ZG` -> "The last character does not match"; Firm PAN `AAKPL6173Q` (4th letter P) -> rejected as an individual PAN.
  6. Step 2: clear "Short intro — what the unit does" and press Next -> "Fill the required fields before continuing: Short intro — what the unit does". Step 8: unit cost `52000` (rupees) in the pelletiser row -> advisory about rupees vs lakhs plus the funding mismatch blocker; restore `11.5`.
- **Discrepancies spotted:**
  1. `MSE_SPICE_EXTRA_FIELDS` declares `processOfManufacture`, but the form has no such control for this scheme (only AP_CMEP and older schemes have it on Step 2).
  2. Scheme rules are text only: 25% of new P&M capped at Rs 12.5 lakh, "brownfield only" and "second-hand ineligible" are shown in a grey note but never enforced (no grant cap in `rules.ts`, no check that Existing unit years > 0, no check that Condition = New, no comparison of "Proposed P&M cost" with the machinery total). The note also prints the raw sector code (`plastic`).
  3. Step 6 "Power requirement" is saved but not printed in the preview; Step 7 auto-fill uses the unit name and "Firm / proprietor name *" is not enforced (MSE_SPICE missing from `LEAN_FIRM`). `premisesType` is not collected.
  4. `dates.order` in `dataChecks.ts` never fires (reads `step4.startDate`); for an existing unit "Start Date" 2019-08-12 is the unit start, but the label does not say so.

## 19. EPM Niryat Protsahan (`EPM_NIRYAT`)
**Entry:** `/individual-dpr/create?new=true&scheme=EPM_NIRYAT` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 7. Step titles on screen: Step 1: Cover & eligibility; Step 2: Unit / export profile; Step 3: Applicant / firm; Step 4: Export credit / WC need; Step 5: Means of finance; Step 6: Operating & export sales; Step 7: Documents & uploads.
**Test persona:** Vemuri Srinivasa Rao (age 49, B.Sc Agriculture, managing director) runs **Sri Lakshmi Venkateswara Chilli Exports Private Limited** at **Mirchi Yard, Guntur**. Since April 2018 the firm has bought Teja S17 and Byadgi dried red chillies from farmers and traders, graded and packed them, and exported 31 containers in 2025-26 to Vietnam, Malaysia and Bangladesh. It now needs Rs 90 lakh of pre- and post-shipment export credit and wants the interest subvention. The business kind is **Buying and selling** (assets list). Mandal / village is not an input. This pack has no sector story, location, market, premises, viability or schedule step.

Conventions as in 14. No step in this pack has a required field except Step 1 (Unit / Project Name, District, Location), so Next works as soon as those three are filled.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Lakshmi Venkateswara Chilli Exports` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `Guntur` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Guntur` | Town must belong to the district. Options: Guntur, Tenali, Ponnur, Mangalagiri, Tadepalli, Prathipadu, Vatticherukuru. |
| 4 | Nature of Business | Text input | No | `Export of dried red chillies and chilli powder` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Teja S17 whole dried chilli, Byadgi chilli, chilli powder` | Data check flags fewer than 3 characters. |
| 6 | Export markets | Text input | No | `Vietnam, Malaysia, Bangladesh, Sri Lanka, UAE` |  |
| 7 | HSN lines | Text input | No | `09042110, 09042210` | Whole dried chillies 09042110; chillies crushed or ground 09042210. No format check. |
| 8 | Pre / post shipment | Select (Select / Pre-shipment / Post-shipment / Both pre + post) | No | `Both pre + post` | Stored `both`. |
| 9 | Export credit sought (₹ Lakhs) | Number input | No | `90` | Equal to the bank loan in Step 5 (the grey note says "bank loan ≈ export credit sought"). |
| 10 | Entrepreneur name | Text input | No | `Vemuri Srinivasa Rao` | Shown on the cover. |

### Step 2 — Unit / export profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The firm has exported dried red chillies from its Mirchi Yard warehouse at Guntur since 2018 and shipped 31 containers in 2025-26 to Vietnam, Malaysia and Bangladesh against letters of credit and advance payment.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2018-04-02` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-09-30` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Manual grading and drying yard with moisture meter and ASTA colour test` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `About 25 containers (350 MT) handled a year; 20 containers (280 MT) of exports planned for 2026-27` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Teja S17 whole dried chilli` | `55` | `185` |
| 2 | `Byadgi whole dried chilli` | `30` | `210` |
| 3 | `Chilli powder in retail export packs` | `15` | `240` |

Selling price unit used in this test: ₹ per kg. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

Weighted price = 0.55 x 185 + 0.30 x 210 + 0.15 x 240 = ₹200.75 per kg; 279 MT x ₹200.75 = ₹560.09 lakh (Step 6 uses 560.00).

### Step 3 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Sri Lakshmi Venkateswara Chilli Exports Private Limited` | AUTO: the box is pre-filled with the unit name "Sri Lakshmi Venkateswara Chilli Exports"; select all and overwrite with this exact text. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Private limited company` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37AABCV7204D1ZL` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 4-5). |
| 4 | Firm PAN (optional) | Text input, masked | No | `AABCV7204D` | Firm PAN: 4th letter must NOT be P (personal PAN is rejected). This value has 4th letter C. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-10-0098417` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `9848731206` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `Door No. 12-4-88, Mirchi Yard Road, Guntur, Andhra Pradesh – 522 004` | AUTO: starts as "<Location>, <District>" (for example "Guntur, Guntur"); replace it with the full address. |

### Step 4 — Export credit / WC need
Top: read-only "Details carried to this schedule" block, the optional "Work out working capital" button, a grey note "Heavy capex tables are hidden for Mudra Shishu / Kishore..." (wrong for this scheme) and the business-kind picker. Land, Building, Furniture and Pre-operative are hidden for this scheme.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Buying and selling` | The auto-guess may show another kind: change it to "Buying and selling". This replaces the machinery table with an Assets list and renames the labels on the Operating cost step. |
| 2 | Working capital (₹ Lakhs) | Number input | No | `114` | Export working capital needed (about 74 days of the yearly cost of goods). |


**Assets list (shown instead of machinery because kind = Buying and selling; if it shows only a button "Add a list of your assets (optional)", click it first; then "Add asset" per row; Type select = Equipment & tools / Furniture & fixtures / Vehicle / Computers & software / Other)**

| Row | Asset | Type | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|
| 1 | `Moisture meter and ASTA colour analyser` | `Equipment & tools` | `1` | `1.35` | 1.35 |
| 2 | `Computers, printers and export documentation software` | `Computers & software` | `3` | `0.48` | 1.44 |
| 3 | `Pallet racking and weighing platform scale` | `Equipment & tools` | `1` | `1.7` | 1.70 |
| 4 | `Office furniture and fittings at the export office` | `Furniture & fixtures` | `1` | `1.51` | 1.51 |

Assets total = 6.00 lakh. AUTO: written to the hidden machinery amount and counted in "Total Project Cost" (shown under the editor as "Total: ₹6 lakh").

AUTO – "Total Project Cost" must read **₹ 120 Lakhs** (assets 6.00 + working capital 114.00).

### Step 5 — Means of finance
Top: "Details carried to this schedule" block and optional buttons. Below the fields a grey note: "EPM Niryat is 2.75% interest subvention on eligible export credit — not a capital grant. Keep governmentGrant at 0; bank loan ≈ export credit sought. · both · 90 L." (shown with the stored value `both`).

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `Indian Bank, Guntur Brodipet branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `9.5` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `0` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `12` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `30` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `0` | Keep 0: the 2.75% interest subvention is not a capital grant. |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `90` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 120 Lakhs**. Tenure 12 months and moratorium 0 describe revolving export credit.

### Step 6 — Operating & export sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Dried red chillies (Teja S17 and Byadgi)` | `Export stock` | `Bought from farmers and traders at Guntur Mirchi Yard at spot price` |
| 2 | `Gunny bags and export cartons` | `Packing` | `Monthly from a Guntur packaging dealer` |
| 3 | `Fumigation and cold-storage charges` | `Quality and shelf life` | `Per container, paid to a licensed fumigator` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Export manager` | `1` | `45000` |
| 2 | `Documentation executive` | `1` | `25000` |
| 3 | `Godown supervisors` | `2` | `18000` |
| 4 | `Loaders` | `8` | `12000` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Cost of goods bought for resale (₹ Lakhs) | Number input | No | `478` | About 85% of sales. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `2.4` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `24.24` | Annual: ₹2,02,000 a month x 12 = ₹24.24 lakh. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `1.5` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `14.4` | Includes export documentation, certificates and bank charges. |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `12` |  |
| 7 | Annual sales volume (units) | Number input | No | `279` | Unit used in this test: MT. Tonnes exported (MT). |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `560` | 279 MT = 279,000 kg x ₹200.75 = 560.09 lakh, entered as 560.00. |

Operating check: yearly costs 532.54 lakh against sales 560.00 lakh, so no "costs higher than sales" note (EBITDA 27.46 lakh).

### Step 7 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | IEC Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `EPM_iec_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | Shipping / LC / Export Evidence | File (.pdf .doc .docx .jpg .jpeg .png) | No | `EPM_shipping_lc_export_evidence.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | Udyam Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `EPM_udyam_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 4 | Bank Statements | File (.pdf .doc .docx .jpg .jpeg .png) | No | `EPM_bank_statements.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = assets 6.00 (1.35 + 3 x 0.48 + 1.70 + 1.51) + working capital 114.00 = **₹120.00 lakh** (land, building, furniture, pre-operative hidden = 0). Means of finance = own 30.00 + grant 0.00 + bank loan 90.00 + other 0.00 = **₹120.00 lakh** (exact). Own money 30 / 120 = 25%; debt-equity = 90.00 / (30.00 + 0.00) = **3.00**, exactly at the 3:1 ceiling, so it passes (blocks only above 3). The bank loan equals the export credit sought, 90.00. Repayment months = 12 - 0 = 12; EMI at 9.5% = 7.89 lakh a month (about ₹7,89,152), 94.70 lakh a year. Interest at 9.5% on 90.00 for 12 months is about 8.55 lakh. Yearly costs 532.54 against sales 560.00 give EBITDA 27.46 lakh. Expected advisory when generating: "The term loan (₹90.00 lakh) is more than the assets and set-up costs it pays for (₹6.00 lakh)." because the form has no working-capital-loan input; click "This is correct" on it, or "Generate anyway" (the DSCR and cash notes belong to the Financial viability step, which this pack does not have, so they stay hidden).
- **Uploads to prepare:** IEC Certificate -> `EPM_iec_certificate.pdf`; Shipping / LC / Export Evidence -> `EPM_shipping_lc_export_evidence.pdf`; Udyam Certificate -> `EPM_udyam_certificate.pdf`; Bank Statements -> `EPM_bank_statements.pdf`. Four slots, all always shown, none required.
- **Generate & verify:** Review dialog shows exactly **one advisory** (term loan higher than assets) and no "Must fix first" items; click "This is correct" on it (or "Generate anyway") to continue. Preview has **7 sections**. Cover: "DETAILED PROJECT REPORT", "Establishment of" (not "Upgradation": wording gap for an existing exporter), `Sri Lakshmi Venkateswara Chilli Exports`, "under 'EPM Niryat Protsahan (export interest support)'", District Guntur, Location Guntur, Entrepreneur name Vemuri Srinivasa Rao. Step 1 section: Export markets, HSN lines, Pre / post shipment "Both pre + post", Export credit sought (₹ Lakhs) 90, Entrepreneur name. Step 4 shows Working capital 114 and the Assets list (4 rows, total 6); Step 5 shows 30 / 0 / 90 / 0 with Indian Bank, 9.5, 0, 12; Step 6 shows Cost of goods bought for resale 478, wages 24.24, sales 560, volume 279. PDF and DOCX match.
- **Negative / boundary tests:**
  1. Step 5: Promoter `29`, Bank Loan `91` (own 24.17%, total 120.00) -> blocker "Bank debt is 3.14 times your own money plus subsidy. The most allowed is 3 to 1." (debt-equity 91 / 29 = 3.14). Back to `30` / `90` (exactly 3.00) clears it: the boundary is "more than 3".
  2. Step 5: Promoter `20`, Bank Loan `100` -> blocker "Bank debt is 5 times your own money plus subsidy. The most allowed is 3 to 1."; Promoter `12`, Bank Loan `108` (own 10.00%) -> only the debt-equity blocker ("Bank debt is 9 times your own money plus subsidy. The most allowed is 3 to 1."). A 100% pre-shipment credit plan is therefore impossible, which real export credit can be.
  3. Step 5: Bank Loan `91` with Promoter `30` (funding 121.00 vs cost 120.00) -> blocker "The funding adds up to ₹121.00 lakh but the project cost is ₹120.00 lakh. They must match exactly (difference ₹1.00 lakh)."
  4. Step 5: Loan tenure `6` -> advisory "A loan period of 6 months is unusual. Most term loans run 36 to 84 months." (rate `9.5` fine; `18` -> advisory about unusual rate). Neither blocks.
  5. Step 3: GSTIN `37AABCV7204D1ZM` -> "The last character does not match"; Udyam `UDYAM-AP-10-98417` -> format error and Next is blocked; Firm PAN `AABPV7204D` (4th letter P) -> rejected.
  6. Step 1: Export credit sought `90000` (rupees) -> accepted without a warning, because the field is not in the rupee-detection list (gap); restore `90`. Clear Location and press Next -> "Fill the required fields before continuing: Location".
- **Discrepancies spotted:**
  1. The pack applies the generic project-cost model: Step 4 "Export credit / WC need" is the ordinary "Total Project Cost" page (assets list + working capital), and Step 5 applies the generic 10% own-money and 3:1 debt-equity blockers, which reject a typical 75-100% bank-funded export credit. There is no export-credit rule, no interest-subvention (2.75%) calculation and no link between "Export credit sought" and the bank loan.
  2. The finance model treats the whole bank loan as a term loan (no working-capital-loan input), so every export-credit plan raises the advisory "term loan is more than the assets and set-up costs"; the month-based loan terms (tenure, moratorium) do not fit revolving credit.
  3. The wrong-scheme note "Heavy capex tables are hidden for Mudra Shishu / Kishore" appears on Step 4. "Export credit sought" is not covered by the rupee-detection data check.
  4. The cover action line says "Establishment of" for an existing exporter; no step collects an export-order, IEC number or LC detail even though the IEC and shipping evidence uploads are listed.
  5. Step 3 "Firm / proprietor name *" asterisk is not enforced; its auto-fill uses the unit name (EPM_NIRYAT missing from `LEAN_FIRM`). `dates.order` never fires.

## 20. RAMP TEAM (ONDC) (`RAMP_TEAM`)
**Entry:** `/individual-dpr/create?new=true&scheme=RAMP_TEAM` (or pick the scheme card on the Create New Latest DPR picker); on the brief screen click **Start DPR steps**. **Total steps:** 8 (code `RAMP_TEAM_STEPS`; spec and brief say 5). Step titles on screen: Step 1: Cover & scheme inputs; Step 2: Unit / product profile; Step 3: Market / need; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Tadikonda Sravani (age 33, B.Sc Home Science, woman entrepreneur) runs **Amma Vantalu Home Foods**, a sole proprietorship at **Bhavanipuram, Vijayawada (NTR district)**. Since January 2023 she has made mango avakaya, gongura pickle and kandi podi in a rented kitchen unit with four women workers and sold through WhatsApp groups and two city stores. She plans to list 28 SKUs on ONDC and needs a small jar-filling and sealing set-up plus working capital. Business kind **Making things**. Mandal / village is not an input; it goes only in the Step 4 address. This pack has no sector story, location, premises, viability or schedule step.

Conventions as in 14. Only Step 1 has required fields (Unit / Project Name, District, Location).

### Step 1 — Cover & scheme inputs
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Amma Vantalu Home Foods` | Required: blocks Next (field gets a red ring and "Required"). It becomes the cover title in the live preview and PDF. The "Suggest title" button is optional; do not use it, type the exact text. |
| 2 | District * | Select (placeholder "Select district") | Yes | `NTR` | One of the 26 AP districts. Changing the district clears Location when the town is not in the new district. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District is chosen) | Yes | `Vijayawada` | Town must belong to the district. Options: Vijayawada, Jaggayyapeta, Nandigama, Tiruvuru, Kondapalli, Ibrahimpatnam, Mylavaram. |
| 4 | Nature of Business | Text input | No | `Home-style pickle and spice powder production` | Data check flags fewer than 12 characters. Do not click "Match me" (it replaces the text with a matched skill name). |
| 5 | Major Products | Text input | No | `Mango avakaya, gongura pickle, kandi podi` | Data check flags fewer than 3 characters. |
| 6 | ONDC readiness | Select (Select / Ready to onboard / already on ONDC / Planning catalogue / onboarding / Early exploration) | No | `Planning catalogue / onboarding` | Stored `planning`. |
| 7 | Catalogue SKUs (approx) | Number input | No | `28` |  |
| 8 | Entrepreneur name | Text input | No | `Tadikonda Sravani` | Shown on the cover. |
| 9 | Product list note | Textarea (expandable) | No | `28 SKUs: 12 pickles in 500 g and 250 g jars, 9 podis and spice powders, 7 sweets and snacks. Photographs and HSN mapping for each SKU are pending.` | Free text, shown in the preview. |

### Step 2 — Unit / product profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea (expandable) | No | `The promoter has sold pickles and podis through WhatsApp groups and two city stores since 2023, producing about 1,200 kg a month in a rented kitchen unit with four women workers.` | Data check flags fewer than 30 characters. |
| 2 | Start Date | Date input | No | `2023-01-09` | Stored as ISO date. Must be between 1990 and 2100 ("Enter a valid date between 1990 and 2100" toast otherwise). Cannot be later than Commitment Date. |
| 3 | Commitment Date | Date input | No | `2026-10-01` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and the value is not stored. Enter Start Date first. |
| 4 | Tools / process level | Text input | No | `Semi-manual mixing and jar filling; hand sealing` |  |
| 5 | Capacity / throughput (if applicable) | Text input | No | `About 1,200 kg a month, 14,400 jars of about 400 g a year` | Placeholder "e.g. 50 kg/hour or 1000 units/month". |


**Products, share of output and selling price (product mix editor; starts with 1 empty row, click "Add product" for each further row)**

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Pickles (mango, gongura, lemon)` | `60` | `170` |
| 2 | `Podis and spice powders` | `30` | `120` |
| 3 | `Sweets and snacks` | `10` | `120` |

Selling price unit used in this test: ₹ per jar or pack. Shares add to 100. The editor does not check the 100% total or compare to sales (no validation).

Weighted price = 0.60 x 170 + 0.30 x 120 + 0.10 x 120 = ₹150 per jar or pack; 14,400 x ₹150 = ₹21.60 lakh.

### Step 3 — Market / need
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea (expandable) | No | `Online home-food buyers across India through ONDC buyer apps, households in Hyderabad and Bengaluru, and gift shops.` |  |
| 2 | Demand / footfall note | Textarea (expandable) | No | `WhatsApp and store orders have grown from 300 to 1,100 jars a month in two years. An ONDC listing would reach buyers outside Vijayawada who keep asking for shipping.` |  |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | No | `Amma Vantalu Home Foods (proprietor Tadikonda Sravani)` | AUTO: the box is pre-filled with the unit name "Amma Vantalu Home Foods"; select all and overwrite with this exact text. The asterisk is shown but the code does not enforce it (see Discrepancies). |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Sole proprietorship` | Free text. Placeholder "Sole proprietorship / partnership / company". |
| 3 | GSTIN (optional) | Text input, masked | No | `37CQRPT5390L1ZP` | Auto-uppercased, 15 characters. Valid state code, PAN pattern and check character are verified (this value passes). It is also read by the "Details carried to this schedule" block on the cost and finance steps (Steps 5-6). |
| 4 | Firm PAN (optional) | Text input, masked | No | (leave blank) | Leave blank: a sole proprietor has only a personal PAN (4th letter P), which the app refuses to store. Typing a P-type PAN here shows an error. |
| 5 | Udyam registration number (optional) | Text input, masked | No | `UDYAM-AP-11-0187263` | Hyphens are added automatically. Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | Text input, masked | No | `8309276541` | 10 digits starting with 6, 7, 8 or 9. |
| 7 | Correspondence address | Textarea (expandable) | No | `Flat 302, Sri Sai Residency, Bhavanipuram, Vijayawada, NTR district, Andhra Pradesh – 520 012` | AUTO: starts as "<Location>, <District>" (for example "Vijayawada, NTR"); replace it with the full address. |

### Step 5 — Project cost
Top: read-only "Details carried to this schedule" block, optional "Work out working capital" button, the wrong-wording grey note ("Heavy capex tables are hidden for Mudra Shishu / Kishore...") and the business-kind picker. Land, Building, Furniture and Pre-operative are hidden for this scheme.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Making things` | Auto-guess is usually "Making things" for this text; still select it explicitly so the machinery table is shown. |
| 2 | Working capital (₹ Lakhs) | Number input | No | `1.9` | Jars, caps, raw mango and spices for about 2 months. |


**Machinery list (starts empty: click "Add machinery" once per row; Condition select = New / Used)**

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Semi-automatic jar filling and capping machine` | `New` | `Sri Ganesh Food Machines, Hyderabad` | `1` | `1.8` | 1.80 |
| 2 | `Induction cap sealer` | `New` | `Sri Ganesh Food Machines, Hyderabad` | `1` | `0.65` | 0.65 |
| 3 | `Spice pulveriser (5 HP)` | `New` | `Venkateswara Industries, Vijayawada` | `1` | `1.05` | 1.05 |
| 4 | `Packing table with weighing scale` | `New` | `Venkateswara Industries, Vijayawada` | `1` | `0.6` | 0.60 |

Machinery total = 4.10 lakh. AUTO: as soon as any row has a description or unit cost the hidden "machinery" amount is set to this total (the direct machinery input is hidden for these schemes), so it is included in "Total Project Cost".

AUTO – "Total Project Cost" must read **₹ 6 Lakhs** (machinery 4.10 + working capital 1.90).

### Step 6 — Means of finance
Top: "Details carried to this schedule" block and optional buttons.

| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name | Text input | No | `Canara Bank, Bhavanipuram branch` | In the "Term loan terms" box above the money fields. |
| 2 | Interest rate (% per year) | Number input | No | `10.5` | Data check flags rates below 6 or above 16. |
| 3 | Moratorium (months) | Number input | No | `6` | Must be below the loan tenure (check "The grace period ... is as long as, or longer than, the whole loan period"). |
| 4 | Loan tenure (months) | Number input | No | `60` | Data check flags below 12 or above 180 months. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number input | No | `2` | Minimum 10% of project cost once a bank loan exists (blocks Generate). |
| 6 | Government Grant (₹ Lakhs) | Number input | No | `0` | RAMP TEAM is not a capital subsidy; keep 0. |
| 7 | Bank Loan (₹ Lakhs) | Number input | No | `4` | Whole bank money is treated as a term loan (there is no working-capital-loan input). |
| 8 | Other Sources (₹ Lakhs) | Number input | No | `0` |  |

AUTO – "Total Finance" must read **₹ 6 Lakhs**.

### Step 7 — Operating cost & sales

**Raw materials (editor starts empty: click "Add raw material" per row)**

| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Raw mango, gongura and spices` | `Pickle and podi base` | `Bought weekly from Vijayawada market and Guntur spice dealers` |
| 2 | `Jars, caps and labels` | `Retail packing` | `Monthly from a Hyderabad packaging supplier` |
| 3 | `Courier cartons and tamper seals` | `Dispatch for ONDC orders` | `Monthly from a local carton maker` |



**Staff by role and monthly pay (editor starts empty: click "Add role" per row)**

| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Production workers` | `3` | `7500` |
| 2 | `Packing and dispatch helper` | `1` | `7500` |


| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | Number input | No | `10.8` | About 50% of sales. |
| 2 | Power Cost (₹ Lakhs) | Number input | No | `0.6` |  |
| 3 | Wages (₹ Lakhs) | Number input | No | `3.6` | Annual: ₹30,000 a month x 12 = ₹3.60 lakh. |
| 4 | Maintenance (₹ Lakhs) | Number input | No | `0.3` |  |
| 5 | Administrative Expenses (₹ Lakhs) | Number input | No | `1.2` |  |
| 6 | Marketing Expenses (₹ Lakhs) | Number input | No | `2.2` |  |
| 7 | Annual Production Volume | Number input | No | `14400` | Unit used in this test: jars and packs. 1,200 kg a month = 14,400 jars of about 400 g. |
| 8 | Annual Sales Realization (₹ Lakhs) | Number input | No | `21.6` | 14,400 x ₹150 = 21.60 lakh. |

Operating check: yearly costs 18.70 lakh against sales 21.60 lakh, so no "costs higher than sales" note (EBITDA 2.90 lakh).

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `RAMP_udyam_certificate.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 2 | Product List / Catalogue Draft | File (.pdf .doc .docx .jpg .jpeg .png) | No | `RAMP_product_catalogue_draft.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |
| 3 | Aadhaar / PAN | File (.pdf .doc .docx .jpg .jpeg .png) | No | `RAMP_aadhaar_pan.pdf` | Always shown. After upload the label shows "✓ Uploaded: <file name>". Use a genuine small PDF (the app checks file content; up to 50 MB on the server). |


- **Money cross-check:** Project cost = machinery 4.10 (1.80 + 0.65 + 1.05 + 0.60) + working capital 1.90 = **₹6.00 lakh**. Means of finance = own 2.00 + grant 0.00 + bank loan 4.00 + other 0.00 = **₹6.00 lakh** (exact). Own money 2.00 / 6.00 = 33.33%; debt-equity = 4.00 / (2.00 + 0.00) = 2.00 (ceiling 3.00). Repayment months = 60 - 6 = 54; EMI at 10.5% = 0.09 lakh a month (about ₹9,326), 1.12 lakh a year. Loan 4.00 is below the machinery 4.10, so no "term loan too high" note. Yearly costs 18.50 against sales 21.60 (EBITDA 3.10 lakh). Model check (not shown in this pack): average DSCR 2.5.
- **Uploads to prepare:** Udyam Certificate -> `RAMP_udyam_certificate.pdf`; Product List / Catalogue Draft -> `RAMP_product_catalogue_draft.pdf`; Aadhaar / PAN -> `RAMP_aadhaar_pan.pdf`. Three slots, all always shown, none required.
- **Generate & verify:** No "Must fix first", no advisory notes. Preview has **8 sections** (the code catalog), not 5. Cover: "DETAILED PROJECT REPORT", "Establishment of", `Amma Vantalu Home Foods`, "under 'RAMP TEAM (sell on ONDC)'", District NTR, Location Vijayawada, Entrepreneur name Tadikonda Sravani. Step 1 section: ONDC readiness "Planning catalogue / onboarding", Catalogue SKUs (approx) 28, Entrepreneur name, Product list note. Step 5: Machinery / equipment 4.1, Working capital 1.9 and the 4-row machinery list; Step 6: 2 / 0 / 4 / 0 with Canara Bank, 10.5, 6, 60; Step 7: Raw Material Cost 10.8, Wages 3.6, Sales 21.6. PDF and DOCX match.
- **Negative / boundary tests:**
  1. Step 6: Bank Loan `4.5` (funding 6.50 vs cost 6.00) -> blocker "The funding adds up to ₹6.50 lakh but the project cost is ₹6.00 lakh. They must match exactly (difference ₹0.50 lakh).".
  2. Step 6: Promoter `1.4`, Bank Loan `4.6` (own 23.33%, debt-equity 3.29) -> blocker "Bank debt is 3.29 times your own money plus subsidy. The most allowed is 3 to 1.".
  3. Step 6: Promoter `1.5`, Bank Loan `4.5` -> exactly 3.00 and own 25%: **no blocker**; only the generic advisory "The term loan (₹4.50 lakh) is more than the assets and set-up costs it pays for (₹4.10 lakh)." appears (boundary passes). Restore 2.00 / 4.00.
  4. Step 5: lower the first machinery row (filling and capping machine) unit cost to `0.9` (machinery total 3.20) and raise Working capital to `2.8` (cost stays 6.00), leaving Bank Loan at 4.00 -> advisory "The term loan (₹4.00 lakh) is more than the assets and set-up costs it pays for (₹3.20 lakh)." (generic note, never blocks). Restore `1.8` and `1.9`.
  5. Step 1: Catalogue SKUs `28.5` -> accepted (no integer check); ONDC readiness left on "Select" -> accepted. Step 4: mobile `830927654` (9 digits) -> "Mobile number has 10 digits (1 more)." and Next is blocked; Firm PAN `CQRPT5390L` (4th letter P) -> rejected as an individual PAN.
  6. Step 2: Start Date `2023-01-09` and Commitment Date `2022-12-01` -> toast "Commitment Date must be on or after Start Date". Clear District and press Next on Step 1 -> "Fill the required fields before continuing: District, Location" (changing the district also clears the town).
- **Discrepancies spotted:**
  1. Step count: `RAMP_TEAM_STEPS` has **8** steps (cover, unit, market, applicant, cost, finance, operating, uploads); `rampTeam.md`, the header of `rampTeamQuestions.ts`, `RAMP_TEAM_IMPACT_BULLETS` and the brief say 5, and the spec puts the uploads at Step 5.
  2. Spec and impact bullet say "Not a machinery subsidy — use a loan DPR separately", yet the pack asks for a machinery list, bank loan terms and means of finance and applies the generic 10% / 3:1 finance blockers, with no ONDC- or RAMP-specific rule or grant.
  3. Step 5 shows the grey note "Heavy capex tables are hidden for Mudra Shishu / Kishore" for a RAMP TEAM draft. Land, Building, Furniture and Pre-operative are hidden although the Step 5 page is the full project-cost page.
  4. `productListNote` and `catalogueSkus` are shown in the preview but nothing checks that the SKU count matches the note or the product mix. The Step 4 "Firm / proprietor name *" asterisk is not enforced; its auto-fill uses the unit name (RAMP_TEAM missing from `LEAN_FIRM`). `dates.order` never fires.

---

## 21. ASPIRE — Promotion of Innovation, Rural Industries and Entrepreneurship (`ASPIRE`)

**Entry:** `/individual-dpr/create?new=true&scheme=ASPIRE` (or pick the card "ASPIRE — Promotion of Innovation, Rural Industries and Entrepreneurship" on the scheme grid) -> scheme brief screen -> click **Next** to open the form. **Total steps:** 11 (code: `ASPIRE_STEPS`; the spec doc, the yellow scheme-impact bar and the brief all say "10" — see Discrepancies). **Test persona:** Smt. Killo Sunitha (age 31), a Girijan woman from the coffee belt, starts a micro unit that roasts and grinds Araku coffee and sells it in 250 g / 500 g pouches. Unit: **Araku Hills Coffee Roasters**, district Alluri Sitharama Raju, town Araku Valley (Araku mandal), sole proprietorship, rented 400 sq ft shed, incubated by the Paderu Livelihood Business Incubator. Greenfield, Start 2026-11-02. Optional AI "Fill this step" / "Suggest title" / "Match me" buttons exist — ignore them, type the values below.

### Step 1 — Cover & incubator
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Araku Hills Coffee Roasters` | Blocks Next if empty. "Suggest title" button optional (needs Nature + Products first). |
| 2 | District * | select (26 AP districts) | Yes | `Alluri Sitharama Raju` | Changing district clears Location if the town is not in the new district. |
| 3 | Location * | select (towns of chosen district; disabled until district chosen, placeholder "Select district first") | Yes | `Araku Valley` | There is no mandal/village input anywhere; mandal goes in the Step 11 address. |
| 4 | Nature of Business | text (skill-match input) | No | `Roasting and grinding of Araku green coffee beans with pouch packing` | "Match me" is optional; if it rewrites the text, retype. |
| 5 | Major Products | text | No | `Araku roast and ground coffee in 250 g and 500 g pouches` | |
| 6 | Incubator / LBI name | text | No | `Paderu Livelihood Business Incubator (LBI), Girijan Cooperative Corporation` | Panel header reads "ASPIRE — incubator & livelihood" plus a line "Spec: docs/schemes/ASPIRE/aspire.md" (internal text visible in UI). |
| 7 | Premises type | select: Incubator / LBI space; Home / village workplace; Rented shed / shop; Other | No | `Rented shed / shop` | Stored as `rented`. Not shown in the generated document (see Discrepancies). |
| 8 | Entrepreneur name | text | No | `Killo Sunitha` | Appears on the cover meta line "Entrepreneur name"; also auto-copies into Step 11 firm name. |
| 9 | Age | number, min 18, max 100 | No | `31` | Under 18 blocks saving (toast: "This site makes bank and scheme DPRs. The person named as the entrepreneur must be 18 or older...") . |
| 10 | Innovation / livelihood brief | textarea | No | `Women-led micro unit that buys parchment-grade Araku coffee beans directly from 40 Girijan farmer families, roasts them in small batches and sells ground coffee in branded pouches through tribal cooperative outlets, tourist shops and online, so that the farmers earn the value-addition margin that now goes to traders.` | One input writes two stored fields (`innovationBrief` and `livelihoodFocus`). |

### Step 2 — Innovation / livelihood story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Agro-based food processing (coffee)` | Required; blocks Next. |
| 2 | Short intro — what the unit does | textarea | Yes | `Araku coffee roasting and grinding unit that buys beans from tribal farmer groups and sells packed ground coffee to cooperative outlets, hotels, homestays and online buyers.` | Required. Data check flags under 30 characters as "very short". |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is at Araku Valley town on the Visakhapatnam-Araku road, about 115 km from Visakhapatnam. Coffee-growing villages of Araku and Ananthagiri mandals lie within 30 km. Weekly tribal market, tourist footfall and GCC retail outlets are within 2 km.` | Only field on this step. |

### Step 4 — Unit / livelihood profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Proposed unit: roast 5 kg batches of green coffee in a drum roaster, grind in a 1 HP pulveriser, weigh and heat-seal into 250 g and 500 g pouches. Two women employed.` | |
| 2 | Start Date | date | No | `2026-11-02` | Must be 1990-01-01 to 2100-12-31 (toast "Enter a valid date between 1990 and 2100"). Must be on or before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-11-16` | Rejected with toast "Commitment Date must be on or after Start Date" if earlier than Start Date. |
| 4 | Tools / process level | text | No | `Semi-automatic small drum roaster, 1 HP pulveriser, manual heat-sealing` | |
| 5 | Capacity / throughput (if applicable) | text | No | `5 kg per batch; about 4 kg roasted coffee per hour; 1,200 kg per year` | |

Sub-table — heading "Products, share of output and selling price" (one blank row shows by default; use **Add product** for the second):
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Araku roast and ground coffee, 250 g pouch` | `60` | `275` (Rs per pouch) |
| 2 | `Araku roast and ground coffee, 500 g pouch` | `40` | `520` (Rs per pouch) |

No validation that shares total 100; keep them at 100.

### Step 5 — Market & offtake
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Tourists and local families at Araku Valley, GCC retail outlets, hotels and homestays at Araku, and online customers through the farmers' producer group page.` | |
| 2 | Demand / footfall note | textarea | No | `About 4 lakh tourists visit Araku every year. GCC outlets and three hotels have indicated a purchase of 150 kg a month; about 40 online enquiries a month.` | |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | text | Yes | `Rented roasting shed, Bus Stand Road, Araku Valley` | Required (marked *). |
| 2 | Premises note (own / lease / rent) | textarea | No | `Rented shed of 400 sq ft at Rs 6,000 per month on a 5-year rent agreement from Sri Killo Ramu; 3-phase power connection available.` | |
| 3 | Power requirement (HP / kW) — optional | text | No | `6 kW` | Stored in Step 10 bucket `powerRequirements`; not in the document. |

(No Premises select appears on this step for ASPIRE; the premises choice is on Step 1.)

### Step 7 — Applicant
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk shown, not enforced | AUTO – verify shows `Killo Sunitha` | Copied from Step 1 Entrepreneur name until typed over; note under it: "Filled in from your unit details. Change it if the applicant is different." Leave as is. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text, masked 15 chars | No | leave blank | Blank passes. (Wrong values tested in negative tests.) |
| 4 | Firm PAN (optional) | text, masked | No | `AAHFK4821M` | 4th letter F = firm. A 4th letter P (personal) is rejected. |
| 5 | Udyam registration number (optional) | text, auto hyphens | No | `UDYAM-AP-01-0052764` | Format UDYAM-XX-00-0000000. |
| 6 | Contact mobile number (optional) | text, 10 digits | No | `9440218763` | Must start 6-9. |
| 7 | Correspondence address | textarea | No | `Door No. 4-17, Bus Stand Road, Araku Valley, Araku mandal, Alluri Sitharama Raju district, Andhra Pradesh - 531149` | AUTO starts as `Araku Valley, Alluri Sitharama Raju`; replace it with the full address (note says "Started from your town and district. Add the full street address."). |

### Step 8 — Light project cost
Top of page: read-only card "Details carried to this schedule" (Promoter / applicant = Killo Sunitha, Unit = Araku Hills Coffee Roasters, Address = the Step 7 address, GSTIN = "Not entered yet"). Buttons "Work out working capital" (optional calculator). Text: "Heavy capex tables are hidden for Mudra Shishu / Kishore. Enter machinery and working-capital margin only." (wording wrong for ASPIRE; see Discrepancies). Land, building, furniture and pre-operative boxes are hidden.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select: Making things / A service / Buying and selling | No | `Making things` | Set it explicitly (otherwise guessed from your words). Making things shows the Machinery list; the other two show an Assets list instead. |
| 2 | Working capital (₹ Lakhs) | number | No | `1.50` | Rs lakh. |
| – | (no direct machinery box) | – | – | AUTO | Machinery total = sum of list rows (qty x unit cost). |

Sub-table — heading "Machinery list" (click **Add machinery** for each row; each row has Description, Condition, Supplier, Qty, Unit cost (₹ Lakhs)):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Drum coffee roaster, 5 kg per batch, LPG fired` | New | `Sri Ganesh Agro Engineering, Visakhapatnam` | `1` | `1.85` | 1.85 |
| 2 | `Coffee grinder / pulveriser, 1 HP` | New | `Sri Ganesh Agro Engineering, Visakhapatnam` | `1` | `0.62` | 0.62 |
| 3 | `Pouch heat-sealing machine, 300 mm` | New | `Vijaya Packaging Machines, Vijayawada` | `1` | `0.28` | 0.28 |
| 4 | `Digital weighing scale, 30 kg` | New | `Vijaya Packaging Machines, Vijayawada` | `2` | `0.075` | 0.15 |

AUTO – verify bottom bar "Total Project Cost" shows `₹ 4.4 Lakhs` (2.90 machinery + 1.50 working capital).

### Step 9 — Means of finance
Read-only "Details carried to this schedule" card; buttons "Split the funding" and "Loan instalment and DSCR" (optional). A "Term loan terms" box precedes the money fields.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `State Bank of India, Araku Valley branch` | |
| 2 | Interest rate (% per year) | number | No | `10.5` | Advisory if under 6 or over 16. |
| 3 | Moratorium (months) | number | No | `3` | Must be shorter than the loan tenure. |
| 4 | Loan tenure (months) | number | No | `60` | Advisory if under 12 or over 180. |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No (but must balance) | `1.50` | Rs lakh. |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No ASPIRE grant rule exists in code; keep 0. |
| 7 | Bank Loan (₹ Lakhs) | number | No (but must balance) | `2.90` | Rs lakh. |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

AUTO – verify "Total Finance" shows `₹ 4.4 Lakhs`.

### Step 10 — Operating cost & sales
Two repeating blocks come first, then the money fields (all Rs lakh per year except volume).
Sub-table — "Raw materials" (Add raw material; columns Material / Use / How it is bought):
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Green Araku coffee beans (parchment-processed)` | `Roasting and grinding` | `Directly from farmer groups at Rs 480 per kg in lots of 200 kg` |
| 2 | `Laminated zip pouches, 250 g and 500 g` | `Packing` | `5,000 pieces per order from a Visakhapatnam supplier` |

Sub-table — "Staff by role and monthly pay" (Add role; columns Role / Number of people / Monthly pay (₹)):
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Roaster-cum-operator` | `1` | `9000` |
| 2 | `Packing helper` | `1` | `6000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `7.32` | 6.86 beans (1,430 kg x Rs 480) + 0.46 pouches. |
| 2 | Power Cost (₹ Lakhs) | number | No | `0.24` | |
| 3 | Wages (₹ Lakhs) | number | No | `1.80` | = (9,000 + 6,000) x 12; not auto-linked to the staff table. |
| 4 | Maintenance (₹ Lakhs) | number | No | `0.12` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `0.90` | Includes rent 0.72. |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `0.40` | |
| 7 | Annual Production Volume | number | No | `1200` | kg of roasted coffee. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `12.90` | 720 kg at Rs 1,100/kg + 480 kg at Rs 1,040/kg is about 12.91; keep 12.90. Costs 10.78 < sales (otherwise "yearly costs above sales" advisory). |

### Step 11 — Documents & uploads
Slots (each is a file input, accepts .pdf .doc .docx .jpg .jpeg .png; after upload a green line "✓ Uploaded: <name>" appears):
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Rural / Village Address Proof | file | No | `ASPIRE_rural_address_proof_Araku.pdf` | |
| 2 | Concept / Innovation Note | file | No | `ASPIRE_concept_note_coffee_roasting.pdf` | |
| 3 | Udyam Certificate (or application) | file | No | `ASPIRE_udyam_certificate.pdf` | |
| 4 | Aadhaar / PAN | file | No | `ASPIRE_aadhaar_card_masked.jpg` | Aadhaar/PAN numbers are not stored; only the file reference. |

- **Money cross-check:** Project cost = machinery 1.85 + 0.62 + 0.28 + (2 x 0.075 = 0.15) = 2.90, + working capital 1.50 = **4.40 lakh**. Means of finance = own 1.50 + grant 0 + bank 2.90 + other 0 = **4.40** (must equal cost to the 0.01 lakh, not just within 1%). Own money 34.1% (minimum 10%); debt-equity 2.90 / 1.50 = 1.93 (ceiling 3). Term loan 2.90 <= asset cost 2.90, so no "term loan higher than assets" note. EMI at 10.5%, 60 months on 2.90 lakh = Rs 6,233 a month (Rs 0.75 lakh a year). Engine average DSCR about 2.5 (not shown in this scheme's form; no viability step). Year-1 costs 10.78 vs sales 12.90.
- **Uploads to prepare:** the four slots above (always shown; no conditions).
- **Generate & verify:** On Step 11 the button is **Generate DPR**. With a clean draft no review dialog should appear (if "Check my answers" lists items, read them; "Generate anyway" proceeds). Preview opens at `/dpr/view/<id>`. Cover shows: DETAILED PROJECT REPORT / On / Establishment of / ARAKU HILLS COFFEE ROASTERS / under 'ASPIRE'; meta District = Alluri Sitharama Raju, Location = Araku Valley, Entrepreneur name = Killo Sunitha. Table of contents lists up to 11 sections: Cover & incubator; Innovation / livelihood story; Location; Unit / livelihood profile; Market & offtake; Premises; Applicant; Light project cost; Means of finance; Operating cost & sales; Documents & uploads. Final preview drops sections with no answers, so with all four uploads done you must see 11. Check: project cost table lists "Machinery / equipment (₹ Lakhs)" 2.9 and "Working capital (₹ Lakhs)" 1.5 plus the Machinery list rows; "Applicant details for this schedule" table (Promoter / applicant, Unit, Address, GSTIN) at the top of the cost and finance sections; Operating section shows the 2 raw-material rows and 2 staff rows; Step 1 section shows the brief (see duplicate row below). Downloads PDF/DOCX/XLS are English only.
- **Negative / boundary tests:**
  1. Step 1: clear Unit / Project Name and press Next -> toast "Fill the required fields before continuing: Unit / Project Name"; the field gets a red ring and "Required".
  2. Step 1: Age `17` -> red toast with the guardian message and the draft cannot be saved (Save Draft fails; autosave silent-fails). Age `101` is outside the max 100 attribute.
  3. Step 4: Commitment Date `2026-10-30` with Start Date `2026-11-02` -> value refused, toast "Commitment Date must be on or after Start Date"; Start Date `1985-05-01` -> toast "Enter a valid date between 1990 and 2100".
  4. Step 7: Firm PAN `ABCPK1234F` -> inline error / Next blocked ("Individual PANs are not stored. Enter the firm/company PAN or leave blank."); Udyam `UDYAM-AP-1-52` -> "Use the form UDYAM-AP-01-0001234."; mobile `5440218763` -> "An Indian mobile number starts with 6, 7, 8 or 9."
  5. Step 9: bank loan `2.89` (sum 4.39) -> Generate blocked, dialog "Must fix first": "The funding adds up to ₹4.39 lakh but the project cost is ₹4.40 lakh. They must match exactly (difference ₹0.01 lakh)." Also own `0.30` + bank `4.10` -> two blockers: own money 6.82% below the 10% minimum, and debt 13.67 times own money (ceiling 3 to 1).
  6. Step 10: Annual Sales `9` (costs 10.78) -> advisory "Your yearly costs (₹10.78 lakh) are higher than your yearly sales (₹9 lakh)"; this is a note, not a block ("This is correct" dismisses it). Step 8: type `250000` in a machinery unit cost -> advisory "An amount of ... lakh ... Did you type rupees instead of lakhs?".
- **Discrepancies spotted:**
  1. Step count: spec `docs/schemes/ASPIRE/aspire.md`, `docs/create-new-dpr-business-logic.md`, `ASPIRE_IMPACT_BULLETS` ("Own 10-step ... Step 10: rural address proof") and the scheme brief all say 10 steps; `ASPIRE_STEPS` has 11 (Operating cost & sales was added). The uploads step is Step 11, not 10.
  2. Duplicate row: `ASPIRE_EXTRA_FIELDS` lists both `innovationBrief` and `livelihoodFocus`, both labelled "Innovation / livelihood brief" in `individualDocModel.ts`, so the document and progress stepper show the same brief twice.
  3. Premises type (Step 1 select) is stored but never rendered in the live document/PDF (step 1 skip-list and no extras on the premises section).
  4. Step 8 hint says "...hidden for Mudra Shishu / Kishore" although the scheme is ASPIRE (shared string).
  5. Firm / proprietor name shows a required asterisk but is not in the required-field rules (`requiredStepFields.ts`), so it is not enforced.
  6. Internal path text "Spec: docs/schemes/ASPIRE/aspire.md" is visible on the Step 1 panel.
  7. (Shared) `dataChecks.ts` "Production is shown starting before the investment is committed" reads `step4.startDate`, a field these packs never store (the form stores `yearOfEstablishment`), and its direction (start < commitment) is the opposite of the form rule, so the check can never fire.

---

## 22. National Handloom Development Programme (`NHDP`)

**Entry:** `/individual-dpr/create?new=true&scheme=NHDP` (card "National Handloom Development Programme (NHDP)") -> brief -> **Next**. **Total steps:** 11 (code `NHDP_STEPS`; spec and impact bar say 10). **Test persona:** Pothula Narasimhulu, a master weaver of Dharmavaram, member of Dharmavaram Handloom Weavers Co-operative Society Ltd, expands from 2 to 5 pit looms (3 new looms with 480-hook jacquard) to weave Dharmavaram pure silk sarees with zari borders. Unit: **Sri Narasimha Handloom Silk Weavers**, district Sri Sathya Sai, town Dharmavaram, sole proprietorship, home loom shed in Weavers Colony. Start 2026-11-09. There is no age field on this form.

### Step 1 — Cover & loom eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Narasimha Handloom Silk Weavers` | Blocks Next if empty. |
| 2 | District * | select | Yes | `Sri Sathya Sai` | |
| 3 | Location * | select | Yes | `Dharmavaram` | |
| 4 | Nature of Business | text | No | `Handloom weaving of Dharmavaram pure silk sarees on pit looms with jacquard` | |
| 5 | Major Products | text | No | `Dharmavaram pure silk sarees with zari borders` | |
| 6 | Loom type | select: Pit loom; Frame loom; Jacquard / semi-automatic; Other | No | `Pit loom` | Panel header "NHDP — loom & weaver". |
| 7 | Weaver ID / corp membership | text | No | `HLW-AP-SSS-004712 / DHWCS Member No. 218` | Upload slot with the same key can overwrite this (see Discrepancies). |
| 8 | Workplace | select: Home loom shed; Weavers’ colony / co-op shed; Rented workplace; Other | No | `Home loom shed` | Stored `home`. Not shown in the document. |
| 9 | Product line | text | No | `Pure silk sarees, 5.5 m with 0.8 m blouse piece, zari and temple borders` | |
| 10 | Yarn source | text | No | `Mulberry silk warp and weft from Hindupur reeling units; zari from Surat dealer; local dyeing` | |
| 11 | Weaver name | text | No | `Pothula Narasimhulu` | Cover meta shows it as "Entrepreneur name". |

### Step 2 — Handloom / process story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Handloom textiles (silk sarees)` | Required. |
| 2 | Short intro — what the unit does | textarea | Yes | `Weaving of Dharmavaram pure silk sarees with zari borders on pit looms with jacquard, sold through the weavers' co-operative society and retail showrooms in Hyderabad and Bengaluru.` | Required; at least 30 characters to avoid the "very short" note. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is in Weavers Colony, Dharmavaram, 2 km from the co-operative society showroom and 8 km from Dharmavaram railway station. Silk is available from Hindupur (55 km); retail demand from Hyderabad, Bengaluru and temple towns.` | |

### Step 4 — Weaver profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Weaver with 2 existing pit looms, now adding 3 pit looms with 480-hook jacquards and a warping drum to reach 120 sarees a year; two skilled weavers to be hired.` | |
| 2 | Start Date | date | No | `2026-11-09` | 1990 to 2100; on or before Commitment Date. |
| 3 | Commitment Date | date | No | `2026-11-23` | |
| 4 | Tools / process level | text | No | `Pit looms with jacquard, motorised pirn winder, drum warping` | |
| 5 | Capacity / throughput (if applicable) | text | No | `3 new looms, about 40 sarees per loom per year; 120 sarees a year` | |

"Products, share of output and selling price":
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Dharmavaram pure silk saree with zari border` | `70` | `14500` (Rs per saree) |
| 2 | `Dharmavaram pure silk saree with temple border` | `30` | `21500` (Rs per saree) |

### Step 5 — Market & offtake
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Wedding and festival buyers through the co-operative society showroom, saree dealers in Hyderabad and Bengaluru, and online handloom marketplaces.` | |
| 2 | Demand / footfall note | textarea | No | `Society showroom has taken 60 sarees a year from the unit; two Hyderabad dealers have asked for 40 sarees a year; wedding-season demand exceeds supply from October to March.` | |

### Step 6 — Workplace / loom shed
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | text | Yes | `Home loom shed, Door No. 8-112, Weavers Colony, Dharmavaram` | Required. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Own loom shed of 600 sq ft attached to the house, with space for 5 pit looms and warping drum; metered power connection.` | |
| 3 | Power requirement (HP / kW) — optional | text | No | `2 kW` | |

### Step 7 — Applicant
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk only | `Sri Narasimha Handloom Silk Weavers (Prop. Pothula Narasimhulu)` | Initially AUTO `Pothula Narasimhulu`; type over it (then it stops following Step 1). |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text | No | leave blank | |
| 4 | Firm PAN (optional) | text | No | `BQTFN6139D` | |
| 5 | Udyam registration number (optional) | text | No | `UDYAM-AP-18-0017395` | |
| 6 | Contact mobile number (optional) | text | No | `9866143207` | |
| 7 | Correspondence address | textarea | No | `Door No. 8-112, Weavers Colony, Dharmavaram, Sri Sathya Sai district, Andhra Pradesh - 515671` | AUTO starts as `Dharmavaram, Sri Sathya Sai`. |

### Step 8 — Tools / WC cost
Land, building, furniture and pre-operative boxes hidden (same hint text as ASPIRE, "...Mudra Shishu / Kishore..."). "Work out working capital" calculator optional.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | |
| 2 | Working capital (₹ Lakhs) | number | No | `1.87` | Rs lakh. |

"Machinery list" (Add machinery):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Pit loom with accessories (heald frames, reeds, shuttles)` | New | `Venkateswara Loom Works, Dharmavaram` | `3` | `0.38` | 1.14 |
| 2 | `Jacquard, 480-hook, with design cards` | New | `Sri Ganesh Jacquard Works, Dharmavaram` | `3` | `0.42` | 1.26 |
| 3 | `Warping drum (mill) with creel` | New | `Venkateswara Loom Works, Dharmavaram` | `1` | `0.55` | 0.55 |
| 4 | `Motorised pirn winder` | New | `Sri Ganesh Jacquard Works, Dharmavaram` | `2` | `0.09` | 0.18 |

AUTO – verify "Total Project Cost" `₹ 5 Lakhs` (3.13 + 1.87).

### Step 9 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Andhra Pradesh Grameena Vikas Bank, Dharmavaram branch` | |
| 2 | Interest rate (% per year) | number | No | `10.5` | |
| 3 | Moratorium (months) | number | No | `3` | |
| 4 | Loan tenure (months) | number | No | `60` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No | `1.50` | |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No NHDP rate in code. |
| 7 | Bank Loan (₹ Lakhs) | number | No | `3.00` | |
| 8 | Other Sources (₹ Lakhs) | number | No | `0.50` | Society advance, interest-free. |

AUTO – "Total Finance" `₹ 5 Lakhs`.

### Step 10 — Operating cost & sales
"Raw materials":
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Mulberry silk warp and weft yarn, 20/22 denier` | `Warp and weft` | `Monthly from Hindupur silk reeling units, paid in 30 days` |
| 2 | `Zari thread, silver-gold` | `Borders and pallu` | `Quarterly from a Surat dealer, advance payment` |
| 3 | `Dyes and chemicals` | `Colouring` | `Local dyeing unit, per lot` |

"Staff by role and monthly pay":
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Skilled weaver (hired)` | `2` | `12000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `10.56` | 120 sarees x Rs 8,800. |
| 2 | Power Cost (₹ Lakhs) | number | No | `0.15` | |
| 3 | Wages (₹ Lakhs) | number | No | `2.88` | 2 x 12,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | number | No | `0.12` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `0.30` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `0.60` | |
| 7 | Annual Production Volume | number | No | `120` | sarees. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `19.92` | 84 x 14,500 + 36 x 21,500 = 19.92. Costs 14.61 < sales. |

### Step 11 — Documents & uploads
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Aadhaar | file | No | `NHDP_aadhaar_card_masked.jpg` | |
| 2 | Bank Passbook | file | No | `NHDP_bank_passbook_first_page.pdf` | |
| 3 | Weaver ID / Handloom Corp Membership | file | No | `NHDP_weaver_id_DHWCS_membership.pdf` | Do this slot LAST. It writes into the same stored key as the Step 1 text "Weaver ID / corp membership" (see Discrepancies). After uploading, go back to Step 1 and check that field. |

- **Money cross-check:** Cost = machinery 1.14 + 1.26 + 0.55 + 0.18 = 3.13, + working capital 1.87 = **5.00 lakh**. Finance = own 1.50 + grant 0 + bank 3.00 + other 0.50 = **5.00**. Own money 30% (>=10%); debt-equity 3.00 / 1.50 = 2.00. Term loan 3.00 <= asset cost 3.13 (no warning). EMI at 10.5%, 60 months on 3.00 = Rs 6,448 a month (Rs 0.77 lakh a year). Engine average DSCR about 5.8 (not shown on the form).
- **Uploads to prepare:** the three slots above, always shown.
- **Generate & verify:** Step 11 -> **Generate DPR**. Cover: Establishment of / SRI NARASIMHA HANDLOOM SILK WEAVERS / under 'National Handloom Development Programme'; meta District Sri Sathya Sai, Location Dharmavaram, Entrepreneur name Pothula Narasimhulu. Eleven sections expected (Cover & loom eligibility; Handloom / process story; Location; Weaver profile; Market & offtake; Workplace / loom shed; Applicant; Tools / WC cost; Means of finance; Operating cost & sales; Documents & uploads). Check Machinery list 4 rows, project cost 3.13 machinery + 1.87 working capital, finance total 5, loan terms, 3 raw-material rows, 1 staff row. In the Step 1 section confirm "Weaver ID / corp membership" still reads `HLW-AP-SSS-004712 / DHWCS Member No. 218` after the uploads (expected to fail, see bug) and that no "Age" line has a value.
- **Negative / boundary tests:**
  1. Step 2: leave "Short intro" empty, press Next -> blocked, "Fill the required fields before continuing: Short intro — what the unit does".
  2. Step 6: clear "Shop / shed / workplace" -> Next blocked with "Shop / shed / workplace".
  3. Step 4: Start Date `2026-11-09`, Commitment Date `2026-11-01` -> refused with "Commitment Date must be on or after Start Date"; Commitment `2101-01-01` -> "Enter a valid date between 1990 and 2100".
  4. Step 9: own `1.50`, other `0.50`, bank `3.10` -> funding 5.10 vs cost 5.00: Generate blocked ("They must match exactly (difference ₹0.10 lakh)"). Own `0.40`, bank `4.10`, other `0.50` -> own money 8% below the 10% minimum plus debt-equity 10.25 above 3.
  5. Step 7: GSTIN `37BQTFN6139D1ZA` (wrong last character; correct is `37BQTFN6139D1ZZ`) -> "The last character does not match. Check the GSTIN for a typing mistake." and Next is blocked; GSTIN `37BQTFN6139D1ZZ` passes.
  6. Step 9: interest `3` -> advisory "An interest rate of 3% is unusual"; moratorium `60` with tenure `60` -> advisory "The grace period (60 months) is as long as, or longer than, the whole loan period (60 months)". Neither blocks.
- **Discrepancies spotted:**
  1. Step count: `nhdp.md`, `NHDP_IMPACT_BULLETS` ("Own 10-step... Step 10: Weaver ID, Aadhaar, passbook"), brief and business-logic doc say 10; code has 11, uploads is Step 11.
  2. **Bug:** upload slot id `weaverId` equals the Step 1 extras field `weaverId`. `handleInputChange` routes any key in `extraFieldNames` to `schemeExtras`, so uploading the Weaver ID file overwrites the typed ID with the stringified upload object (`[object Object]`) and the slot never shows "✓ Uploaded" (it reads `step18.weaverId`). A failed upload stores the file name instead.
  3. `entrepreneurAge` is in `NHDP_EXTRA_FIELDS` and the document model lists "Age", but the NHDP form has no Age input, so that row can never be answered (and the age rule never applies).
  4. Label mismatch: form "Weaver name" vs document/cover "Entrepreneur name"; form "Workplace" (premisesType) is never rendered in the document.
  5. Step 8 hint mentions "Mudra Shishu / Kishore" (shared string), and Firm / proprietor name shows * but is not enforced.
  6. Internal text "Spec: docs/schemes/NHDP/nhdp.md" visible in the Step 1 panel; the shared `dataChecks` date-order rule never fires (see item 7 under ASPIRE).

---

## 23. Coir Vikas Yojana (`CVY`)

**Entry:** `/individual-dpr/create?new=true&scheme=CVY` (card "Coir Vikas Yojana") -> brief -> **Next**. **Total steps:** 12 (code and spec agree). **Test persona:** Kommuri Satyanarayana (existing coconut trader) sets up a new coir yarn spinning unit. Unit: **Sri Satya Sai Coir Industries**, district Dr. B.R. Ambedkar Konaseema, town Amalapuram (Mummidivaram Road coir estate), sole proprietorship, own workshed, Coir Board application in progress. Start 2026-12-01.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Satya Sai Coir Industries` | |
| 2 | District * | select | Yes | `Dr. B.R. Ambedkar Konaseema` | |
| 3 | Location * | select | Yes | `Amalapuram` | |
| 4 | Nature of Business | text | No | `Spinning of 2-ply coir yarn from white coir fibre` | |
| 5 | Major Products | text | No | `2-ply coir yarn and short coir fibre` | |
| 6 | Coir product line | text (placeholder "e.g. coir fibre, pith, mats") | No | `2-ply spun coir yarn from white fibre` | Panel header "CVY — coir unit". |
| 7 | Coir Board status | select: Registered with Coir Board; Application in progress; Not yet registered | No | `Application in progress` | Stored `applied`. |
| 8 | Premises | select: Own shed / workshed; Leased / rented; Home-based coir unit; Other | No | `Own shed / workshed` | Stored `own`; not shown in the document. |
| 9 | Entrepreneur name | text | No | `Kommuri Satyanarayana` | Cover meta. |

### Step 2 — Business / activity story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Coir and coconut-based industry` | |
| 2 | Short intro — what the unit does | textarea | Yes | `Spinning of 2-ply coir yarn from white coir fibre bought from Konaseema coconut growers; the yarn is sold to coir mat and rope makers and traders in East Godavari and Krishna districts.` | |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is on Mummidivaram Road coir estate, Amalapuram, in the middle of the Konaseema coconut belt; fibre extraction units within 15 km; NH-216 and Amalapuram bus stand 3 km; coir traders at Mandapeta and Kakinada within 60 km.` | |

### Step 4 — Unit profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Proposed unit with two motorised spinning machines, a fibre willowing machine and a winding machine; 4 workers; yarn sold in 5 kg bundles.` | |
| 2 | Start Date | date | No | `2026-12-01` | |
| 3 | Commitment Date | date | No | `2026-12-14` | |
| 4 | Tools / process level | text | No | `Motorised spinning, mechanical willowing, manual bundling` | |
| 5 | Capacity / throughput (if applicable) | text | No | `200 kg yarn per day, 300 days, 60 tonnes a year; 70% use in year 1 (42 tonnes)` | |

"Products, share of output and selling price":
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `2-ply coir yarn, per kg` | `90` | `56` (Rs per kg) |
| 2 | `Short coir fibre, per kg` | `10` | `22` (Rs per kg) |

### Step 5 — Market & sales
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Coir mat and rope manufacturers (through traders at Mandapeta and Kakinada) and local mat makers in Konaseema; yarn sold in 5 kg bundles on 15-day credit.` | |
| 2 | Demand / footfall note | textarea | No | `Two Mandapeta traders have offered to take 20 tonnes a year; local mat units need about 25 tonnes; coir yarn demand rises before the March export season.` | |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | text | Yes | `Own workshed, Plot No. 21, Coir Estate Road, Amalapuram` | Required. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Own plot of 600 sq yards; new workshed of 1,500 sq ft to be built; 3-phase power connection of 15 HP applied for.` | |
| 3 | Power requirement (HP / kW) — optional | text | No | `15 HP` | |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk only | `Sri Satya Sai Coir Industries` | Initially AUTO `Kommuri Satyanarayana`; type over. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text | No | `37AAGFC7264K1Z2` | Valid check character; uses the firm PAN below. |
| 4 | Firm PAN (optional) | text | No | `AAGFC7264K` | |
| 5 | Udyam registration number (optional) | text | No | `UDYAM-AP-07-0063148` | |
| 6 | Contact mobile number (optional) | text | No | `9704582913` | |
| 7 | Correspondence address | textarea | No | `Plot No. 21, Coir Estate Road, Mummidivaram Road, Amalapuram, Dr. B.R. Ambedkar Konaseema district, Andhra Pradesh - 533201` | AUTO starts as `Amalapuram, Dr. B.R. Ambedkar Konaseema`. |

### Step 8 — Project cost
All five cost boxes show (CVY keeps heavy capex). Read-only schedule card shows Promoter, Unit, Address and GSTIN `37AAGFC7264K1Z2`.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | |
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | `0` | Own land. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `4.50` | 1,500 sq ft at Rs 300. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `0.35` | (stored as utilitiesAndInfrastructure). |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `0.40` | |
| 6 | Working capital (₹ Lakhs) | number | No | `3.60` | |
| – | (no direct machinery box) | – | – | AUTO | Machinery total = list total. |

"Machinery list":
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Motorised coir yarn spinning machine, 2-ply, 10 spindles` | New | `Kerala Coir Machinery Co., Alappuzha` | `2` | `1.65` | 3.30 |
| 2 | `Coir fibre willowing and cleaning machine` | New | `Kerala Coir Machinery Co., Alappuzha` | `1` | `2.40` | 2.40 |
| 3 | `Yarn winding and bundling machine` | New | `Sri Lakshmi Engineering Works, Rajahmundry` | `1` | `0.85` | 0.85 |
| 4 | `7.5 HP motor with starter panel` | New | `Sri Lakshmi Engineering Works, Rajahmundry` | `1` | `0.60` | 0.60 |

AUTO – "Total Project Cost" `₹ 16 Lakhs`.

### Step 9 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Andhra Pradesh Grameena Vikas Bank, Amalapuram branch` | |
| 2 | Interest rate (% per year) | number | No | `10.75` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `72` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No | `6.00` | |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No CVY subsidy rule in code (spec says confirm live GO). |
| 7 | Bank Loan (₹ Lakhs) | number | No | `10.00` | |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

AUTO – "Total Finance" `₹ 16 Lakhs`.

### Step 10 — Operating cost & sales
"Raw materials":
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `White coconut husk fibre` | `Spinning into yarn` | `From Konaseema fibre extraction units at Rs 24 per kg, 5-tonne lots, weekly` |
| 2 | `Jute twine and bundle labels` | `Bundling` | `From Amalapuram stationers, monthly` |

"Staff by role and monthly pay":
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Machine operator` | `2` | `10000` |
| 2 | `Helper` | `2` | `8000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `11.59` | 48,300 kg fibre x Rs 24. |
| 2 | Power Cost (₹ Lakhs) | number | No | `0.96` | |
| 3 | Wages (₹ Lakhs) | number | No | `4.32` | (2 x 10,000 + 2 x 8,000) x 12. |
| 4 | Maintenance (₹ Lakhs) | number | No | `0.35` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `0.60` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `0.50` | |
| 7 | Annual Production Volume | number | No | `42000` | kg of output. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `22.09` | 37,800 x 56 + 4,200 x 22 = 22.09. Costs 18.32. |

### Step 11 — Financial viability
Shown: "Project cost ₹ 16 Lakhs" and "Equity + loan + other ₹ 16 Lakhs" cards, a full finance model panel (auto), a Year table and Break-even. Year 1 row is pre-filled from Step 10 until you edit a cell; enter every cell anyway.
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `22.09` | `11.59` | `4.32` | `0.96` | `1.20` |
| 2 | `25.40` | `13.30` | `4.54` | `1.03` | `1.95` |
| 3 | `28.20` | `14.70` | `4.76` | `1.10` | `2.60` |
| 4 | `30.50` | `15.80` | `5.00` | `1.16` | `3.05` |
| 5 | `32.00` | `16.60` | `5.25` | `1.22` | `3.40` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `42` | Fixed 5.77 / (full-capacity sales 31.56 - variable 17.93) = 42%. Advisory if over 100. |
| – | DSCR (profit + depreciation vs EMI) box | AUTO | – | verify | Red under 1.5 (form uses its own 7-year/12% assumption). Mean NP 2.44 + dep 1.165 over EMI 2.19 = about 1.65, no red. Engine DSCR about 1.61. |

### Step 12 — Documents & uploads
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Coir Board Documents | file | No | `CVY_coir_board_application_ack.pdf` | |
| 2 | Machinery Quotations | file | No | `CVY_quotation_spinning_machines_KCM.pdf` | |
| 3 | Udyam Certificate | file | No | `CVY_udyam_certificate.pdf` | |

- **Money cross-check:** Cost = land 0 + building 4.50 + machinery (3.30 + 2.40 + 0.85 + 0.60 = 7.15) + furniture 0.35 + pre-operative 0.40 + working capital 3.60 = **16.00 lakh**. Finance = 6.00 + 0 + 10.00 + 0 = **16.00**. Own 37.5%; debt-equity 10.00 / 6.00 = 1.67. Term loan 10.00 <= assets and set-up costs 12.40. EMI at 10.75%, 72 months on 10.00 = Rs 18,906 a month (Rs 2.27 lakh a year). Engine average DSCR about 1.61 (minimum 1.47); no "DSCR low" note.
- **Uploads to prepare:** three slots, always shown.
- **Generate & verify:** Step 12 -> **Generate DPR**. Cover: Establishment of / SRI SATYA SAI COIR INDUSTRIES / under 'Coir Vikas Yojana'; meta Dr. B.R. Ambedkar Konaseema, Amalapuram, Kommuri Satyanarayana. 12 sections (Cover & eligibility; Business / activity story; Location; Unit profile; Market & sales; Premises; Applicant / firm; Project cost; Means of finance; Operating cost & sales; Financial viability; Documents & uploads). Check Project cost lists land 0 (may be dropped when 0), building 4.5, furniture 0.35, pre-operative 0.4, machinery 7.15, working capital 3.6; Means of finance 6 / 0 / 10 / 0 and bank terms; viability table 5 rows and break-even 42.
- **Negative / boundary tests:**
  1. Step 1: pick District `Guntur` after choosing town `Amalapuram` -> Location resets to blank ("Select town") and Next is blocked until a Guntur town is chosen.
  2. Step 9: bank `10.01` -> Generate blocked (difference ₹0.01 lakh). Own `1.00`, bank `15.00` -> blockers: own money 6.25% (min 10%) and debt-equity 15 (max 3).
  3. Step 9: moratorium `72`, tenure `72` -> advisory (grace period not shorter than loan period); tenure `6` -> advisory "A loan period of 6 months is unusual".
  4. Step 11: Break-even `140` -> advisory "A break-even of 140% means you would need more than your full capacity"; leave Year 1 Net profit negative and sales under costs -> advisory only.
  5. Step 8: Building `450000` -> advisory "An amount of 450000 lakh is about ₹4500 crore. Did you type rupees instead of lakhs?"; also project-cost note if cost over 500 lakh.
  6. Step 7: Udyam `UDYAM-AP-07-63148` (too short) -> incomplete/invalid, Next blocked; Firm PAN `AAGPC7264K` (4th letter P) -> blocked as individual PAN.
- **Discrepancies spotted:**
  1. Premises (Step 1 select) is asked but never rendered in the document/PDF.
  2. Label mismatch on the cost step: the form shows "Land / building / workshed — land (₹ Lakhs)", "Land / building / workshed — building (₹ Lakhs)" and "Furniture & fixtures (₹ Lakhs)" (the last stored as `utilitiesAndInfrastructure`), while the document model labels the same fields "Land (₹ Lakhs)", "Building / shed (₹ Lakhs)" and "Utilities & Infrastructure (₹ Lakhs)". Check which label the preview prints.
  3. Internal text "Spec: docs/schemes/CVY/cvy.md" visible in the Step 1 panel.
  4. Firm / proprietor name has a required asterisk but is not enforced.
  5. Shared issues: date-order data check that cannot fire (ASPIRE item 7) and the hard-coded `setCurrentStep(11)` at Generate on a bad Step-7 format (PMPDS item 3).

---

## 24. MSE Green Investment and Financing for Transformation (`MSE_GIFT`)

**Entry:** `/individual-dpr/create?new=true&scheme=MSE_GIFT` (card "MSE Green Investment and Financing for Transformation (MSE-GIFT)") -> brief -> **Next**. **Total steps:** 12. **Test persona:** Maddipati Srinivasa Rao, owner of an existing injection-moulding unit (running since 2016) that adds servo energy-saving drives, VFDs and a 25 kWp rooftop solar plant. Unit: **Sri Venkata Sai Plastic Moulding Works**, district Guntur, town Guntur (Autonagar), sole proprietorship, existing MSE. Because this is a brownfield pack the "Start Date" is the year the unit started (2016-08-22) and Commitment Date is the upgrade commitment (2026-12-01).

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Venkata Sai Plastic Moulding Works` | |
| 2 | District * | select | Yes | `Guntur` | |
| 3 | Location * | select | Yes | `Guntur` | |
| 4 | Nature of Business | text | No | `Injection moulding of household plastic buckets and mugs` | |
| 5 | Major Products | text | No | `Plastic buckets (16 litre) and mugs (1 litre)` | |
| 6 | Energy baseline (kWh / month) | number | No | `14500` | Panel header "MSE-GIFT — green / EE". |
| 7 | Expected saving (%) | number min 0, max 100 | No | `28` | |
| 8 | EE equipment focus | text | No | `Servo energy-saving drives, VFDs and 25 kWp rooftop solar PV` | |
| 9 | Entrepreneur name | text | No | `Maddipati Srinivasa Rao` | Cover meta. |

### Step 2 — Business / activity story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Plastic products manufacturing (injection moulding)` | |
| 2 | Short intro — what the unit does | textarea | Yes | `Existing injection moulding unit making household buckets and mugs for dealers across Guntur and Krishna districts; now installing servo energy-saving drives, VFDs and rooftop solar to cut its power cost by about 28 percent.` | |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is in Autonagar industrial area, Guntur, 4 km from Guntur railway station with NH-16 access; resin dealers in Guntur and Vijayawada; customers are plastic-ware dealers within 150 km.` | |

### Step 4 — Unit profile
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Existing unit runs 12 injection moulding machines on one shift; proposed green upgrade retrofits 4 machines with servo drives, adds VFDs on chiller and compressor and installs 25 kWp rooftop solar.` | |
| 2 | Start Date | date | No | `2016-08-22` | Existing unit start. |
| 3 | Commitment Date | date | No | `2026-12-01` | |
| 4 | Tools / process level | text | No | `Hydraulic injection moulding machines, air-cooled chiller, screw compressor` | |
| 5 | Capacity / throughput (if applicable) | text | No | `Existing 12 machines; 1,60,000 pieces a year at 80% use` | |

"Products, share of output and selling price":
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Plastic bucket, 16 litre` | `44` | `78` (Rs per piece) |
| 2 | `Plastic mug, 1 litre` | `56` | `42` (Rs per piece) |

### Step 5 — Market & sales
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Plastic-ware and general stores through 14 dealers in Guntur, Krishna and Prakasam districts; two wholesale buyers at Vijayawada.` | |
| 2 | Demand / footfall note | textarea | No | `Order book is steady at 13,000 to 14,000 pieces a month; dealers ask for lower prices, so a cut in power cost protects margin.` | |

### Step 6 — Premises
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | text | Yes | `Own factory shed, Plot No. 56, Autonagar, Guntur` | Required. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Own shed of 5,000 sq ft on a 600 sq yard APIIC plot; roof strong enough for solar panels; 63 kVA HT service connection.` | |
| 3 | Power requirement (HP / kW) — optional | text | No | `63 kVA contract demand` | |

(No premises select on this step for MSE_GIFT.)

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk only | `Sri Venkata Sai Plastic Moulding Works` | Initially AUTO `Maddipati Srinivasa Rao`. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text | No | `37AAKFV5517R1Z9` | |
| 4 | Firm PAN (optional) | text | No | `AAKFV5517R` | |
| 5 | Udyam registration number (optional) | text | No | `UDYAM-AP-10-0029586` | |
| 6 | Contact mobile number (optional) | text | No | `9246731850` | |
| 7 | Correspondence address | textarea | No | `Plot No. 56, Autonagar Industrial Area, Guntur, Guntur district, Andhra Pradesh - 522005` | AUTO `Guntur, Guntur` to be replaced. |

### Step 8 — Project cost
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | |
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | `0` | |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `1.20` | Roof strengthening, panel mounting structure and inverter room. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `0` | |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `0.60` | Energy audit, net-metering and testing fees. |
| 6 | Working capital (₹ Lakhs) | number | No | `1.25` | |

"Machinery list" (EE equipment):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Rooftop solar PV plant, 25 kWp grid-tied with inverter` | New | `Sunrise Solar Solutions, Vijayawada` | `1` | `11.25` | 11.25 |
| 2 | `Servo energy-saving drive retrofit kit for 150-tonne injection moulding machine` | New | `Servotech Drives India, Hyderabad` | `4` | `0.62` | 2.48 |
| 3 | `Variable frequency drive panel for chiller and compressor` | New | `Servotech Drives India, Hyderabad` | `3` | `0.48` | 1.44 |
| 4 | `Power capacitor bank with energy meters` | New | `Servotech Drives India, Hyderabad` | `1` | `0.78` | 0.78 |

AUTO – "Total Project Cost" `₹ 19 Lakhs`.

### Step 9 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `State Bank of India, Autonagar branch, Guntur` | |
| 2 | Interest rate (% per year) | number | No | `10.25` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `60` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No | `5.70` | |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No MSE-GIFT rate in code (spec: confirm live guideline caps). |
| 7 | Bank Loan (₹ Lakhs) | number | No | `13.30` | |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

AUTO – "Total Finance" `₹ 19 Lakhs`.

### Step 10 — Operating cost & sales
"Raw materials":
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `HDPE and PP moulding granules` | `Moulding buckets and mugs` | `From Vijayawada resin dealers at about Rs 106 per kg, 2-tonne lots, 30-day credit` |
| 2 | `Colour masterbatch and handle inserts` | `Colouring and fitting` | `Monthly from Guntur suppliers` |

"Staff by role and monthly pay":
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Machine operator` | `4` | `14000` |
| 2 | `Helper` | `4` | `10000` |
| 3 | `Supervisor` | `1` | `22000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `50.70` | About 47.8 tonnes x Rs 106 per kg. |
| 2 | Power Cost (₹ Lakhs) | number | No | `10.02` | After the upgrade: 1,74,000 kWh x Rs 8 = 13.92 less 28% = 10.02. |
| 3 | Wages (₹ Lakhs) | number | No | `14.16` | 1,18,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | number | No | `1.20` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `2.40` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `1.50` | |
| 7 | Annual Production Volume | number | No | `160000` | pieces. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `92.40` | 70,000 x 78 + 90,000 x 42 = 54.60 + 37.80. Costs 79.98. |

### Step 11 — Financial viability
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `92.40` | `50.70` | `14.16` | `10.02` | `8.50` |
| 2 | `97.00` | `53.20` | `14.90` | `10.50` | `9.60` |
| 3 | `101.80` | `55.80` | `15.60` | `11.00` | `10.80` |
| 4 | `106.90` | `58.60` | `16.40` | `11.50` | `11.90` |
| 5 | `112.20` | `61.50` | `17.20` | `12.10` | `13.00` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `49` | Fixed 19.26 / (full-capacity sales 115.5 - variable 75.9) = 48.6%. |
| – | DSCR box | AUTO | – | verify | Form formula: mean NP 10.76 + dep 1.715 over EMI 2.91 = about 4.3, no red. Engine DSCR about 3.2. |

### Step 12 — Documents & uploads
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Recent Energy Bill | file | No | `MSEGIFT_energy_bill_APSPDCL_Sep2026.pdf` | |
| 2 | EE Equipment Quotations | file | No | `MSEGIFT_quotation_solar_servo_VFD.pdf` | |
| 3 | Udyam Certificate | file | No | `MSEGIFT_udyam_certificate.pdf` | |

- **Money cross-check:** Cost = 0 + building 1.20 + machinery (11.25 + 2.48 + 1.44 + 0.78 = 15.95) + 0 + pre-operative 0.60 + working capital 1.25 = **19.00 lakh**. Finance = 5.70 + 0 + 13.30 + 0 = **19.00**. Own 30%; debt-equity 13.30 / 5.70 = 2.33. Term loan 13.30 <= assets and set-up costs 17.75. EMI at 10.25%, 60 months on 13.30 = Rs 28,422 a month (Rs 3.41 lakh a year). Engine average DSCR about 3.2.
- **Uploads to prepare:** three slots, always shown.
- **Generate & verify:** Step 12 -> **Generate DPR**. Cover: **Upgradation of** / SRI VENKATA SAI PLASTIC MOULDING WORKS / under 'MSE-GIFT (green investment)'; meta Guntur, Guntur, Maddipati Srinivasa Rao. 12 sections (Cover & eligibility ... Financial viability, Documents & uploads). Step 1 section must list "Energy baseline (kWh / month)" 14500, "Expected saving (%)" 28 and "EE equipment focus". Project cost section: building 1.2, machinery 15.95, pre-operative 0.6, working capital 1.25 (+ list). Viability: 5 rows, break-even 49.
- **Negative / boundary tests:**
  1. Step 1: Expected saving `150` -> field flags the range (0 to 100: "Enter a number from 0 to 100.") but note the form does not block Next (see Discrepancies).
  2. Step 4: Start `2016-08-22`, Commitment `2016-01-01` -> "Commitment Date must be on or after Start Date".
  3. Step 9: bank `13.31` -> blocked "funding adds up to ₹19.01 lakh but the project cost is ₹19.00 lakh". Own `1.50`, bank `17.50` -> own 7.9% below 10% and debt-equity 11.67 above 3.
  4. Step 9: interest `18` -> advisory "An interest rate of 18% is unusual" only.
  5. Step 7: GSTIN `37AAKFV5517R1Z5` (bad check char; correct `...Z9`) -> "The last character does not match..." blocks Next. Mobile `924673185` (9 digits) -> "Mobile number has 10 digits (1 more)".
  6. Step 10: Wages `150000` -> advisory (amount looks like rupees) and, as costs exceed sales, "yearly costs ... higher than your yearly sales".
- **Discrepancies spotted:**
  1. Expected saving (%) has `min=0 max=100` on the input but there is no required-field or Next-blocking rule for it, so out-of-range values pass unless the inline range message is acted on.
  2. Brownfield wording: Step 4 labels are the generic "Start Date" (year the unit began) and the shared date-order data check reads a field that is never stored, so it cannot warn (see ASPIRE item 7).
  3. Firm / proprietor name has a required asterisk but is not enforced.
  4. Internal text "Spec: docs/schemes/MSE_GIFT/mseGift.md" visible on the Step 1 panel.
  5. The spec only describes steps 2-11 generically; there is no energy-baseline field outside Step 1, and the baseline is not used in any calculation (the saving % is just text) — the engine does not link kWh to Power Cost.

---

## 25. Pharmaceutical Technology Upgradation Assistance Scheme (`PTUAS`)

**Entry:** `/individual-dpr/create?new=true&scheme=PTUAS` (card "Pharmaceutical Technology Upgradation Assistance Scheme (PTUAS)") -> brief -> **Next**. **Total steps:** 13. **Test persona:** Bandaru Satya Prasad, owner of an existing tablet-manufacturing unit at Parawada Pharma City that upgrades granulation, compression, coating, packing and HVAC to meet revised Schedule M GMP. Unit: **Sri Satya Pharma Formulations**, district Anakapalli, town Anakapalli, sole proprietorship. Existing since 2014-03-17; upgrade committed 2026-12-07; commercial production target 2027-07-01.

### Step 1 — Cover & eligibility
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Satya Pharma Formulations` | |
| 2 | District * | select | Yes | `Anakapalli` | |
| 3 | Location * | select | Yes | `Anakapalli` | Town list for this district: Anakapalli, Narsipatnam, Elamanchili, Yelamanchili, Kasimkota, Pendurthi. |
| 4 | Nature of Business | text | No | `Manufacture of oral solid dosage pharmaceutical formulations (tablets)` | |
| 5 | Major Products | text | No | `Paracetamol, cetirizine and metformin tablets` | |
| 6 | GMP status | select: WHO-GMP / Schedule M compliant; Partial / upgrading to GMP; Not yet GMP | No | `Partial / upgrading to GMP` | Stored `partial`. Panel header "PTUAS — pharma upgrade". |
| 7 | Product licence | text | No | `Mfg. Licence No. AP/DCA/ML/TAB/2014/0147 (Form 25 and 28)` | |
| 8 | Existing tech | text | No | `Single-rotary 16-station press, open coating pan, manual blister packing, no HVAC in granulation area` | Label on screen is "Existing tech". Not shown in the document (see Discrepancies). |
| 9 | Proposed tech | text | No | `27-station double-rotary press, rapid mixer granulator, fluid bed dryer, automatic coating, Alu-Alu blister line with HVAC clean rooms` | Label "Proposed tech". |
| 10 | Entrepreneur name | text | No | `Bandaru Satya Prasad` | Cover meta. |

### Step 2 — Upgrade / process story
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Sector / industry type | text | Yes | `Pharmaceutical formulations (oral solid dosage)` | |
| 2 | Short intro — what the unit does | textarea | Yes | `Tablet manufacturing unit making paracetamol, cetirizine and metformin tablets for own brand and contract supply to distributors in Andhra Pradesh and Odisha, upgrading granulation, compression, coating and packing technology to revised Schedule M GMP.` | No "Process of manufacture" input appears for PTUAS. |

### Step 3 — Location
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Brief location / market catchment | textarea | No | `Unit is a leased plot in Jawaharlal Nehru Pharma City, Parawada, 35 km from Visakhapatnam port and airport; common effluent treatment plant and 33 kV power in the park; distributors at Visakhapatnam, Vijayawada and Bhubaneswar.` | |

### Step 4 — Unit profile & capacity
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Present: 9 crore tablets a year on old single-rotary press, manual packing. Proposed: replace with granulation, double-rotary compression, coating and blister lines with HVAC to meet revised Schedule M and raise output to about 14.6 lakh strips of 10 tablets.` | |
| 2 | Start Date | date | No | `2014-03-17` | Year the unit began. |
| 3 | Commitment Date | date | No | `2026-12-07` | |
| 4 | Tools / process level | text | No | `Semi-automatic: single-rotary press, open pan coating, manual blister packing` | |
| 5 | Capacity / throughput (if applicable) | text | No | `Proposed: 14.6 lakh strips of 10 tablets a year at 75% use` | |

"Products, share of output and selling price":
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Paracetamol 500 mg tablets, strip of 10` | `40` | `14` (Rs per strip) |
| 2 | `Cetirizine 10 mg tablets, strip of 10` | `25` | `18` (Rs per strip) |
| 3 | `Metformin 500 mg tablets, strip of 10` | `35` | `24` (Rs per strip) |

### Step 5 — Market & offtake
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Pharma distributors and stockists in Andhra Pradesh and Odisha, government dispensaries through tender supply, and contract manufacturing for two marketing companies.` | |
| 2 | Demand / footfall note | textarea | No | `Two marketing companies have signed letters of intent for 4 lakh strips a year each once GMP certification is complete; present buyers want WHO-GMP certified supply.` | |

### Step 6 — Premises & utilities
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Shop / shed / workplace * | text | Yes | `Leased factory building, Plot No. 14-B, Pharma City, Parawada` | Required. |
| 2 | Premises note (own / lease / rent) | textarea | No | `Leased from APIIC for 33 years; built-up area 6,500 sq ft; clean-room block of 2,200 sq ft to be built; HT power 100 kVA and borewell water in the park.` | |
| 3 | Power requirement (HP / kW) — optional | text | No | `100 kVA` | |

### Step 7 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk only | `Sri Satya Pharma Formulations` | Initially AUTO `Bandaru Satya Prasad`. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text | No | `37AAMFS3086Q1Z8` | |
| 4 | Firm PAN (optional) | text | No | `AAMFS3086Q` | |
| 5 | Udyam registration number (optional) | text | No | `UDYAM-AP-24-0081437` | |
| 6 | Contact mobile number (optional) | text | No | `9700615284` | |
| 7 | Correspondence address | textarea | No | `Plot No. 14-B, Jawaharlal Nehru Pharma City, Parawada, Anakapalli district, Andhra Pradesh - 531021` | AUTO `Anakapalli, Anakapalli`. |

### Step 8 — Upgrade project cost
All five cost boxes shown.
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | |
| 2 | Land / building / workshed — land (₹ Lakhs) | number | No | `0` | Leased. |
| 3 | Land / building / workshed — building (₹ Lakhs) | number | No | `14.00` | Clean-room civil work. |
| 4 | Furniture & fixtures (₹ Lakhs) | number | No | `2.50` | |
| 5 | Preliminary & Pre-operative (₹ Lakhs) | number | No | `4.50` | Validation, consultants, licence fees. |
| 6 | Working capital (₹ Lakhs) | number | No | `22.00` | |

"Machinery list":
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Rapid mixer granulator, 100 litre` | New | `Cadmach Machinery, Ahmedabad` | `1` | `9.50` | 9.50 |
| 2 | `Fluid bed dryer, 60 kg` | New | `Cadmach Machinery, Ahmedabad` | `1` | `8.20` | 8.20 |
| 3 | `Double-rotary tablet compression machine, 27 station` | New | `Elizabeth Pharma Machinery, Mumbai` | `1` | `22.50` | 22.50 |
| 4 | `Automatic perforated coating machine, 36 inch` | New | `Elizabeth Pharma Machinery, Mumbai` | `1` | `11.80` | 11.80 |
| 5 | `Alu-Alu blister packing machine` | New | `Pharma Pack Systems, Vadodara` | `1` | `13.60` | 13.60 |
| 6 | `HVAC air handling unit with HEPA filters` | New | `Airtech Cleanroom Solutions, Hyderabad` | `2` | `8.20` | 16.40 |

AUTO – "Total Project Cost" `₹ 125 Lakhs`.

### Step 9 — Means of finance (critical)
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `State Bank of India, SME Branch, Visakhapatnam` | |
| 2 | Interest rate (% per year) | number | No | `10.25` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `84` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No | `37.50` | |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No PTUAS subsidy rule or cap in code (spec: confirm live DoP guideline). |
| 7 | Bank Loan (₹ Lakhs) | number | No | `87.50` | |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

AUTO – "Total Finance" `₹ 125 Lakhs`.

### Step 10 — Operating cost & sales
"Raw materials":
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Active pharmaceutical ingredients (paracetamol, cetirizine, metformin)` | `Tablet formulation` | `From licensed API dealers at Hyderabad, 30-day credit, lot-wise with COA` |
| 2 | `Excipients (starch, MCC, binders, coating polymers)` | `Granulation and coating` | `Monthly from Vizag chemical suppliers` |
| 3 | `Alu-Alu foil and printed cartons` | `Strip packing` | `Quarterly from Vadodara packaging supplier` |

"Staff by role and monthly pay":
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Production in-charge (B.Pharm)` | `1` | `40000` |
| 2 | `QC chemist` | `2` | `30000` |
| 3 | `Machine operator` | `6` | `16000` |
| 4 | `Packing helper` | `9` | `10000` |
| 5 | `Store-keeper` | `1` | `22000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `150.00` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `9.60` | |
| 3 | Wages (₹ Lakhs) | number | No | `36.96` | 3,08,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | number | No | `5.50` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `12.00` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `22.00` | |
| 7 | Annual Production Volume | number | No | `1460000` | strips of 10 tablets. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `270.10` | 14,60,000 strips x Rs 18.50 average = 270.10. Costs 236.06. |

### Step 11 — Financial viability
| Year | Sales | RM | Wages | Power | Net profit |
|---|---|---|---|---|---|
| 1 | `270.10` | `150.00` | `36.96` | `9.60` | `18.50` |
| 2 | `297.00` | `165.00` | `38.80` | `10.20` | `26.00` |
| 3 | `326.50` | `181.50` | `40.70` | `10.80` | `33.50` |
| 4 | `359.00` | `199.50` | `42.70` | `11.40` | `42.00` |
| 5 | `395.00` | `219.50` | `44.80` | `12.00` | `50.50` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Break-even (capacity %) | number | No | `52` | Fixed 76.46 / (full-capacity sales 360.1 - variable 212.8) = 51.9%. |
| – | DSCR box | AUTO | – | verify | Form formula: EMI 19.17 (87.5, 7 yrs, 12%), dep 9.6, mean NP 34.1 -> about 2.28, no red. Engine DSCR about 1.89. |

### Step 12 — Implementation schedule
The three milestone rows are pre-filled with the placeholder activity names "Machinery order / installation", "Power connection", "Trial run" (no Add-row button; type over them). Each row has Activity text plus two date inputs (start, end).
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Commercial production date (CoD) | date | No | `2027-07-01` | After the Commitment Date. |
| 2 | Milestone 1 Activity / start / end | text, date, date | No | `Placing machinery orders and advance payment` / `2026-12-07` / `2027-01-15` | |
| 3 | Milestone 2 Activity / start / end | text, date, date | No | `Clean-room civil work and HVAC installation` / `2027-01-18` / `2027-04-30` | |
| 4 | Milestone 3 Activity / start / end | text, date, date | No | `Machinery installation, IQ/OQ/PQ qualification and trial batches` / `2027-05-03` / `2027-06-25` | |

### Step 13 — Documents & uploads
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Manufacturing / Product Licence | file | No | `PTUAS_manufacturing_licence_form25_28.pdf` | |
| 2 | Pollution Consent | file | No | `PTUAS_pollution_consent_CFO_APPCB.pdf` | |
| 3 | Machinery Quotations | file | No | `PTUAS_quotation_tablet_press_and_coating.pdf` | |
| 4 | CA FCI Statement | file | No | `PTUAS_CA_FCI_statement_2026.pdf` | |
| 5 | Udyam Certificate | file | No | `PTUAS_udyam_certificate.pdf` | |

- **Money cross-check:** Cost = land 0 + building 14.00 + machinery (9.50 + 8.20 + 22.50 + 11.80 + 13.60 + 16.40 = 82.00) + furniture 2.50 + pre-operative 4.50 + working capital 22.00 = **125.00 lakh** (Rs 1.25 crore; under the 500-lakh "large project" note). Finance = 37.50 + 0 + 87.50 + 0 = **125.00**. Own 30%; debt-equity 87.50 / 37.50 = 2.33. Term loan 87.50 <= assets and set-up costs 103.00. EMI at 10.25%, 84 months on 87.50 = Rs 1,46,393 a month (Rs 17.57 lakh a year). Engine average DSCR about 1.89 (minimum 1.73).
- **Uploads to prepare:** five slots, always shown.
- **Generate & verify:** Step 13 -> **Generate DPR**. Cover: **Upgradation of** / SRI SATYA PHARMA FORMULATIONS / under 'PTUAS (pharma technology upgrade)'; meta Anakapalli, Anakapalli, Bandaru Satya Prasad. 13 sections: Cover & eligibility; Upgrade / process story; Location; Unit profile & capacity; Market & offtake; Premises & utilities; Applicant / firm; Upgrade project cost; Means of finance (critical); Operating cost & sales; Financial viability; Implementation schedule; Documents & uploads. Step 1 section should show GMP status "Partial / upgrading to GMP" and Product licence; check that Existing/Proposed technology do NOT appear anywhere (known gap). Schedule section shows CoD 2027-07-01 and three milestones with dates.
- **Negative / boundary tests:**
  1. Step 6: empty "Shop / shed / workplace" -> Next blocked ("Fill the required fields before continuing: Shop / shed / workplace").
  2. Step 9: bank `87.40` -> Generate blocked (funding 124.90 vs cost 125.00, difference ₹0.10 lakh). Own `10.00`, bank `115.00` -> own money 8% below 10% minimum and debt-equity 11.5 above 3.
  3. Step 9: moratorium `90` with tenure `84` -> advisory "The grace period (90 months) is as long as, or longer than, the whole loan period (84 months)"; interest `5` -> unusual-rate advisory; neither blocks.
  4. Step 12: end date earlier than start date in a milestone row -> accepted (no check); verify whether it is flagged (expected: not flagged). CoD earlier than Commitment Date -> also not checked by the form.
  5. Step 7: Firm PAN `AAMPS3086Q` (4th letter P) -> "Individual PANs are not stored..." blocks Next; GSTIN `37AAMFS3086Q1Z1` (bad check char) -> blocks Next.
  6. Step 8: Furniture `250000` -> advisory (rupees typed as lakhs); working capital `0` and funding left unchanged -> funding (125.00) no longer equals cost (103.00): Generate blocked.
- **Discrepancies spotted:**
  1. `PTUAS_EXTRA_FIELDS` includes `processOfManufacture`, but no PTUAS form control exists for it (Step 2 only shows it for other schemes) and the document does not list it: the field is orphaned.
  2. Existing tech / Proposed tech are asked on Step 1 (labels "Existing tech" / "Proposed tech") but the document model skips them on Step 1 and only adds "Existing technology" / "Proposed technology / upgrade" on Step 2 for PMEGP_2ND, SCLCSS and AP_TECH_UPGRADE, so PTUAS values never reach the preview/PDF and progress counting is off.
  3. Implementation schedule has no Add-milestone control (three pre-filled placeholder rows only) and no date-order validation: milestone end before start, or CoD before the Commitment Date, are accepted silently.
  4. Cost-step labels differ between form and document: the form says "Furniture & fixtures (₹ Lakhs)" / "Land / building / workshed — land|building" while the document model keeps "Utilities & Infrastructure (₹ Lakhs)" / "Land (₹ Lakhs)" / "Building / shed (₹ Lakhs)" for the same stored fields (same applies to MSE_GIFT and CVY).
  5. Firm / proprietor name asterisk not enforced; internal text "Spec: docs/schemes/PTUAS/ptuas.md" visible in the Step 1 panel.

---

## 26. Pharmaceutical & Medical Devices Promotion and Development Scheme (`PMPDS`)

**Entry:** `/individual-dpr/create?new=true&scheme=PMPDS` (card "Pharmaceutical & Medical Devices Promotion and Development Scheme (PMPDS)") -> brief -> **Next**. **Total steps:** 8 (code `PMPDS_STEPS`; the spec doc, impact bar and business-logic doc say 5). **Test persona:** Ponnada Sravan Kumar, a first-generation entrepreneur starting a small medical-device unit (sterile surgical gauze, crepe bandages, absorbent cotton rolls) near the AP MedTech Zone, needing promotion support for ISO 13485 certification and a CDSCO manufacturing licence. Unit: **Sri Sravan Medicare Disposables**, district Visakhapatnam, town Visakhapatnam, sole proprietorship, greenfield. Start 2026-11-23.

### Step 1 — Cover & scheme inputs
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | text | Yes | `Sri Sravan Medicare Disposables` | |
| 2 | District * | select | Yes | `Visakhapatnam` | |
| 3 | Location * | select | Yes | `Visakhapatnam` | Other towns: Gajuwaka, Madhurawada, Bheemunipatnam, Anandapuram. |
| 4 | Nature of Business | text | No | `Manufacture of sterile surgical gauze, bandages and cotton rolls (medical devices)` | |
| 5 | Major Products | text | No | `Surgical gauze pads, crepe bandages, absorbent cotton rolls` | |
| 6 | Focus | select: Formulation / pharma product; Medical device; Both / allied | No | `Medical device` | Stored `device`. Panel header "PMPDS — promotion". |
| 7 | Entrepreneur name | text | No | `Ponnada Sravan Kumar` | Cover meta. |
| 8 | Promotion / development need | textarea | No | `Support for ISO 13485 certification, CDSCO manufacturing licence (Form MD-5) for Class A devices and a sterilisation / testing tie-up, so the unit can supply government hospitals through APMSIDC tenders.` | |

### Step 2 — Unit / product profile
(This pack has no story, location or premises step; the unit profile comes straight after the cover.)
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | textarea | No | `Proposed unit near AP MedTech Zone making sterile gauze pads, crepe bandages and absorbent cotton rolls; 6 workers on one shift.` | |
| 2 | Start Date | date | No | `2026-11-23` | |
| 3 | Commitment Date | date | No | `2026-12-07` | |
| 4 | Tools / process level | text | No | `Semi-automatic cutting, folding and rolling machines; hot-air sterilising oven` | |
| 5 | Capacity / throughput (if applicable) | text | No | `1,20,000 packs and rolls a year on one shift` | |

"Products, share of output and selling price":
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Surgical gauze pad pack (10 pieces)` | `55` | `24` (Rs per pack) |
| 2 | `Crepe bandage, 10 cm` | `30` | `40` (Rs per piece) |
| 3 | `Absorbent cotton roll, 500 g` | `15` | `190` (Rs per roll) |

### Step 3 — Market / need
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | textarea | No | `Government hospitals and PHCs through APMSIDC tenders, private hospitals and nursing homes in Visakhapatnam, and medical-store distributors.` | |
| 2 | Demand / footfall note | textarea | No | `Visakhapatnam has about 400 hospitals and nursing homes; two distributors will take 40,000 units a year once the product is ISO 13485 certified.` | |

### Step 4 — Applicant / firm
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | text | Asterisk only | `Sri Sravan Medicare Disposables` | Initially AUTO `Ponnada Sravan Kumar`. |
| 2 | Legal status (sole / partnership / company) | text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | text | No | `37AAPFM2290L1ZP` | |
| 4 | Firm PAN (optional) | text | No | `AAPFM2290L` | |
| 5 | Udyam registration number (optional) | text | No | `UDYAM-AP-21-0044062` | |
| 6 | Contact mobile number (optional) | text | No | `9885472016` | |
| 7 | Correspondence address | textarea | No | `Door No. 5-9-14, AP MedTech Zone Road, Pedagantyada, Visakhapatnam, Visakhapatnam district, Andhra Pradesh - 530044` | AUTO `Visakhapatnam, Visakhapatnam`. |

### Step 5 — Project cost
Land, building, furniture and pre-operative boxes hidden (hint: "Heavy capex tables are hidden for Mudra Shishu / Kishore. Enter machinery and working-capital margin only.").
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | What kind of business is this? | select | No | `Making things` | |
| 2 | Working capital (₹ Lakhs) | number | No | `4.40` | |

"Machinery list":
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Line total |
|---|---|---|---|---|---|---|
| 1 | `Gauze cutting and folding machine` | New | `Medi-Tech Machinery, Ahmedabad` | `1` | `4.20` | 4.20 |
| 2 | `Bandage rolling and winding machine` | New | `Medi-Tech Machinery, Ahmedabad` | `1` | `3.10` | 3.10 |
| 3 | `Cotton carding and roll forming machine` | New | `Sri Ram Textile Engineers, Coimbatore` | `1` | `3.65` | 3.65 |
| 4 | `Pouch packing and sealing machine` | New | `Vijaya Packaging Machines, Vijayawada` | `1` | `1.40` | 1.40 |
| 5 | `Hot-air sterilising oven, 100 litre` | New | `Lab-Aid Equipment, Hyderabad` | `1` | `1.25` | 1.25 |

AUTO – "Total Project Cost" `₹ 18 Lakhs`.

### Step 6 — Means of finance
| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | text | No | `Union Bank of India, Pedagantyada branch` | |
| 2 | Interest rate (% per year) | number | No | `10.5` | |
| 3 | Moratorium (months) | number | No | `6` | |
| 4 | Loan tenure (months) | number | No | `60` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | number | No | `5.40` | |
| 6 | Government Grant (₹ Lakhs) | number | No | `0` | No PMPDS grant rule in code (spec: confirm live DoP guideline). |
| 7 | Bank Loan (₹ Lakhs) | number | No | `12.60` | |
| 8 | Other Sources (₹ Lakhs) | number | No | `0` | |

AUTO – "Total Finance" `₹ 18 Lakhs`.

### Step 7 — Operating cost & sales
"Raw materials":
| Row | Material | Use | How it is bought |
|---|---|---|---|
| 1 | `Absorbent cotton and cotton gauze fabric` | `Gauze pads and rolls` | `From Guntur and Coimbatore mills at Rs 150 per kg, monthly, 30-day credit` |
| 2 | `Cotton crepe yarn and elastic thread` | `Crepe bandages` | `From Erode suppliers, quarterly` |
| 3 | `Pouches, cartons and ethylene oxide sterilisation charges` | `Packing and sterility` | `From Visakhapatnam suppliers and AMTZ common facility per batch` |

"Staff by role and monthly pay":
| Row | Role | Number of people | Monthly pay (₹) |
|---|---|---|---|
| 1 | `Machine operator` | `3` | `14000` |
| 2 | `Packer` | `2` | `10000` |
| 3 | `Supervisor` | `1` | `18000` |

| # | Field | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Raw Material Cost (₹ Lakhs) | number | No | `40.00` | |
| 2 | Power Cost (₹ Lakhs) | number | No | `2.40` | |
| 3 | Wages (₹ Lakhs) | number | No | `9.60` | 80,000 x 12. |
| 4 | Maintenance (₹ Lakhs) | number | No | `0.90` | |
| 5 | Administrative Expenses (₹ Lakhs) | number | No | `2.40` | |
| 6 | Marketing Expenses (₹ Lakhs) | number | No | `3.00` | |
| 7 | Annual Production Volume | number | No | `120000` | packs, pieces and rolls. |
| 8 | Annual Sales Realization (₹ Lakhs) | number | No | `64.44` | 66,000 x 24 + 36,000 x 40 + 18,000 x 190 = 15.84 + 14.40 + 34.20. Costs 58.30. |

### Step 8 — Documents & uploads
| # | Field (slot label) | Control | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Manufacturing / Product Licence (if any) | file | No | `PMPDS_CDSCO_licence_application_MD3.pdf` | Application acknowledgement is fine ("if any"). |
| 2 | Udyam Certificate | file | No | `PMPDS_udyam_certificate.pdf` | |
| 3 | Aadhaar / PAN | file | No | `PMPDS_aadhaar_card_masked.jpg` | |

- **Money cross-check:** Cost = machinery (4.20 + 3.10 + 3.65 + 1.40 + 1.25 = 13.60) + working capital 4.40 = **18.00 lakh**. Finance = 5.40 + 0 + 12.60 + 0 = **18.00**. Own 30%; debt-equity 12.60 / 5.40 = 2.33. Term loan 12.60 <= asset cost 13.60. EMI at 10.5%, 60 months on 12.60 = Rs 27,082 a month (Rs 3.25 lakh a year). Engine average DSCR about 1.75 (minimum 1.57). There is no viability step in this pack, so no DSCR panel appears.
- **Uploads to prepare:** three slots, always shown.
- **Generate & verify:** Step 8 -> **Generate DPR**. Cover: Establishment of / SRI SRAVAN MEDICARE DISPOSABLES / under 'PMPDS (pharma & medical devices)'; meta Visakhapatnam, Visakhapatnam, Ponnada Sravan Kumar. 8 sections: Cover & scheme inputs; Unit / product profile; Market / need; Applicant / firm; Project cost; Means of finance; Operating cost & sales; Documents & uploads (8 appear only if at least one upload is attached). The Step 1 section must list Focus "Medical device" and "Promotion / development need". No Sector, Location or Premises section exists.
- **Negative / boundary tests:**
  1. Step 1: leave District blank -> Next blocked ("Fill the required fields before continuing: District"); Location select is disabled with "Select district first". (Steps 2 to 8 have no required fields in this pack.)
  2. Step 2: Start Date `2026-11-23`, Commitment Date `2026-11-01` -> "Commitment Date must be on or after Start Date"; Start `1899-01-01` -> "Enter a valid date between 1990 and 2100".
  3. Step 6: bank `12.50` -> funding 17.90 vs cost 18.00: Generate blocked ("difference ₹0.10 lakh"). Own `0.90`, bank `17.10` -> own money 5% below the 10% minimum and debt-equity 19 above 3.
  4. Step 4: Contact mobile `98854720` -> "Mobile number has 10 digits (2 more)", Next blocked; Udyam `UDYAM-AP-21-4062` -> invalid, Next blocked.
  5. Step 7: Annual Sales `30` -> advisory "yearly costs (₹58.3 lakh) higher than yearly sales (₹30 lakh)"; Wages `960000` -> advisory (looks like rupees).
  6. Step 5: pick "A service" in "What kind of business is this?" -> the Machinery list is replaced by an "Assets list" (Asset, Type, Qty, Unit cost) and the machinery rows' total is no longer used; switching back to "Making things" restores the list. Verify the cost total changes accordingly.
- **Discrepancies spotted:**
  1. Step count: `pmpds.md`, `PMPDS_IMPACT_BULLETS` ("Own 5-step promotion pack") and `docs/create-new-dpr-business-logic.md` say 5 steps; `PMPDS_STEPS` has 8 (adds Project cost, Means of finance, Operating cost & sales, plus the unit/market/applicant/uploads steps). Spec's "Step 5: Uploads" is really Step 8.
  2. The spec says "not a full plant DPR" yet the form asks the full cost, finance and operating sections with machinery lists, loan terms and the finance-balance blockers (equity 10%, debt-equity 3) — the blockers apply to a promotion note.
  3. Hard-coded `setCurrentStep(11)` in `IndividualDPRCreation.tsx` (Generate path, bad Step-4 GSTIN/PAN/Udyam/mobile): in this pack local step 11 does not exist (only 8 steps), and for the other five schemes it is the wrong step; the applicant step is local step 4 here and local step 7 in the five longer packs (where local step 11 is Documents & uploads for ASPIRE/NHDP, Financial viability for CVY/MSE_GIFT/PTUAS).
  4. Step 5 hint mentions "Mudra Shishu / Kishore" (shared string); Firm / proprietor name asterisk not enforced; internal text "Spec: docs/schemes/PMPDS/pmpds.md" visible in the Step 1 panel.

---

## 27. MSME Sustainable ZED Certification (`ZED`)
**Entry:** `/individual-dpr/create?new=true&scheme=ZED` (or pick "Sustainable ZED Certification" on the Create New Latest DPR scheme picker). **Total steps:** 8 (the code catalog `ZED_STEPS` has 8 steps, not the "5" stated in docs, the impact bullets and the brief; see Discrepancies). Step titles on screen: Step 1: Cover & ZED levels; Step 2: Unit profile; Step 3: Quality / market need; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Kondaveeti Srinivasa Rao (age 46, partner) runs **Sri Sai Ganesh Auto Components**, a partnership firm (with his brother Kondaveeti Hari Krishna) in APIIC Auto Nagar, **Mangalagiri mandal, Guntur district**. Since 2016 the unit has made CNC-turned brake lever pins, gear shafts and wheel-hub bushes for two-wheeler OEM vendors. It holds ZED Bronze and wants Silver to qualify for OEM vendor audits. Persona data must stay identical in every step. Mandal/village is not an input; it goes only in the correspondence address.

Conventions: Req? = blocks Next/Generate in the code. "AUTO" = filled by the app. All money fields below are **₹ Lakhs** unless the label says (₹). Do not click the optional AI buttons, "Match me", "Suggest title" or "Not sure what to enter" calculators; the data below is manual input.

### Step 1 — Cover & ZED levels
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Sri Sai Ganesh Auto Components` | Required (red ring + "Required" if empty). Keep short (cover title limit 8 words / 56 chars). |
| 2 | District * | Select (placeholder "Select district") | Yes | `Guntur` | 26 AP districts. Changing district clears Location if the town is not in it. |
| 3 | Location * | Select (placeholder "Select town"; disabled until District chosen) | Yes | `Mangalagiri` | Town must belong to the district (Guntur list: Guntur, Tenali, Ponnur, Mangalagiri, Tadepalli, Prathipadu, Vatticherukuru). |
| 4 | Nature of Business | Text input | No | `Manufacturing of precision turned and machined auto components for two-wheeler OEM vendors` | Data check flags under 12 characters. Do not click "Match me" (it would overwrite with a skill name). |
| 5 | Major Products | Text input | No | `Brake lever pins, gear shafts, wheel hub bushes` | Data check flags under 3 characters. |
| 6 | Current ZED level | Select (Select / Not certified yet / Bronze / Silver / Gold) | No | `Bronze` | Stored as `bronze`. |
| 7 | Target ZED level | Select (Select / Bronze / Silver / Gold; "Not certified yet" is not offered) | No | `Silver` | Stored as `silver`. No code check that target is above current. |
| 8 | Entrepreneur name | Text input | No | `Kondaveeti Srinivasa Rao` | Feeds Step 4 "Firm / proprietor name" (AUTO copy) and the "Promoter / applicant" row on Steps 5-6. |
| 9 | Quality / sustainability focus | Textarea | No | `Reduce rejection from 4.2% to under 2% through in-process gauging, set up 5S and tool-crib discipline, cut power use with a 10 kW rooftop solar plant, and install dust and fume extraction to meet Silver-level environment criteria.` | Free text, over 40 characters. |

### Step 2 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `The unit runs 6 CNC turning centres and 2 VMCs on two shifts, machining alloy steel and brass bars into brake lever pins, gear shafts and hub bushes for three Vijayawada-based two-wheeler OEM vendors. Incoming, in-process and final inspection are done manually on a bench gauge set.` | Data check flags under 30 characters as "very short". |
| 2 | Start Date | Date | No | `2016-07-01` | Stored as `yearOfEstablishment`. Allowed range 1990-01-01 to 2100-12-31; otherwise toast "Enter a valid date between 1990 and 2100". |
| 3 | Commitment Date | Date | No | `2026-11-10` | Must be on or after Start Date, else toast "Commitment Date must be on or after Start Date" and value is rejected. |
| 4 | Tools / process level | Text input | No | `CNC turning and VMC machining with manual gauging; ISO 9001 documentation in place; ZED Bronze certified` | Free text. |
| 5 | Capacity / throughput (if applicable) | Text input | No | `20,000 components per month on two shifts` | Placeholder shows "e.g. 50 kg/hour or 1000 units/month". Stored as `productionCapacity`. |
| 6 | Products, share of output and selling price (sub-table; add rows with "Add product") | Repeating rows | No | see rows below | Share total should be 100. Selling price is per unit in rupees (the label does not say ₹). |

Product rows (Product Name / Share of Output (%) / Selling Price (per unit)):
| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Brake lever pin` | `40` | `22` |
| 2 | `Gear shaft` | `35` | `41` |
| 3 | `Wheel hub bush` | `25` | `27.5` |

Check: 0.40x22 + 0.35x41 + 0.25x27.5 = 8.80 + 14.35 + 6.875 = ₹30.025 average x 2,40,000 pieces (Step 7) = ₹72.06 lakh, which matches Step 7 sales of 72.00.

### Step 3 — Quality / market need
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Two-wheeler OEM vendors and tier-2 suppliers in Vijayawada, Hosur and Chennai; vendor audits increasingly ask for ZED Silver or higher.` | Free text. |
| 2 | Demand / footfall note | Textarea | No | `Two OEM vendors have asked for ZED Silver proof before renewing rate contracts in April 2027. Current order book is about 20,000 pieces a month; certification is expected to add roughly 5,000 pieces a month.` | Free text. |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text input | Asterisk only (not enforced in code) | `Sri Sai Ganesh Auto Components` | AUTO on arrival: `Kondaveeti Srinivasa Rao` (copied from Entrepreneur name) with a note "Filled in from your unit details". Overwrite with the firm name; after you type, the app stops following Step 1. |
| 2 | Legal status (sole / partnership / company) | Text input | No | `Partnership firm` | Free text. |
| 3 | GSTIN (optional) | Text, GSTIN mask, 15 chars | No | `37AAHFS4821M1ZS` | Valid check character. Upper-cased automatically. |
| 4 | Firm PAN (optional) | Text, PAN mask, 10 chars | No | `AAHFS4821M` | 4th letter must be one of A B C F G H J K L P T and not P (individual PAN is rejected). Note: the app blanks PAN on save. |
| 5 | Udyam registration number (optional) | Text, Udyam mask | No | `UDYAM-AP-05-0034821` | Type `UDYAMAP050034821`; hyphens are added. |
| 6 | Contact mobile number (optional) | Text, 10 digits | No | `9440318276` | Must start with 6-9. |
| 7 | Correspondence address | Textarea | No | `Plot No. 14, APIIC Auto Nagar, Mangalagiri mandal, Guntur District, Andhra Pradesh - 522503` | AUTO on arrival: `Mangalagiri, Guntur`. Overwrite with the full address. |

### Step 5 — Project cost
Land, building, utilities and pre-operative fields are hidden for this scheme. The only inputs are the kind picker, the machinery list and Working capital.
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Details carried to this schedule (read-only box) | Display | n/a | n/a | AUTO. Promoter / applicant: `Kondaveeti Srinivasa Rao`; Unit: `Sri Sai Ganesh Auto Components`; Address: `Plot No. 14, APIIC Auto Nagar, Mangalagiri mandal, Guntur District, Andhra Pradesh - 522503`; GSTIN: `37AAHFS4821M1ZS`. |
| 2 | What kind of business is this? | Select (Making things / A service / Buying and selling) | No | `Making things` | AUTO-detected as Making things from the Step 1 text. Confirm it shows "Making things"; the machinery list appears only for this kind. |
| 3 | Machinery list (add rows with "Add machinery") | Repeating rows | No | see rows below | Machinery total is AUTO-written to the cost once any row has a description or unit cost. |
| 4 | Working capital (₹ Lakhs) | Number | No | `3.25` | Label for this scheme is "Working capital (₹ Lakhs)". |
| 5 | Total Project Cost | Read-only display | n/a | n/a | AUTO: `₹ 18 Lakhs`. |

Machinery rows (Description / Condition / Supplier / Qty / Unit cost (₹ Lakhs)):
| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Digital Rockwell hardness tester` | New | `Precimeasure Instruments Pvt Ltd, Bengaluru` | `1` | `1.85` | 1.85 |
| 2 | `Bench-top profile projector (optical comparator)` | New | `Precimeasure Instruments Pvt Ltd, Bengaluru` | `1` | `2.40` | 2.40 |
| 3 | `Dust collection and fume extraction unit` | New | `Kirloskar Ventilation Systems, Hyderabad` | `2` | `1.60` | 3.20 |
| 4 | `Tool-crib cabinets and 5S storage racks` | New | `Godrej Storage Solutions dealer, Vijayawada` | `6` | `0.35` | 2.10 |
| 5 | `Rooftop solar power plant, 10 kW` | New | `Sunrise Solar Energy Systems, Guntur` | `1` | `5.20` | 5.20 |

Machinery total = 1.85 + 2.40 + 3.20 + 2.10 + 5.20 = 14.75. Condition defaults to "New"; leave as is.

### Step 6 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Bank name (Term loan terms box) | Text | No | `State Bank of India, Mangalagiri branch` | |
| 2 | Interest rate (% per year) | Number | No | `10.5` | Advisory if under 6 or over 16. |
| 3 | Moratorium (months) | Number | No | `6` | Advisory if it is not less than tenure. |
| 4 | Loan tenure (months) | Number | No | `60` | Advisory if under 12 or over 180. |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | No (blocking rules apply) | `3.60` | 20% of cost. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `2.70` | 15% of cost. No scheme cap is coded for ZED. |
| 7 | Bank Loan (₹ Lakhs) | Number | No | `11.70` | 65% of cost. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | Leave 0 or blank. |
| 9 | Total Finance | Read-only display | n/a | n/a | AUTO: `₹ 18 Lakhs`. |

### Step 7 — Operating cost & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Raw materials (sub-table, "Add raw material") | Repeating rows: Material / Use / How it is bought | No | see rows below | Narrative only; does not feed totals. |
| 2 | Staff by role and monthly pay (sub-table, "Add role") | Repeating rows: Role / Number of people / Monthly pay (₹) | No | see rows below | Does not feed Wages automatically; keep consistent by hand. |
| 3 | Raw Material Cost (₹ Lakhs) | Number | No | `38.40` | |
| 4 | Power Cost (₹ Lakhs) | Number | No | `3.60` | |
| 5 | Wages (₹ Lakhs) | Number | No | `14.40` | = staff total 1,20,000 x 12. |
| 6 | Maintenance (₹ Lakhs) | Number | No | `1.80` | |
| 7 | Administrative Expenses (₹ Lakhs) | Number | No | `2.40` | |
| 8 | Marketing Expenses (₹ Lakhs) | Number | No | `1.20` | |
| 9 | Annual Production Volume | Number | No | `240000` | Pieces per year. |
| 10 | Annual Sales Realization (₹ Lakhs) | Number | No | `72` | Advisory "costs higher than sales" if total costs exceed this. |

Raw material rows: (1) `Alloy steel EN8 and EN24 bright bars` / `Turned and machined into pins and shafts` / `Monthly purchase from a Vijayawada steel stockist on 30-day credit`; (2) `Brass rods` / `Hub bushes` / `Quarterly purchase from a Jamnagar brass supplier, 15-day credit`; (3) `Cutting oil and carbide inserts` / `Machining consumables` / `Monthly cash purchase from Guntur industrial suppliers`.
Staff rows (Role / Number of people / Monthly pay (₹)): `CNC operator` / `3` / `16000`; `Quality inspector` / `1` / `19000`; `Machine helper` / `3` / `10000`; `Shift supervisor` / `1` / `23000`. Total = 48,000 + 19,000 + 30,000 + 23,000 = ₹1,20,000 per month.

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File (.pdf .doc .docx .jpg .jpeg .png) | No | `ZED_udyam_certificate.pdf` | After upload shows "✓ Uploaded: <name>". |
| 2 | Aadhaar / PAN | File | No | `ZED_aadhaar_pan.pdf` | |

- **Money cross-check:** Project cost = machinery 14.75 + working capital 3.25 = ₹18.00 lakh (land, building, utilities, pre-operative are hidden = 0). Means of finance = 3.60 + 2.70 + 11.70 + 0 = ₹18.00 lakh; the code needs funding to equal cost **exactly** (hundredths of a lakh), stricter than the brief's 1%. Own money 3.60/18 = 20% (minimum 10% applies when a bank loan exists; default rule since ZED has none of its own). Debt-equity = 11.70 / (3.60 + 2.70) = 1.86 (limit 3.0). Grant 15% (advisory only above 50%). Term loan 11.70 is below capex 14.75, so no "term loan too high" note. Repayment months = 60 - 6 = 54; EMI at 10.5% = 11.70 x 0.00875 x 1.00875^54 / (1.00875^54 - 1) = ₹0.2728 lakh per month (about ₹27,280), ₹3.27 lakh per year. Projection check: EBITDA = 72.00 - (38.40 + 3.60) - (14.40 + 1.80 + 2.40 + 1.20) = 10.20; the model gives average DSCR about 3.0 and positive cash every year, so no DSCR or cash warning.
- **Uploads to prepare:** Udyam Certificate -> `ZED_udyam_certificate.pdf` (always shown); Aadhaar / PAN -> `ZED_aadhaar_pan.pdf` (always shown). No conditional slots.
- **Generate & verify:** Preview has **8 sections** in the order of the 8 steps above (not 5). Cover shows action line "Proposal for", unit name `Sri Sai Ganesh Auto Components`, and "under 'Sustainable ZED Certification'". Step 1 section lists Current ZED level = Bronze and Target ZED level = Silver (option labels, not codes), Entrepreneur name, and the focus text. Step 5 section shows the 5-row machinery table and total 18; Step 6 shows 3.60 / 2.70 / 11.70 and bank terms; Step 7 shows the sales 72 and wages 14.40. Both PDF and DOCX download and carry the same figures. No "Must fix first" blockers.
- **Negative / boundary tests:**
  1. Step 6: Bank Loan `11.20` (funding 17.50 vs cost 18.00) -> blocking "The funding adds up to ₹17.5 lakh but the project cost is ₹18 lakh. They must match exactly (difference ₹0.5 lakh)"; Generate refused with "Fix the items marked Must fix first".
  2. Step 6: Promoter `1.20`, Grant `2.70`, Bank `14.10` (total still 18.00) -> two blockers: own money 6.67% below the 10% minimum, and debt-equity 3.62 above 3 to 1.
  3. Step 2: Commitment Date `2016-01-01` (before Start Date 2016-07-01) -> toast "Commitment Date must be on or after Start Date" and the date is not stored. Start Date `1985-01-01` -> toast "Enter a valid date between 1990 and 2100".
  4. Step 4: Firm PAN `AAHPS4821M` (4th letter P) -> inline rejection as a personal PAN; GSTIN `37AAHFS4821M1ZT` -> "The last character does not match"; mobile `5440318276` -> "An Indian mobile number starts with 6, 7, 8 or 9".
  5. Step 5: Rockwell tester unit cost `185000` (rupees instead of lakhs) -> advisory "An amount of ... lakh is about ₹... crore. Did you type rupees instead of lakhs?" plus the funding mismatch blocker; remove after the test.
  6. Step 1: clear Unit / Project Name and press Next -> blocked, field outlined red with "Required". Also set Current `Gold` and Target `Bronze`: the app accepts it (no cross-check; gap).
- **Discrepancies spotted:**
  1. Step count: `ZED_STEPS` in `schemeStepCatalog.ts` has **8** steps; `zed.md`, `zedQuestions.ts` header, `ZED_IMPACT_BULLETS` and the scheme brief all say 5, and the impact bullet says "Step 5: Udyam, Aadhaar/PAN" while uploads are Step 8.
  2. `zed.md` and `ZED_IMPACT_BULLETS` say "No land/building FCI or 5-year P&L", but the app asks for means of finance with a bank loan, loan terms and operating cost and sales, and applies the generic equity and debt-equity blockers to a certification scheme.
  3. Step 5 shows the sentence "Heavy capex tables are hidden for Mudra Shishu / Kishore..." even though this is ZED.
  4. Step 4 "Firm / proprietor name *" shows a required asterisk but is not enforced (`missingIndividualRequired` has no step-11 rule).
  5. `dataChecks.ts` rule `dates.order` reads `step4.startDate`, but the form stores Start Date as `yearOfEstablishment`, so it never fires; and its logic (flag when start < commitment) is the opposite of the form rule (commitment must be on or after start).

## 28. MSME Competitive LEAN (`LEAN`)
**Entry:** `/individual-dpr/create?new=true&scheme=LEAN`. **Total steps:** 8 (code `LEAN_STEPS`; docs and brief say 5). Titles: Step 1: Cover & bottleneck; Step 2: Unit / shop-floor profile; Step 3: Process / market need; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Muppidi Lakshmi Prasanna (age 41, managing director) runs **Godavari Gold Foods Private Limited**, an existing rice-snack unit on Dowleswaram Road, **Rajamahendravaram (Rajahmundry urban mandal), East Godavari district**. Since 2019 it has made murukulu, chekkalu and ready-to-cook rice batter on two lines (frying and packing). Changeovers and scrap are eating output, so it wants a LEAN consultant engagement plus a few lean tools.

### Step 1 — Cover & bottleneck
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Godavari Gold Foods Private Limited` | Required. 4 words, within title limit. |
| 2 | District * | Select | Yes | `East Godavari` | |
| 3 | Location * | Select | Yes | `Rajamahendravaram` | East Godavari list: Rajamahendravaram, Kovvur, Nidadavole, Gokavaram, Rajanagaram, Korukonda. |
| 4 | Nature of Business | Text input | No | `Manufacturing of rice-flour snacks and ready-to-cook batter` | At least 12 characters. |
| 5 | Major Products | Text input | No | `Murukulu, chekkalu, ready-to-cook rice batter` | |
| 6 | Main process bottleneck | Textarea (placeholder "e.g. changeover time, scrap, inventory") | No | `Changeover between murukulu and chekkalu batches on the extruder line takes about 95 minutes, the packing line sits idle for 2.5 hours per shift waiting for fried product, and dough scrap is about 6% of input.` | |
| 7 | Shop-floor size / lines | Text input | No | `7,200 sq ft production hall; 2 lines (frying line and packing line)` | |
| 8 | Entrepreneur name | Text input | No | `Muppidi Lakshmi Prasanna` | |
| 9 | Expected lean gain | Textarea | No | `Cut changeover from 95 to 40 minutes, reduce dough scrap from 6% to 3%, and raise overall line efficiency from 58% to 72% within six months of the LEAN consultant engagement.` | |

### Step 2 — Unit / shop-floor profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `The unit runs one extruder and fryer line making murukulu and chekkalu in 3 batches per shift, plus a batter grinding room, and packs in 200 g and 500 g pouches for Rajamahendravaram and Kakinada retailers and sweet shops.` | Min 30 characters for the data check. |
| 2 | Start Date | Date | No | `2019-03-12` | Range 1990-2100. |
| 3 | Commitment Date | Date | No | `2026-11-05` | Must be on or after Start Date. |
| 4 | Tools / process level | Text input | No | `Semi-automatic extruder and gas-fired fryer; manual dough dividing and manual weighing at packing; no visual management` | |
| 5 | Capacity / throughput (if applicable) | Text input | No | `120 kg per hour on the extruder line; about 10,000 kg per month` | |
| 6 | Products, share of output and selling price | Repeating rows ("Add product") | No | see rows below | Total share 100. |

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Murukulu (kg)` | `45` | `90` |
| 2 | `Chekkalu (kg)` | `35` | `78` |
| 3 | `Ready-to-cook rice batter (kg)` | `20` | `62` |

Check: 0.45x90 + 0.35x78 + 0.20x62 = 40.50 + 27.30 + 12.40 = ₹80.20 per kg x 1,20,000 kg = ₹96.24 lakh vs Step 7 sales 96.00.

### Step 3 — Process / market need
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Sweet shops, supermarkets and kirana wholesalers in East and West Godavari, Kakinada and Visakhapatnam; two modern-trade chains have asked for 10 tonnes a month on fixed weekly schedules.` | |
| 2 | Demand / footfall note | Textarea | No | `Festival season (Sankranti, Dasara) brings 40% higher orders, but current changeovers and idle packing capacity cap output at about 10 tonnes a month; lean improvements would free roughly 2.5 tonnes a month.` | |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Asterisk only | `Godavari Gold Foods Private Limited` | AUTO on arrival: `Muppidi Lakshmi Prasanna`. Overwrite. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Private limited company` | |
| 3 | GSTIN (optional) | GSTIN mask | No | `37AACCG2468K1ZC` | Valid check char. |
| 4 | Firm PAN (optional) | PAN mask | No | `AACCG2468K` | 4th letter C (company). Blanked on save. |
| 5 | Udyam registration number (optional) | Udyam mask | No | `UDYAM-AP-07-0062915` | |
| 6 | Contact mobile number (optional) | 10 digits | No | `9701452836` | |
| 7 | Correspondence address | Textarea | No | `D.No. 5-72/1, Dowleswaram Road, Rajamahendravaram (Rajahmundry urban mandal), East Godavari District, Andhra Pradesh - 533125` | AUTO on arrival: `Rajamahendravaram, East Godavari`. |

### Step 5 — Project cost
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Details carried to this schedule | Read-only | n/a | n/a | AUTO: Promoter `Muppidi Lakshmi Prasanna`; Unit `Godavari Gold Foods Private Limited`; Address (the full address from Step 4); GSTIN `37AACCG2468K1ZC`. |
| 2 | What kind of business is this? | Select | No | `Making things` | AUTO-detected (text contains "Manufacturing"). |
| 3 | Machinery list ("Add machinery") | Repeating rows | No | see rows | |
| 4 | Working capital (₹ Lakhs) | Number | No | `5.66` | |
| 5 | Total Project Cost | Read-only | n/a | n/a | AUTO: `₹ 19 Lakhs`. |

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Quick-change extruder die and tooling set` | New | `Annapurna Food Machinery Works, Coimbatore` | `2` | `1.35` | 2.70 |
| 2 | `Inline checkweigher with reject arm` | New | `Mettler-Toledo authorised dealer, Hyderabad` | `1` | `3.80` | 3.80 |
| 3 | `Automatic dough divider and rounder` | New | `Annapurna Food Machinery Works, Coimbatore` | `1` | `4.60` | 4.60 |
| 4 | `Stainless steel kanban racks and WIP trolleys` | New | `Sri Lakshmi Steel Fabricators, Rajamahendravaram` | `8` | `0.28` | 2.24 |

Machinery total = 2.70 + 3.80 + 4.60 + 2.24 = 13.34.

### Step 6 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Union Bank of India, Rajamahendravaram main branch` | |
| 2 | Interest rate (% per year) | Number | No | `9.75` | |
| 3 | Moratorium (months) | Number | No | `3` | |
| 4 | Loan tenure (months) | Number | No | `48` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | No | `5.70` | 30%. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `0` | LEAN consultancy support is not modelled as a grant here. |
| 7 | Bank Loan (₹ Lakhs) | Number | No | `13.30` | 70%. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |
| 9 | Total Finance | Read-only | n/a | n/a | AUTO: `₹ 19 Lakhs`. |

### Step 7 — Operating cost & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw materials (sub-table) | Rows: Material / Use / How it is bought | No | see rows | |
| 2 | Staff by role and monthly pay (sub-table) | Rows: Role / Number of people / Monthly pay (₹) | No | see rows | |
| 3 | Raw Material Cost (₹ Lakhs) | Number | No | `52.80` | |
| 4 | Power Cost (₹ Lakhs) | Number | No | `4.80` | |
| 5 | Wages (₹ Lakhs) | Number | No | `15.60` | = 1,30,000 x 12. |
| 6 | Maintenance (₹ Lakhs) | Number | No | `2.40` | |
| 7 | Administrative Expenses (₹ Lakhs) | Number | No | `3.00` | |
| 8 | Marketing Expenses (₹ Lakhs) | Number | No | `2.40` | |
| 9 | Annual Production Volume | Number | No | `120000` | kg per year. |
| 10 | Annual Sales Realization (₹ Lakhs) | Number | No | `96` | |

Raw material rows: (1) `Raw rice and rice flour` / `Base dough for murukulu, chekkalu and batter` / `Weekly purchase from Amalapuram rice mills, 7-day credit`; (2) `Refined sunflower oil` / `Frying` / `Fortnightly bulk purchase from a Kakinada edible-oil distributor`; (3) `Spices, sesame and salt` / `Flavouring` / `Monthly cash purchase from Rajamahendravaram spice market`; (4) `Printed laminate pouches and cartons` / `Packing` / `Quarterly order from a Vijayawada packaging supplier`.
Staff rows: `Production operator` / `5` / `12000`; `Packing helper` / `4` / `10000`; `Line supervisor` / `1` / `18000`; `Quality and store clerk` / `1` / `12000`. Total = 60,000 + 40,000 + 18,000 + 12,000 = ₹1,30,000 per month.

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File | No | `LEAN_udyam_certificate.pdf` | |
| 2 | Aadhaar / PAN | File | No | `LEAN_aadhaar_pan.pdf` | |

- **Money cross-check:** Cost = 13.34 + 5.66 = ₹19.00 lakh. Finance = 5.70 + 0 + 13.30 + 0 = ₹19.00 lakh (exact match). Own 5.70/19 = 30% (min 10%). Debt-equity = 13.30 / (5.70 + 0) = 2.33 (limit 3). Term loan 13.30 is below capex 13.34 (no warning). Repay months 48 - 3 = 45; EMI at 9.75% = 13.30 x 0.008125 x 1.008125^45 / (1.008125^45 - 1) = ₹0.3541 lakh per month, ₹4.25 lakh per year. EBITDA = 96.00 - (52.80 + 4.80) - (15.60 + 2.40 + 3.00 + 2.40) = 15.00; model average DSCR about 3.1, cash positive.
- **Uploads to prepare:** Udyam Certificate -> `LEAN_udyam_certificate.pdf`; Aadhaar / PAN -> `LEAN_aadhaar_pan.pdf`. Both always shown.
- **Generate & verify:** 8 sections. Cover: "Proposal for" / `Godavari Gold Foods Private Limited` / "under 'Competitive LEAN'". Step 1 section shows the bottleneck, shop-floor size, entrepreneur and expected gain text. Step 2 section shows the product-mix table (3 rows). Step 5 machinery table 4 rows, total 19; Step 6 shows 5.70 / 0 / 13.30; Step 7 shows raw-material and staff tables. PDF and DOCX agree.
- **Negative / boundary tests:**
  1. Step 6: own `4.00`, bank `15.00`, grant 0 (total 19.00): equity 21% passes, but debt-equity 15.00/4.00 = 3.75 -> blocking "Bank debt is 3.75 times your own money plus subsidy. The most allowed is 3 to 1."
  2. Step 6: own `1.50`, bank `17.50` -> blocks on equity 7.89% (<10%) and debt-equity 11.67.
  3. Step 6: Government Grant `10` with own 5.70 and bank 13.30 (funding 29.00) -> funding mismatch blocker; the grant alone is 52% of cost only if funding were rebalanced (advisory above 50%).
  4. Step 2: Commitment Date `2019-01-01` (before Start Date 2019-03-12) -> toast, value rejected.
  5. Step 4: GSTIN with a 14-character entry (delete last char) -> "GSTIN has 15 characters ... (1 more)"; Udyam `UDYAM-AP-07-006291` -> shows the format hint.
  6. Step 7: Annual Sales Realization `60` (below total costs 80.40) -> advisory "Your yearly costs (₹80.4 lakh) are higher than your yearly sales (₹60 lakh)"; does not block generation.
- **Discrepancies spotted:**
  1. 8 steps in code vs "5 consecutive steps" in `lean.md`, `leanQuestions.ts` header, scheme brief and impact bullets; impact bullet "Step 5: Udyam, Aadhaar/PAN" is really Step 8.
  2. `lean.md` and the impact bullet say "No heavy FCI / MoF", but the app runs full Means of finance with loan terms and the equity / debt-equity blockers.
  3. The same stale "Heavy capex tables are hidden for Mudra Shishu / Kishore" sentence appears on Step 5.
  4. Step 4 "Firm / proprietor name *" required asterisk is not enforced.
  5. `dates.order` check never fires (reads `startDate`, form stores `yearOfEstablishment`) and its direction is inverted versus the form rule.

## 29. MSME Innovative — IPR (`MSME_IPR`)
**Entry:** `/individual-dpr/create?new=true&scheme=MSME_IPR` (picker name "MSME Innovative — Incubation, Design & IPR"). **Total steps:** 8 (code `MSME_IPR_STEPS`; docs/brief say 5). Titles: Step 1: Cover & IP type; Step 2: Unit / invention profile; Step 3: IP / market need; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Shaik Abdul Rahim (age 38, sole proprietor) runs **Rahim Agri Engineering Works** in the industrial estate at **Adoni (Adoni mandal), Kurnool district**, fabricating groundnut and cotton-seed processing machines since 2023. He has developed a solar-assisted low-breakage groundnut decorticator and has the patent specification draft ready, so he is seeking support for filing, prototype testing and pilot build.

### Step 1 — Cover & IP type
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Rahim Agri Engineering Works` | Required. |
| 2 | District * | Select | Yes | `Kurnool` | |
| 3 | Location * | Select | Yes | `Adoni` | Kurnool list: Kurnool, Adoni, Yemmiganur, Kodumur, Pattikonda, Alur. |
| 4 | Nature of Business | Text input | No | `Manufacturing of groundnut decorticators and farm processing machines` | At least 12 characters. |
| 5 | Major Products | Text input | No | `Groundnut decorticator, cotton seed delinter, paddy winnower` | |
| 6 | IP type | Select (Select / Patent / Design / Trademark / Geographical Indication (GI) / Other IP) | No | `Patent` | Stored `patent`. |
| 7 | Filing stage | Select (Select / Idea / prior art search / Specification draft ready / Already filed / Granted / registered) | No | `Specification draft ready` | Stored `draft`. |
| 8 | Invention / mark title | Text input | No | `Solar-Assisted Low-Breakage Groundnut Decorticator with Adjustable Concave` | |
| 9 | Entrepreneur name | Text input | No | `Shaik Abdul Rahim` | |

### Step 2 — Unit / invention profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `The workshop fabricates groundnut decorticators and seed-cotton delinters to order for farmers and oil mills in Kurnool and Anantapur. The new decorticator uses a solar-assisted drive and an adjustable concave to cut kernel breakage from about 8% to under 3%; field trials on 3 machines are done and the patent specification draft is ready.` | Min 30 chars. |
| 2 | Start Date | Date | No | `2023-08-10` | |
| 3 | Commitment Date | Date | No | `2026-11-20` | On or after Start Date. |
| 4 | Tools / process level | Text input | No | `Conventional lathe, drilling and arc-welding fabrication; no instrumented test bench yet` | |
| 5 | Capacity / throughput (if applicable) | Text input | No | `2 machines per month; each decorticator shells 600 kg of pods per hour` | |
| 6 | Products, share of output and selling price | Rows | No | see rows | |

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Decorticator model SAD-1 (600 kg/hr)` | `60` | `145000` |
| 2 | `Decorticator model SAD-2 (900 kg/hr)` | `40` | `160000` |

Check: 0.6x1,45,000 + 0.4x1,60,000 = 87,000 + 64,000 = ₹1,51,000 average x 20 machines = ₹30.20 lakh vs Step 7 sales 30.00.

### Step 3 — IP / market need
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Groundnut farmers' groups, FPOs and small oil mills in Kurnool, Anantapur, Nandyal and Prakasam districts; state agriculture department custom-hiring centres.` | |
| 2 | Demand / footfall note | Textarea | No | `Local fabricators are copying the design after demonstrations; a granted patent will protect the adjustable-concave mechanism and let the unit license it to two machine builders in Salem and Rajkot.` | |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Asterisk only | `Shaik Abdul Rahim` | AUTO on arrival equals the Entrepreneur name, so nothing to change; the note "Filled in from your unit details" is shown. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | GSTIN mask | No | `37BKTPS7305L1ZA` | Valid; embeds the proprietor's personal PAN (accepted by the GSTIN check). |
| 4 | Firm PAN (optional) | PAN mask | No | leave blank | A sole proprietor has only a personal PAN, which this field rejects, so leave it empty. |
| 5 | Udyam registration number (optional) | Udyam mask | No | `UDYAM-AP-10-0048276` | |
| 6 | Contact mobile number (optional) | 10 digits | No | `8099236417` | |
| 7 | Correspondence address | Textarea | No | `D.No. 21-4-118, Industrial Estate Road, Adoni (Adoni mandal), Kurnool District, Andhra Pradesh - 518301` | AUTO on arrival: `Adoni, Kurnool`. |

### Step 5 — Project cost
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Details carried to this schedule | Read-only | n/a | n/a | AUTO: Promoter `Shaik Abdul Rahim`; Unit `Rahim Agri Engineering Works`; Address (Step 4 text); GSTIN `37BKTPS7305L1ZA`. |
| 2 | What kind of business is this? | Select | No | `Making things` | AUTO-detected. |
| 3 | Machinery list | Rows | No | see rows | |
| 4 | Working capital (₹ Lakhs) | Number | No | `2.45` | Covers patent attorney and filing fees, field-test costs and pilot run materials. |
| 5 | Total Project Cost | Read-only | n/a | n/a | AUTO: `₹ 10 Lakhs`. |

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Pilot prototype decorticator with solar drive` | New | `In-house build with Sri Balaji Motors and Controls, Kurnool` | `1` | `3.10` | 3.10 |
| 2 | `Digital moisture and kernel-breakage analyser` | New | `Agri Test Instruments, Hyderabad` | `1` | `1.20` | 1.20 |
| 3 | `BLDC motor and variable frequency drive set, 3 HP` | New | `Sri Balaji Motors and Controls, Kurnool` | `2` | `0.65` | 1.30 |
| 4 | `Test-bench instrumentation (torque sensor and data logger)` | New | `Agri Test Instruments, Hyderabad` | `1` | `1.95` | 1.95 |

Machinery total = 3.10 + 1.20 + 1.30 + 1.95 = 7.55.

### Step 6 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Canara Bank, Adoni branch` | |
| 2 | Interest rate (% per year) | Number | No | `10` | |
| 3 | Moratorium (months) | Number | No | `6` | |
| 4 | Loan tenure (months) | Number | No | `48` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | No | `2.00` | 20%. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `3.50` | 35% (IP-filing and testing support). |
| 7 | Bank Loan (₹ Lakhs) | Number | No | `4.50` | 45%. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |
| 9 | Total Finance | Read-only | n/a | n/a | AUTO: `₹ 10 Lakhs`. |

### Step 7 — Operating cost & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw materials (sub-table) | Rows | No | see rows | |
| 2 | Staff by role and monthly pay (sub-table) | Rows | No | see rows | |
| 3 | Raw Material Cost (₹ Lakhs) | Number | No | `15.00` | |
| 4 | Power Cost (₹ Lakhs) | Number | No | `0.90` | |
| 5 | Wages (₹ Lakhs) | Number | No | `4.80` | = 40,000 x 12. |
| 6 | Maintenance (₹ Lakhs) | Number | No | `0.60` | |
| 7 | Administrative Expenses (₹ Lakhs) | Number | No | `1.20` | |
| 8 | Marketing Expenses (₹ Lakhs) | Number | No | `1.50` | |
| 9 | Annual Production Volume | Number | No | `20` | Machines per year. |
| 10 | Annual Sales Realization (₹ Lakhs) | Number | No | `30` | |

Raw material rows: (1) `MS plates, angles and pipes` / `Frame, hopper and concave` / `Monthly purchase from a Kurnool steel yard, cash`; (2) `Bearings, belts and fasteners` / `Drive and assembly` / `Quarterly purchase from Hyderabad industrial suppliers, 15-day credit`; (3) `Solar panel, controller and wiring` / `Solar-assisted drive` / `Per-order purchase from Sri Balaji Motors and Controls, Kurnool`.
Staff rows: `Fabricator-welder` / `2` / `14000`; `Assembly technician` / `1` / `12000`. Total = 28,000 + 12,000 = ₹40,000 per month.

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File | No | `IPR_udyam_certificate.pdf` | |
| 2 | Aadhaar / PAN | File | No | `IPR_aadhaar_pan.pdf` | The app has no slot for the draft patent specification or TM search (see Discrepancies). |

- **Money cross-check:** Cost = 7.55 + 2.45 = ₹10.00 lakh. Finance = 2.00 + 3.50 + 4.50 + 0 = ₹10.00 lakh. Own 20%; debt-equity = 4.50 / (2.00 + 3.50) = 0.82; grant 35% (advisory above 50%). Term loan 4.50 below capex 7.55. Repay months 48 - 6 = 42; EMI at 10% = 4.50 x 0.008333 x 1.008333^42 / (1.008333^42 - 1) = ₹0.1274 lakh per month, ₹1.53 lakh per year. EBITDA = 30.00 - (15.00 + 0.90) - (4.80 + 0.60 + 1.20 + 1.50) = 6.00; model average DSCR about 3.8; cash positive.
- **Uploads to prepare:** Udyam Certificate -> `IPR_udyam_certificate.pdf`; Aadhaar / PAN -> `IPR_aadhaar_pan.pdf`. Suggested extras that cannot be uploaded in the app: `IPR_patent_specification_draft.pdf`.
- **Generate & verify:** 8 sections. Cover: "Proposal for" / `Rahim Agri Engineering Works` / "under 'MSME Innovative — IPR / Design / Incubation'". Step 1 section: IP type = Patent, Filing stage = Specification draft ready, the invention title, entrepreneur name. Step 5 shows the 4-row machinery table, total 10; Step 6 shows 2.00 / 3.50 / 4.50; Step 7 has raw-material and staff tables. PDF and DOCX agree.
- **Negative / boundary tests:**
  1. Step 6: Government Grant `6.00`, Bank Loan `2.00`, own 2.00 (total 10.00) -> no blocker, but advisory "The subsidy is 60% of the project cost. Subsidy rates under most schemes are well below half."
  2. Step 6: Bank Loan `4.00` (funding 9.50) -> blocking funding mismatch "must match exactly (difference ₹0.5 lakh)".
  3. Step 6: own `0.40`, grant `3.50`, bank `6.10` -> blocking equity 4% (<10%) (debt-equity 6.10 / 3.90 = 1.56 is fine).
  4. Step 6: Moratorium `48` with tenure `48` -> advisory "The grace period (48 months) is as long as, or longer than, the whole loan period (48 months)"; Interest rate `22` -> advisory "An interest rate of 22% is unusual".
  5. Step 2: Start Date `2027-01-01`, Commitment Date `2026-11-20` -> toast "Commitment Date must be on or after Start Date".
  6. Step 1: leave IP type and Filing stage on "Select" -> accepted (no required check on IP fields; Generate still works).
- **Discrepancies spotted:**
  1. 8 steps in code vs 5 in `msmeIpr.md`, `msmeIprQuestions.ts` header, brief intro and impact bullets.
  2. `msmeIpr.md` and the impact bullet promise "Udyam, Aadhaar/PAN (+ draft specification / TM search as needed)" on the last step, but `getStep18Uploads` returns only Udyam Certificate and Aadhaar / PAN.
  3. Docs say IPR is "not a plant-and-machinery term-loan DPR" but the app asks a machinery list, bank loan terms and the debt-equity blockers.
  4. Scheme picker name "Incubation, Design & IPR" vs impact title "MSME Innovative — IPR" vs brief title "MSME Innovative — IPR / Design / Incubation" (three different names for the cover and UI).
  5. Stale "Heavy capex tables are hidden for Mudra Shishu / Kishore" message on Step 5; required asterisk on Step 4 name is not enforced; `dates.order` never fires.

## 30. Procurement and Marketing Scheme (`PMS`)
**Entry:** `/individual-dpr/create?new=true&scheme=PMS`. **Total steps:** 8 (code `PMS_STEPS`; docs/brief say 5). Titles: Step 1: Cover & fair details; Step 2: Unit / product profile; Step 3: Market / fair offtake; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Pothina Anuradha (age 44, designated partner) runs **Kondapalli Heritage Toys & Crafts LLP** in the Kondapalli toy colony, **Kondapalli (Ibrahimpatnam mandal), NTR district**, making GI-tagged Kondapalli wooden toys and handicrafts since 2018. She plans to exhibit at the India International Trade Fair in New Delhi in November 2026 and needs support for stall, display equipment and fair stock.

### Step 1 — Cover & fair details
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Kondapalli Heritage Toys & Crafts LLP` | Required. 5 words. |
| 2 | District * | Select | Yes | `NTR` | |
| 3 | Location * | Select | Yes | `Kondapalli` | NTR list: Vijayawada, Jaggayyapeta, Nandigama, Tiruvuru, Kondapalli, Ibrahimpatnam, Mylavaram. |
| 4 | Nature of Business | Text input | No | `Manufacturing of Kondapalli wooden toys and handicraft decor items` | |
| 5 | Major Products | Text input | No | `Dasavatharam toy sets, wooden toy figures, home decor pieces` | |
| 6 | Event / fair name | Text input | No | `India International Trade Fair (IITF) 2026` | |
| 7 | Stall size | Text input (placeholder "e.g. 9 sqm") | No | `18 sqm` | |
| 8 | Fair city | Text input | No | `New Delhi` | |
| 9 | Estimated fair cost (₹ Lakhs) | Number | No | `4.85` | ₹ Lakhs. Not linked to Step 5/6 by code; keep it equal to the Step 5 working capital for consistency. |
| 10 | Entrepreneur name | Text input | No | `Pothina Anuradha` | |

### Step 2 — Unit / product profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `The LLP employs 6 artisans who carve, assemble and paint Kondapalli toys from soft Tella Poniki wood using natural vegetable colours. Products are sold from the unit, through APCO showrooms and at two state-level exhibitions a year; this proposal is for a first participation in a national trade fair.` | |
| 2 | Start Date | Date | No | `2018-06-01` | |
| 3 | Commitment Date | Date | No | `2026-12-01` | On or after Start Date. |
| 4 | Tools / process level | Text input | No | `Hand carving with small power tools, natural-colour painting, manual finishing; Kondapalli toys GI-tagged` | |
| 5 | Capacity / throughput (if applicable) | Text input | No | `About 1,200 pieces per month` | |
| 6 | Products, share of output and selling price | Rows | No | see rows | |

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Dasavatharam toy set` | `30` | `600` |
| 2 | `Single wooden toy figure` | `45` | `190` |
| 3 | `Home decor piece and fridge magnet` | `25` | `135` |

Check: 0.30x600 + 0.45x190 + 0.25x135 = 180 + 85.50 + 33.75 = ₹299.25 average x 14,000 pieces = ₹41.90 lakh vs Step 7 sales 42.00.

### Step 3 — Market / fair offtake
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Gift and handicraft retailers, corporate gifting buyers, interior decorators and export agents visiting IITF from Delhi NCR, Mumbai, Bengaluru and overseas.` | |
| 2 | Demand / footfall note | Textarea | No | `IITF draws over 10 lakh visitors in two weeks; at a previous state exhibition the unit sold about ₹1.8 lakh in six days. A national stall is expected to bring bulk enquiries worth ₹10 lakh and 4 to 6 repeat buyers.` | |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Asterisk only | `Kondapalli Heritage Toys & Crafts LLP` | AUTO on arrival: `Pothina Anuradha`. Overwrite. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Limited liability partnership (LLP)` | |
| 3 | GSTIN (optional) | GSTIN mask | No | `37AAJFK9153Q1ZF` | Valid check char. |
| 4 | Firm PAN (optional) | PAN mask | No | `AAJFK9153Q` | 4th letter F. Blanked on save. |
| 5 | Udyam registration number (optional) | Udyam mask | No | `UDYAM-AP-08-0071354` | |
| 6 | Contact mobile number (optional) | 10 digits | No | `9963104582` | |
| 7 | Correspondence address | Textarea | No | `D.No. 3-18, Toy Colony, Kondapalli (Ibrahimpatnam mandal), NTR District, Andhra Pradesh - 521228` | AUTO on arrival: `Kondapalli, NTR`. |

### Step 5 — Project cost
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Details carried to this schedule | Read-only | n/a | n/a | AUTO: Promoter `Pothina Anuradha`; Unit `Kondapalli Heritage Toys & Crafts LLP`; Address (Step 4); GSTIN `37AAJFK9153Q1ZF`. |
| 2 | What kind of business is this? | Select | No | `Making things` | AUTO-detected (text contains "Manufacturing"). |
| 3 | Machinery list | Rows | No | see rows | Used here for reusable stall and display equipment. |
| 4 | Working capital (₹ Lakhs) | Number | No | `4.85` | Fair stock, freight, stall rent, travel and stay (equals Step 1 Estimated fair cost). |
| 5 | Total Project Cost | Read-only | n/a | n/a | AUTO: `₹ 10.7 Lakhs`. |

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `Modular exhibition stall with branding (reusable)` | New | `Vijaya Expo Systems, Vijayawada` | `1` | `2.20` | 2.20 |
| 2 | `Portable carving and finishing demo kit` | New | `Kondapalli Artisans Tools Cooperative, Kondapalli` | `1` | `0.85` | 0.85 |
| 3 | `LED display panels and spot lighting` | New | `Vijaya Expo Systems, Vijayawada` | `4` | `0.40` | 1.60 |
| 4 | `Transit packing crates` | New | `Sri Durga Packaging Works, Vijayawada` | `10` | `0.12` | 1.20 |

Machinery total = 2.20 + 0.85 + 1.60 + 1.20 = 5.85.

### Step 6 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Andhra Pradesh Grameena Vikas Bank, Kondapalli branch` | |
| 2 | Interest rate (% per year) | Number | No | `10.25` | |
| 3 | Moratorium (months) | Number | No | `3` | |
| 4 | Loan tenure (months) | Number | No | `36` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | No | `2.15` | 20.09%. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `3.20` | 29.9% (stall rent and space subsidy). |
| 7 | Bank Loan (₹ Lakhs) | Number | No | `5.35` | 50%. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |
| 9 | Total Finance | Read-only | n/a | n/a | AUTO: `₹ 10.7 Lakhs`. |

### Step 7 — Operating cost & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw materials (sub-table) | Rows | No | see rows | |
| 2 | Staff by role and monthly pay (sub-table) | Rows | No | see rows | |
| 3 | Raw Material Cost (₹ Lakhs) | Number | No | `16.80` | |
| 4 | Power Cost (₹ Lakhs) | Number | No | `1.20` | |
| 5 | Wages (₹ Lakhs) | Number | No | `9.60` | = 80,000 x 12. |
| 6 | Maintenance (₹ Lakhs) | Number | No | `0.90` | |
| 7 | Administrative Expenses (₹ Lakhs) | Number | No | `1.80` | |
| 8 | Marketing Expenses (₹ Lakhs) | Number | No | `4.20` | Includes fair promotion material. |
| 9 | Annual Production Volume | Number | No | `14000` | Pieces per year. |
| 10 | Annual Sales Realization (₹ Lakhs) | Number | No | `42` | |

Raw material rows: (1) `Tella Poniki (soft wood) logs and planks` / `Toy blanks` / `Monthly purchase from a Kondapalli forest-produce depot, cash`; (2) `Natural vegetable colours and lac` / `Painting and finishing` / `Quarterly purchase from a Vijayawada craft-supplies dealer`; (3) `Gift boxes and cushioning` / `Packing` / `Monthly order from Sri Durga Packaging Works, 10-day credit`.
Staff rows: `Master artisan` / `2` / `16000`; `Painter` / `3` / `12000`; `Packer and dispatch helper` / `1` / `12000`. Total = 32,000 + 36,000 + 12,000 = ₹80,000 per month.

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Udyam Certificate | File | No | `PMS_udyam_certificate.pdf` | |
| 2 | Previous Fair Photos (optional) | File | No | `PMS_previous_fair_photos.jpg` | Optional; accepts .jpg/.png. |

- **Money cross-check:** Cost = 5.85 + 4.85 = ₹10.70 lakh. Finance = 2.15 + 3.20 + 5.35 + 0 = ₹10.70 lakh. Own 2.15/10.70 = 20.09% (min 10%). Debt-equity = 5.35 / (2.15 + 3.20) = 1.00 (limit 3). Grant 29.9% (under the 50% advisory). Term loan 5.35 below capex 5.85. Repay months 36 - 3 = 33; EMI at 10.25% = 5.35 x 0.0085417 x 1.0085417^33 / (1.0085417^33 - 1) = ₹0.1867 lakh per month, ₹2.24 lakh per year. Step 1 fair cost 4.85 = working capital 4.85. EBITDA = 42.00 - (16.80 + 1.20) - (9.60 + 0.90 + 1.80 + 4.20) = 7.50; model average DSCR about 2.8 on the repayment years, cash positive.
- **Uploads to prepare:** Udyam Certificate -> `PMS_udyam_certificate.pdf` (always); Previous Fair Photos (optional) -> `PMS_previous_fair_photos.jpg` (always shown, optional).
- **Generate & verify:** 8 sections. Cover: action line "Marketing Support Proposal for" / `Kondapalli Heritage Toys & Crafts LLP` / "under 'Procurement and Marketing Scheme (PMS)'". Step 1 section shows event, stall size, fair city, estimated cost 4.85, entrepreneur. Machinery table 4 rows, total 10.7; finance 2.15 / 3.20 / 5.35; Step 7 tables. PDF and DOCX agree.
- **Negative / boundary tests:**
  1. Step 1: Estimated fair cost `-2` -> the input accepts a negative value (no min); no validation blocks it. Reset to 4.85 afterwards.
  2. Step 1: change Estimated fair cost to `9.00` while Step 5 working capital stays 4.85 -> no warning (not cross-checked).
  3. Step 6: own `0.50`, grant `3.20`, bank `7.00` (total 10.70) -> blocking equity 4.67% (<10%). Debt-equity 7.00/3.70 = 1.89 passes.
  4. Step 6: own `1.00`, grant `0`, bank `9.70` -> blocks on equity 9.35% and on debt-equity 9.70 / 1.00 = 9.7 (limit 3).
  5. Step 6: Loan tenure `6` -> advisory "A loan period of 6 months is unusual"; Moratorium `6` with tenure `6` -> "grace period ... as long as ... whole loan period".
  6. Step 7: Annual Sales Realization `20` -> advisory "Your yearly costs (₹34.5 lakh) are higher than your yearly sales (₹20 lakh)"; generation still allowed.
- **Discrepancies spotted:**
  1. 8 steps in code vs 5 in `pms.md`, `pmsQuestions.ts`, brief and bullets ("Step 5: Udyam" is Step 8).
  2. `pms.md` says "Use a separate term-loan DPR if needed", but the app runs the full Means of finance with bank loan terms and blockers.
  3. Estimated fair cost (Step 1) is never reconciled with Step 5 / 6 totals and accepts negative numbers.
  4. Stale "Heavy capex tables are hidden for Mudra Shishu / Kishore" text on Step 5; Step 4 name asterisk not enforced; `dates.order` never fires.

## 31. National SC/ST Hub (`SCST_HUB`)
**Entry:** `/individual-dpr/create?new=true&scheme=SCST_HUB`. **Total steps:** 8 (code `SCST_HUB_STEPS`; docs/brief say 5). Titles: Step 1: Cover & GeM readiness; Step 2: Unit profile; Step 3: Procurement focus; Step 4: Applicant / firm; Step 5: Project cost; Step 6: Means of finance; Step 7: Operating cost & sales; Step 8: Documents & uploads.
**Test persona:** Pasupuleti Venkata Ramesh (age 37, Scheduled Caste, sole proprietor) runs **Venkata Ramesh Steel Furniture Works** on Palnadu Road, **Narasaraopet (Narasaraopet mandal), Palnadu district**. Since 2020 he has built steel almirahs, hostel cots and office tables; he is GeM-registered but has not yet bid, and wants vendor-development and procurement readiness plus some capacity upgrades to supply government hostels, schools and PHCs.

### Step 1 — Cover & GeM readiness
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes / validation / expected auto-value |
|---|---|---|---|---|---|
| 1 | Unit / Project Name * | Text input | Yes | `Venkata Ramesh Steel Furniture Works` | Required. |
| 2 | District * | Select | Yes | `Palnadu` | |
| 3 | Location * | Select | Yes | `Narasaraopet` | Palnadu list: Narasaraopet, Chilakaluripet, Macherla, Piduguralla, Sattenapalle, Vinukonda, Dachepalle, Gurazala. |
| 4 | Nature of Business | Text input | No | `Manufacturing of institutional steel furniture for hostels, schools and offices` | |
| 5 | Major Products | Text input | No | `Steel almirahs, hostel cots, office tables` | |
| 6 | Category | Select (Select / Scheduled Caste (SC) / Scheduled Tribe (ST)) | No | `Scheduled Caste (SC)` | Stored as `sc` under the key `sclcssCategory`. No required check, even though the scheme is SC/ST only. |
| 7 | GeM experience | Select (Select / Not on GeM yet / GeM registered / Have bid on GeM / Have won GeM orders) | No | `GeM registered` | Stored `registered`. |
| 8 | Entrepreneur name | Text input | No | `Pasupuleti Venkata Ramesh` | |
| 9 | Procurement focus | Textarea | No | `Supply steel almirahs, hostel cots and office tables to government hostels, schools and PHCs through GeM; target a first order book of about ₹60 lakh in 2027-28 and BIS-aligned product testing.` | |

### Step 2 — Unit profile
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Present / proposed activity summary | Textarea | No | `The unit fabricates sheet-metal furniture on a 4,000 sq ft shop floor with 9 workers, selling to local schools, private hostels and offices on cash and 30-day credit; it registered on GeM in March 2026 but has not yet bid because it lacks powder coating and press-brake capacity for bulk lots.` | Min 30 chars. |
| 2 | Start Date | Date | No | `2020-02-15` | |
| 3 | Commitment Date | Date | No | `2026-11-05` | On or after Start Date. |
| 4 | Tools / process level | Text input | No | `Manual shearing, spot welding and hand-spray painting; no powder coating or CNC bending` | |
| 5 | Capacity / throughput (if applicable) | Text input | No | `About 70 pieces per month; target 100 pieces per month` | |
| 6 | Products, share of output and selling price | Rows | No | see rows | |

| Row | Product Name | Share of Output (%) | Selling Price (per unit) |
|---|---|---|---|
| 1 | `Steel almirah (2-door)` | `40` | `9800` |
| 2 | `Hostel cot (single, bunk-ready)` | `35` | `4600` |
| 3 | `Office table with drawers` | `25` | `6400` |

Check: 0.40x9,800 + 0.35x4,600 + 0.25x6,400 = 3,920 + 1,610 + 1,600 = ₹7,130 average x 1,180 units = ₹84.13 lakh vs Step 7 sales 84.00.

### Step 3 — Procurement focus
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Target customers / market | Textarea | No | `Social welfare and tribal welfare hostels, government schools, PHCs and municipal offices in Palnadu, Guntur and Prakasam districts, bought through GeM and AP e-procurement tenders.` | |
| 2 | Demand / footfall note | Textarea | No | `Hostel and school furniture tenders under Samagra Shiksha and welfare-department budgets are issued every year; GeM lots usually ask for 200 to 500 pieces with powder-coated finish and delivery within 45 days.` | |

### Step 4 — Applicant / firm
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Firm / proprietor name * | Text | Asterisk only | `Pasupuleti Venkata Ramesh` | AUTO on arrival equals Entrepreneur name; the note "Filled in from your unit details" shows. Leave as is, or type `Venkata Ramesh Steel Furniture Works` to test overwriting. |
| 2 | Legal status (sole / partnership / company) | Text | No | `Sole proprietorship` | |
| 3 | GSTIN (optional) | GSTIN mask | No | `37CMVPP6027D1ZM` | Valid; personal PAN inside is accepted by the GSTIN check. |
| 4 | Firm PAN (optional) | PAN mask | No | leave blank | Sole proprietor; personal PAN is rejected by this field. |
| 5 | Udyam registration number (optional) | Udyam mask | No | `UDYAM-AP-24-0029463` | |
| 6 | Contact mobile number (optional) | 10 digits | No | `7013628495` | |
| 7 | Correspondence address | Textarea | No | `D.No. 8-112, Palnadu Road, Narasaraopet (Narasaraopet mandal), Palnadu District, Andhra Pradesh - 522601` | AUTO on arrival: `Narasaraopet, Palnadu`. |

### Step 5 — Project cost
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Details carried to this schedule | Read-only | n/a | n/a | AUTO: Promoter `Pasupuleti Venkata Ramesh`; Unit `Venkata Ramesh Steel Furniture Works`; Address (Step 4 text); GSTIN `37CMVPP6027D1ZM`. |
| 2 | What kind of business is this? | Select | No | `Making things` | AUTO-detected. |
| 3 | Machinery list | Rows | No | see rows | |
| 4 | Working capital (₹ Lakhs) | Number | No | `5.20` | |
| 5 | Total Project Cost | Read-only | n/a | n/a | AUTO: `₹ 17 Lakhs`. |

| Row | Description | Condition | Supplier | Qty | Unit cost (₹ Lakhs) | Row total |
|---|---|---|---|---|---|---|
| 1 | `CNC press brake, 60 tonne` | New | `Bharat Sheet Metal Machines, Rajkot` | `1` | `4.20` | 4.20 |
| 2 | `Sheet shearing machine, 6 ft` | New | `Bharat Sheet Metal Machines, Rajkot` | `1` | `2.60` | 2.60 |
| 3 | `Spot welding machine, 25 kVA` | New | `Sri Venkateswara Welding Equipment, Vijayawada` | `2` | `0.55` | 1.10 |
| 4 | `Powder coating booth with curing oven` | New | `Vijaya Finishing Systems, Hyderabad` | `1` | `3.90` | 3.90 |

Machinery total = 4.20 + 2.60 + 1.10 + 3.90 = 11.80.

### Step 6 — Means of finance
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Bank name | Text | No | `Indian Bank, Narasaraopet branch` | |
| 2 | Interest rate (% per year) | Number | No | `11` | |
| 3 | Moratorium (months) | Number | No | `6` | |
| 4 | Loan tenure (months) | Number | No | `60` | |
| 5 | Promoter contribution / equity (₹ Lakhs) | Number | No | `5.20` | 30.6%. |
| 6 | Government Grant (₹ Lakhs) | Number | No | `0` | |
| 7 | Bank Loan (₹ Lakhs) | Number | No | `11.80` | 69.4%. |
| 8 | Other Sources (₹ Lakhs) | Number | No | `0` | |
| 9 | Total Finance | Read-only | n/a | n/a | AUTO: `₹ 17 Lakhs`. |

### Step 7 — Operating cost & sales
| # | Field (exact UI label) | Control / type | Req? | Test input (exact) | Notes |
|---|---|---|---|---|---|
| 1 | Raw materials (sub-table) | Rows | No | see rows | |
| 2 | Staff by role and monthly pay (sub-table) | Rows | No | see rows | |
| 3 | Raw Material Cost (₹ Lakhs) | Number | No | `46.20` | |
| 4 | Power Cost (₹ Lakhs) | Number | No | `5.40` | |
| 5 | Wages (₹ Lakhs) | Number | No | `13.20` | = 1,10,000 x 12. |
| 6 | Maintenance (₹ Lakhs) | Number | No | `1.80` | |
| 7 | Administrative Expenses (₹ Lakhs) | Number | No | `2.40` | |
| 8 | Marketing Expenses (₹ Lakhs) | Number | No | `1.20` | |
| 9 | Annual Production Volume | Number | No | `1180` | Furniture pieces per year. |
| 10 | Annual Sales Realization (₹ Lakhs) | Number | No | `84` | |

Raw material rows: (1) `CRCA steel sheets, 0.8 to 1.2 mm` / `Almirah and table bodies` / `Fortnightly purchase from a Vijayawada steel dealer, 21-day credit`; (2) `MS angles, pipes and flats` / `Cot frames and legs` / `Monthly purchase from a Guntur steel yard, cash`; (3) `Powder coat, locks and hardware` / `Finishing and fittings` / `Quarterly purchase from a Hyderabad hardware distributor`.
Staff rows: `Sheet-metal fabricator` / `3` / `14000`; `Welder` / `2` / `13000`; `Powder-coating operator` / `1` / `12000`; `Helper` / `3` / `10000`. Total = 42,000 + 26,000 + 12,000 + 30,000 = ₹1,10,000 per month.

### Step 8 — Documents & uploads
| # | Field (exact UI label) | Control / type | Req? | Test input | Notes |
|---|---|---|---|---|---|
| 1 | Caste Certificate | File | No | `SCST_caste_certificate.pdf` | Always shown (not conditional on the Category selection). |
| 2 | Udyam Certificate | File | No | `SCST_udyam_certificate.pdf` | |
| 3 | Cancelled Cheque | File | No | `SCST_cancelled_cheque.jpg` | |

- **Money cross-check:** Cost = 11.80 + 5.20 = ₹17.00 lakh. Finance = 5.20 + 0 + 11.80 + 0 = ₹17.00 lakh. Own 5.20/17 = 30.6% (min 10%). Debt-equity = 11.80 / 5.20 = 2.27 (limit 3). Term loan 11.80 equals capex 11.80, so no "term loan too high" note (it only fires above). Repay months 60 - 6 = 54; EMI at 11% = 11.80 x 0.0091667 x 1.0091667^54 / (1.0091667^54 - 1) = ₹0.2780 lakh per month, ₹3.34 lakh per year. EBITDA = 84.00 - (46.20 + 5.40) - (13.20 + 1.80 + 2.40 + 1.20) = 13.80; model average DSCR about 3.9; cash positive.
- **Uploads to prepare:** Caste Certificate -> `SCST_caste_certificate.pdf`; Udyam Certificate -> `SCST_udyam_certificate.pdf`; Cancelled Cheque -> `SCST_cancelled_cheque.jpg`. All three always appear.
- **Generate & verify:** 8 sections. Cover: action line "Establishment of" (see Discrepancies) / `Venkata Ramesh Steel Furniture Works` / "under 'National SC/ST Hub'". Step 1 section lists the category (the preview label is "SC / ST category", value "Scheduled Caste (SC)"), GeM experience = GeM registered, entrepreneur name, procurement focus. Machinery table 4 rows, total 17; finance 5.20 / 0 / 11.80; Step 7 tables. PDF and DOCX agree.
- **Negative / boundary tests:**
  1. Step 1: leave Category on "Select" and complete the DPR -> Generate still works (no check that an SC/ST category was chosen).
  2. Step 6: own `3.00`, bank `14.00` (total 17.00) -> blocking equity 17.6% passes, but debt-equity 14.00 / 3.00 = 4.67 -> blocker "most allowed is 3 to 1".
  3. Step 6: own `1.20`, bank `15.80` -> blocks on equity 7.06% (<10%) and debt-equity 13.2.
  4. Step 6: Bank Loan `12.50` with own 5.20 -> funding 17.70 vs 17.00 -> mismatch blocker "(difference ₹0.7 lakh)". Also type Bank Loan `13.00`, own `4.00`: balanced (17.00) but term loan 13.00 > capex 11.80 -> advisory only ("The term loan ... is more than the assets and set-up costs it pays for").
  5. Step 4: mobile `701362849` (9 digits) -> "Mobile number has 10 digits (1 more)"; Udyam `UDYAM-AP-24-00294` -> format hint.
  6. Step 2: Start Date `2026-12-01`, Commitment Date `2026-11-05` -> toast "Commitment Date must be on or after Start Date".
- **Discrepancies spotted:**
  1. 8 steps in code vs 5 in `scstHub.md`, `scstHubQuestions.ts`, brief and bullets ("Step 5: Caste certificate..." is Step 8).
  2. `scstHub.md` says "not a term loan by itself", but the app asks for a full means of finance with bank loan terms and equity / debt-equity blockers.
  3. Category is stored in `sclcssCategory` (the SCLCSS key), shown as "Category" in the form but "SC / ST category" in the preview, and is never required, so an SC/ST-only scheme can be generated with no category chosen.
  4. Cover action line for `SCST_HUB` falls through to "Establishment of" while sibling short packs (ZED, LEAN, MSME_IPR) use "Proposal for" and PMS has its own line.
  5. Caste Certificate upload is always shown but is not conditional on category; stale "Heavy capex tables are hidden for Mudra Shishu / Kishore" text on Step 5; Step 4 name asterisk not enforced; `dates.order` never fires.

---

