import { getUnitName } from './toIndividualPayload.ts';

type AnyData = Record<string, any>;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** The applicant details that repeat across sections, gathered from wherever the person entered them. */
type Profile = {
  promoterName: string;
  unitName: string;
  address: string;
  gstin: string;
  district: string;
  location: string;
};

/** Where the schedules (project cost, bank loan) read promoter, address and GST from. Nothing here is stored. */
export function deriveProfile(data: AnyData | null | undefined): Profile {
  const d = data || {};
  const extras = d.schemeExtras || {};
  const step1 = d.step1 || {};
  const step11 = d.step11 || {};
  const district = text(step1.district);
  const location = text(step1.location);
  const place = [location, district].filter(Boolean).join(', ');
  return {
    promoterName: text(extras.entrepreneurName) || text(extras.authorisedSignatory) || text(step11.spvName),
    unitName: getUnitName(step1),
    address: text(step11.address) || place,
    gstin: text(step11.gstin).toUpperCase(),
    district,
    location,
  };
}

type Rule = {
  /** Where the value is written: step<N>.<field> */
  target: string;
  /** What to copy; empty means nothing to copy yet. */
  source: (data: AnyData) => string;
};

const LEAN_FIRM = new Set([
  'PMEGP', 'PMEGP_2ND', 'MUDRA', 'STANDUP', 'PMFME', 'SCLCSS', 'AP_TECH_UPGRADE', 'AP_EDP', 'VISHWAKARMA', 'SVANIDHI',
  'ECLGS', 'ZED', 'LEAN', 'MSME_IPR', 'PMS', 'SCST_HUB', 'ASPIRE', 'NHDP', 'CVY', 'MSE_GIFT', 'PTUAS', 'PMPDS',
]);

/** Fields later in the form that start out as a copy of something already entered. */
const REUSE_RULES: Rule[] = [
  {
    // The applicant / firm name is the unit's name; for a proprietor it is the person's name.
    target: 'step11.spvName',
    source: (d) => {
      const extras = d.schemeExtras || {};
      const proprietor = LEAN_FIRM.has(String(d.matchedSchemeCode || '')) && text(extras.entrepreneurName);
      return proprietor || getUnitName(d.step1);
    },
  },
  {
    target: 'step11.address',
    source: (d) => [text(d.step1?.location), text(d.step1?.district)].filter(Boolean).join(', '),
  },
];

function read(data: AnyData, path: string): string {
  const [step, field] = path.split('.');
  return text(data[step]?.[field]);
}

/**
 * Copy repeated details forward without ever overwriting what the person typed.
 * A target is filled while it is empty, and keeps following its source for as long as it still holds the value we
 * put there. The moment the person types something different it is theirs and is left alone.
 * The values we filled are remembered in `schemeExtras.autoFilled`.
 */
export function applyContextReuse(data: AnyData): AnyData {
  const trail: Record<string, string> = { ...(data.schemeExtras?.autoFilled || {}) };
  let next = data;
  let trailChanged = false;

  for (const rule of REUSE_RULES) {
    const wanted = rule.source(next);
    const current = read(next, rule.target);
    const lastFilled = trail[rule.target];
    const following = current === '' || (lastFilled !== undefined && current === lastFilled);
    if (!following || current === wanted) continue;
    const [step, field] = rule.target.split('.');
    next = { ...next, [step]: { ...(next[step] || {}), [field]: wanted } };
    if (wanted === '') delete trail[rule.target];
    else trail[rule.target] = wanted;
    trailChanged = true;
  }

  if (!trailChanged) return next === data ? data : next;
  return { ...next, schemeExtras: { ...(next.schemeExtras || {}), autoFilled: trail } };
}

/** True while the field still holds a value we copied (so the screen can say where it came from). */
export function isAutoFilled(data: AnyData, path: string): boolean {
  const filled = data.schemeExtras?.autoFilled?.[path];
  return filled !== undefined && filled !== '' && read(data, path) === filled;
}
