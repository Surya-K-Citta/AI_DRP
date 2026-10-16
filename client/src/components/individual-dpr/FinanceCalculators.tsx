import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { breakEvenPercent, fundingSplit, loanCover, workingCapitalNeed } from '@/lib/individualDpr/financeCalc';
import { projectCost } from '@/lib/individualDpr/dataChecks';

type AnyData = Record<string, any>;
type Apply = (step: number, patch: Record<string, number>) => void;
type Which = 'wc' | 'split' | 'loan' | 'breakeven';

const num = (v: unknown): number => {
  const x = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(x) ? x : 0;
};
const show = (x: number) => String(Math.round(x * 100) / 100);

function yearlyFigures(data: AnyData) {
  const s14 = data.step14 || {};
  const changing = num(s14.rawMaterialCost) + num(s14.powerCost);
  const fixed = num(s14.wages) + num(s14.maintenance) + num(s14.administrativeExpenses) + num(s14.marketingExpenses);
  return { sales: num(s14.annualSalesRealization), changing, fixed, running: changing + fixed };
}

const CALCS: Record<number, { which: Which; label: string }[]> = {
  12: [{ which: 'wc', label: 'Work out working capital' }],
  13: [
    { which: 'split', label: 'Split the funding' },
    { which: 'loan', label: 'Loan instalment and DSCR' },
  ],
  15: [{ which: 'breakeven', label: 'Work out break-even' }],
};

/** Buttons that open the calculators relevant to this step. Each one can write its answer back into the form. */
export const FinanceCalcStrip: React.FC<{ contentStep: number; data: AnyData; onApply: Apply }> = ({ contentStep, data, onApply }) => {
  const tf = useClusterFormText();
  const [open, setOpen] = useState<Which | null>(null);
  const calcs = CALCS[contentStep];
  if (!calcs) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" data-finance-calcs>
      <span className="text-sm text-muted-foreground">{tf('Not sure what to enter?')}</span>
      {calcs.map((c) => (
        <Button key={c.which} type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(c.which)}>
          <Calculator className="h-4 w-4" aria-hidden />
          {tf(c.label)}
        </Button>
      ))}
      {open ? <CalcModal which={open} data={data} onApply={onApply} onClose={() => setOpen(null)} /> : null}
    </div>
  );
};

const Field: React.FC<{ caption: string; value: string; onChange: (v: string) => void; hint?: string }> = ({ caption, value, onChange, hint }) => {
  const tf = useClusterFormText();
  return (
    <label className="block text-sm">
      <span className="font-medium">{tf(caption)}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-[10px] border border-input bg-background px-3 text-sm"
      />
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{tf(hint)}</span> : null}
    </label>
  );
};

const CalcModal: React.FC<{ which: Which; data: AnyData; onApply: Apply; onClose: () => void }> = ({ which, data, onApply, onClose }) => {
  const tf = useClusterFormText();
  const y = yearlyFigures(data);
  const s13 = data.step13 || {};
  const cost = projectCost(data);
  const [a, setA] = useState(() => {
    if (which === 'wc') return '3';
    if (which === 'split') return '10';
    if (which === 'loan') return show(num(s13.bankLoan));
    return show(y.sales);
  });
  const [b, setB] = useState(() => (which === 'split' ? '0' : which === 'loan' ? show(num(s13.interestRate) || 11) : show(y.changing)));
  const [c, setC] = useState(() => (which === 'loan' ? show(num(s13.loanTenureMonths) / 12 || 5) : show(y.fixed)));
  const [d, setD] = useState(() => show(Math.max(0, y.sales - y.running)));
  const fill = (template: string, vars: Record<string, string>) => Object.entries(vars).reduce((t, [k, v]) => t.split(`{${k}}`).join(v), tf(template));

  let title = '';
  let meaning = '';
  let body: React.ReactNode = null;
  let result: React.ReactNode = null;
  let apply: (() => void) | null = null;

  if (which === 'wc') {
    title = 'Working capital';
    meaning = 'Working capital is the money you need for day-to-day running (raw material, wages, rent) until customers pay you. A common way to estimate it is a few months of running costs.';
    const need = workingCapitalNeed(y.running, num(a));
    body = (
      <>
        <p className="text-sm text-muted-foreground">
          {fill('Your yearly running costs from the cost and sales step: ₹{x} lakh.', { x: show(y.running) })}
        </p>
        <Field caption="How many months of running costs do you need to keep ready?" value={a} onChange={setA} hint="Many small units keep 2 to 4 months. Ask your bank." />
      </>
    );
    result = <p className="text-lg font-semibold">{fill('About ₹{x} lakh', { x: show(need) })}</p>;
    apply = () => onApply(12, { workingCapitalMargin: need });
  }

  if (which === 'split') {
    title = 'Split the funding';
    meaning = 'Your project cost is paid for by your own money, any government subsidy, and a bank loan for the rest. Enter the shares your scheme asks for and we work out the loan.';
    const split = fundingSplit(cost, num(a), num(b));
    body = (
      <>
        <p className="text-sm text-muted-foreground">{fill('Project cost from the cost step: ₹{x} lakh.', { x: show(cost) })}</p>
        <Field caption="Your own money (% of project cost)" value={a} onChange={setA} hint="Most schemes ask for 5% to 10%. Check your scheme rules." />
        <Field caption="Government subsidy (% of project cost)" value={b} onChange={setB} hint="Type 0 if there is none. Use the rate in your scheme rules." />
      </>
    );
    result = split.overfunded ? (
      <p className="text-sm font-medium text-red-700">{tf('Your own money and subsidy add up to more than the project cost.')}</p>
    ) : (
      <p className="text-sm">
        {fill('Own money ₹{o} lakh, subsidy ₹{g} lakh, bank loan ₹{l} lakh.', { o: show(split.own), g: show(split.grant), l: show(split.loan) })}
      </p>
    );
    apply = cost > 0 && !split.overfunded ? () => onApply(13, { spvContribution: split.own, governmentGrant: split.grant, bankLoan: split.loan }) : null;
  }

  if (which === 'loan') {
    title = 'Loan instalment and DSCR';
    meaning = 'The instalment is what you pay the bank every month. DSCR shows whether your yearly profit is enough to pay those instalments. Banks usually look for 1.5 or more.';
    const cover = loanCover({ loan: num(a), ratePct: num(b), months: num(c) * 12, yearlyAvailable: num(d) });
    const verdictText: Record<string, string> = {
      comfortable: 'Comfortable: your profit pays the instalments with room to spare.',
      tight: 'Tight: the instalments are covered, but with little room. Banks usually want 1.5 or more.',
      short: 'Not enough: your yearly profit does not cover the instalments. Try a smaller loan or a longer period.',
      unknown: 'Enter the loan amount to see the result.',
    };
    body = (
      <>
        <Field caption="Bank loan (₹ Lakhs)" value={a} onChange={setA} />
        <Field caption="Interest rate (% per year)" value={b} onChange={setB} hint="Ask your bank. Small-business loans are usually 8% to 14%." />
        <Field caption="Repayment period (years)" value={c} onChange={setC} />
        <Field caption="Money left each year to pay the loan (₹ Lakhs)" value={d} onChange={setD} hint="Yearly sales minus running costs, before the loan payments. Taken from your cost and sales step when filled in." />
      </>
    );
    result = (
      <div className="space-y-1 text-sm">
        <p>{fill('Monthly instalment: ₹{x} lakh. Yearly: ₹{y} lakh.', { x: show(cover.emi), y: show(cover.yearlyPayment) })}</p>
        <p className="font-semibold">{fill('DSCR: {x}', { x: cover.verdict === 'unknown' ? '–' : show(cover.dscr) })}</p>
        <p className={cover.verdict === 'short' ? 'text-red-700' : cover.verdict === 'tight' ? 'text-amber-700' : 'text-emerald-700'}>{tf(verdictText[cover.verdict])}</p>
      </div>
    );
    apply = () => onApply(13, { interestRate: num(b), loanTenureMonths: Math.round(num(c) * 12) });
  }

  if (which === 'breakeven') {
    title = 'Break-even point';
    meaning = 'Break-even is the level of production where your sales exactly cover your costs. Below it you lose money, above it you earn a profit. It is shown as a share of your full capacity.';
    const pct = breakEvenPercent({ sales: num(a), changingCosts: num(b), fixedCosts: num(c) });
    body = (
      <>
        <Field caption="Yearly sales at full capacity (₹ Lakhs)" value={a} onChange={setA} />
        <Field caption="Costs that rise and fall with production (₹ Lakhs a year)" value={b} onChange={setB} hint="Raw material, packing, power for the machines." />
        <Field caption="Costs that stay the same (₹ Lakhs a year)" value={c} onChange={setC} hint="Wages, rent, maintenance, office and marketing costs, loan interest." />
      </>
    );
    result =
      pct === null ? (
        <p className="text-sm font-medium text-red-700">{tf('Sales do not cover even the costs that change with production, so there is no break-even. Check the amounts.')}</p>
      ) : (
        <p className="text-lg font-semibold">{fill('Break-even at about {x}% of capacity', { x: show(pct) })}</p>
      );
    apply = pct !== null ? () => onApply(15, { breakEvenPoint: pct }) : null;
  }

  return (
    <div className="motion-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="calc-title">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-xl border border-border bg-background shadow-xl" data-calc={which}>
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 id="calc-title" className="text-lg font-semibold">{tf(title)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tf(meaning)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={tf('Close')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto p-4">{body}</div>
        <div className="space-y-3 border-t p-4">
          <div className="rounded-md bg-muted/50 p-3">{result}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{tf('Close')}</Button>
            {apply ? (
              <Button
                variant="primary"
                onClick={() => {
                  apply?.();
                  onClose();
                }}
              >
                {tf('Use these values')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
