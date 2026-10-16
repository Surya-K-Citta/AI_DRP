import { type CL, formatCL, fromCL, pctOfCL, sharePct, toCL } from './money.ts';
import { composeFinancing, composeProjectCost, reconcileFinancing } from './capital.ts';
import { buildModel } from './model.ts';
import { pmegpOwnPercent, pmegpSubsidyPercent } from '../individualDpr/pmegpQuestions.ts';
import { PMEGP_2ND_OWN_PERCENT } from '../individualDpr/pmegp2ndQuestions.ts';
import { PMFME_MIN_OWN_PERCENT, PMFME_SUBSIDY_CAP_LAKHS, PMFME_SUBSIDY_PERCENT } from '../individualDpr/pmfmeQuestions.ts';
import { SCLCSS_SUBSIDY_CAP_LAKHS, SCLCSS_SUBSIDY_PERCENT } from '../individualDpr/sclcssQuestions.ts';
import { STANDUP_MIN_OWN_PERCENT } from '../individualDpr/standupQuestions.ts';
import { eclgsIndicativeQuantumLakhs } from '../individualDpr/eclgsQuestions.ts';
import { svanidhiTrancheCapLakhs } from '../individualDpr/svanidhiQuestions.ts';
import { vishwakarmaTrancheCapLakhs } from '../individualDpr/vishwakarmaQuestions.ts';

type AnyData = Record<string, any>;

export type FinanceFinding = {
  id: string;
  /** block: the DPR cannot be generated or submitted until this is fixed. warn: shown, never blocks. */
  severity: 'block' | 'warn';
  /** Content step and field to jump to. */
  step: number;
  field?: string;
  message: string;
  hint?: string;
  vars?: Record<string, string>;
};

export type SchemeFinanceRule = {
  /** Smallest promoter equity as a share of the project cost, percent. 0 means no minimum applies. */
  minEquityPct: number;
  /** Largest bank debt ÷ (promoter equity + capital subsidy). null means no ceiling for this scheme. */
  maxDebtEquity: number | null;
  /** Where the number comes from, so it can be checked and updated. */
  source: string;
};

export const DEFAULT_RULE: SchemeFinanceRule = {
  minEquityPct: 10,
  maxDebtEquity: 3,
  source: 'Usual bank margin of at least 10% and a debt-equity ceiling of 3:1 for a term-loan project',
};

/** Micro-credit schemes lend a large share of a small amount, so the 3:1 ceiling and a margin do not apply. */
const MICRO_CREDIT: SchemeFinanceRule = { minEquityPct: 0, maxDebtEquity: null, source: 'Micro-credit scheme: no margin or debt-equity ceiling in docs/schemes' };

export function ruleFor(data: AnyData | null | undefined): SchemeFinanceRule {
  const d = data || {};
  const code = String(d.matchedSchemeCode || '');
  const extras = d.schemeExtras || {};
  switch (code) {
    case 'PMEGP':
      return { minEquityPct: pmegpOwnPercent(extras.pmegpCategory), maxDebtEquity: 3, source: 'docs/schemes/PMEGP: own contribution 10% (general) or 5% (special category)' };
    case 'PMEGP_2ND':
      return { minEquityPct: PMEGP_2ND_OWN_PERCENT, maxDebtEquity: 3, source: 'docs/schemes/PMEGP_2ND: own contribution 10%' };
    case 'PMFME':
      return { minEquityPct: PMFME_MIN_OWN_PERCENT, maxDebtEquity: 3, source: 'docs/schemes/PMFME: own contribution at least 10%' };
    case 'STANDUP':
      return {
        minEquityPct: STANDUP_MIN_OWN_PERCENT,
        maxDebtEquity: (100 - STANDUP_MIN_OWN_PERCENT) / STANDUP_MIN_OWN_PERCENT,
        source: 'docs/schemes/STANDUP: margin at least 10%, so up to 90% may be a bank loan (9:1)',
      };
    case 'MUDRA':
    case 'SVANIDHI':
    case 'VISHWAKARMA':
    case 'ECLGS':
      return MICRO_CREDIT;
    default:
      return DEFAULT_RULE;
  }
}

const lakh = (cl: CL) => formatCL(cl);

/** The largest bank loan the scheme allows for this application, in centi-lakh, or null when the scheme sets none here. */
export function lendingLimit(data: AnyData | null | undefined): { limit: CL; label: string; min?: CL } | null {
  const d = data || {};
  const code = String(d.matchedSchemeCode || '');
  const extras = d.schemeExtras || {};
  switch (code) {
    case 'MUDRA': {
      const caps: Record<string, number> = { shishu: 0.5, kishore: 5, tarun: 10, tarunPlus: 20 };
      const key = String(extras.mudraCategory || '');
      const labels: Record<string, string> = {
        shishu: 'the Mudra Shishu category',
        kishore: 'the Mudra Kishore category',
        tarun: 'the Mudra Tarun category',
        tarunPlus: 'the Mudra Tarun Plus category',
      };
      return caps[key] ? { limit: toCL(caps[key]), label: labels[key] } : null;
    }
    case 'VISHWAKARMA': {
      const cap = vishwakarmaTrancheCapLakhs(extras.loanTranche);
      return cap > 0 ? { limit: toCL(cap), label: 'this PM Vishwakarma loan tranche' } : null;
    }
    case 'SVANIDHI':
      return { limit: toCL(svanidhiTrancheCapLakhs(extras.loanTranche)), label: 'this PM SVANidhi loan tranche' };
    case 'STANDUP':
      return { limit: toCL(100), min: toCL(10), label: 'the Stand-Up India composite loan (₹10 lakh to ₹1 crore)' };
    case 'ECLGS': {
      const quantum = eclgsIndicativeQuantumLakhs(extras.peakWcOutstanding);
      return quantum > 0 ? { limit: toCL(quantum), label: '20% of peak working-capital outstanding under ECLGS' } : null;
    }
    default:
      return null;
  }
}

const S13 = 13;

/** Every funding, ratio and scheme-limit check on the money side of the DPR. */
export function reviewFinance(data: AnyData | null | undefined): FinanceFinding[] {
  const out: FinanceFinding[] = [];
  const d = data || {};
  const cost = composeProjectCost(d);
  const fin = composeFinancing(d);
  const recon = reconcileFinancing(d);
  const rule = ruleFor(d);
  const code = String(d.matchedSchemeCode || '');
  const started = cost.total > 0 || fin.total > 0;

  if (started && !recon.balanced) {
    out.push({
      id: 'mof.mismatch',
      severity: 'block',
      step: S13,
      field: 'bankLoan',
      message: 'The funding adds up to ₹{a} lakh but the project cost is ₹{b} lakh. They must match exactly (difference ₹{c} lakh).',
      hint: 'Change the bank loan or your own contribution until both are the same.',
      vars: { a: lakh(recon.financing), b: lakh(recon.cost), c: lakh(Math.abs(recon.difference)) },
    });
  }

  if (cost.total > 0 && fin.debt > 0) {
    const equityPct = sharePct(fin.promoterEquity, cost.total);
    if (rule.minEquityPct > 0 && equityPct + 1e-9 < rule.minEquityPct) {
      out.push({
        id: 'equity.min',
        severity: 'block',
        step: S13,
        field: 'spvContribution',
        message: 'Your own money is {a}% of the project cost. The minimum for this scheme is {b}%.',
        hint: 'You need at least ₹{c} lakh of your own money.',
        vars: { a: String(equityPct), b: String(rule.minEquityPct), c: lakh(pctOfCL(cost.total, rule.minEquityPct)) },
      });
    }
    const base = fin.promoterEquity + fin.subsidy;
    if (rule.maxDebtEquity !== null) {
      const ratio = base > 0 ? fin.debt / base : Infinity;
      if (ratio > rule.maxDebtEquity + 1e-9) {
        out.push({
          id: 'debt.equity',
          severity: 'block',
          step: S13,
          field: 'bankLoan',
          message: 'Bank debt is {a} times your own money plus subsidy. The most allowed is {b} to 1.',
          hint: 'Put in more of your own money or ask for a smaller loan. Debt-equity is bank loan ÷ (own money + subsidy).',
          vars: { a: Number.isFinite(ratio) ? String(Math.round(ratio * 100) / 100) : 'many', b: String(rule.maxDebtEquity) },
        });
      }
    }
  }

  const limit = lendingLimit(d);
  if (limit && fin.debt > limit.limit) {
    out.push({
      id: 'lending.limit',
      severity: 'block',
      step: S13,
      field: 'bankLoan',
      message: 'The bank loan of ₹{a} lakh is more than the ₹{b} lakh allowed for {c}.',
      hint: 'Reduce the bank loan, or fund the rest from your own money.',
      vars: { a: lakh(fin.debt), b: lakh(limit.limit), c: limit.label },
    });
  }
  if (limit?.min !== undefined && fin.debt > 0 && fin.debt < limit.min) {
    out.push({
      id: 'lending.min',
      severity: 'warn',
      step: S13,
      field: 'bankLoan',
      message: 'The bank loan of ₹{a} lakh is below the ₹{b} lakh this scheme usually starts at.',
      hint: 'Check that this scheme is the right one for such a small loan.',
      vars: { a: lakh(fin.debt), b: lakh(limit.min) },
    });
  }

  if (code === 'PMFME' && fin.subsidy > 0) {
    const cap = Math.min(pctOfCL(cost.total, PMFME_SUBSIDY_PERCENT), toCL(PMFME_SUBSIDY_CAP_LAKHS));
    if (fin.subsidy > cap) {
      out.push({ id: 'grant.cap', severity: 'block', step: S13, field: 'governmentGrant', message: 'The PMFME grant of ₹{a} lakh is above the most allowed, ₹{b} lakh (35% of cost, up to ₹10 lakh).', hint: 'Reduce the grant and fund the rest from the bank loan or your own money.', vars: { a: lakh(fin.subsidy), b: lakh(cap) } });
    }
  }
  if (code === 'SCLCSS' && fin.subsidy > 0) {
    const cap = Math.min(pctOfCL(cost.capex.machinery, SCLCSS_SUBSIDY_PERCENT), toCL(SCLCSS_SUBSIDY_CAP_LAKHS));
    if (fin.subsidy > cap) {
      out.push({ id: 'grant.cap', severity: 'block', step: S13, field: 'governmentGrant', message: 'The SCLCSS subsidy of ₹{a} lakh is above the most allowed, ₹{b} lakh (25% of machinery cost, up to ₹25 lakh).', hint: 'Reduce the subsidy to the allowed amount.', vars: { a: lakh(fin.subsidy), b: lakh(cap) } });
    }
  }
  if ((code === 'AP_EDP' || code === 'AP_TECH_UPGRADE') && fin.subsidy > 0 && cost.capex.total > 0 && fin.subsidy > pctOfCL(cost.capex.total, 75)) {
    out.push({ id: 'grant.cap', severity: 'block', step: S13, field: 'governmentGrant', message: 'Subsidy is more than 75% of the fixed capital cost (₹{a} lakh). Combined incentives cannot go above that.', hint: 'Reduce the subsidy.', vars: { a: lakh(pctOfCL(cost.capex.total, 75)) } });
  }
  if (code === 'PMEGP' && fin.subsidy > 0 && cost.total > 0) {
    const expected = pmegpSubsidyPercent(d.schemeExtras?.pmegpCategory, d.schemeExtras?.pmegpArea);
    const actual = sharePct(fin.subsidy, cost.total);
    if (Math.abs(actual - expected) > 0.5) {
      out.push({ id: 'pmegp.rate', severity: 'warn', step: S13, field: 'governmentGrant', message: 'The subsidy is {a}% of the cost but your category and area give {b}%.', hint: 'Check the category and rural or urban choice, or the subsidy amount.', vars: { a: String(actual), b: String(expected) } });
    }
  }

  // Cross-section: each kind of bank money should have something of its own kind to fund.
  if (fin.workingCapitalLoan > cost.workingCapital && cost.workingCapital > 0) {
    out.push({ id: 'wc.loan.high', severity: 'warn', step: S13, field: 'bankLoan', message: 'The working capital loan (₹{a} lakh) is more than the working capital in the project cost (₹{b} lakh).', hint: 'The working capital loan should not be more than the working capital you need.', vars: { a: lakh(fin.workingCapitalLoan), b: lakh(cost.workingCapital) } });
  }
  const assetsFunded = cost.capex.total + cost.preOperative + cost.opex;
  if (fin.termLoan > assetsFunded && assetsFunded > 0) {
    out.push({ id: 'term.loan.high', severity: 'warn', step: S13, field: 'bankLoan', message: 'The term loan (₹{a} lakh) is more than the assets and set-up costs it pays for (₹{b} lakh).', hint: 'Part of this loan is really working capital. Enter it as a working capital loan.', vars: { a: lakh(fin.termLoan), b: lakh(assetsFunded) } });
  }

  // Projection checks.
  if (cost.total > 0) {
    const model = buildModel(d);
    if (!model.checks.balanceSheetBalances || !model.checks.cashContinuity) {
      out.push({ id: 'model.integrity', severity: 'block', step: 15, message: 'The projected balance sheet does not balance. This should never happen.', hint: 'Please report this with your DPR so it can be fixed.' });
    }
    if (fin.debt > 0 && model.dscr.average !== null && !model.dscr.meetsNorm) {
      out.push({ id: 'dscr.low', severity: 'warn', step: 15, message: 'The average DSCR is {a}. Banks usually want {b} or more.', hint: 'Lower the loan, lengthen the repayment period or improve the sales and cost figures.', vars: { a: String(model.dscr.average), b: String(model.dscr.norm) } });
    }
    if (!model.checks.liquidityPositive) {
      out.push({ id: 'cash.negative', severity: 'warn', step: 15, message: 'Cash runs out in year {a}: the closing cash balance is negative.', hint: 'More working capital or a longer loan period would help.', vars: { a: String(model.checks.firstNegativeCashYear) } });
    }
  }
  return out;
}

export { fromCL };
