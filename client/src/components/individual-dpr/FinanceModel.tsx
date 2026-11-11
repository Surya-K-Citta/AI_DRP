import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { formatCL } from '@/lib/finance/money';
import { buildModel, type Model, type YearRow } from '@/lib/finance/model';
import { composeFinancing, composeProjectCost, reconcileFinancing } from '@/lib/finance/capital';
import { ruleFor } from '@/lib/finance/rules';
import { CATALOG_VERSION, verifyCatalog } from '@/lib/finance/catalog';
import formulaLock from '@/lib/finance/formulaLock.json';
import { sharePct } from '@/lib/finance/money';

type AnyData = Record<string, any>;

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 10000) / 100}%`);

/** Check marks for the headline integrity tests of the model. */
function modelChecks(data: AnyData, model: Model) {
  const cost = composeProjectCost(data);
  const fin = composeFinancing(data);
  const recon = reconcileFinancing(data);
  const rule = ruleFor(data);
  const equityShare = sharePct(fin.promoterEquity, cost.total);
  const base = fin.promoterEquity + fin.subsidy;
  const ratio = base > 0 ? fin.debt / base : null;
  return [
    { label: 'Funding equals the project cost exactly', ok: recon.balanced },
    { label: 'Balance sheet balances in every year', ok: model.checks.balanceSheetBalances },
    { label: 'Each year opens with the cash the last year closed with', ok: model.checks.cashContinuity },
    { label: 'Cash never goes negative', ok: model.checks.liquidityPositive },
    { label: 'Average DSCR is 1.50 or more', ok: fin.debt === 0 ? true : model.dscr.meetsNorm },
    { label: 'Your own money meets the scheme minimum', ok: fin.debt === 0 || rule.minEquityPct === 0 || equityShare >= rule.minEquityPct },
    { label: 'Debt is within the debt-equity ceiling', ok: fin.debt === 0 || rule.maxDebtEquity === null || (ratio !== null && ratio <= rule.maxDebtEquity) },
  ];
}

const NumberInput: React.FC<{ caption: string; value: number; onChange: (v: number) => void; step?: number }> = ({ caption, value, onChange, step = 1 }) => {
  const tf = useClusterFormText();
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground">{tf(caption)}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      />
    </label>
  );
};

function Statement({ heading, years, rows, open: startOpen = false }: { heading: string; years: YearRow[]; rows: { label: string; get: (r: YearRow) => number | string; strong?: boolean }[]; open?: boolean }) {
  const tf = useClusterFormText();
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="rounded-md border">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {tf(heading)}
      </button>
      {open ? (
        <div className="overflow-x-auto border-t">
          <table className="w-full min-w-[34rem] text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-2 py-1.5 text-left">{tf('₹ Lakhs')}</th>
                {years.map((r) => (
                  <th key={r.year} className="px-2 py-1.5 text-right">{r.year === 0 ? tf('Set-up') : `${tf('Year')} ${r.year}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className={row.strong ? 'font-semibold' : ''}>
                  <td className="px-2 py-1">{tf(row.label)}</td>
                  {years.map((r) => {
                    const v = row.get(r);
                    return <td key={r.year} className="px-2 py-1 text-right tabular-nums">{typeof v === 'number' ? formatCL(v) : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

const FINANCE_ROWS = {
  pl: [
    { label: 'Revenue', get: (r: YearRow) => r.revenue },
    { label: 'Variable costs', get: (r: YearRow) => r.variableCosts },
    { label: 'Gross margin', get: (r: YearRow) => r.grossMargin, strong: true },
    { label: 'Fixed costs', get: (r: YearRow) => r.fixedCosts },
    { label: 'EBITDA', get: (r: YearRow) => r.ebitda, strong: true },
    { label: 'Depreciation', get: (r: YearRow) => r.depreciation },
    { label: 'Set-up costs written off', get: (r: YearRow) => r.amortisation },
    { label: 'Interest', get: (r: YearRow) => r.interest },
    { label: 'Profit before tax', get: (r: YearRow) => r.pbt },
    { label: 'Tax', get: (r: YearRow) => r.tax },
    { label: 'Profit after tax (PAT)', get: (r: YearRow) => r.pat, strong: true },
  ],
  cf: [
    { label: 'Operating activities', get: (r: YearRow) => r.operatingCash },
    { label: 'Investing activities', get: (r: YearRow) => r.investingCash },
    { label: 'Financing activities', get: (r: YearRow) => r.financingCash },
    { label: 'Opening cash', get: (r: YearRow) => r.openingCash },
    { label: 'Closing cash', get: (r: YearRow) => r.closingCash, strong: true },
  ],
  bs: [
    { label: 'Net fixed assets', get: (r: YearRow) => r.netFixedAssets },
    { label: 'Set-up costs not yet written off', get: (r: YearRow) => r.preOperativeUnwritten },
    { label: 'Net working capital', get: (r: YearRow) => r.netWorkingCapital },
    { label: 'Cash', get: (r: YearRow) => r.closingCash },
    { label: 'Total assets', get: (r: YearRow) => r.totalAssets, strong: true },
    { label: 'Promoter capital', get: (r: YearRow) => r.promoterCapital },
    { label: 'Subsidy reserve', get: (r: YearRow) => r.subsidyReserve },
    { label: 'Retained earnings', get: (r: YearRow) => r.retainedEarnings },
    { label: 'Term loan', get: (r: YearRow) => r.termLoan },
    { label: 'Working capital loan', get: (r: YearRow) => r.workingCapitalLoan },
    { label: 'Other funding', get: (r: YearRow) => r.otherFunding },
    { label: 'Total liabilities and equity', get: (r: YearRow) => r.totalLiabilitiesAndEquity, strong: true },
    { label: 'Difference', get: (r: YearRow) => r.balanceDifference },
  ],
};

/** Read-only projection built from the answers, with its integrity checks and the assumptions behind it. */
export const FinanceModelPanel: React.FC<{ data: AnyData; onAssumptions: (next: Record<string, number>) => void }> = ({ data, onAssumptions }) => {
  const tf = useClusterFormText();
  const model = useMemo(() => buildModel(data), [data]);
  const cost = composeProjectCost(data);
  const a = model.assumptions;
  const [catalog, setCatalog] = useState<'checking' | 'ok' | 'changed'>('checking');
  useEffect(() => {
    let live = true;
    verifyCatalog(formulaLock as any).then((verdict) => live && setCatalog(verdict.ok ? 'ok' : 'changed')).catch(() => live && setCatalog('changed'));
    return () => { live = false; };
  }, []);
  const set = (patch: Record<string, number>) => onAssumptions({ ...(data.schemeExtras?.financeAssumptions || {}), ...patch });

  if (cost.total <= 0) {
    return <p className="rounded-md border p-3 text-sm text-muted-foreground" data-finance-model>{tf('Fill in the project cost and the means of finance, and the projected statements will appear here.')}</p>;
  }
  const checks = modelChecks(data, model);
  const v = model.valuation;
  return (
    <section className="space-y-3 rounded-lg border p-4" data-finance-model>
      <div>
        <h3 className="text-base font-semibold">{tf('Projected financial statements')}</h3>
        <p className="text-xs text-muted-foreground">{tf('Worked out from your answers. They update as you type. Change the assumptions if yours are different.')}</p>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2" aria-label={tf('Checks')}>
        {checks.map((check) => (
          <li key={check.label} className={`flex items-start gap-2 text-sm ${check.ok ? 'text-emerald-700' : 'text-red-700'}`} data-check-ok={check.ok}>
            {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <span>{tf(check.label)}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block text-xs">
          <span className="text-muted-foreground">{tf('Years')}</span>
          <select value={a.years} onChange={(e) => set({ years: Number(e.target.value) })} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            {[5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <NumberInput caption="Yearly sales growth (%)" value={a.revenueGrowthPct} onChange={(x) => set({ revenueGrowthPct: x })} />
        <NumberInput caption="Yearly cost increase (%)" value={a.costGrowthPct} onChange={(x) => set({ costGrowthPct: x })} />
        <NumberInput caption="Income tax rate (%)" value={a.taxPct} onChange={(x) => set({ taxPct: x })} />
        <NumberInput caption="Discount rate for NPV (%)" value={a.discountPct} onChange={(x) => set({ discountPct: x })} />
        <NumberInput caption="Building depreciation (%)" value={a.buildingDepPct} onChange={(x) => set({ buildingDepPct: x })} />
        <NumberInput caption="Machinery depreciation (%)" value={a.machineryDepPct} onChange={(x) => set({ machineryDepPct: x })} />
        <NumberInput caption="Furniture depreciation (%)" value={a.furnitureDepPct} onChange={(x) => set({ furnitureDepPct: x })} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-finance-summary>
        {[
          ['Project IRR', pct(v.projectIrr)],
          ['Equity IRR', pct(v.equityIrr)],
          [`${tf('NPV at')} ${v.discountPct}%`, `₹${v.npv} ${tf('lakh')}`],
          ['Payback', v.payback === null ? '—' : `${v.payback} ${tf('years')}`],
          ['Average DSCR', model.dscr.average === null ? '—' : String(model.dscr.average)],
          ['Break-even', model.breakEven.percentOfRevenue === null ? '—' : `${model.breakEven.percentOfRevenue}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-muted/40 p-2">
            <div className="text-xs text-muted-foreground">{tf(label)}</div>
            <div className="text-sm font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <Statement heading="Profit and loss" years={model.years.slice(1)} rows={FINANCE_ROWS.pl} open />
      <Statement heading="Cash flow statement" years={model.years} rows={FINANCE_ROWS.cf} />
      <Statement heading="Balance sheet" years={model.years} rows={FINANCE_ROWS.bs} />
      <Statement
        heading="Debt service"
        years={model.years.slice(1)}
        rows={[
          { label: 'Loan repaid in the year', get: (r) => r.principal },
          { label: 'Loan still to repay', get: (r) => r.termLoanClosing },
          { label: 'DSCR', get: (r) => (r.dscr === null ? '—' : r.dscr.toFixed(2)), strong: true },
        ]}
      />
      <p className="text-xs text-muted-foreground" data-catalog={catalog}>
        {tf('Formulas')}: v{CATALOG_VERSION} ·{' '}
        {catalog === 'ok' ? tf('checked against the locked catalog (SHA-256)') : catalog === 'checking' ? tf('checking…') : tf('differs from the locked catalog')}
      </p>
    </section>
  );
};

/** Compact version for the document: key lines by year and the headline measures. */
export const FinanceDocSummary: React.FC<{ data: AnyData; showEmpty?: boolean }> = ({ data, showEmpty = false }) => {
  const tf = useClusterFormText();
  const model = useMemo(() => buildModel(data), [data]);
  if (composeProjectCost(data).total <= 0 && !showEmpty) return null;
  const years = model.years.slice(1);
  const rows: { label: string; get: (r: YearRow) => string }[] = [
    { label: 'Revenue', get: (r) => formatCL(r.revenue) },
    { label: 'EBITDA', get: (r) => formatCL(r.ebitda) },
    { label: 'Profit after tax (PAT)', get: (r) => formatCL(r.pat) },
    { label: 'Closing cash', get: (r) => formatCL(r.closingCash) },
    { label: 'DSCR', get: (r) => (r.dscr === null ? '—' : r.dscr.toFixed(2)) },
  ];
  const v = model.valuation;
  return (
    <>
      <table className="individual-particulars" data-finance-doc>
        <caption className="individual-qa-q">{tf('Projected results (₹ Lakhs)')}</caption>
        <thead>
          <tr>
            <th>{tf('Particular')}</th>
            {years.map((r) => <th key={r.year}>{`${tf('Year')} ${r.year}`}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="part">{tf(row.label)}</td>
              {years.map((r) => <td key={r.year}>{row.get(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <table className="individual-particulars">
        <caption className="individual-qa-q">{tf('Returns and ratios')}</caption>
        <thead>
          <tr><th>{tf('Particular')}</th><th>{tf('Details')}</th></tr>
        </thead>
        <tbody>
          {[
            ['Project IRR', pct(v.projectIrr)],
            ['Equity IRR', pct(v.equityIrr)],
            [`${tf('NPV at')} ${v.discountPct}%`, `${v.npv}`],
            ['Payback', v.payback === null ? '—' : `${v.payback} ${tf('years')}`],
            ['Average DSCR', model.dscr.average === null ? '—' : String(model.dscr.average)],
            ['Break-even', model.breakEven.percentOfRevenue === null ? '—' : `${model.breakEven.percentOfRevenue}%`],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="part">{tf(label)}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
