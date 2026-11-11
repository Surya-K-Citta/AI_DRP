/**
 * Per-scheme step catalogs for Create New Latest DPR.
 * UI shows consecutive Step 1..N for each scheme (no gaps from a shared 18-step skeleton).
 * `contentStep` is the store / AI / PDF bucket (legacy individual slot) so generation keeps working.
 */

export type SchemeStepDef = {
  /** Consecutive index shown in the UI for this scheme (1..N). */
  n: number;
  /** Stable semantic id within the scheme. */
  id: string;
  title: string;
  /** Data / AI / PDF bucket (`step${contentStep}` in the store). */
  contentStep: number;
};

function catalog(
  defs: Array<{ id: string; title: string; contentStep: number }>
): SchemeStepDef[] {
  return defs.map((d, i) => {
    const n = i + 1;
    const bare = d.title.replace(/^Step \d+:\s*/, '');
    return {
      n,
      id: d.id,
      title: `Step ${n}: ${bare}`,
      contentStep: d.contentStep,
    };
  });
}

/** Vanilla / full individual bank DPR — 18 consecutive steps (contentStep === n). */
const VANILLA_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Step 1: Your unit – basic details', contentStep: 1 },
  { id: 'sector', title: 'Step 2: Sector overview', contentStep: 2 },
  { id: 'location', title: 'Step 3: District & location', contentStep: 3 },
  { id: 'unit', title: 'Step 4: Your unit profile', contentStep: 4 },
  { id: 'valueChain', title: 'Step 5: Value chain', contentStep: 5 },
  { id: 'market', title: 'Step 6: Market', contentStep: 6 },
  { id: 'gaps', title: 'Step 7: Gaps', contentStep: 7 },
  { id: 'swot', title: 'Step 8: SWOT', contentStep: 8 },
  { id: 'plan', title: 'Step 9: What you plan to do', contentStep: 9 },
  { id: 'shed', title: 'Step 10: Workplace / shed / unit', contentStep: 10 },
  { id: 'applicant', title: 'Step 11: Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Step 12: Project cost', contentStep: 12 },
  { id: 'finance', title: 'Step 13: Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Step 14: Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Step 15: Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Step 16: Implementation schedule', contentStep: 16 },
  { id: 'impact', title: 'Step 17: Expected impact', contentStep: 17 },
  { id: 'uploads', title: 'Step 18: Document uploads', contentStep: 18 },
]);

/**
 * PMEGP bank-unit DPR — 14 consecutive steps (KVIC profile structure).
 * Spec: docs/schemes/PMEGP/pmegp.md
 */
const PMEGP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & entrepreneur', contentStep: 1 },
  { id: 'intro', title: 'Executive summary & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & sales assumptions', contentStep: 6 },
  { id: 'shed', title: 'Workshed / premises & power', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'impact', title: 'Employment & impact', contentStep: 17 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * MUDRA (PMMY) bank-unit pack — 12 consecutive steps.
 * Spec: docs/schemes/MUDRA/mudra.md
 */
const MUDRA_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & category', contentStep: 1 },
  { id: 'intro', title: 'Business activity', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales assumptions', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * Stand-Up India bank-unit pack — 13 consecutive steps (₹10 L–₹1 Cr composite).
 * Spec: docs/schemes/STANDUP/standup.md
 */
const STANDUP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Business activity & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market, buyers & competition', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * PMFME food-unit pack — 14 consecutive steps (NIFTEM / MoFPI individual path).
 * Spec: docs/schemes/PMFME/pmfme.md
 */
const PMFME_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & formalisation', contentStep: 1 },
  { id: 'intro', title: 'Introduction & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market, buyers & raw material', contentStep: 6 },
  { id: 'shed', title: 'Premises & utilities', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'impact', title: 'Employment & impact', contentStep: 17 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * PMEGP 2nd loan (upgrade) — 14 consecutive steps (brownfield PMEGP/REGP/MUDRA).
 * Spec: docs/schemes/PMEGP_2ND/pmegp2nd.md
 */
const PMEGP_2ND_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & prior assistance', contentStep: 1 },
  { id: 'intro', title: 'Introduction & upgrade process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity (existing → proposed)', contentStep: 4 },
  { id: 'market', title: 'Market & sales assumptions', contentStep: 6 },
  { id: 'shed', title: 'Workshed / premises & power', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Upgrade project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'impact', title: 'Employment & impact', contentStep: 17 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * SCLCSS (SC/ST capital subsidy) — 13 consecutive steps (tech / P&M focused).
 * Spec: docs/schemes/SCLCSS/sclcss.md
 */
const SCLCSS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & SC/ST eligibility', contentStep: 1 },
  { id: 'intro', title: 'Technology upgrade story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost (machinery-led)', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * AP Technology Upgradation — 13 consecutive steps (MSME-EDP 4.0 brownfield FCI).
 * Spec: docs/schemes/AP_TECH_UPGRADE/apTechUpgrade.md
 */
const AP_TECH_UPGRADE_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & AP eligibility', contentStep: 1 },
  { id: 'intro', title: 'Technology upgrade story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Upgrade project cost (FCI)', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * AP MSME-EDP 4.0 — 13 consecutive steps (new-unit capital subsidy on FCI).
 * Spec: docs/schemes/AP_EDP/apEdp.md
 */
const AP_EDP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & AP eligibility', contentStep: 1 },
  { id: 'intro', title: 'Introduction & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises & utilities', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost (FCI)', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * PM Vishwakarma — 12 consecutive steps (artisan toolkit + training + enterprise loan).
 * Spec: docs/schemes/VISHWAKARMA/vishwakarma.md
 */
const VISHWAKARMA_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & craft eligibility', contentStep: 1 },
  { id: 'intro', title: 'Trade story & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Craft profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales assumptions', contentStep: 6 },
  { id: 'shed', title: 'Workplace / premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost (tools + WC)', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * PM SVANidhi — 11 consecutive steps (street-vendor WC micro-credit).
 * Spec: docs/schemes/SVANIDHI/svanidhi.md
 */
const SVANIDHI_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & vending eligibility', contentStep: 1 },
  { id: 'intro', title: 'Vending activity', contentStep: 2 },
  { id: 'location', title: 'Location / pitch', contentStep: 3 },
  { id: 'unit', title: 'Vendor profile', contentStep: 4 },
  { id: 'market', title: 'Market & daily sales', contentStep: 6 },
  { id: 'shed', title: 'Pitch / workplace', contentStep: 10 },
  { id: 'applicant', title: 'Applicant', contentStep: 11 },
  { id: 'cost', title: 'Working capital need', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * ECLGS 5.0 — 7 consecutive steps (additional WC liquidity).
 * Spec: docs/schemes/ECLGS/eclgs.md
 */
const ECLGS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & existing facility', contentStep: 1 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Additional WC need', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * MSME Sustainable ZED — 8 consecutive steps (certification note).
 * Spec: docs/schemes/ZED/zed.md
 */
const ZED_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & ZED levels', contentStep: 1 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Quality / market need', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * Competitive LEAN — 8 consecutive steps (process consulting note).
 * Spec: docs/schemes/LEAN/lean.md
 */
const LEAN_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & bottleneck', contentStep: 1 },
  { id: 'unit', title: 'Unit / shop-floor profile', contentStep: 4 },
  { id: 'market', title: 'Process / market need', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * MSME Innovative IPR — 8 consecutive steps (IP filing note).
 * Spec: docs/schemes/MSME_IPR/msmeIpr.md
 */
const MSME_IPR_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & IP type', contentStep: 1 },
  { id: 'unit', title: 'Unit / invention profile', contentStep: 4 },
  { id: 'market', title: 'IP / market need', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * PMS — 8 consecutive steps (trade-fair / marketing annex).
 * Spec: docs/schemes/PMS/pms.md
 */
const PMS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & fair details', contentStep: 1 },
  { id: 'unit', title: 'Unit / product profile', contentStep: 4 },
  { id: 'market', title: 'Market / fair offtake', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * National SC/ST Hub — 8 consecutive steps (procurement readiness).
 * Spec: docs/schemes/SCST_HUB/scstHub.md
 */
const SCST_HUB_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & GeM readiness', contentStep: 1 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Procurement focus', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * ASPIRE — 11 consecutive steps (rural innovation / livelihood).
 * Spec: docs/schemes/ASPIRE/aspire.md
 */
const ASPIRE_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & incubator', contentStep: 1 },
  { id: 'intro', title: 'Innovation / livelihood story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit / livelihood profile', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant', contentStep: 11 },
  { id: 'cost', title: 'Light project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/**
 * NHDP — 11 consecutive steps (weaver / handloom).
 * Spec: docs/schemes/NHDP/nhdp.md
 */
const NHDP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & loom eligibility', contentStep: 1 },
  { id: 'intro', title: 'Handloom / process story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Weaver profile', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Workplace / loom shed', contentStep: 10 },
  { id: 'applicant', title: 'Applicant', contentStep: 11 },
  { id: 'cost', title: 'Tools / WC cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * Coir Vikas Yojana — 12 consecutive steps.
 * Spec: docs/schemes/CVY/cvy.md
 */
const CVY_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Business / activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * MSE-GIFT (green investment) — 12 consecutive steps.
 * Spec: docs/schemes/MSE_GIFT/mseGift.md
 */
const MSE_GIFT_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Business / activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * PTUAS (pharma technology upgrade) — 13 consecutive steps.
 * Spec: docs/schemes/PTUAS/ptuas.md
 */
const PTUAS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Upgrade / process story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises & utilities', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Upgrade project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * PMPDS (pharma & medical devices) — 8 consecutive steps.
 * Spec: docs/schemes/PMPDS/pmpds.md
 */
const PMPDS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & scheme inputs', contentStep: 1 },
  { id: 'unit', title: 'Unit / product profile', contentStep: 4 },
  { id: 'market', title: 'Market / need', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * CGTMSE (credit guarantee) — 12 consecutive steps.
 * Spec: docs/schemes/CGTMSE/cgtmse.md
 */
const CGTMSE_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Business / activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * AP Food Processing Policy 4.0 — 13 consecutive steps.
 * Spec: docs/schemes/AP_FPP/apFpp.md
 */
const AP_FPP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Upgrade / process story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises & utilities', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Upgrade project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * AP CMEP — 13 consecutive steps.
 * Spec: docs/schemes/AP_CMEP/apCmep.md
 */
const AP_CMEP_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Executive summary & process', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile & capacity', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises & utilities', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Upgrade project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance (critical)', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial projections (actuals and estimates)', contentStep: 15 },
  { id: 'schedule', title: 'Implementation schedule', contentStep: 16 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * AP OBMMS welfare self-employment — 11 consecutive steps.
 * Spec: docs/schemes/OBMMS/obmms.md
 */
const OBMMS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant', contentStep: 11 },
  { id: 'cost', title: 'Project / land cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * RAMP MSE-SPICE — 12 consecutive steps.
 * Spec: docs/schemes/MSE_SPICE/mseSpice.md
 */
const MSE_SPICE_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Business / activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & sales', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'viability', title: 'Financial viability', contentStep: 15 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * AP MSME-PARKS land rebate — 11 consecutive steps.
 * Spec: docs/schemes/AP_PARKS/apParks.md
 */
const AP_PARKS_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'intro', title: 'Activity story', contentStep: 2 },
  { id: 'location', title: 'Location', contentStep: 3 },
  { id: 'unit', title: 'Unit profile', contentStep: 4 },
  { id: 'market', title: 'Market & offtake', contentStep: 6 },
  { id: 'shed', title: 'Premises', contentStep: 10 },
  { id: 'applicant', title: 'Applicant', contentStep: 11 },
  { id: 'cost', title: 'Project / land cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * RAMP TEAM (ONDC) — 8 consecutive steps.
 * Spec: docs/schemes/RAMP_TEAM/rampTeam.md
 */
const RAMP_TEAM_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & scheme inputs', contentStep: 1 },
  { id: 'unit', title: 'Unit / product profile', contentStep: 4 },
  { id: 'market', title: 'Market / need', contentStep: 6 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Project cost', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating cost & sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);


/**
 * EPM Niryat Protsahan — 7 consecutive steps.
 * Spec: docs/schemes/EPM_NIRYAT/epmNiryat.md
 */
const EPM_NIRYAT_STEPS: SchemeStepDef[] = catalog([
  { id: 'cover', title: 'Cover & eligibility', contentStep: 1 },
  { id: 'unit', title: 'Unit / export profile', contentStep: 4 },
  { id: 'applicant', title: 'Applicant / firm', contentStep: 11 },
  { id: 'cost', title: 'Export credit / WC need', contentStep: 12 },
  { id: 'finance', title: 'Means of finance', contentStep: 13 },
  { id: 'operating', title: 'Operating & export sales', contentStep: 14 },
  { id: 'uploads', title: 'Documents & uploads', contentStep: 18 },
]);

/** Scheme code → catalog. Missing codes fall back to vanilla. */
const SCHEME_STEP_CATALOGS: Record<string, SchemeStepDef[]> = {
  PMEGP: PMEGP_STEPS,
  MUDRA: MUDRA_STEPS,
  STANDUP: STANDUP_STEPS,
  PMFME: PMFME_STEPS,
  PMEGP_2ND: PMEGP_2ND_STEPS,
  SCLCSS: SCLCSS_STEPS,
  AP_TECH_UPGRADE: AP_TECH_UPGRADE_STEPS,
  AP_EDP: AP_EDP_STEPS,
  VISHWAKARMA: VISHWAKARMA_STEPS,
  SVANIDHI: SVANIDHI_STEPS,
  ECLGS: ECLGS_STEPS,
  ZED: ZED_STEPS,
  LEAN: LEAN_STEPS,
  MSME_IPR: MSME_IPR_STEPS,
  PMS: PMS_STEPS,
  SCST_HUB: SCST_HUB_STEPS,
  ASPIRE: ASPIRE_STEPS,
  NHDP: NHDP_STEPS,
  CVY: CVY_STEPS,
  MSE_GIFT: MSE_GIFT_STEPS,
  PTUAS: PTUAS_STEPS,
  PMPDS: PMPDS_STEPS,
  CGTMSE: CGTMSE_STEPS,
  AP_FPP: AP_FPP_STEPS,
  AP_CMEP: AP_CMEP_STEPS,
  OBMMS: OBMMS_STEPS,
  MSE_SPICE: MSE_SPICE_STEPS,
  AP_PARKS: AP_PARKS_STEPS,
  RAMP_TEAM: RAMP_TEAM_STEPS,
  EPM_NIRYAT: EPM_NIRYAT_STEPS,
};

export function getSchemeSteps(schemeCode?: string | null): SchemeStepDef[] {
  if (!schemeCode) return VANILLA_STEPS;
  return SCHEME_STEP_CATALOGS[schemeCode] || VANILLA_STEPS;
}

export function getSchemeStepCount(schemeCode?: string | null): number {
  return getSchemeSteps(schemeCode).length;
}

export function getStepDef(
  schemeCode: string | null | undefined,
  localStep: number
): SchemeStepDef | undefined {
  return getSchemeSteps(schemeCode).find((s) => s.n === localStep);
}

/** Local UI step → store/AI content bucket. */
export function localToContent(
  schemeCode: string | null | undefined,
  localStep: number
): number {
  return getStepDef(schemeCode, localStep)?.contentStep ?? localStep;
}

/** Content bucket → local UI step (if that content is in the scheme catalog). */
export function contentToLocal(
  schemeCode: string | null | undefined,
  contentStep: number
): number | undefined {
  return getSchemeSteps(schemeCode).find((s) => s.contentStep === contentStep)?.n;
}


