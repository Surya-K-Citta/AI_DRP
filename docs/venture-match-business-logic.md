# Scheme Finder (Venture Match) — Business Logic

> Latest product rules as implemented in the codebase.  
> Primary route: `/venture-match`  
> UI label: **Scheme Finder**

**Maintenance:** Any business-logic change to Scheme Finder / Venture Match must update this file (Cursor rule: `.cursor/rules/venture-match-docs.mdc`). If the handoff or link to Individual DPR changes, update [create-new-dpr-business-logic.md](./create-new-dpr-business-logic.md) too.

Related doc: [Create New Latest DPR business logic](./create-new-dpr-business-logic.md)

---

## 1. Purpose

Scheme Finder asks a **dynamic set of questions** (base 14 + up to 5 conditional) and ranks which MSME schemes still fit. Matching runs **on the client** (deterministic rules). An optional hybrid help chat can suggest an option using AP-oriented chips first, then an LLM fallback.

It does **not** create the DPR itself. It hands answers + matches into **Create New Latest DPR** (Individual DPR), or redirects **cluster** matches to Cluster DPR.

**Rev 2 (AP MSME One integration):** Conditional questions `supportType`, `upgradeIntent`, `qualityGoal`, `sectorFlag`, `procurementInterest`; new scheme codes including `PMEGP_2ND`, `SCLCSS` (not general CLCSS), short overlays (`ZED`/`LEAN`/`PMS`/…), CTA-only (`CHAMPIONS`/`ESDP`/`NTCEC`), and cluster CTAs (`MSE_CDP`/`SFURTI`/`AP_CDP`/`APICF`). See [ap-msme-one-schemes-gap.pdf](./ap-msme-one-schemes-gap.pdf).

---

## 2. How this links to Create New Latest DPR

| Step | What happens |
|------|----------------|
| User finishes visible questions | `evaluate(answers)` builds `matches` + `excluded` (each match has `dprRoute`) |
| **Generate DPR for this Match** (`full` / `short`) | `saveHandoff` → `/individual-dpr/create?new=true&scheme=<CODE>` |
| **Open Cluster DPR** (`dprRoute=cluster`) | Navigate to `/cluster-dpr/create` |
| CTA-only matches | No individual DPR button — helpdesk / training hint only |
| **Create DPR** (generic button) | Same handoff → `/individual-dpr/create?new=true` |
| Handoff storage | `localStorage` key `venture-match-handoff` (`HANDOFF_KEY`) |
| Progress storage | `localStorage` key `venture-match-progress` (`STORAGE_KEY`) — wizard resume only |

On Individual DPR open with `?new=true`:

1. Page **peeks** the handoff (`peekHandoff`) — does not delete it.
2. Sets `matchedSchemeCode` from `?scheme=` if present.
3. Stores `ventureMatchAnswers` from handoff (overlay rules only).  
4. Does **not** prefill Create New Latest DPR form fields from Scheme Finder answers.

So Scheme Finder is the **eligibility + scheme choice front door**; Create New DPR is the **18-step bank-ready report** that consumes that choice.

There is also a separate path: AI Guided Builder (`/dpr/builder`) can **consume** the same handoff via `consumeHandoff()` + `buildDprPrefill()`. Create New Latest DPR is the primary Scheme Finder CTA today.

---

## 3. Question flow (14 cards)

Order is fixed in `client/src/lib/ventureMatch/questions.ts`:

| # | `questionId` | Multi? | Option IDs (summary) |
|---|--------------|--------|----------------------|
| 1 | `activity` | no | `mfg`, `knowledge`, `food`, `craft`, `service`, `trade`, `vending`, `crop`, `mixed`, `notSure`, `notBusiness` |
| 2 | `stage` | no | `greenfield`, `brownfield`, `idea`, `restart`, `notSure` |
| 3 | `budget` | no | bands `under2L` … `above10Cr`, plus `none`, `notSure` |
| 4 | `legal` | no | `sole`, `partnership`, `company`, `unregistered`, `otherEntity`, `notSure` |
| 5 | `owner` | **yes** | Free combos: `female`, `pwd`, `transgender`, `exServiceman`. Pick-one group: `sc`, `st`, `bc`, `generalMale`. Exclusive (alone): `notDecided`, `noMajority`, `notSure` |
| 6 | `domicile` | no | `ap`, `other`, `planningAp`, `notSure` |
| 7 | `location` | no | `urban`, `rural`, `apiic`, `home`, `outsideAp`, `notDecided` |
| 8 | `riceCard` | no | `yes`, `no`, `otherCard`, `notSure` |
| 9 | `age` | no | `under18`, `18to20`, `21to50`, `51to60`, `above60`, `notSure` |
| 10 | `education` | no | `below8th`, `8thPlus`, `notSure` |
| 11 | `udyam` | no | `yes`, `willing`, `applied`, `refuse`, `notSure` |
| 12 | `priorSubsidy` | no | `none`, `repaid`, `outstanding`, `notSure` |
| 13 | `govtFamily` | no | `yes`, `no`, `notSure` |
| 14 | `market` | no | `offline`, `ecommerce`, `export`, `both`, `notSellingYet`, `notSure` |

### Header and navigation

The page header is sticky (stays on screen while scrolling, like Create New Latest DPR). The back button (with the page title) is named after the screen the person came from (**Back to Dashboard**, **Back to Projects**, …; `useBackTarget`) and returns there, defaulting to `/dashboard` when the page is opened directly. The question progress bar (“Question x of N”, remaining count, bar) is part of that sticky header. **Previous** and **Next** are round floating buttons. On wide screens (lg and up) they sit at the vertical middle of the screen, an equal distance outside the left and right edges of the question block, and stay put while scrolling; on smaller screens they sit in the bottom-left and bottom-right corners. The “Need help choosing?” pill is also floating and fixed: bottom-right on wide screens, bottom-centre on small screens (hidden while the help chat is open); the question card holds only the question and options. **Previous** steps back one question (or from the results back to the last question) and is disabled on the first question. **Next** moves forward only once the current question is answered (for the owner question, at least one tag); after the last question it opens the results, and it is disabled on the results screen. There is no language toggle on this page.

### Owner tag rules

Rules live in `lib/ventureMatch/ownerSelection.ts` (`toggleOwner`, `sanitizeOwnerTags`) with the lists in `types.ts`.

- **Pick-one group** (`OWNER_PICK_ONE_GROUPS`): SC, ST, BC and General category man. Choosing one replaces any other from this group; tapping the chosen one again clears it.
- **Free tags** — Woman, Person with disability, Transgender, Ex-serviceman — each toggle on their own and combine with anything except an exclusive tag (so, for example, SC + Woman + PwD, or General category man + Ex-serviceman, are valid).
- **Exclusive tags** (`OWNER_EXCLUSIVE_TAGS`: not decided, no 51%, not sure) clear every other tag and cannot mix with them. Selecting one while another exclusive is selected replaces it.
- Help-chat suggestions are cleaned with the same rules before they are applied (client `sanitizeOwnerTags`, and the server help service trims the model’s answer the same way).
- Scheme matching is unchanged: it asks whether any chosen tag qualifies (for example SC *or* ST for SCLCSS; Woman, Transgender, Ex-serviceman or PwD for the CMEP booster). The ownership hint shows when General category man is chosen without Woman.

### Global block

If `activity` is `notBusiness` or `notSure`, **all schemes fail** (`blocksAllSchemes`). Remaining count becomes 0.

---

## 4. Evaluation engine

File: `client/src/lib/ventureMatch/evaluate.ts`  
Rules: `client/src/lib/ventureMatch/schemes.ts`

For each scheme criterion:

- `pass` — answer present and allowed  
- `fail` — answer present and not allowed  
- `unknown` — answer missing / not yet asked  

Scheme classification:

- Any criterion `fail` → **excluded**
- Else if at least one `pass` → **match** (unknowns allowed)
- Else (all unknown) → neither listed as match nor as excluded with fails only in step view

**Remaining count** while answering question N ignores the current and later answers (`scopedAnswers`), so the counter only reflects decisions already locked in.

**Step exclusions** UI shows schemes that newly fail given answers up to the previous step.

Benefit copy is an i18n key from `scheme.benefit(answers)` (e.g. PMEGP rural/special rates, CMEP booster text).

---

## 5. Catalog (16 schemes)

| Code | Kind | AP domicile required? | Headline gates (simplified) |
|------|------|----------------------|-----------------------------|
| `SVANIDHI` | loan | no | Street vending + urban + age 18+ |
| `VISHWAKARMA` | subsidy | no | Craft + age 18+ + no outstanding subsidy + no govt family |
| `PMFME` | subsidy | no | Food + budget ≤ ~₹50L bands + sole/partnership/otherEntity + 8th+ |
| `PMEGP` | subsidy | no | Greenfield (idea = unknown) + enterprise activity + registered firm + numeric budget + education gate if large |
| `STANDUP` | loan | no | Enterprise + registered + greenfield + woman/SC/ST + ₹10L–₹1Cr + 18+ + Udyam ready |
| `MUDRA` | loan | no | Enterprise + registered + budget ≤ ₹20L band + 18+ + Udyam ready |
| `CGTMSE` | guarantee | no | Registered + Udyam ready + budget &lt; ₹10Cr bands + enterprise |
| `AP_EDP` | subsidy | **yes** | Manufacturing + greenfield + AP unit location (urban/rural/apiic) + registered + Udyam + budget |
| `AP_FPP` | subsidy | **yes** | Food + legal incl. company/otherEntity + AP location + Udyam |
| `AP_TECH_UPGRADE` | subsidy | **yes** | Manufacturing + brownfield/restart + AP location + registered |
| `MSE_SPICE` | subsidy | no | Registered + brownfield/restart + Udyam |
| `OBMMS` | subsidy | **yes** | SC/ST/BC/PWD + white rice card + age 21–60 + stage not idea-only + budget + AP location + unregistered/sole |
| `AP_PARKS` | subsidy | **yes** | Location = APIIC park + registered |
| `AP_CMEP` | subsidy | **yes** | Activity `mfg` or `knowledge` + greenfield + numeric budget (loan required; `none` fails) |
| `RAMP_TEAM` | support | no | Registered + ecommerce/both + Udyam |
| `EPM_NIRYAT` | subsidy | no | Registered + export market + Udyam |

### Shared activity buckets (matcher)

- Manufacturing-like: `mfg`, `food`, `craft`
- Service-like: `service`, `trade`, `vending`, `knowledge`
- Enterprise activities (most central schemes): mfg, knowledge, food, craft, service, trade, vending, mixed

### PMEGP education gate

If manufacturing-like and budget min ≥ ₹10L, or service-like/mixed and budget min ≥ ₹5L → need `education === '8thPlus'`. Below threshold → pass without education.

### AP special-category boost (EDP / FPP benefit text)

`domicile === 'ap'` AND owner includes one of `female | sc | st | bc | pwd` → boosted benefit string.

### AP CMEP booster (match flag + UI banner)

`boosted` is set **only** for `AP_CMEP` when:

```text
domicile === 'ap'
AND owner has at least one of: female | transgender | exServiceman | pwd
```

Results card shows a booster banner when `scheme.boosted` is true.

### Ownership hint

If owner includes `generalMale` and not `female`, results show a hint about putting the firm in wife/mother’s name (Stand-Up India / higher subsidy / CGTMSE / RAMP TEAM messaging).

---

## 6. Help chat (hybrid)

- UI: `VentureMatchHelpBubble` + trigger on each card.
- Guides: `helpGuides.ts` — AP-rule notes + clarifying chip trees; maps replies → option ID(s).
- Multi only for `owner`.
- Free text → `POST /api/ai/...` → `ventureMatchHelp.service` (server LLM).
- Chat has its own EN | తెలుగు toggle (does not have to change whole-app language).
- Applying a suggestion writes the option and advances like a normal selection.

---

## 7. Results actions

Per matched scheme:

- Card shows the name, then 2–3 bullet **key facts** and the benefit i18n string (the line that depends on the person’s answers, for example the PMEGP rate for their area). The bullets come from `client/src/lib/ventureMatch/schemeKeyFacts.ts`, one list per scheme code, each bullet tagged **Support** (amount / percentage / what is given), **Who** (who can apply) or **Note** (limits, what it cannot be combined with, whether it is a service with no DPR). Figures come from the scheme briefs and `docs/schemes`, are written as “up to” / “about”, and the results notice says they are indicative. EN and TE are written together; a scheme with no entry falls back to the first lines of its brief intro. When a scheme’s rules change, update `schemeKeyFacts.ts` together with its brief and scheme doc.
- CMEP booster banner if `boosted`.
- One button at the bottom right of the card, under the bullet facts (so the text uses the full card width): **Know more & create** → `onCreateDprForScheme(code)`, which opens Create New Latest DPR on that scheme’s brief (the “know more” page) before the form. Not shown for under-18 applicants or for service / helpdesk programmes (`dprRoute` `cta` / `none`), which show the “not a bank DPR” hint instead.

### Motion

Scheme Finder uses short, eased animations (CSS in `client/src/index.css`, classes `vm-*`): the question card slides in from the right when moving forward and from the left when going back; options rise in one after another, lift on hover, press down on click and show a pop-in check when chosen; the progress bar fills smoothly; the sticky header gains a shadow once the page scrolls; the results page, scheme cards and plan items fade up in sequence; the floating buttons grow on hover and shrink on press. All of it is switched off when the person's system asks for reduced motion (`prefers-reduced-motion`).

### No guarantee or assurance in the copy

Scheme Finder gives guidance only. No text on this page (cards, plan, hints, help chat, results) may promise or assure eligibility, approval, subsidy amount or timelines: no “you qualify”, “you will get”, “guaranteed”, “assured” or equivalents, and no “best” / “strongest” claims. Use “may”, “could”, “usually”, “suggested”. Scheme names that contain “guarantee” (CGTMSE, ECLGS) and descriptions of what a scheme itself offers are fine, because they describe the scheme, not this tool. The results page shows a short notice (`ventureMatch.noGuarantee`) under the match count, and the plan panel repeats it. The help-chat system prompt forbids promising anything. Keep this rule when adding scheme copy.

### Combination guidance (best plan)

On wide screens (lg and up) the results page is two columns: the matched scheme cards (and the “schemes that do not match” list) on the left, and `VentureMatchCombos` on the right, which stays in view and scrolls on its own while you read the cards. On smaller screens it is one column with the cards first and the panel below. On the results screen only the back arrow (**Previous**) is shown, floating at the left edge at the vertical middle of the screen (bottom-left on small screens); it returns to the last question so answers can be changed. `VentureMatchCombos` shows how the matched schemes fit together. The rules and the plan builder live in `client/src/lib/ventureMatch/combos.ts` (`relationBetween`, `analyzeCombinations`), so they can be tested and reviewed without the UI.

Every scheme has a **role**: margin money / back-ended subsidy (PMEGP, PMEGP 2nd loan, AP CMEP), capital subsidy (PMFME, SCLCSS, AP EDP, AP FPP, AP Tech Upgrade, MSE-GIFT, OBMMS, CVY, NHDP, PTUAS, MSE-SPICE), loan (MUDRA, SVANidhi, Vishwakarma), guarantee (CGTMSE, ECLGS), land rebate (AP Parks), cluster (MSE-CDP, SFURTI, APCDP, APICF), everything else = support (training, certification, marketing, innovation).

Relation between two matched schemes:

| Relation | Meaning | Examples |
|----------|---------|----------|
| Cannot (`exclusive`) | Same cost subsidised twice, or an eligibility bar | AP EDP × AP Tech Upgrade × AP FPP (**in our scheme docs**: G.O.Ms.No.69, total incentives ≤ 75% of fixed capital investment); PMEGP × any other subsidy; PMEGP × MUDRA (same loan); Vishwakarma × PMEGP / MUDRA / SVANidhi (5-year bar); AP CMEP × PMEGP and AP state subsidies; two cluster schemes for one common facility |
| Overlap (`overlap`) | Redundant: one is enough | CGTMSE on a MUDRA / SVANidhi / Vishwakarma loan (already guaranteed); MSME Champions with ZED / LEAN / Innovative (it is their single window) |
| Order (`sequence`) | One must come first | PMEGP → 2nd loan; MUDRA → 2nd loan; SVANidhi → MUDRA; ESDP training → PMEGP / AP CMEP |
| Check (`conditional`) | Allowed only with conditions | Capital subsidy × capital subsidy or margin money (convergence clause, never the same machinery cost); MUDRA label with a subsidy; AP Parks with a non-AP subsidy; ECLGS beside another loan (different facility) |
| Together (`stack`) | Works side by side | Guarantee on a subsidised bank loan; AP Parks land rebate with AP EDP / FPP / Tech Upgrade (still ≤ 75% FCI); SCLCSS with National SC/ST Hub; cluster membership with an individual scheme; any support scheme with anything |

**Two tabs in the plan block.** The block has **Suggested** (the plan described here, unchanged) and **Compare**. In Compare the person first picks *their* scheme from the matched schemes, then ticks up to three others to set beside it; a comparison table appears (`VentureMatchCompare.tsx`). Columns are the chosen schemes (theirs first, marked “Your scheme”); rows are: what kind of help, run by (central / state), what you may get, the line for *their* answers, who can apply, needs a bank loan?, limits to know, fit with their answers (checks passed of total, and how many are still open), how it combines with their scheme (together / possible with checks / cannot / overlaps / one after the other, with the reason), how to apply, documents to keep ready, and a **Know more & create** button per scheme (hidden for under-18 applicants; “No DPR to prepare” for service-only schemes). The table never ranks schemes; the person decides. Facts come from `schemeKeyFacts.ts` and the scheme briefs; the “together” row comes from `relationBetween` in `combos.ts`; “fit” comes from `SchemeMatch.fit`, filled in by `evaluate`. The block keeps its place (right column beside the cards on wide screens, below the cards on small ones) whichever tab is open; the table scrolls sideways inside the block with the row labels pinned, and a hint says so.

**Expanded view.** An **Expand** button beside the tabs enlarges the plan block into a large window over the page (Close, Esc, or a click outside shrinks it again), for both tabs. Suggested lays its sections out in two columns; Compare uses wider columns so four schemes fit without sideways scrolling on a desktop. It is the same block, only enlarged, so a comparison in progress is kept when you expand or shrink it. While it is open the page stops scrolling behind it, and the results page drops its sticky positioning for the block (a sticky parent would trap the window beneath the page header).

Each rule is tagged `guideline` (written in `docs/schemes`) or `practice` (standard Indian MSME practice, not in our scheme documents). `practice` rules show a “Confirm with DIC / bank” tag on screen. **Ask the scheme owners to review the `practice` rules** before treating them as final; subsidy windows and convergence clauses change.

Best plan: schemes are ranked by typical benefit (`WEIGHT`, +5 for the AP CMEP booster; food units rank AP FPP above AP EDP). Going down the list, a scheme joins the plan unless it is `exclusive` or `overlap` with one already chosen; it is then listed under “Matched, but not in the plan” with the scheme it loses to and why. `conditional` pairs stay in the plan with a “Check before applying” note. The plan is shown as: lead schemes (margin / capital / loan), add-ons (guarantee, land rebate, support), cluster route, order of steps, then all can / cannot pairs. Cards of lead schemes get an “In your best plan” badge. The ranking is by typical value, not a computed subsidy amount, so it is guidance, not a guarantee.

Footer:

- **Create DPR** → Individual DPR without forced scheme code.
- **Start again** → clears answers + `venture-match-progress`.

---

## 8. Key source files

| File | Role |
|------|------|
| `client/src/pages/VentureMatch.tsx` | Wizard, storage, navigation to DPR |
| `client/src/lib/ventureMatch/combos.ts` | Scheme combination rules + best-plan builder |
| `client/src/lib/ventureMatch/questions.ts` | Question order + storage keys |
| `client/src/lib/ventureMatch/schemes.ts` | 16 scheme rules + CMEP booster |
| `client/src/lib/ventureMatch/evaluate.ts` | Match / exclude / remaining |
| `client/src/lib/ventureMatch/mapToDpr.ts` | Handoff + classic-builder prefill helper |
| `client/src/lib/ventureMatch/helpGuides.ts` | Chip trees |
| `server/src/services/ventureMatchHelp.service.ts` | LLM help fallback |
| `client/src/i18n/locales/en.json` / `te.json` | Scheme names, criteria, benefits |

---

## 9. Non-goals / boundaries

- Does not submit applications to banks or AP MSME ONE.
- Does not invent live subsidy percentages beyond coded benefit strings; Create New DPR scheme briefs hold brochure-style copy separately.
- Central schemes are **not** gated on AP domicile; only listed AP state schemes (incl. CMEP) are.
