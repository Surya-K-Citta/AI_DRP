/**
 * Server-side copy of the blocking money checks in client/src/lib/finance/rules.ts, so a DPR cannot be generated
 * or submitted with funding that does not match the cost, too little promoter equity, too much debt, a loan above the
 * scheme's lending limit or a grant above its cap, even if the browser check is skipped.
 *
 * Amounts are whole hundredths of a lakh. `financeGuard.parity.test.ts` runs the same scenarios as the client
 * (financeGuard.vectors.json, written by `npm run vectors` in the client) and fails if the two ever disagree.
 */
type AnyData = Record<string, any>;
export type Blocker = { id: string; field: string; step: number; message: string };

const toCL = (value: unknown): number => {
  const raw = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(raw)) return 0;
  return Math.sign(raw) * Math.floor(Math.abs(raw) * 100 + 1e-9 + 0.5);
};
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const pctOf = (cl: number, pct: number) => toCL((cl * pct) / 100 / 100);
const sharePct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 10000) / 100);
const fmt = (cl: number) => `${cl < 0 ? '-' : ''}${Math.floor(Math.abs(cl) / 100)}.${String(Math.abs(cl) % 100).padStart(2, '0')}`;

function cost(d: AnyData) {
  const s = d.step12 || {};
  const capex = sum(['land', 'building', 'utilitiesAndInfrastructure', 'machinery', 'furniture', 'securityDeposits'].map((k) => toCL(s[k])));
  const total = capex + toCL(s.preliminaryAndPreOperative) + toCL(s.initialOpex) + toCL(s.workingCapitalMargin);
  return { capex, machinery: toCL(s.machinery), total };
}

function financing(d: AnyData) {
  const s = d.step13 || {};
  const bank = toCL(s.bankLoan);
  const equity = toCL(s.spvContribution);
  const subsidy = toCL(s.governmentGrant);
  const other = toCL(s.otherSources);
  return { debt: bank, equity, subsidy, other, total: bank + equity + subsidy + other };
}

const MIN_OWN: Record<string, number> = { PMEGP_2ND: 10, PMFME: 10, STANDUP: 10 };
const MICRO = new Set(['MUDRA', 'SVANIDHI', 'VISHWAKARMA', 'ECLGS']);

function rule(d: AnyData): { minEquity: number; maxDE: number | null } {
  const code = String(d.matchedSchemeCode || '');
  if (MICRO.has(code)) return { minEquity: 0, maxDE: null };
  if (code === 'PMEGP') return { minEquity: d.schemeExtras?.pmegpCategory === 'special' ? 5 : 10, maxDE: 3 };
  if (code === 'STANDUP') return { minEquity: 10, maxDE: 9 };
  return { minEquity: MIN_OWN[code] ?? 10, maxDE: 3 };
}

function limit(d: AnyData): number | null {
  const code = String(d.matchedSchemeCode || '');
  const x = d.schemeExtras || {};
  if (code === 'MUDRA') {
    const cap = ({ shishu: 0.5, kishore: 5, tarun: 10, tarunPlus: 20 } as Record<string, number>)[String(x.mudraCategory || '')];
    return cap ? toCL(cap) : null;
  }
  if (code === 'VISHWAKARMA') return x.loanTranche === 'second' ? toCL(2) : x.loanTranche === 'first' ? toCL(1) : null;
  if (code === 'SVANIDHI') return toCL(x.loanTranche === 'third' ? 0.5 : x.loanTranche === 'second' ? 0.25 : 0.15);
  if (code === 'STANDUP') return toCL(100);
  if (code === 'ECLGS') {
    const peak = Number(x.peakWcOutstanding) || 0;
    return peak > 0 ? toCL(Math.min(peak * 0.2, 10000)) : null;
  }
  return null;
}

export function financeBlockers(data: AnyData | null | undefined): Blocker[] {
  const d = data || {};
  const c = cost(d);
  const f = financing(d);
  const out: Blocker[] = [];
  const code = String(d.matchedSchemeCode || '');
  if ((c.total > 0 || f.total > 0) && c.total !== f.total) {
    out.push({ id: 'mof.mismatch', field: 'bankLoan', step: 13, message: `The funding adds up to ₹${fmt(f.total)} lakh but the project cost is ₹${fmt(c.total)} lakh. They must match exactly.` });
  }
  if (c.total > 0 && f.debt > 0) {
    const r = rule(d);
    const equityPct = sharePct(f.equity, c.total);
    if (r.minEquity > 0 && equityPct + 1e-9 < r.minEquity) {
      out.push({ id: 'equity.min', field: 'spvContribution', step: 13, message: `Promoter equity is ${equityPct}% of the project cost. The minimum for this scheme is ${r.minEquity}%.` });
    }
    const base = f.equity + f.subsidy;
    if (r.maxDE !== null && (base > 0 ? f.debt / base : Infinity) > r.maxDE + 1e-9) {
      out.push({ id: 'debt.equity', field: 'bankLoan', step: 13, message: `Bank debt is more than ${r.maxDE} times promoter equity plus subsidy.` });
    }
  }
  const cap = limit(d);
  if (cap !== null && f.debt > cap) {
    out.push({ id: 'lending.limit', field: 'bankLoan', step: 13, message: `The bank loan of ₹${fmt(f.debt)} lakh is more than the ₹${fmt(cap)} lakh allowed for this scheme.` });
  }
  if (code === 'PMFME' && f.subsidy > Math.min(pctOf(c.total, 35), toCL(10))) {
    out.push({ id: 'grant.cap', field: 'governmentGrant', step: 13, message: 'The PMFME grant is above 35% of the cost or ₹10 lakh.' });
  }
  if (code === 'SCLCSS' && f.subsidy > Math.min(pctOf(c.machinery, 25), toCL(25))) {
    out.push({ id: 'grant.cap', field: 'governmentGrant', step: 13, message: 'The SCLCSS subsidy is above 25% of machinery cost or ₹25 lakh.' });
  }
  if ((code === 'AP_EDP' || code === 'AP_TECH_UPGRADE') && f.subsidy > pctOf(c.capex, 75) && f.subsidy > 0 && c.capex > 0) {
    out.push({ id: 'grant.cap', field: 'governmentGrant', step: 13, message: 'Subsidy is above 75% of the fixed capital cost.' });
  }
  return out;
}

/** The step 1 fields every individual DPR must have before it can be generated. */
export function basicMissing(data: AnyData | null | undefined): string[] {
  const s1 = (data || {}).step1 || {};
  const out: string[] = [];
  if (!String(s1.unitName || s1.clusterName || '').trim()) out.push('unitName');
  if (!String(s1.district || '').trim()) out.push('district');
  if (!String(s1.location || '').trim()) out.push('location');
  return out;
}
