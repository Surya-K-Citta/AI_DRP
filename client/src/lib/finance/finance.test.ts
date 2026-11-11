import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatCL, fromCL, sumCL, toCL } from './money.ts';
import { balancingBankLoan, composeFinancing, composeProjectCost, reconcileFinancing } from './capital.ts';
import { discountedPaybackYears, irrExcel, npvExcel, npvFromZero, paybackYears, xirrExcel } from './valuation.ts';
import { assumptionsFrom, buildModel } from './model.ts';

// A small deterministic generator, so the property checks repeat exactly.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('exact money', () => {
  it('rounds amounts to hundredths of a lakh the same way every time', () => {
    assert.equal(toCL(1.005), 101);
    assert.equal(toCL('2,50.5'), 25050);
    assert.equal(toCL(0.1 + 0.2), 30);
    assert.equal(toCL(''), 0);
    assert.equal(toCL('abc'), 0);
    assert.equal(formatCL(toCL(12.5)), '12.50');
    assert.equal(formatCL(-5), '-0.05');
  });
  it('project cost parts add up to the total exactly, to two decimals', () => {
    const next = rng(7);
    for (let i = 0; i < 300; i += 1) {
      const money = () => Math.round(next() * 100000) / 1000; // up to 3 decimals typed
      const data = { step12: { land: money(), building: money(), utilitiesAndInfrastructure: money(), machinery: money(), furniture: money(), securityDeposits: money(), preliminaryAndPreOperative: money(), workingCapitalMargin: money() } };
      const c = composeProjectCost(data);
      const shown = [c.capex.land, c.capex.building, c.capex.utilities, c.capex.machinery, c.capex.furniture, c.capex.deposits, c.preOperative, c.opex, c.workingCapital];
      assert.equal(sumCL(shown), c.total);
      assert.equal(formatCL(c.total), formatCL(sumCL(shown.map((v) => toCL(fromCL(v))))));
      assert.equal(c.capex.total + c.preOperative + c.opex + c.workingCapital, c.total);
    }
  });
  it('means of finance equal the project cost with zero variance once the loan balances them', () => {
    const next = rng(11);
    for (let i = 0; i < 300; i += 1) {
      const money = () => Math.round(next() * 100000) / 1000;
      const data: any = { step12: { machinery: money() + 1, land: money(), workingCapitalMargin: money() }, step13: { spvContribution: money() / 5, governmentGrant: money() / 8, otherSources: 0 } };
      const cost = composeProjectCost(data).total;
      const others = toCL(data.step13.spvContribution) + toCL(data.step13.governmentGrant);
      if (others > cost) continue;
      data.step13.bankLoan = balancingBankLoan(data);
      const r = reconcileFinancing(data);
      assert.equal(r.difference, 0);
      assert.equal(r.balanced, true);
      assert.equal(composeFinancing(data).total, cost);
    }
  });
  it('splits the bank money into term loan and working capital loan without losing a paisa', () => {
    const f = composeFinancing({ step13: { bankLoan: 10, workingCapitalLoan: 2.5 } });
    assert.deepEqual([f.termLoan, f.workingCapitalLoan, f.debt], [750, 250, 1000]);
    assert.equal(composeFinancing({ step13: { bankLoan: 1, workingCapitalLoan: 5 } }).termLoan, 0);
  });
});

describe('discounting matches Microsoft Excel', () => {
  it('NPV follows the Excel convention (first value discounted one period)', () => {
    assert.equal(Math.round(npvExcel(0.1, [-10000, 3000, 4200, 6800]) * 100) / 100, 1188.44);
    assert.equal(Math.round((npvExcel(0.08, [8000, 9200, 10000, 12000, 14500]) - 40000) * 100) / 100, 1922.06);
    assert.ok(Math.abs(npvFromZero(0.1, [-100, 110])) < 1e-9);
  });
  it('IRR and XIRR agree with the Excel help examples to well under 0.1%', () => {
    assert.ok(Math.abs((irrExcel([-100, 110]) as number) - 0.1) < 1e-9);
    assert.equal(Math.round((irrExcel([-1000, 500, 500, 500]) as number) * 10000) / 10000, 0.2338);
    const irr = irrExcel([-70000, 12000, 15000, 18000, 21000, 26000]) as number;
    const xirr = xirrExcel([-10000, 2750, 4250, 3250, 2750], ['2008-01-01', '2008-03-01', '2008-10-30', '2009-02-15', '2009-04-01']) as number;
    assert.ok(Math.abs(xirr - 0.373362535) / 0.373362535 < 0.001, String(xirr));
    // NPV at the IRR is zero.
    assert.ok(Math.abs(npvFromZero(irr, [-70000, 12000, 15000, 18000, 21000, 26000])) < 1e-6);
  });
  it('gives no IRR when the flows never change sign, and finds payback inside a year', () => {
    assert.equal(irrExcel([100, 200]), null);
    assert.equal(irrExcel([-100, -50]), null);
    assert.equal(paybackYears([-100, 40, 40, 40]), 2.5);
    assert.equal(paybackYears([-100, 10, 10]), null);
    assert.ok((discountedPaybackYears(0.1, [-100, 60, 60, 60]) as number) > 1);
  });
  it('IRR is the same as a slow, independent bisection for many random projects', () => {
    const next = rng(5);
    for (let i = 0; i < 200; i += 1) {
      const flows = [-(50 + next() * 100), ...Array.from({ length: 6 }, () => 5 + next() * 60)];
      const fast = irrExcel(flows) as number;
      let lo = -0.9;
      let hi = 5;
      for (let k = 0; k < 200; k += 1) {
        const mid = (lo + hi) / 2;
        if (npvFromZero(mid, flows) > 0) lo = mid;
        else hi = mid;
      }
      assert.ok(Math.abs(fast - lo) < 1e-9, `${fast} vs ${lo}`);
    }
  });
});

const sample = () => ({
  step12: { land: 5, building: 15, machinery: 60, furniture: 5, preliminaryAndPreOperative: 5, workingCapitalMargin: 10 },
  step13: { spvContribution: 20, governmentGrant: 20, bankLoan: 60, interestRate: 12, loanTenureMonths: 60, moratoriumMonths: 6 },
  step14: { annualSalesRealization: 120, rawMaterialCost: 50, powerCost: 6, wages: 18, maintenance: 3, administrativeExpenses: 5, marketingExpenses: 4 },
});

describe('projection model', () => {
  it('is deterministic and covers 5 to 7 years', () => {
    const a = buildModel(sample());
    const b = buildModel(JSON.parse(JSON.stringify(sample())));
    assert.deepEqual(a, b);
    assert.equal(a.years.length - 1, 5);
    assert.equal(buildModel(sample(), { years: 7 }).years.length - 1, 7);
    assert.equal(assumptionsFrom({ schemeExtras: { financeAssumptions: { years: 12 } } }).years, 7);
    assert.equal(assumptionsFrom({ schemeExtras: { financeAssumptions: { years: 2 } } }).years, 5);
  });
  it('profit and loss lines follow from one another', () => {
    const m = buildModel(sample(), { revenueGrowthPct: 0, costGrowthPct: 0 });
    const y1 = m.years[1];
    assert.equal(y1.revenue, 12000);
    assert.equal(y1.variableCosts, 5600);
    assert.equal(y1.grossMargin, 6400);
    assert.equal(y1.fixedCosts, 3000);
    assert.equal(y1.ebitda, 3400);
    for (const r of m.years.slice(1)) {
      assert.equal(r.grossMargin, r.revenue - r.variableCosts);
      assert.equal(r.ebitda, r.grossMargin - r.fixedCosts);
      assert.equal(r.pbt, r.ebitda - r.depreciation - r.amortisation - r.interest);
      assert.equal(r.pat, r.pbt - r.tax);
      assert.equal(r.tax, r.pbt > 0 ? Math.round((r.pbt * 25) / 100) : 0);
    }
  });
  it('depreciation is written-down value and set-up costs are written off completely', () => {
    const m = buildModel(sample(), { years: 5 });
    assert.equal(m.years[1].depreciation, Math.round(1500 * 0.1) + Math.round(6000 * 0.15) + Math.round(500 * 0.1));
    assert.equal(m.years[5].preOperativeUnwritten, 0);
    assert.equal(m.years.slice(1).reduce((s, r) => s + r.amortisation, 0), 500);
  });
  it('the term loan is repaid exactly within its tenor', () => {
    const m = buildModel(sample(), { years: 6 });
    assert.equal(m.years.reduce((s, r) => s + r.principal, 0), 6000);
    assert.equal(m.years[5].termLoanClosing, 0);
    assert.equal(m.years[6].principal, 0);
    assert.ok(m.years[1].interest > 0);
  });
  it('DSCR is (PAT + depreciation + interest) / (principal + interest), and the average meets or misses 1.50', () => {
    const m = buildModel(sample());
    for (const r of m.years.slice(1)) {
      if (r.principal + r.interest === 0) continue;
      const expected = Math.round(((r.pat + r.depreciation + r.amortisation + r.interest) / (r.principal + r.interest)) * 100) / 100;
      assert.equal(r.dscr, expected);
    }
    const values = m.years.slice(1).filter((r) => r.dscr !== null).map((r) => r.dscr as number);
    assert.equal(m.dscr.average, Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100);
    assert.equal(m.dscr.meetsNorm, (m.dscr.average as number) >= 1.5);
    const weak = buildModel({ ...sample(), step14: { ...sample().step14, annualSalesRealization: 70 } });
    assert.equal(weak.dscr.meetsNorm, false);
  });
  it('assets always equal liabilities plus equity, and cash carries from year to year', () => {
    const next = rng(21);
    for (let i = 0; i < 300; i += 1) {
      const money = (max: number) => Math.round(next() * max * 1000) / 1000;
      const cost = { land: money(20), building: money(40), machinery: money(80) + 1, furniture: money(5), preliminaryAndPreOperative: money(6), workingCapitalMargin: money(20) };
      const data: any = {
        step12: cost,
        step13: { spvContribution: money(30), governmentGrant: money(20), otherSources: money(3), interestRate: 6 + next() * 12, loanTenureMonths: [24, 36, 60, 84][i % 4], moratoriumMonths: [0, 3, 6, 12][i % 4] },
        step14: { annualSalesRealization: money(250), rawMaterialCost: money(100), powerCost: money(10), wages: money(40), maintenance: money(5), administrativeExpenses: money(8), marketingExpenses: money(6) },
      };
      data.step13.bankLoan = balancingBankLoan(data);
      data.step13.workingCapitalLoan = money(5);
      const m = buildModel(data, { years: 5 + (i % 3), taxPct: [0, 25, 30][i % 3], revenueGrowthPct: i % 7, costGrowthPct: i % 5 });
      assert.equal(m.checks.balanceSheetBalances, true, `case ${i}`);
      assert.equal(m.checks.cashContinuity, true, `case ${i}`);
      for (const r of m.years) {
        assert.equal(r.totalAssets, r.totalLiabilitiesAndEquity);
        assert.equal(r.balanceDifference, 0);
      }
      const recon = reconcileFinancing(data);
      assert.equal(m.years[0].closingCash, recon.difference, 'spare cash at the start is exactly what funding exceeds cost by');
      if (recon.balanced) assert.equal(m.years[0].closingCash, 0);
    }
  });
  it('flags a project that runs out of cash', () => {
    const m = buildModel({ ...sample(), step14: { ...sample().step14, annualSalesRealization: 60 } });
    assert.equal(m.checks.liquidityPositive, false);
    assert.ok((m.checks.firstNegativeCashYear as number) >= 1);
  });
  it('reports IRR, NPV, payback and break-even', () => {
    const m = buildModel(sample());
    assert.ok(m.valuation.projectIrr !== null && m.valuation.projectIrr > 0 && m.valuation.projectIrr < 1);
    assert.ok(m.valuation.equityIrr !== null);
    assert.equal(m.valuation.projectFlows.length, m.years.length);
    assert.ok(m.valuation.payback === null || m.valuation.payback > 0);
    assert.ok(m.breakEven.percentOfRevenue !== null && m.breakEven.percentOfRevenue > 0);
    const flows = m.valuation.projectFlows.map((v) => v / 100);
    assert.ok(Math.abs(npvFromZero(m.valuation.projectIrr as number, flows)) < 1e-6);
    assert.equal(m.valuation.npv, Math.round(npvFromZero(0.12, flows) * 100) / 100);
  });
  it('copes with an empty draft', () => {
    const m = buildModel({});
    assert.equal(m.checks.balanceSheetBalances, true);
    assert.equal(m.valuation.projectIrr, null);
    assert.equal(m.dscr.average, null);
  });
});

import { readFileSync } from 'node:fs';
import { CATALOG_VERSION, FORMULA_CATALOG, computeLock, sha256Hex, verifyCatalog } from './catalog.ts';
import { lendingLimit, reviewFinance, ruleFor } from './rules.ts';
import { auditSubmission, financeWarnings } from '../individualDpr/submissionAudit.ts';

const lock = JSON.parse(readFileSync(new URL('./formulaLock.json', import.meta.url), 'utf8'));

describe('formula catalog is locked with SHA-256', () => {
  it('computes real SHA-256 hashes', async () => {
    assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('matches the committed lock exactly (a changed formula fails here until it is versioned and re-locked)', async () => {
    const verdict = await verifyCatalog(lock);
    assert.deepEqual(verdict, { ok: true, changed: [], added: [], removed: [] });
    assert.equal(lock.catalogVersion, CATALOG_VERSION);
  });
  it('notices a tampered lock, an added formula and a removed one', async () => {
    const tampered = JSON.parse(JSON.stringify(lock));
    tampered.formulas['pl.pat'].sha256 = '0'.repeat(64);
    assert.deepEqual((await verifyCatalog(tampered)).changed, ['pl.pat']);
    const missing = JSON.parse(JSON.stringify(lock));
    delete missing.formulas['val.irr'];
    assert.deepEqual((await verifyCatalog(missing)).added, ['val.irr']);
    const extra = JSON.parse(JSON.stringify(lock));
    extra.formulas['old.formula'] = { version: '1.0.0', sha256: '1'.repeat(64) };
    assert.deepEqual((await verifyCatalog(extra)).removed, ['old.formula']);
  });
  it('is deterministic, immutable and well formed', async () => {
    assert.deepEqual(await computeLock(), await computeLock());
    assert.equal(new Set(FORMULA_CATALOG.map((f) => f.id)).size, FORMULA_CATALOG.length);
    for (const f of FORMULA_CATALOG) {
      assert.match(f.version, /^\d+\.\d+\.\d+$/);
      assert.ok(f.statement.length > 20 && Object.isFrozen(f));
      assert.throws(() => { (f as any).statement = 'changed'; }, TypeError);
    }
    assert.ok(FORMULA_CATALOG.length >= 19);
  });
});

const funded = (over: any = {}) => ({
  matchedSchemeCode: null,
  step12: { land: 5, building: 15, machinery: 60, furniture: 5, preliminaryAndPreOperative: 5, workingCapitalMargin: 10 },
  step13: { spvContribution: 20, governmentGrant: 0, bankLoan: 80, interestRate: 12, loanTenureMonths: 60 },
  step14: { annualSalesRealization: 150, rawMaterialCost: 50, powerCost: 6, wages: 18, maintenance: 3, administrativeExpenses: 5, marketingExpenses: 4 },
  ...over,
});
const ids = (data: any, severity?: string) => reviewFinance(data).filter((f) => !severity || f.severity === severity).map((f) => f.id);

describe('funding rules by scheme', () => {
  it('a balanced plan within the norms has no blockers', () => {
    assert.deepEqual(ids(funded({ step13: { ...funded().step13, spvContribution: 25, bankLoan: 75 } }), 'block'), []);
  });
  it('blocks funding that is not exactly the project cost', () => {
    const f = reviewFinance(funded({ step13: { ...funded().step13, bankLoan: 79.99 } })).find((x) => x.id === 'mof.mismatch');
    assert.ok(f && f.severity === 'block' && f.field === 'bankLoan' && f.vars?.c === '0.01');
  });
  it('blocks promoter equity below the scheme minimum, naming the amount needed', () => {
    const data = funded({ step13: { ...funded().step13, spvContribution: 5, bankLoan: 95 } });
    const f = reviewFinance(data).find((x) => x.id === 'equity.min');
    assert.ok(f && f.vars?.a === '5' && f.vars?.b === '10' && f.vars?.c === '10.00');
    assert.ok(ids(funded({ matchedSchemeCode: 'PMEGP', schemeExtras: { pmegpCategory: 'special' }, step13: { ...funded().step13, spvContribution: 5, governmentGrant: 35, bankLoan: 60 } }), 'block').indexOf('equity.min') === -1, 'special category needs 5%');
    assert.ok(ids(funded({ matchedSchemeCode: 'PMEGP', schemeExtras: { pmegpCategory: 'general' }, step13: { ...funded().step13, spvContribution: 5, governmentGrant: 35, bankLoan: 60 } })).includes('equity.min'), 'general category needs 10%');
  });
  it('blocks debt above 3 times equity, with subsidy counted as equity', () => {
    assert.ok(ids(funded({ step13: { ...funded().step13, spvContribution: 24, bankLoan: 76 } })).includes('debt.equity'));
    assert.ok(!ids(funded({ step13: { ...funded().step13, spvContribution: 25, bankLoan: 75 } })).includes('debt.equity'));
    assert.ok(!ids(funded({ step13: { ...funded().step13, spvContribution: 10, governmentGrant: 15, bankLoan: 75 } })).includes('debt.equity'));
  });
  it('micro-credit schemes have no margin or debt-equity ceiling, Stand-Up allows 90% debt', () => {
    const mudra = funded({ matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'tarun' }, step12: { machinery: 8, workingCapitalMargin: 2 }, step13: { spvContribution: 0.5, bankLoan: 9.5 } });
    assert.deepEqual(ids(mudra, 'block'), []);
    assert.equal(ruleFor({ matchedSchemeCode: 'STANDUP' }).maxDebtEquity, 9);
    assert.equal(ruleFor({ matchedSchemeCode: 'STANDUP' }).minEquityPct, 10);
  });
  it('blocks a bank loan above the scheme lending limit', () => {
    const kishore = { matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'kishore' }, step12: { machinery: 8, workingCapitalMargin: 2 }, step13: { spvContribution: 1, bankLoan: 9 } };
    assert.ok(ids(kishore, 'block').includes('lending.limit'));
    assert.equal(lendingLimit(kishore)?.limit, 500);
    assert.ok(!ids({ ...kishore, schemeExtras: { mudraCategory: 'tarun' } }, 'block').includes('lending.limit'));
    const vish = { matchedSchemeCode: 'VISHWAKARMA', schemeExtras: { loanTranche: 'first' }, step12: { workingCapitalMargin: 3 }, step13: { bankLoan: 3 } };
    assert.ok(ids(vish, 'block').includes('lending.limit'));
    const svan = { matchedSchemeCode: 'SVANIDHI', schemeExtras: { loanTranche: 'first' }, step12: { workingCapitalMargin: 0.2 }, step13: { bankLoan: 0.2 } };
    assert.ok(ids(svan, 'block').includes('lending.limit'));
    const standup = { matchedSchemeCode: 'STANDUP', step12: { machinery: 150 }, step13: { spvContribution: 15, bankLoan: 135 } };
    assert.ok(ids(standup, 'block').includes('lending.limit'));
  });
  it('blocks grants above their caps', () => {
    const pmfme = { matchedSchemeCode: 'PMFME', step12: { machinery: 20 }, step13: { spvContribution: 4, governmentGrant: 7.1, bankLoan: 8.9 } };
    assert.ok(ids(pmfme, 'block').includes('grant.cap'), '35% of 20 lakh is 7');
    assert.ok(!ids({ ...pmfme, step13: { spvContribution: 4, governmentGrant: 7, bankLoan: 9 } }, 'block').includes('grant.cap'));
    assert.ok(!ids({ matchedSchemeCode: 'PMFME', step12: { machinery: 100 }, step13: { spvContribution: 20, governmentGrant: 10, bankLoan: 70 } }, 'block').includes('grant.cap'));
    assert.ok(ids({ matchedSchemeCode: 'PMFME', step12: { machinery: 100 }, step13: { spvContribution: 10, governmentGrant: 10.5, bankLoan: 79.5 } }, 'block').includes('grant.cap'), 'above the 10 lakh ceiling');
    const sclcss = { matchedSchemeCode: 'SCLCSS', step12: { machinery: 200 }, step13: { spvContribution: 20, governmentGrant: 30, bankLoan: 150 } };
    assert.ok(ids(sclcss, 'block').includes('grant.cap'));
  });
  it('warns, without blocking, when DSCR is under 1.50 or cash runs out', () => {
    const weak = funded({ step14: { ...funded().step14, annualSalesRealization: 70 } });
    const w = reviewFinance(weak);
    assert.ok(w.find((x) => x.id === 'dscr.low')?.severity === 'warn');
    assert.ok(w.find((x) => x.id === 'cash.negative')?.severity === 'warn');
  });
  it('skips equity and debt checks when nothing is borrowed', () => {
    assert.deepEqual(ids(funded({ step13: { spvContribution: 100, bankLoan: 0 } })), []);
  });
});

describe('pre-submission audit', () => {
  const required = (step: number, d: any) => (step === 1 && !d?.district ? [{ key: 'district', label: 'District' }] : step === 2 ? [{ key: 'sectorType', label: 'Sector' }] : []);
  it('blocks on each empty required field and anchors it to its step and field', () => {
    const out = auditSubmission({}, [1, 2], required);
    assert.deepEqual(out.map((f) => [f.id, f.step, f.field, f.blocking]), [['required.1.district', 1, 'district', true], ['required.2.sectorType', 2, 'sectorType', true]]);
    assert.equal(out[0].vars?.a, 'District');
  });
  it('adds the money blockers, and nothing when everything is in order', () => {
    const bad = auditSubmission(funded({ step13: { ...funded().step13, bankLoan: 70 } }), [], () => []);
    assert.ok(bad.some((f) => f.id === 'mof.mismatch' && f.blocking && f.kind === 'blocking'));
    assert.deepEqual(auditSubmission(funded({ step13: { ...funded().step13, spvContribution: 25, bankLoan: 75 } }), [], () => []), []);
    assert.ok(financeWarnings(funded({ step14: { ...funded().step14, annualSalesRealization: 70 } })).every((f) => f.kind === 'unusual'));
  });
});
