/**
 * How the matched schemes fit together: which can be taken side by side, which rule each other out,
 * which must come in order, and a suggested plan to discuss with the DIC / bank.
 *
 * The rules come from the scheme guidelines kept in docs/schemes and from standard practice for
 * Indian MSME schemes. Where a rule is only common practice (not written in our scheme docs) it is
 * marked `source: 'practice'` so the screen can tell people to confirm it with the DIC or bank.
 */
import type { SchemeMatch } from './types.ts';

export type Loc = { en: string; te: string };
const L = (en: string, te: string): Loc => ({ en, te });

export type SchemeRole =
  | 'margin' // credit-linked margin money / back-ended subsidy on the project cost
  | 'capital' // capital subsidy / interest support on investment
  | 'loan' // a loan product
  | 'guarantee' // credit guarantee
  | 'land' // land-cost rebate
  | 'support' // training, certification, marketing, innovation
  | 'cluster'; // common-facility schemes run through a group of units

const ROLE_BY_CODE: Record<string, SchemeRole> = {
  PMEGP: 'margin',
  PMEGP_2ND: 'margin',
  AP_CMEP: 'margin',
  PMFME: 'capital',
  SCLCSS: 'capital',
  AP_EDP: 'capital',
  AP_FPP: 'capital',
  AP_TECH_UPGRADE: 'capital',
  MSE_GIFT: 'capital',
  OBMMS: 'capital',
  CVY: 'capital',
  NHDP: 'capital',
  PTUAS: 'capital',
  MSE_SPICE: 'capital',
  MUDRA: 'loan',
  SVANIDHI: 'loan',
  VISHWAKARMA: 'loan',
  CGTMSE: 'guarantee',
  ECLGS: 'guarantee',
  AP_PARKS: 'land',
  MSE_CDP: 'cluster',
  SFURTI: 'cluster',
  AP_CDP: 'cluster',
  APICF: 'cluster',
};

export function roleOf(code: string): SchemeRole {
  return ROLE_BY_CODE[code] || 'support';
}

/** Typical value of the benefit; used only to rank which scheme to lead with when two rule each other out. */
const WEIGHT: Record<string, number> = {
  PMFME: 100, SCLCSS: 98, AP_FPP: 97, AP_EDP: 96, AP_TECH_UPGRADE: 94, AP_CMEP: 93, PMEGP: 92,
  PMEGP_2ND: 90, VISHWAKARMA: 88, OBMMS: 85, MSE_GIFT: 80, CVY: 80, NHDP: 80, PTUAS: 80, MSE_SPICE: 78,
  SVANIDHI: 70, ECLGS: 60, CGTMSE: 55, AP_PARKS: 50, MUDRA: 40,
};
const ROLE_WEIGHT: Record<SchemeRole, number> = {
  margin: 90, capital: 80, loan: 40, guarantee: 55, land: 50, support: 30, cluster: 25,
};
function weightOf(match: SchemeMatch): number {
  const base = WEIGHT[match.code] ?? ROLE_WEIGHT[roleOf(match.code)];
  return base + (match.boosted ? 5 : 0);
}

export type RelationType = 'exclusive' | 'conditional' | 'stack' | 'overlap' | 'sequence';

export interface Relation {
  type: RelationType;
  note: Loc;
  /** `guideline` = written in our scheme docs; `practice` = standard practice, confirm with the DIC / bank. */
  source: 'guideline' | 'practice';
  /** For `sequence`: the scheme that comes first. */
  first?: string;
}

const NOTES = {
  sameCost: L(
    'Both pay a subsidy on the same project cost. The same cost is not normally subsidised twice, so you would usually choose one.',
    'రెండూ ఒకే ప్రాజెక్ట్ ఖర్చుపై సబ్సిడీ ఇస్తాయి. ఒకే ఖర్చుకు సాధారణంగా రెండుసార్లు సబ్సిడీ ఇవ్వరు, కాబట్టి సాధారణంగా ఒకదాన్ని ఎంచుకోవాలి.'
  ),
  apPolicy: L(
    'Under the AP industrial policy (G.O.Ms.No.69) these incentives are mutually exclusive on the same fixed capital investment, and all incentives together are capped at 75% of it.',
    'ఏపీ పారిశ్రామిక విధానం (G.O.Ms.No.69) ప్రకారం ఒకే స్థిర మూలధన పెట్టుబడిపై ఈ ప్రోత్సాహకాలు పరస్పరం కలపరాదు, మొత్తం ప్రోత్సాహకాలు దానిలో 75%కి పరిమితం.'
  ),
  apState: L(
    'Both are Andhra Pradesh state subsidies for the same unit. The state does not pay twice for the same investment.',
    'రెండూ ఒకే యూనిట్‌కు ఆంధ్రప్రదేశ్ రాష్ట్ర సబ్సిడీలు. ఒకే పెట్టుబడికి రాష్ట్రం రెండుసార్లు చెల్లించదు.'
  ),
  pmegp: L(
    'PMEGP margin money is normally not given to a unit that takes any other Central or State subsidy.',
    'ఇతర కేంద్ర లేదా రాష్ట్ర సబ్సిడీ తీసుకునే యూనిట్‌కు PMEGP మార్జిన్ మనీ సాధారణంగా ఇవ్వరు.'
  ),
  pmegpMudra: L(
    'Both finance the same bank loan. A PMEGP loan is not also a MUDRA loan, so pick the route your bank supports.',
    'రెండూ ఒకే బ్యాంక్ రుణానికి సంబంధించినవి. PMEGP రుణం MUDRA రుణం కూడా కాదు, మీ బ్యాంక్ అంగీకరించే మార్గాన్ని ఎంచుకోండి.'
  ),
  vishwakarma: L(
    'PM Vishwakarma is for people who have not taken a PMEGP, MUDRA or PM SVANidhi loan in the last 5 years.',
    'గత 5 సంవత్సరాల్లో PMEGP, MUDRA లేదా PM SVANidhi రుణం తీసుకోని వారికి మాత్రమే PM Vishwakarma వర్తిస్తుంది.'
  ),
  cluster: L(
    'A common facility cannot be funded twice by two cluster schemes. Your cluster picks one.',
    'ఒకే ఉమ్మడి సదుపాయానికి రెండు క్లస్టర్ పథకాలు నిధులు ఇవ్వవు. మీ క్లస్టర్ ఒకదాన్ని ఎంచుకుంటుంది.'
  ),
  convergence: L(
    'Possible only if both scheme guidelines allow it, never on the same machinery cost, and with total support inside each scheme’s limit (AP policy: 75% of fixed capital investment). Confirm with your DIC before applying.',
    'రెండు పథకాల మార్గదర్శకాలు అనుమతిస్తేనే సాధ్యం; ఒకే యంత్రాల ఖర్చుపై ఎప్పుడూ కాదు; మొత్తం సహాయం ప్రతి పథకం పరిమితిలో ఉండాలి (ఏపీ విధానం: స్థిర మూలధన పెట్టుబడిలో 75%). దరఖాస్తుకు ముందు మీ DICతో నిర్ధారించుకోండి.'
  ),
  loanLabel: L(
    'MUDRA is a loan label, not a subsidy, so a subsidy can sit on a MUDRA-labelled loan if the subsidy scheme and your bank allow it. Confirm with your bank.',
    'MUDRA ఒక రుణ లేబుల్, సబ్సిడీ కాదు; సబ్సిడీ పథకం మరియు మీ బ్యాంక్ అనుమతిస్తే MUDRA రుణంపై సబ్సిడీ ఉండవచ్చు. మీ బ్యాంక్‌తో నిర్ధారించుకోండి.'
  ),
  guaranteeStack: L(
    'The guarantee only covers the bank loan, so it can work alongside the subsidy and may reduce the need for collateral.',
    'గ్యారంటీ బ్యాంక్ రుణాన్ని మాత్రమే కవర్ చేస్తుంది, కాబట్టి సబ్సిడీతో పాటు పనిచేయవచ్చు మరియు తాకట్టు అవసరాన్ని తగ్గించవచ్చు.'
  ),
  guaranteeOverlap: L(
    'This loan already carries its own government guarantee, so CGTMSE adds little. One guarantee per loan is usually enough.',
    'ఈ రుణానికి ఇప్పటికే ప్రభుత్వ గ్యారంటీ ఉంది, కాబట్టి CGTMSE అదనంగా దాదాపు ఏమీ ఇవ్వదు. ఒక రుణానికి సాధారణంగా ఒక గ్యారంటీ చాలు.'
  ),
  eclgs: L(
    'ECLGS is a separate working-capital facility for an existing borrower, so it can run beside this scheme, but only on a different loan.',
    'ECLGS ఇప్పటికే రుణం ఉన్నవారికి ప్రత్యేక వర్కింగ్ క్యాపిటల్ సదుపాయం; ఈ పథకంతో పాటు నడవగలదు, కానీ వేరే రుణంపై మాత్రమే.'
  ),
  champions: L(
    'MSME Champions is the single window for ZED, LEAN and Innovative. Apply through it and do not claim the same support twice.',
    'MSME Champions ZED, LEAN, Innovative లకు ఒకే కిటికీ. దాని ద్వారా దరఖాస్తు చేయండి, ఒకే సహాయాన్ని రెండుసార్లు కోరవద్దు.'
  ),
  pmegp2: L(
    'Take PMEGP first. The 2nd loan opens only after the first loan is repaid and the first margin money is adjusted.',
    'ముందు PMEGP తీసుకోండి. మొదటి రుణం తిరిగి చెల్లించి, మొదటి మార్జిన్ మనీ సర్దుబాటు అయ్యాకే 2వ రుణం వస్తుంది.'
  ),
  upgrade: L(
    'The 2nd loan upgrades a unit that was already funded under PMEGP, REGP or MUDRA, after the first loan is repaid.',
    'PMEGP, REGP లేదా MUDRA కింద ఇప్పటికే నిధులు పొందిన యూనిట్‌ను మొదటి రుణం తిరిగి చెల్లించిన తర్వాత 2వ రుణం ఉన్నతీకరిస్తుంది.'
  ),
  svanidhi: L(
    'Repay SVANidhi tranches on time first. A larger loan such as MUDRA is easier after that.',
    'ముందు SVANidhi విడతలను సమయానికి తిరిగి చెల్లించండి. ఆ తర్వాత MUDRA వంటి పెద్ద రుణం సులభం.'
  ),
  training: L(
    'Finish the entrepreneurship training first. Banks and the subsidy agency expect it before the subsidy is released.',
    'ముందు ఎంట్రప్రెన్యూర్‌షిప్ శిక్షణ పూర్తి చేయండి. సబ్సిడీ విడుదలకు ముందు బ్యాంకులు, సబ్సిడీ సంస్థ దీన్ని ఆశిస్తాయి.'
  ),
  land: L(
    'The land-cost rebate is a separate component from the capital subsidy. Total incentives are still capped at 75% of fixed capital investment.',
    'భూమి ఖర్చు రాయితీ మూలధన సబ్సిడీకి వేరైన భాగం. మొత్తం ప్రోత్సాహకాలు ఇప్పటికీ స్థిర మూలధన పెట్టుబడిలో 75%కి పరిమితం.'
  ),
  support: L(
    'Training, certification, marketing or innovation support does not touch your loan or subsidy, so it can be added to any plan.',
    'శిక్షణ, ధృవీకరణ, మార్కెటింగ్ లేదా ఆవిష్కరణ సహాయం మీ రుణం లేదా సబ్సిడీని ప్రభావితం చేయదు, కాబట్టి ఏ ప్రణాళికకైనా జోడించవచ్చు.'
  ),
  nssh: L(
    'SCLCSS is run by the National SC/ST Hub, so the hub’s other help (vendor development, procurement support) is available with it.',
    'SCLCSS ను జాతీయ SC/ST హబ్ నడుపుతుంది, కాబట్టి హబ్ ఇతర సహాయం (వెండర్ డెవలప్‌మెంట్, కొనుగోలు మద్దతు) దీనితో లభిస్తుంది.'
  ),
  clusterMember: L(
    'Cluster schemes fund common facilities through a group of units, not your individual loan. You can be a cluster member and still take an individual scheme.',
    'క్లస్టర్ పథకాలు మీ వ్యక్తిగత రుణం కాకుండా యూనిట్ల సమూహం ద్వారా ఉమ్మడి సదుపాయాలకు నిధులు ఇస్తాయి. మీరు క్లస్టర్ సభ్యులై ఉండి వ్యక్తిగత పథకం కూడా తీసుకోవచ్చు.'
  ),
  vishwakarmaPlus: L(
    'Different purposes (craft toolkit and small loan versus plant subsidy). Allowed in principle, but check that you have no outstanding subsidy.',
    'వేర్వేరు ఉద్దేశాలు (హస్తకళ టూల్‌కిట్, చిన్న రుణం మరియు యంత్ర సబ్సిడీ). సూత్రప్రాయంగా అనుమతి, కానీ మీకు బకాయి సబ్సిడీ లేదని చూసుకోండి.'
  ),
} as const;

const AP_STATE_SUBSIDIES = new Set(['AP_EDP', 'AP_FPP', 'AP_TECH_UPGRADE', 'OBMMS']);
const AP_POLICY_TRIO = new Set(['AP_EDP', 'AP_FPP', 'AP_TECH_UPGRADE']);
const PMEGP_FAMILY = new Set(['PMEGP', 'PMEGP_2ND']);
const VISHWAKARMA_BARRED = new Set(['PMEGP', 'PMEGP_2ND', 'MUDRA', 'SVANIDHI']);
const CHAMPIONS_UMBRELLA = new Set(['ZED', 'LEAN', 'MSME_IPR']);

const rel = (type: RelationType, note: Loc, source: 'guideline' | 'practice', first?: string): Relation => ({
  type,
  note,
  source,
  first,
});

/** How two schemes relate. `null` means they simply do not interact. */
export function relationBetween(a: string, b: string): Relation | null {
  const pair = new Set([a, b]);
  const both = (x: string, y: string) => pair.has(x) && pair.has(y);
  const has = (code: string) => pair.has(code);
  const other = (code: string) => (a === code ? b : a);
  const ra = roleOf(a);
  const rb = roleOf(b);
  const roles = new Set([ra, rb]);

  // Order of steps
  if (both('PMEGP', 'PMEGP_2ND')) return rel('sequence', NOTES.pmegp2, 'guideline', 'PMEGP');
  if (both('MUDRA', 'PMEGP_2ND')) return rel('sequence', NOTES.upgrade, 'guideline', 'MUDRA');
  if (both('SVANIDHI', 'MUDRA')) return rel('sequence', NOTES.svanidhi, 'practice', 'SVANIDHI');
  if (has('ESDP') && (has('PMEGP') || has('AP_CMEP'))) return rel('sequence', NOTES.training, 'guideline', 'ESDP');

  // Hard conflicts written in our scheme docs
  if (AP_POLICY_TRIO.has(a) && AP_POLICY_TRIO.has(b)) return rel('exclusive', NOTES.apPolicy, 'guideline');

  // Hard conflicts from scheme eligibility rules
  if (has('VISHWAKARMA') && VISHWAKARMA_BARRED.has(other('VISHWAKARMA'))) {
    return rel('exclusive', NOTES.vishwakarma, 'practice');
  }
  if (both('PMEGP', 'MUDRA')) return rel('exclusive', NOTES.pmegpMudra, 'practice');
  if (roles.has('cluster') && ra === rb) return rel('exclusive', NOTES.cluster, 'practice');
  if (PMEGP_FAMILY.has(a) !== PMEGP_FAMILY.has(b)) {
    const rest = PMEGP_FAMILY.has(a) ? b : a;
    const restRole = roleOf(rest);
    if (restRole === 'margin' || restRole === 'capital') return rel('exclusive', NOTES.pmegp, 'practice');
    if (restRole === 'land') return rel('conditional', NOTES.convergence, 'practice');
  }
  if (both('AP_CMEP', 'PMEGP') || both('AP_CMEP', 'PMEGP_2ND')) return rel('exclusive', NOTES.sameCost, 'practice');
  if (has('AP_CMEP') && AP_STATE_SUBSIDIES.has(other('AP_CMEP'))) return rel('exclusive', NOTES.apState, 'practice');
  if (ra === 'margin' && rb === 'margin') return rel('exclusive', NOTES.sameCost, 'practice');
  if (has('OBMMS') && (roleOf(other('OBMMS')) === 'capital' || roleOf(other('OBMMS')) === 'margin')) {
    return rel('exclusive', NOTES.apState, 'practice');
  }

  // Overlaps
  if (has('CHAMPIONS') && CHAMPIONS_UMBRELLA.has(other('CHAMPIONS'))) return rel('overlap', NOTES.champions, 'practice');
  if (has('CGTMSE') && ['MUDRA', 'SVANIDHI', 'VISHWAKARMA'].includes(other('CGTMSE'))) {
    return rel('overlap', NOTES.guaranteeOverlap, 'practice');
  }

  // Combinations
  if (both('CGTMSE', 'ECLGS')) return rel('conditional', NOTES.eclgs, 'practice');
  if (roles.has('guarantee') && (roles.has('margin') || roles.has('capital') || roles.has('land'))) {
    return has('ECLGS') ? rel('conditional', NOTES.eclgs, 'practice') : rel('stack', NOTES.guaranteeStack, 'practice');
  }
  if (roles.has('guarantee') && roles.has('loan')) return rel('stack', NOTES.guaranteeStack, 'practice');
  if (has('AP_PARKS') && (AP_POLICY_TRIO.has(other('AP_PARKS')))) return rel('stack', NOTES.land, 'guideline');
  if (has('AP_PARKS') && (ra === 'capital' || rb === 'capital' || ra === 'margin' || rb === 'margin')) {
    return rel('conditional', NOTES.convergence, 'practice');
  }
  if (both('SCLCSS', 'SCST_HUB')) return rel('stack', NOTES.nssh, 'practice');
  if (has('VISHWAKARMA') && (roles.has('capital') || roles.has('margin'))) return rel('conditional', NOTES.vishwakarmaPlus, 'practice');
  if (has('MUDRA') && (roles.has('capital') || roles.has('margin'))) return rel('conditional', NOTES.loanLabel, 'practice');
  if (has('SVANIDHI') && (roles.has('capital') || roles.has('margin'))) return null;
  if (ra === 'capital' && rb === 'capital') return rel('conditional', NOTES.convergence, 'practice');
  if (ra === 'capital' && rb === 'margin') return rel('conditional', NOTES.convergence, 'practice');
  if (roles.has('cluster') && roles.size > 1) return rel('stack', NOTES.clusterMember, 'practice');
  if (roles.has('support') && roles.size > 1) return rel('stack', NOTES.support, 'practice');
  return null;
}

export interface PlanItem {
  scheme: SchemeMatch;
  role: SchemeRole;
  /** Why it is in the plan. */
  why: Loc;
  /** Combination checks to do with the DIC / bank before applying. */
  checks: Loc[];
}

export interface LeftOut {
  scheme: SchemeMatch;
  role: SchemeRole;
  /** The scheme in the plan that rules this one out (or makes it redundant). */
  because: SchemeMatch;
  relation: Relation;
}

export interface PairView {
  a: SchemeMatch;
  b: SchemeMatch;
  relation: Relation;
}

export interface ComboAnalysis {
  /** Money schemes to lead with: subsidy, margin money, loan. */
  core: PlanItem[];
  /** Guarantees and support that sit on top of the core plan. */
  addOns: PlanItem[];
  /** Cluster schemes: need a group of units, run outside the individual DPR. */
  clusters: PlanItem[];
  leftOut: LeftOut[];
  canCombine: PairView[];
  cannotCombine: PairView[];
  /** Steps that must come in order, earliest first. */
  sequence: PairView[];
}

const ROLE_REASON: Record<SchemeRole, Loc> = {
  margin: L(
    'Could lead the plan: credit-linked subsidy on the project cost.',
    'ప్రణాళికలో ముందుండవచ్చు: ప్రాజెక్ట్ ఖర్చుపై క్రెడిట్-లింక్డ్ సబ్సిడీ.'
  ),
  capital: L(
    'Could lead the plan: capital subsidy on the investment.',
    'ప్రణాళికలో ముందుండవచ్చు: పెట్టుబడిపై మూలధన సబ్సిడీ.'
  ),
  loan: L(
    'Funds the unit: a loan that may carry easy terms and no collateral for small amounts.',
    'యూనిట్‌కు నిధులు: సులభ నిబంధనలతో రుణం, చిన్న మొత్తాలకు తాకట్టు అవసరం లేకపోవచ్చు.'
  ),
  guarantee: L(
    'Adds a government guarantee cover to help the bank lend without collateral.',
    'తాకట్టు లేకుండా బ్యాంక్ రుణం ఇవ్వడానికి సహాయపడే ప్రభుత్వ గ్యారంటీ కవర్ జోడిస్తుంది.'
  ),
  land: L(
    'Reduces the land cost if your unit is in an APIIC park.',
    'మీ యూనిట్ APIIC పార్క్‌లో ఉంటే భూమి ఖర్చు తగ్గిస్తుంది.'
  ),
  support: L(
    'Free or low-cost support that sits beside any loan or subsidy.',
    'ఏ రుణం లేదా సబ్సిడీతోనైనా పాటు ఉండే ఉచిత లేదా తక్కువ ఖర్చు సహాయం.'
  ),
  cluster: L(
    'Needs a group of units; it does not replace your individual scheme.',
    'యూనిట్ల సమూహం అవసరం; మీ వ్యక్తిగత పథకానికి బదులు కాదు.'
  ),
};

export function analyzeCombinations(matches: SchemeMatch[]): ComboAnalysis {
  const ranked = [...matches].sort((a, b) => weightOf(b) - weightOf(a));
  const chosen: SchemeMatch[] = [];
  const leftOut: LeftOut[] = [];
  const checksFor = new Map<string, Loc[]>();

  for (const scheme of ranked) {
    const clash = chosen
      .map((other) => ({ other, relation: relationBetween(scheme.code, other.code) }))
      .find((item) => item.relation && (item.relation.type === 'exclusive' || item.relation.type === 'overlap'));
    if (clash && clash.relation) {
      leftOut.push({ scheme, role: roleOf(scheme.code), because: clash.other, relation: clash.relation });
      continue;
    }
    const checks: Loc[] = [];
    chosen.forEach((other) => {
      const relation = relationBetween(scheme.code, other.code);
      if (relation?.type === 'conditional') checks.push(relation.note);
    });
    checksFor.set(scheme.code, checks);
    chosen.push(scheme);
  }

  const toItem = (scheme: SchemeMatch): PlanItem => ({
    scheme,
    role: roleOf(scheme.code),
    why: ROLE_REASON[roleOf(scheme.code)],
    checks: checksFor.get(scheme.code) || [],
  });
  const roleIn = (...roles: SchemeRole[]) => chosen.filter((s) => roles.includes(roleOf(s.code))).map(toItem);

  const pairs: PairView[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    for (let j = i + 1; j < matches.length; j += 1) {
      const relation = relationBetween(matches[i].code, matches[j].code);
      if (relation) pairs.push({ a: matches[i], b: matches[j], relation });
    }
  }
  const moneyRoles: SchemeRole[] = ['margin', 'capital', 'loan', 'guarantee', 'land'];
  const worthShowing = (pair: PairView) =>
    moneyRoles.includes(roleOf(pair.a.code)) || moneyRoles.includes(roleOf(pair.b.code));

  return {
    core: roleIn('margin', 'capital', 'loan'),
    addOns: roleIn('guarantee', 'land', 'support'),
    clusters: roleIn('cluster'),
    leftOut,
    canCombine: pairs.filter(
      (pair) => (pair.relation.type === 'stack' || pair.relation.type === 'conditional') && worthShowing(pair)
    ),
    cannotCombine: pairs.filter((pair) => pair.relation.type === 'exclusive' || pair.relation.type === 'overlap'),
    sequence: pairs
      .filter((pair) => pair.relation.type === 'sequence')
      .sort((x, y) => (x.relation.first === x.a.code ? 0 : 1) - (y.relation.first === y.a.code ? 0 : 1)),
  };
}
