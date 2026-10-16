/**
 * Plain-language data checks on a Create DPR draft: answers that are missing, unclear, don't add up, or look unusual.
 * Pure and advisory. Hard "required" fields are handled elsewhere (requiredStepFields.ts).
 * `message` and `hint` are English templates; {a} {b} {c} are filled from `vars` and the screen translates the template.
 */
type AnyData = Record<string, any>;

export type CheckKind = 'blocking' | 'missing' | 'mismatch' | 'unclear' | 'unusual';

export type Finding = {
  id: string;
  kind: CheckKind;
  /** Content step the answer belongs to (same numbering as the form's step 1..18). */
  step: number;
  field?: string;
  message: string;
  hint?: string;
  vars?: Record<string, string>;
  /** Changes when the answer changes, so a dismissed finding comes back if the value is edited. */
  signature: string;
  /** A blocking finding stops the DPR from being generated or submitted and cannot be dismissed. */
  blocking?: boolean;
};

export const KIND_ORDER: CheckKind[] = ['blocking', 'missing', 'mismatch', 'unclear', 'unusual'];

const num = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const n = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};
const txt = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const round = (n: number): string => (Math.round(n * 100) / 100).toString();
const stepOf = (data: AnyData, n: number): AnyData => data[`step${n}`] || {};

export const dismissalKey = (finding: Finding): string => `${finding.id}|${finding.signature}`;

const PLACEHOLDER = /^(na|n\/a|nil|none|nothing|test|testing|xxx+|asdf+|abc+|qwerty|sample|dummy|\.+|-+|\?+|\d+)$/i;

const MONEY_FIELDS: Record<number, string[]> = {
  12: ['land', 'building', 'machinery', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative', 'workingCapitalMargin', 'furniture', 'securityDeposits'],
  13: ['spvContribution', 'governmentGrant', 'bankLoan', 'otherSources'],
  14: ['rawMaterialCost', 'wages', 'powerCost', 'maintenance', 'administrativeExpenses', 'marketingExpenses', 'annualSalesRealization'],
};

const NARRATIVE: { step: number; field: string; min: number; where?: 'extras'; label: string }[] = [
  { step: 1, field: 'natureOfBusiness', min: 12, label: 'What you do' },
  { step: 1, field: 'majorProducts', min: 3, label: 'Major products' },
  { step: 2, field: 'sectorDescription', min: 30, label: 'Short intro' },
  { step: 2, field: 'executiveSummary', min: 40, where: 'extras', label: 'Executive summary' },
  { step: 2, field: 'processOfManufacture', min: 40, where: 'extras', label: 'Process of manufacture' },
  { step: 4, field: 'presentActivities', min: 30, label: 'Present activity' },
  { step: 4, field: 'manufacturingProcess', min: 30, label: 'Manufacturing process' },
];

function startedStep(data: AnyData, n: number): boolean {
  return Object.values(stepOf(data, n)).some((v) => (typeof v === 'string' ? v.trim() !== '' : typeof v === 'number' ? v !== 0 : !!v && typeof v === 'object' && Object.keys(v).length > 0));
}

export function projectCost(data: AnyData): number {
  const s = stepOf(data, 12);
  return MONEY_FIELDS[12].reduce((sum, key) => sum + num(s[key]), 0);
}

export function fundingTotal(data: AnyData): number {
  const s = stepOf(data, 13);
  return MONEY_FIELDS[13].reduce((sum, key) => sum + num(s[key]), 0);
}

/** `final` also reports steps the person has not opened yet; otherwise only steps that have some answers. */
export function runDataChecks(data: AnyData, options: { final?: boolean } = {}): Finding[] {
  const out: Finding[] = [];
  const final = options.final === true;
  const add = (f: Omit<Finding, 'signature'> & { signature?: string }) =>
    out.push({ ...f, signature: f.signature ?? JSON.stringify(f.vars ?? {}) });

  const s1 = stepOf(data, 1);
  const s13 = stepOf(data, 13);
  const s14 = stepOf(data, 14);
  const extras = data.schemeExtras || {};
  const cost = projectCost(data);
  const funding = fundingTotal(data);

  // ---- missing
  if (cost === 0 && (final || startedStep(data, 12))) {
    add({ id: 'cost.zero', kind: 'missing', step: 12, message: 'The project cost is empty. Banks need to see what the project will cost.', hint: 'Fill in land, building, machinery and working capital. Use quotations to estimate.' });
  }
  if (funding === 0 && cost > 0 && (final || startedStep(data, 13))) {
    add({ id: 'mof.zero', kind: 'missing', step: 13, message: 'How the project will be paid for is empty.', hint: 'Enter your own money, any subsidy and the bank loan so that they add up to the project cost.' });
  }
  const costs14 = ['rawMaterialCost', 'wages', 'powerCost', 'maintenance', 'administrativeExpenses', 'marketingExpenses'].reduce((sum, k) => sum + num(s14[k]), 0);
  if (num(s14.annualSalesRealization) === 0 && (costs14 > 0 || final) && (startedStep(data, 14) || final)) {
    add({ id: 'sales.zero', kind: 'missing', step: 14, field: 'annualSalesRealization', message: 'Yearly sales are empty. The bank cannot judge repayment without them.', hint: 'Enter what you expect to sell in a normal year, in lakhs.' });
  }
  if (final && !txt(s1.natureOfBusiness) && !txt(extras.natureOfBusiness)) {
    add({ id: 'what.missing', kind: 'missing', step: 1, field: 'natureOfBusiness', message: 'You have not said what your business does.', hint: 'One or two simple lines are enough.' });
  }

  // ---- unclear text
  const seen = new Map<string, string>();
  for (const item of NARRATIVE) {
    const raw = item.where === 'extras' ? extras[item.field] : stepOf(data, item.step)[item.field];
    const value = txt(raw);
    if (!value) continue;
    if (PLACEHOLDER.test(value)) {
      add({ id: `text.placeholder.${item.field}`, kind: 'unclear', step: item.step, field: item.field, message: 'This answer looks like a placeholder ("{a}").', hint: 'Replace it with a real answer, or leave it empty.', vars: { a: value.slice(0, 20) } });
    } else if (value.length < item.min) {
      add({ id: `text.short.${item.field}`, kind: 'unclear', step: item.step, field: item.field, message: 'This answer is very short: "{a}". A little more detail helps the bank understand.', hint: 'Say what, for whom and how, in two or three simple lines.', vars: { a: value.slice(0, 40) } });
    }
    const key = value.toLowerCase().replace(/\s+/g, ' ');
    if (key.length >= 20) {
      const first = seen.get(key);
      if (first) {
        add({ id: `text.repeat.${item.field}`, kind: 'unclear', step: item.step, field: item.field, message: 'This is word for word the same as another answer ({a}).', hint: 'Each answer should say something different.', vars: { a: first } });
      } else seen.set(key, item.label);
    }
  }

  // ---- amounts that look like rupees
  const rupeeLike: string[] = [];
  for (const [step, keys] of Object.entries(MONEY_FIELDS)) {
    for (const key of keys) {
      const value = num(stepOf(data, Number(step))[key]);
      if (value >= 5000) rupeeLike.push(`${step}.${key}`);
    }
  }
  if (rupeeLike.length) {
    const [step, field] = rupeeLike[0].split('.');
    const value = num(stepOf(data, Number(step))[field]);
    add({ id: 'unit.rupees', kind: 'unclear', step: Number(step), field, message: 'An amount of {a} lakh is about ₹{b} crore. Did you type rupees instead of lakhs?', hint: 'These fields are in lakhs. ₹2,50,000 is 2.5 lakh.', vars: { a: round(value), b: round(value / 100) } });
  }

  // ---- amounts that do not add up
  if (cost > 0 && funding > 0) {
    const diff = Math.abs(funding - cost);
    if (diff > Math.max(0.05, cost * 0.01)) {
      add({ id: 'mof.mismatch', kind: 'mismatch', step: 13, message: 'The funding adds up to ₹{a} lakh but the project cost is ₹{b} lakh. They differ by ₹{c} lakh.', hint: 'Change the bank loan or your own contribution until both match.', vars: { a: round(funding), b: round(cost), c: round(diff) } });
    }
  }
  const tenure = num(s13.loanTenureMonths);
  const moratorium = num(s13.moratoriumMonths);
  if (tenure > 0 && moratorium >= tenure) {
    add({ id: 'loan.moratorium', kind: 'mismatch', step: 13, message: 'The grace period ({a} months) is as long as, or longer than, the whole loan period ({b} months).', hint: 'The grace period is only the first part of the loan period.', vars: { a: round(moratorium), b: round(tenure) } });
  }
  const start = Date.parse(txt(stepOf(data, 4).startDate));
  const commit = Date.parse(txt(stepOf(data, 4).commitmentDate));
  if (Number.isFinite(start) && Number.isFinite(commit) && start < commit) {
    add({ id: 'dates.order', kind: 'mismatch', step: 4, field: 'startDate', message: 'Production is shown starting before the investment is committed.', hint: 'Production normally starts after you commit the money.' });
  }

  // ---- unusual values
  const rate = num(s13.interestRate);
  if (rate > 0 && (rate < 6 || rate > 16)) {
    add({ id: 'loan.rate', kind: 'unusual', step: 13, field: 'interestRate', message: 'An interest rate of {a}% is unusual. Small-business loans are usually between 8% and 14%.', hint: 'Check with your bank. If {a}% is right, keep it.', vars: { a: round(rate) } });
  }
  if (tenure > 0 && (tenure < 12 || tenure > 180)) {
    add({ id: 'loan.tenure', kind: 'unusual', step: 13, field: 'loanTenureMonths', message: 'A loan period of {a} months is unusual. Most term loans run 36 to 84 months.', hint: 'Count in months: 5 years is 60 months.', vars: { a: round(tenure) } });
  }
  if (cost > 0) {
    const own = num(s13.spvContribution);
    const grant = num(s13.governmentGrant);
    if (own > 0 && own / cost < 0.05) {
      add({ id: 'mof.own.low', kind: 'unusual', step: 13, field: 'spvContribution', message: 'Your own money is only {a}% of the project cost. Most schemes expect at least 5% to 10%.', hint: 'Check the scheme rules for the share you must put in.', vars: { a: round((own / cost) * 100) } });
    }
    if (grant > 0 && grant / cost > 0.5) {
      add({ id: 'mof.grant.high', kind: 'unusual', step: 13, field: 'governmentGrant', message: 'The subsidy is {a}% of the project cost. Subsidy rates under most schemes are well below half.', hint: 'Check the subsidy rate in the scheme rules.', vars: { a: round((grant / cost) * 100) } });
    }
    if (cost > 500) {
      add({ id: 'cost.large', kind: 'unusual', step: 12, message: 'A project cost of ₹{a} crore is bigger than most micro and small units.', hint: 'Check that the amounts are in lakhs.', vars: { a: round(cost / 100) } });
    }
  }
  const sales = num(s14.annualSalesRealization);
  if (sales > 0 && costs14 > sales) {
    add({ id: 'sales.loss', kind: 'unusual', step: 14, message: 'Your yearly costs (₹{a} lakh) are higher than your yearly sales (₹{b} lakh). The bank will read this as a loss.', hint: 'Check the sales and cost amounts. If it is right, explain how you will turn it around.', vars: { a: round(costs14), b: round(sales) } });
  }
  const utilisation = num(extras.capacityUtilisationY1 ?? s14.capacityUtilisation);
  if (utilisation > 100) {
    add({ id: 'util.over', kind: 'unusual', step: 14, field: 'capacityUtilisation', message: 'Using {a}% of capacity is not possible. It cannot be above 100%.', hint: 'Enter how much of your machines’ full output you expect to use, from 0 to 100.', vars: { a: round(utilisation) } });
  } else if (utilisation > 0 && utilisation < 30) {
    add({ id: 'util.low', kind: 'unusual', step: 14, field: 'capacityUtilisation', message: 'Using only {a}% of capacity is low. Banks usually expect 50% to 70% in the first year.', hint: 'If {a}% is right, keep it, or check the figure.', vars: { a: round(utilisation) } });
  }
  const breakEven = num(stepOf(data, 15).breakEvenPoint);
  if (breakEven > 100) {
    add({ id: 'breakeven.over', kind: 'unusual', step: 15, field: 'breakEvenPoint', message: 'A break-even of {a}% means you would need more than your full capacity to stop losing money.', hint: 'Break-even is a percentage of capacity, from 0 to 100.', vars: { a: round(breakEven) } });
  }
  const jobs = num(stepOf(data, 17).employmentGeneration ?? extras.directEmployment);
  if (jobs > 250) {
    add({ id: 'jobs.high', kind: 'unusual', step: 17, field: 'employmentGeneration', message: '{a} jobs is a lot for a micro or small unit.', hint: 'Count only the people you will employ directly.', vars: { a: round(jobs) } });
  }

  const rank = (k: CheckKind) => KIND_ORDER.indexOf(k);
  return out.sort((a, b) => rank(a.kind) - rank(b.kind) || a.step - b.step);
}

/** Findings the person has not marked "that is correct". */
export function openFindings(findings: Finding[], dismissed: string[] | undefined): Finding[] {
  const set = new Set(dismissed || []);
  return findings.filter((f) => !set.has(dismissalKey(f)));
}
