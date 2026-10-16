# Create New Latest DPR (Individual DPR) — Business Logic

> Latest product rules as implemented in the codebase.  
> Primary route: `/individual-dpr/create`  
> UI title i18n: **Create New Latest DPR**

**Maintenance:** Any business-logic change to Create New Latest DPR / Individual DPR must update this file (Cursor rule: `.cursor/rules/create-new-dpr-docs.mdc`). If the handoff or link to Scheme Finder changes, update [venture-match-business-logic.md](./venture-match-business-logic.md) too.

Related doc: [Scheme Finder (Venture Match) business logic](./venture-match-business-logic.md)

---

## 1. Purpose

Create New Latest DPR builds a **single-unit / individual enterprise** Detailed Project Report. **Each scheme owns its own consecutive step list** (Step 1…N) via `schemeStepCatalog.ts`. Vanilla uses 18 steps; PMEGP uses 14; MUDRA uses 12; short packs (ZED etc.) use 5; etc. It reuses shared draft/generate/preview services via `toIndividualPayload` (legacy wire keys remain for compatibility), and applies scheme-specific fields / uploads.

Users can:

- Arrive from **Scheme Finder** with answers + a scheme code, or  
- Start vanilla (`?new=true`) and pick a scheme from the dropdown, or  
- Leave scheme empty → **vanilla bank term loan** path.

---

## 2. How this links to Scheme Finder (Venture Match)

| Link | Direction | Detail |
|------|-----------|--------|
| Entry from Scheme Finder | VM → DPR | `saveHandoff` then navigate to `/individual-dpr/create?new=true` or `...?scheme=<CODE>` |
| Handoff key | shared | `localStorage` `venture-match-handoff` |
| On `?new=true` load | DPR reads VM | `peekHandoff()` → `setVentureMatchAnswers` (for overlay rules only), optional `setMatchedSchemeCode` from query. **No form-field prefill.** |
| Scheme list | shared catalog | Dropdown / picker = `SCHEMES` filtered by `isIndividualPickerScheme` (+ empty vanilla option) |
| Runtime use of VM answers | DPR reads VM | Step 18 uploads / PMEGP caste cert / MUDRA Tarun Plus / MUDRA Shishu–Kishore / PMEGP education gate use `data.ventureMatchAnswers` |
| Form impact copy | DPR only | `getSchemeImpact(code)` explains how the **form** changes — not eligibility matching |
| Scheme brochure | DPR only | `SchemeBriefPanel` + `schemeBriefs/*` — Benefits / Eligibility / How to Apply / Documents / FAQs (EN/TE) |

Scheme Finder decides **which schemes fit**. Create New DPR decides **how the DPR form and documents behave for the selected scheme**, and drafts the report.

Changing the scheme dropdown mid-flow updates `matchedSchemeCode`, visible steps, briefs, and extras; it does **not** re-run the Scheme Finder evaluator.

---

## 3. Entry & lifecycle

### Draft saving and resuming

- **Automatic save every 30 seconds** (`useDraftAutosave`) while the form is open, but only when something changed since the last save and a unit name exists (the server needs it to create the draft). It is silent: the stepper badge shows **Saving…**, **Saved 10:42**, **Unsaved changes. Auto-saves every 30 seconds.** or **Could not save. Will retry.** A failed automatic save shows one toast, then keeps retrying every 30 seconds.
- **Manual save** is still the **Save Draft** button; moving between steps and generating also save. All saves go through one queue, so they never overlap (no duplicate drafts) and each sends the newest answers.
- **Nothing is lost on the way out:** signing out saves an open draft first and, if that fails, asks before logging out (`lib/draftFlush.ts`); a draft is also saved when the tab is hidden or the page is left, and the browser warns if the tab is closed with unsaved changes.
- **Resume:** the scheme picker shows **Continue where you left off** with the latest unfinished drafts (**Resume** opens one at the step it was left on). Dashboard and DPR-management **Edit** do the same. Opening another report from the picker loads it in place.
- **Restored exactly:** a report is loaded onto a clean slate (nothing from the previous draft or user is merged in), long text, Telugu, tables, decimals and report style come back as saved, and the step reached is restored. Signing out clears the draft on screen, cached DPR / project lists, chat and cached API answers (`lib/sessionReset.ts`), so the next person on the same browser sees none of it. The one deliberate difference: Aadhaar / PAN numbers typed into ID-number fields are blanked on save (DPDP), so they do not come back.
- **Server:** the draft save (`POST /dpr/cluster/draft/save`) now actually stores every save. Before, only the first save was stored (the project's `stepData` and the DPR's Mixed `content` were changed in place without being marked modified, so later saves returned success but kept the old data), and a draft with no town chosen yet was rejected. Both are fixed; an unset town is stored as “Unknown”. Auto-save counts against the API rate limit (default 100 requests per 15 minutes per address): at most 30 saves per 15 minutes, only while changing things.

### Progress stepper (section-wise percentage and milestones)

The step strip on the Create DPR page (`AuthoringStepper`, logic in `lib/individualDpr/authoringProgress.ts` and the pure maths in `authoringMath.ts`) shows how far the DPR is, live:

- **Per section:** each step button carries a ring and a percentage = answered questions ÷ asked questions for that section. “Answered” means a real entry (blank, a dash and a bare 0 do not count, nor do pre-filled year labels in tables). The questions are the same ones the live report lists for that scheme (`getIndividualDocFields`); the uploads section counts uploaded documents. A section turns green with a tick at 100%.
- **Overall:** the average of the sections (each section counts equally), shown as “N% complete · x / y sections done”, with a progress bar and milestone markers at **25% Getting started, 50% Halfway, 75% Almost there, 100% Complete** and a line for the next milestone. Progress is read from the answers as typed in the store, not the outgoing payload, which adds defaults like the unit name.
- **Saved vs on screen:** the bar has two layers: the solid part is the percentage of the last *saved* copy, the lighter part is what is typed but not saved yet. A badge reads **Saved** or **Unsaved changes**, and a section whose answers differ from the saved copy shows an amber dot. “Saved” moves when a save succeeds (Save Draft, moving to another step, generate) and for a report opened from the server it starts as saved. There is no automatic background save.
- **Required answers:** a line counts the required answers still missing (the same rule that blocks moving forward and generating), and says when all are in.
- Percentages update on every keystroke; they never block anything.

### Editing an existing DPR

The **Edit** and **Delete** buttons on the dashboard cards and on the DPR management (All DPRs) cards behave the same (shared code in `lib/dprActions.tsx`); on DPR management, staff see them only on their own DPRs. Back from the edit page returns to the screen it was opened from (**Back to Dashboard** or **Back to All DPRs**). On a DPR’s view page (`/dpr/view/:id`) the **Edit this DPR** button (it replaced “Style this report”) does the same, and styling is done in the Create DPR page under **Customise / Style**; Back from there returns to the DPR view. The dashboard’s **Edit** button opens the Create DPR page on that report (`/individual-dpr/create?projectId=…&dprId=…`, plus `&scheme=CODE`; cluster reports open `/cluster-dpr/create` the same way). When `projectId` is in the URL the page title reads **Edit DPR** (**Edit Cluster DPR** for clusters) instead of the create title. The dashboard lists only the latest 5 reports (newest first by last update) with a “View all DPRs” button for the rest.

### Dev mode (super admin only)

The **Dev mode** switch lives in the left side tool bar, not in the page header. It shows only for a super admin and only on the Create DPR pages (individual and cluster), as a flask icon that expands to a labelled switch when the bar opens. While it is on, the required-field checks are skipped so steps can be stepped through quickly. State is shared through `store/devModeStore.ts`, starts off each time the page opens, and turns off again when the page is left.

### Back button

Back is named and routed from where the person came (`lib/navHistory.tsx`, `useBackTarget`): arriving from Scheme Finder shows **Back to Scheme Finder**, from the dashboard **Back to Dashboard**, and so on; a page opened directly falls back to the dashboard. On the scheme-picker step the button uses that label. When the page was opened on a scheme brief (`?new=true&scheme=CODE`, e.g. Scheme Finder → Know more & create), Back on the brief returns straight to that screen instead of the scheme list. When the person picked the scheme in the picker, Back on the brief is **All Schemes**. On the form it is **Previous**, except when the page was opened straight onto a saved report (Edit from the dashboard, or a resumed draft with `projectId` in the URL): then Back leaves the page and is named after the screen the person came from (**Back to Dashboard**), and it returns there.

### New draft

`/individual-dpr/create?new=true` (± `&scheme=CODE`)

1. `resetData()`, clear project/DPR ids.  
2. Peek Venture Match handoff if present (store answers for overlay rules only — uploads, MUDRA bands, education gate).  
3. Set scheme from query string (may be null).  
4. **Do not** prefill any form step fields from Scheme Finder.  
5. Force `currentStep = 1`, clear loading.
6. **Setup phases (UI):**
   - No `scheme` in URL → **pick** (scheme cards grid).  
   - `?scheme=CODE` (e.g. from Scheme Finder) → **brief** (description box for that scheme).  
   - Tap a card → **brief** for that scheme.  
   - **Next** on brief → **form** (step strip + live preview). If the person arrived from **Start with a guide** (`?guide=1` and a pending choice set), the form opens with that look already applied and the **Form** tab selected. **Match the scheme** shows Gazette on the guide sample until a scheme is chosen. On the form it uses the scheme’s saved look when one exists, otherwise the built-in scheme look, then the other four choices (paper, type, colours, page extras) are applied on top. A named look (Gazette, Ledger, and the rest) wins over the scheme’s usual look. **Start with the usual report** does not send choices, so the form still starts from the scheme default. Editing an existing DPR (`projectId` in the URL) does not use the guide. The guide page shows a sample report that updates with each choice and scrolls to the first place that choice appears.  
   - Resume with `projectId` → **form** directly.

### Resume / load

`?projectId=` / `?dprId=` loads project + cluster draft into `individualDPRStore`.

### Persist

Drafts save via cluster DPR draft API using `toClusterPayload(data)`:

- `isIndividualDPR: true`
- `matchedSchemeCode` on root + `metadata`
- Step 1 maps `unitName` → `clusterName` if needed
- Step 11 maps applicant → SPV-style fields for shared renderer

URL may be rewritten to include `projectId`, `dprId`, and `&scheme=` when present.

### Generate

User must be on the **last visible** step. Generate persists the scheme answers only (no cluster AI chapters). Live preview and `/dpr/view/:id` both render `IndividualDPRDocumentView` — **one section per scheme catalog step**, each a Q&A table of the questions asked plus their answers. Cluster chapters (SPV, CFC, enterprise mix, “Basic Cluster Details”) are not used.

Downloads (PDF / DOCX / XLS from preview, All DPRs, or Telugu Word-to-PDF) use the same scheme Q&A — not `cluster-dpr-pdf.html`. Preview PDF captures `.dpr-document`; other paths build Q&A via `server/src/services/individualDprDocument.ts`.

DPR quality analysis scores the **stored scheme answers** (`clusterData` steps + extras), not the downloaded PDF and not empty cluster chapters (executive summary / cluster profile).

---

## 4. Step model

Base skeleton: **steps 1–18** (`getStepTitle` / i18n `individualDpr.steps.*`).

| Step | Intent |
|------|--------|
| 1 | Unit basic details (+ scheme extras when configured) |
| 2 | Sector overview |
| 3 | District & location |
| 4 | Unit profile |
| 5 | Value chain |
| 6 | Market |
| 7 | Gaps |
| 8 | SWOT |
| 9 | Planned activities |
| 10 | Workplace / shed |
| 11 | Applicant / firm |
| 12 | Project cost |
| 13 | Means of finance |
| 14 | Operating cost & sales |
| 15 | Financial viability |
| 16 | Implementation schedule |
| 17 | Expected impact |
| 18 | Document uploads |

### Per-scheme step catalogs

Configured in `client/src/lib/individualDpr/schemeStepCatalog.ts`. UI shows consecutive **Step 1…N** for the selected scheme. Internally each step maps to a `contentStep` store/AI/PDF bucket so generation stays compatible.

| Scheme | Step count (UI) | Notes |
|--------|-----------------|--------|
| Vanilla / most full schemes | 18 | `VANILLA_STEPS` |
| `PMEGP` | **14** | Bank-unit catalog — see [pmegp.md](./schemes/PMEGP/pmegp.md) |
| `MUDRA` | **12** | PMMY bank-unit catalog — see [mudra.md](./schemes/MUDRA/mudra.md) |
| `VISHWAKARMA` | **12** | Artisan toolkit + training + enterprise loan — see [vishwakarma.md](./schemes/VISHWAKARMA/vishwakarma.md) |
| `SVANIDHI` | **10** | Street-vendor WC micro-credit — see [svanidhi.md](./schemes/SVANIDHI/svanidhi.md) |
| `AP_EDP` | **13** | New-unit FCI capital subsidy — see [apEdp.md](./schemes/AP_EDP/apEdp.md) |
| `ECLGS` | **7** | Additional WC liquidity — see [eclgs.md](./schemes/ECLGS/eclgs.md) |
| `ZED` | **5** | Certification note — see [zed.md](./schemes/ZED/zed.md) |
| `LEAN` | **5** | Process consulting — see [lean.md](./schemes/LEAN/lean.md) |
| `MSME_IPR` | **5** | IP filing note — see [msmeIpr.md](./schemes/MSME_IPR/msmeIpr.md) |
| `PMS` | **5** | Fair / marketing annex — see [pms.md](./schemes/PMS/pms.md) |
| `SCST_HUB` | **5** | Procurement readiness — see [scstHub.md](./schemes/SCST_HUB/scstHub.md) |
| `ASPIRE` | **10** | Rural innovation / livelihood — see [aspire.md](./schemes/ASPIRE/aspire.md) |
| `NHDP` | **10** | Weaver / handloom — see [nhdp.md](./schemes/NHDP/nhdp.md) |
| `CVY` | **12** | Coir unit — see [cvy.md](./schemes/CVY/cvy.md) |
| `MSE_GIFT` | **12** | Green / EE upgrade — see [mseGift.md](./schemes/MSE_GIFT/mseGift.md) |
| `PTUAS` | **13** | Pharma tech upgrade — see [ptuas.md](./schemes/PTUAS/ptuas.md) |
| `PMPDS` | **5** | Pharma/device promotion — see [pmpds.md](./schemes/PMPDS/pmpds.md) |
| `CGTMSE` | **12** | Credit guarantee (MUDRA-adjacent) — see [cgtmse.md](./schemes/CGTMSE/cgtmse.md) |
| `AP_FPP` | **13** | Food processing FCI — see [apFpp.md](./schemes/AP_FPP/apFpp.md) |
| `AP_CMEP` | **13** | Credit-linked greenfield — see [apCmep.md](./schemes/AP_CMEP/apCmep.md) |
| `OBMMS` | **10** | Welfare self-employment — see [obmms.md](./schemes/OBMMS/obmms.md) |
| `MSE_SPICE` | **12** | Circular P&M (25% / ₹12.5 L) — see [mseSpice.md](./schemes/MSE_SPICE/mseSpice.md) |
| `AP_PARKS` | **10** | APIIC land rebate — see [apParks.md](./schemes/AP_PARKS/apParks.md) |
| `RAMP_TEAM` | **5** | ONDC market access — see [rampTeam.md](./schemes/RAMP_TEAM/rampTeam.md) |
| `EPM_NIRYAT` | **7** | Export interest subvention — see [epmNiryat.md](./schemes/EPM_NIRYAT/epmNiryat.md) |

`getVisibleSteps(code)` returns `[1..N]` for that scheme and drives the step strip and next/prev navigation.

### Live preview & generated document

`IndividualDPRDocumentView` (not `ClusterDPRDocumentView`) is the only document for this flow. Cover + TOC + **one Q&A section per catalog step**. Fields come from `individualDocModel.ts` (asked questions only). No cluster / SPV / CFC / enterprise-count chapters. Cluster DPR stays on `/cluster-dpr/create`.

**Filled vs empty content.** The live document inside the customise view (`StyleEditor`) renders with `showEmpty`: every visible section, field, table (one blank row when there are no rows), upload (marked “Not uploaded”) and cover line is listed, whether or not the user has answered it, so it can be edited in place. The final preview (`/dpr/view/:id`, plain preview) and the generated PDF leave `showEmpty` off and show only answered content; sections with no answers are dropped from the body and the table of contents. Sections the user hid stay hidden in both.

**Editing in the live report.** Each field in the live document uses the same kind of control as its question on the form (`lib/individualDpr/docFieldInput.ts`): dropdowns for select questions (District and its dependent Location list, scheme-specific option lists such as premises, category, yes/no), number boxes for numeric questions and table cells, date pickers for dates (same 1990–2100 and Start ≤ Commitment checks as the form), and free text for the rest. Changing District clears a Location that is not in the new district. Edits write to the same store fields as the form (`liveDocEdit.ts`), so the form and the live report stay in step. A field whose scheme-specific list is not in `docFieldInput.ts` falls back to free text.

**Preview button.** The **Preview** button above the live report opens the *final* document in a full-screen, read-only view: no `showEmpty`, no editing controls, only answered content, with the saved style, section order and hidden sections applied, plus zoom / fit-page and **Close preview** (Esc also closes). It matches what the PDF prints; the editable live report stays behind it.

**Page numbers.** The guide sample, the style preview, and the live report each draw a number at the bottom of every sheet: 1, 2, 3, or “Page 2 of 8” when that style is chosen. The total is the number of sheets on screen. The printed PDF counts the same way with the print page counter.

---

## 5. Scheme overlay (`matchedSchemeCode`)

Configured in `client/src/lib/individualDpr/schemeFormConfig.ts`.

### Extra fields on step 1 (`schemeExtras`)

| Scheme | Extra fields |
|--------|----------------|
| `VISHWAKARMA` | Own 12-step artisan pack — see [docs/schemes/VISHWAKARMA/vishwakarma.md](./schemes/VISHWAKARMA/vishwakarma.md), `vishwakarmaQuestions.ts`, `VISHWAKARMA_STEPS` (18 trades; toolkit ₹15k; tranche ₹1 L / ₹2 L at 5%). |
| `SVANIDHI` | Own 10-step street-vendor pack — see [docs/schemes/SVANIDHI/svanidhi.md](./schemes/SVANIDHI/svanidhi.md), `svanidhiQuestions.ts`, `SVANIDHI_STEPS` (CoV/LoR + UPI; WC ₹15k / ₹25k / ₹50k; 7% interest subsidy). |
| `PMFME` | Own 14-step food-unit pack — see [docs/schemes/PMFME/pmfme.md](./schemes/PMFME/pmfme.md), `pmfmeQuestions.ts`, `PMFME_STEPS` (NIFTEM model structure: FSSAI, new/existing, ODOP, RM sources, 35% grant cap ₹10 L). |
| `AP_EDP` | Own 13-step greenfield pack — see [docs/schemes/AP_EDP/apEdp.md](./schemes/AP_EDP/apEdp.md), `apEdpQuestions.ts`, `AP_EDP_STEPS` (MSME-EDP 4.0 para 6.3: 25%/45%/35% of FCI by size & special category; APIIC SC/ST land rebate). |
| `PMEGP` | Full bank-unit set — see [docs/schemes/PMEGP/pmegp.md](./schemes/PMEGP/pmegp.md), `pmegpQuestions.ts`, and `PMEGP_STEPS` (14 consecutive steps: category, rural/urban, agency, entrepreneur, process, capacity, margin-money %). |
| `MUDRA` | Own 12-step PMMY pack — see [docs/schemes/MUDRA/mudra.md](./schemes/MUDRA/mudra.md), `mudraQuestions.ts`, `MUDRA_STEPS` (Shishu/Kishore/Tarun/Tarun Plus, own+bank MoF, shop proof uploads). |
| `STANDUP` | Own 13-step bank-unit pack — see [docs/schemes/STANDUP/standup.md](./schemes/STANDUP/standup.md), `standupQuestions.ts`, `STANDUP_STEPS` (woman/SC/ST, ≥51% stake, ≥10% own, composite TL+WC, competitors + schedule). |
| `PMEGP_2ND` | Own 14-step upgrade pack — see [docs/schemes/PMEGP_2ND/pmegp2nd.md](./schemes/PMEGP_2ND/pmegp2nd.md), `pmegp2ndQuestions.ts`, `PMEGP_2ND_STEPS` (prior PMEGP/REGP/MUDRA, uniform 15% MM / 10% own, brownfield only). |
| `SCLCSS` | Own 13-step tech-upgrade pack — see [docs/schemes/SCLCSS/sclcss.md](./schemes/SCLCSS/sclcss.md), `sclcssQuestions.ts`, `SCLCSS_STEPS` (SC/ST ≥51%, existing vs proposed tech, 25% subsidy cap ₹25 L). |
| `AP_TECH_UPGRADE` | Own 13-step brownfield pack — see [docs/schemes/AP_TECH_UPGRADE/apTechUpgrade.md](./schemes/AP_TECH_UPGRADE/apTechUpgrade.md), `apTechUpgradeQuestions.ts`, `AP_TECH_UPGRADE_STEPS` (MSME-EDP 4.0 para 6.4: 20%/40%/30% of FCI by size & special category). |
| `MSE_GIFT` | Own 12-step green pack — see [docs/schemes/MSE_GIFT/mseGift.md](./schemes/MSE_GIFT/mseGift.md), `mseGiftQuestions.ts`, `MSE_GIFT_STEPS`. |
| `ZED` | Own 5-step certification pack — see [docs/schemes/ZED/zed.md](./schemes/ZED/zed.md), `zedQuestions.ts`, `ZED_STEPS`. |
| `LEAN` | Own 5-step consulting pack — see [docs/schemes/LEAN/lean.md](./schemes/LEAN/lean.md), `leanQuestions.ts`, `LEAN_STEPS`. |
| `MSME_IPR` | Own 5-step IP pack — see [docs/schemes/MSME_IPR/msmeIpr.md](./schemes/MSME_IPR/msmeIpr.md), `msmeIprQuestions.ts`, `MSME_IPR_STEPS`. |
| `PMS` | Own 5-step fair annex — see [docs/schemes/PMS/pms.md](./schemes/PMS/pms.md), `pmsQuestions.ts`, `PMS_STEPS`. |
| `ECLGS` | Own 7-step WC pack — see [docs/schemes/ECLGS/eclgs.md](./schemes/ECLGS/eclgs.md), `eclgsQuestions.ts`, `ECLGS_STEPS`. |
| `SCST_HUB` | Own 5-step procurement pack — see [docs/schemes/SCST_HUB/scstHub.md](./schemes/SCST_HUB/scstHub.md), `scstHubQuestions.ts`, `SCST_HUB_STEPS`. |
| `ASPIRE` | Own 10-step livelihood pack — see [docs/schemes/ASPIRE/aspire.md](./schemes/ASPIRE/aspire.md), `aspireQuestions.ts`, `ASPIRE_STEPS`. |
| `NHDP` | Own 10-step weaver pack — see [docs/schemes/NHDP/nhdp.md](./schemes/NHDP/nhdp.md), `nhdpQuestions.ts`, `NHDP_STEPS`. |
| `CVY` | Own 12-step coir pack — see [docs/schemes/CVY/cvy.md](./schemes/CVY/cvy.md), `cvyQuestions.ts`, `CVY_STEPS`. |
| `PTUAS` | Own 13-step pharma upgrade — see [docs/schemes/PTUAS/ptuas.md](./schemes/PTUAS/ptuas.md), `ptuasQuestions.ts`, `PTUAS_STEPS`. |
| `PMPDS` | Own 5-step promotion pack — see [docs/schemes/PMPDS/pmpds.md](./schemes/PMPDS/pmpds.md), `pmpdsQuestions.ts`, `PMPDS_STEPS`. |
| `CGTMSE` | Own 12-step bank pack (MUDRA-adjacent guarantee) — see [docs/schemes/CGTMSE/cgtmse.md](./schemes/CGTMSE/cgtmse.md), `cgtmseQuestions.ts`, `CGTMSE_STEPS`. |
| `AP_FPP` | Own 13-step food FCI pack — see [docs/schemes/AP_FPP/apFpp.md](./schemes/AP_FPP/apFpp.md), `apFppQuestions.ts`, `AP_FPP_STEPS` (do not double-claim with `AP_EDP`). |
| `AP_CMEP` | Own 13-step credit-linked greenfield — see [docs/schemes/AP_CMEP/apCmep.md](./schemes/AP_CMEP/apCmep.md), `apCmepQuestions.ts`, `AP_CMEP_STEPS`. |
| `OBMMS` | Own 10-step welfare self-employment — see [docs/schemes/OBMMS/obmms.md](./schemes/OBMMS/obmms.md), `obmmsQuestions.ts`, `OBMMS_STEPS`. |
| `MSE_SPICE` | Own 12-step circular P&M — see [docs/schemes/MSE_SPICE/mseSpice.md](./schemes/MSE_SPICE/mseSpice.md), `mseSpiceQuestions.ts`, `MSE_SPICE_STEPS`. |
| `AP_PARKS` | Own 10-step park land rebate — see [docs/schemes/AP_PARKS/apParks.md](./schemes/AP_PARKS/apParks.md), `apParksQuestions.ts`, `AP_PARKS_STEPS`. |
| `RAMP_TEAM` | Own 5-step ONDC pack — see [docs/schemes/RAMP_TEAM/rampTeam.md](./schemes/RAMP_TEAM/rampTeam.md), `rampTeamQuestions.ts`, `RAMP_TEAM_STEPS`. |
| `EPM_NIRYAT` | Own 7-step export credit — see [docs/schemes/EPM_NIRYAT/epmNiryat.md](./schemes/EPM_NIRYAT/epmNiryat.md), `epmNiryatQuestions.ts`, `EPM_NIRYAT_STEPS`. |
| Cluster / CTA schemes (`MSE_CDP`, `SFURTI`, `AP_CDP`, `APICF`, `CHAMPIONS`, `ESDP`, `NTCEC`) | **Excluded** from Create New Latest DPR picker (`isIndividualPickerScheme`) |

**Policy:** Do not implement general `CLCSS` — use `SCLCSS` (SC/ST only) + `AP_TECH_UPGRADE` for general category. Each scheme defines its own step catalog in `schemeStepCatalog.ts` (not hide-from-18). PMEGP uses the KVIC unit DPR question set in `docs/schemes/PMEGP/pmegp.md`.

AI suggestions / fill-all pass `_schemeCode` and can infer missing extras.

### Step 12 / 15 behaviour (MUDRA + budget from Venture Match)

If scheme is `MUDRA` and Venture Match budget is `under2L` or `2to5L` (Shishu/Kishore):

- Hide complex capex tables (land / building / utilities / pre-op) on step 12.
- Step 15 can show **Nayak working capital**: limit = 20% of turnover, margin = 5% of that limit.

### DSCR

Shown when bank loan (lakhs) &gt; 0 (`showDscr`).

### PMEGP education gate (upload)

If scheme is `PMEGP` or `PMEGP_2ND` and project cost (lakhs) exceeds:

- Manufacturing-like activity (`mfg` / `food` / `craft`) → **&gt; 10**  
- Service-like (`service` / `knowledge` / `trade` / `vending` / `mixed`) → **&gt; 5**  

…then step 18 expects an 8th-pass education upload (gate helper `showPmegpEducationGate`). Activity for this check comes from Venture Match answers when available.

### Step 18 uploads (scheme-specific)

| Scheme | Uploads |
|--------|---------|
| `VISHWAKARMA` | Aadhaar, savings passbook, ration card, certificate/ID (if issued), toolkit quote |
| `SVANIDHI` | CoV/LoR, Aadhaar, passbook, UPI proof |
| `PMFME` | Machinery quotes, premises lease, draft FSSAI |
| `PMEGP` | Machinery quotes, building estimate; + caste certificate if VM owner has sc/st/bc |
| `AP_EDP` | Udyam, land/shed, CFE/CFO, CA FCI, AP domicile (+ special / SC-ST proofs as needed) |
| `MUDRA` | Shop proof, bank statements, quotes; + Mudra closure if Tarun Plus bands (`50Lto1Cr`+) |
| Default / vanilla | Aadhaar/PAN, Udyam, passbook, machinery quotations |

---

## 6. Scheme pick → brief → form

### Suggestions on the scheme cards

On the scheme picker (`SchemePickerGrid`), if the person has **finished** Scheme Finder, the cards carry tags from their own answers (`lib/ventureMatch/savedSuggestion.ts`): **Suggested for you** on the lead schemes of the Scheme Finder plan (`analyzeCombinations(...).core`), and **May also suit you** on other schemes that still matched. A note above the cards says the tags come from their Scheme Finder answers, are suggestions only, and links to **Change my answers**. If Scheme Finder was never finished (nothing saved, or stopped part-way), or nothing matched, the cards show no tags and no note. The answers are read from the browser’s saved Scheme Finder progress for the signed-in user (`venture-match-progress:<userId>`); they are not stored on the server, so another browser or device shows no tags until Scheme Finder is run there. Copy avoids “best” / “guaranteed” wording (see the no-guarantee rule in `venture-match-business-logic.md`).

- **Form header:** scheme **dropdown** (`SCHEME_OPTIONS`) switches `matchedSchemeCode` without leaving the form; selected scheme name is shown under the page title.  
- Yellow scheme-impact bar shows from **step 1** onward (scheme name + how steps/uploads change).

**Pick:** `SchemePickerGrid` shows all `SCHEME_OPTIONS` (vanilla + every scheme) as cards (title, intro, category/type chips).

**Brief:** Tapping a card (or arriving with `?scheme=`) opens `SchemeBriefPanel`:

- Intro  
- Tabs: **Benefits / Eligibility / How to Apply / Documents / FAQs**  
- Sidebar **Quick Info**: Ministry, Category, Type, Status  
- EN/TE from page language  
- Footer **form notes** from `getSchemeImpact` (how the DPR steps change)  
- **Next** continues to the form steps; **All schemes** returns to the grid

Data packs:

- `lib/individualDpr/schemeBriefs/central.ts` — central schemes + vanilla  
- `lib/individualDpr/schemeBriefs/ap.ts` — AP schemes incl. CMEP  
- Lookup: `getSchemeBrief(code)`  

---

## 7. Prefill from Scheme Finder

**Disabled.** Create New Latest DPR leaves all step fields blank on `?new=true`.

- Scheme Finder may still set `matchedSchemeCode` via `?scheme=` and store `ventureMatchAnswers` for **overlay rules only** (e.g. step-18 caste cert, MUDRA Shishu/Kishore hide-capex, PMEGP education gate).
- `prefillFromVentureMatch` is a no-op and must not write nature of business, district, costs, or other form values.
- AI Guided Builder (`/dpr/builder`) may still use its own handoff prefill — that path is separate.

---

## 8. AI assist

- Per-step **AISuggestions** (shared with cluster), scoped with `_schemeCode` when individual.  
- **Fill all steps with AI** (`fillAllStepsWithAi`) walks the scheme catalog (skips uploads), uses each step’s `contentStep` for AI/store, respects hidden capex for MUDRA Shishu/Kishore, and infers scheme extras.  
- User must still review before generate.

### Live preview scroll-to-field hits

On **Create New Latest DPR** only (`IndividualDPRCreation` split/preview pane):

- When step / `schemeExtras` values change (typing, AI apply, fill-all), the live `IndividualDPRDocumentView` scrolls to the **first** tagged occurrence of those fields (`data-dpr-field`).
- If the same change appears in **multiple** places, **Up** / **Down** buttons cycle hits in document order; **Up** hides on the first hit, **Down** hides on the last.
- Cluster create and saved DPR preview pages do not use this navigator.

---

## 9. State ownership

`client/src/store/individualDPRStore.ts` holds:

- `step1` … `step18`  
- `matchedSchemeCode`  
- `ventureMatchAnswers`  
- `schemeExtras`  
- `currentStep`, project/DPR ids, generated document  

UI page: `IndividualDPRCreation.tsx`  
Form: `IndividualDPRForm.tsx`

---

## 10. Key source files

| File | Role |
|------|------|
| `client/src/pages/IndividualDPRCreation.tsx` | Route shell, pick/brief/form phases, save/generate |
| `client/src/components/individual-dpr/SchemePickerGrid.tsx` | Scheme card grid |
| `client/src/components/individual-dpr/IndividualDPRForm.tsx` | Step fields + AI |
| `client/src/components/individual-dpr/SchemeBriefPanel.tsx` | Scheme brochure UI |
| `client/src/lib/individualDpr/schemeFormConfig.ts` | Overlay rules, uploads, impact copy |
| `client/src/lib/individualDpr/schemeBriefs/*` | Brochure content EN/TE |
| `client/src/lib/individualDpr/prefillFromVentureMatch.ts` | No-op (form prefill disabled) |
| `client/src/components/individual-dpr/IndividualDPRDocumentView.tsx` | Scheme-only live + generated document (Q&A sections) |
| `client/src/lib/individualDpr/individualDocModel.ts` | Fields asked per scheme step for the document |
| `client/src/lib/individualDpr/toIndividualPayload.ts` | Adapter to shared draft/generate APIs |
| `client/src/lib/individualDpr/previewFieldHits.ts` | Live preview field-diff + scroll helpers |
| `client/src/lib/ventureMatch/schemes.ts` | Scheme codes listed in dropdown |
| `client/src/lib/ventureMatch/mapToDpr.ts` | Handoff peek/save (shared with Scheme Finder) |

---

## 11. Boundaries

- Eligibility matching stays in Scheme Finder; this page trusts `matchedSchemeCode` (or vanilla).  
- Brochure text is a drafting aid — confirm live GOs / ceilings with the agency.  
- Cluster DPR (`/cluster-dpr/create`) is a separate multi-unit flow; this doc is **individual only**.

## Field validation, masks and tooltips

- `client/src/lib/validation/formats.ts` holds pure masks and checks (PAN, GSTIN incl. check character, Udyam, mobile, IFSC, pincode, email, numeric ranges). Every message is bilingual (EN/TE).
- `components/ui/Input.tsx` takes `format`, `firmPanOnly`, `hint`, and numeric `min`/`max`. It masks while typing (upper-casing, stripping bad characters, auto hyphens, max length), and shows a red inline `role="alert"` message as soon as a value is wrong. "Incomplete" messages wait until the field is left (blur).
- Step 11 has optional GSTIN, Firm PAN, Udyam and Contact mobile fields, with tooltips in `data/fieldDescriptions.ts`.
- Pre-submission gate: `lib/validation/stepFormats.ts` (`invalidFormats`) runs in `guardForward` and before Generate. Filled-but-invalid values block moving forward, are focused/flagged, and a toast names them. Blank optional fields pass.
- DPDP: only firm PANs are kept. A personal PAN (4th letter P) is rejected in the form and blanked by `sanitizeStoredPayload` on the server.

## Reusing details across sections

Details are entered once and carried forward (`client/src/lib/individualDpr/contextReuse.ts`, applied inside the draft store on every change):

- **Copied into later fields:** step 11 applicant / firm name starts as the unit name (for proprietor packs, the entrepreneur name); step 11 correspondence address starts as "town, district" from step 1. A copied field keeps following its source until the person types something different, after that it is theirs and is never touched. Copies are remembered in `schemeExtras.autoFilled`, and the form says where a field was filled from.
- **Shown on the schedules:** the project cost (content step 12) and means of finance / bank loan (content step 13) sections show promoter / applicant, unit, address and GSTIN, in the form (read-only card) and as a table in the live document, preview and export. They are read from steps 1 and 11 and never stored separately, so editing step 11 updates every schedule.
- Never copied: GSTIN, PAN, Udyam number and mobile (typed once, validated, step 11). Only firm PANs are stored.

## Fields that depend on the kind of business and its size

`client/src/lib/individualDpr/businessKind.ts` decides what the cost step and the document show:

- **Kind of business.** Chosen by the person in the "What kind of business is this?" box on the project cost step; otherwise from the Scheme Finder activity (mfg, food, craft, mixed, crop → manufacturing; service, knowledge → service; trade, vending → trading); otherwise a guess from the words in "Nature of Business"; otherwise manufacturing. The choice is saved in `schemeExtras.businessKind`.
- **Manufacturing:** the plant and machinery table (`step12.machineryItems`, total feeds machinery). The CMEP scheme keeps its own detailed tables.
- **Service and trading:** an assets list instead (`step12.assetItems`: asset, type, qty, unit cost; the total feeds the equipment line). Labels change too: Equipment & assets, Materials & supplies, Annual service volume, How the service is delivered (traders: cost of goods for resale, annual sales volume, how you buy and sell).
- **Size.** From the project cost once entered (under ₹5 lakh tiny, under ₹50 lakh small, under ₹2 crore medium, above that large), otherwise from the Scheme Finder budget. For tiny projects without a lean scheme pack the list is optional (collapsed, or hidden for manufacturing vanilla DPRs). Schemes that already hid heavy capex tables (`hideComplexCapex`) are unchanged.
- The live DPR, preview and export follow the same choice (Assets list or Machinery list table, matching labels).
