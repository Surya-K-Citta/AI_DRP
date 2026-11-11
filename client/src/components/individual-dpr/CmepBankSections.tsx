import { FieldPrompt } from '@/components/ui/FieldPrompt';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
  CMEP_COST_HEADS,
  deriveCmepBankSheets,
  normalizeCostPhasing,
  normalizeMachineryItems,
  normalizePromoters,
  totalsFromCostPhasing,
  type CmepCostCell,
  type CmepMachineryItem,
  type CmepPromoter,
} from '@/lib/individualDpr/cmepBankPack';

function money(value: number): string {
  if (!value) return '–';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function CmepPromotersEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: CmepPromoter[]) => void;
}) {
  const tf = useClusterFormText();
  const rows = normalizePromoters(value);
  const update = (index: number, key: keyof CmepPromoter, nextValue: string) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: nextValue } : row)));
  };
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{tf('Promoters')}</h4>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-3">
          <Input value={row.name} placeholder={tf('Name')} onChange={(e) => update(index, 'name', e.target.value)} />
          <Input value={row.relationName} placeholder={tf("Father's / husband's name")} onChange={(e) => update(index, 'relationName', e.target.value)} />
          <Input value={row.age} placeholder={tf('Age')} onChange={(e) => update(index, 'age', e.target.value)} />
          <Input value={row.dob} placeholder={tf('Date of birth')} onChange={(e) => update(index, 'dob', e.target.value)} />
          <Input value={row.education} placeholder={tf('Education')} onChange={(e) => update(index, 'education', e.target.value)} />
          <Input value={row.experienceYears} placeholder={tf('Experience (years)')} onChange={(e) => update(index, 'experienceYears', e.target.value)} />
          <Input value={row.phone} placeholder={tf('Phone')} onChange={(e) => update(index, 'phone', e.target.value)} />
          <Input value={row.address} placeholder={tf('Residential address')} onChange={(e) => update(index, 'address', e.target.value)} />
          {rows.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onChange([...rows, normalizePromoters(null)[0]])}>
        <Plus className="h-4 w-4" />
        {tf('Add promoter')}
      </Button>
    </div>
  );
}

export function CmepCostPhasingEditor({
  step,
  onChange,
}: {
  step: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const tf = useClusterFormText();
  const phasing = normalizeCostPhasing(step.costPhasing, step);
  const edit = (key: string, side: keyof CmepCostCell, value: number) => {
    const next = {
      ...phasing,
      [key]: { ...phasing[key], [side]: value },
    };
    onChange({ costPhasing: next, ...totalsFromCostPhasing(next) });
  };
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">{tf('Cost already incurred and still to be incurred')}</h4>
      <p className="text-sm text-muted-foreground">{tf('Amounts are ₹ Lakhs.')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">{tf('Particulars')}</th>
              <th className="p-2">{tf('Already incurred')}</th>
              <th className="p-2">{tf('To be incurred')}</th>
              <th className="p-2">{tf('Total')}</th>
            </tr>
          </thead>
          <tbody>
            {CMEP_COST_HEADS.map((head) => {
              const cell = phasing[head.key];
              return (
                <tr key={head.key}>
                  <td className="p-2">{tf(head.label)}</td>
                  <td className="p-2">
                    <Input type="number" value={cell.incurred || ''} onChange={(e) => edit(head.key, 'incurred', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-2">
                    <Input type="number" value={cell.proposed || ''} onChange={(e) => edit(head.key, 'proposed', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-2 text-center">{money(cell.incurred + cell.proposed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function blankMachine(): CmepMachineryItem {
  return {
    description: '',
    condition: 'new',
    supplier: '',
    quantity: 1,
    unitCost: 0,
    gst: 0,
    transport: 0,
    installation: 0,
    lifeYears: 0,
    annualMaintenance: 0,
  };
}

export function CmepMachineryEditor({
  value,
  onChange,
  detailed = false,
}: {
  value: unknown;
  onChange: (next: CmepMachineryItem[]) => void;
  detailed?: boolean;
}) {
  const tf = useClusterFormText();
  const rows = normalizeMachineryItems(value);
  const update = (index: number, patch: Partial<CmepMachineryItem>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">{tf('Machinery list')}</h4>
      {rows.map((row, index) => (
        <div key={index} className="relative rounded-md border p-3">
          <button
            type="button"
            aria-label={tf('Remove')}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-1 gap-3 pr-8">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Description" /></label>
              <Input value={row.description} placeholder={tf('Description')} onChange={(e) => update(index, { description: e.target.value })} />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Condition" /></label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={row.condition}
                onChange={(e) => update(index, { condition: e.target.value === 'used' ? 'used' : 'new' })}
              >
                <option value="new">{tf('New')}</option>
                <option value="used">{tf('Used')}</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Supplier" /></label>
              <Input value={row.supplier} placeholder={tf('Supplier')} onChange={(e) => update(index, { supplier: e.target.value })} />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Qty" /></label>
              <Input type="number" value={row.quantity || ''} placeholder={tf('Qty')} onChange={(e) => update(index, { quantity: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Unit cost (₹ Lakhs)" /></label>
              <Input type="number" value={row.unitCost || ''} placeholder={tf('Unit cost (₹ Lakhs)')} onChange={(e) => update(index, { unitCost: parseFloat(e.target.value) || 0 })} />
            </div>
            {detailed && (
              <>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium"><FieldPrompt label="GST (₹ Lakhs)" /></label>
                  <Input type="number" value={row.gst || ''} placeholder={tf('GST (₹ Lakhs)')} onChange={(e) => update(index, { gst: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Transport (₹ Lakhs)" /></label>
                  <Input type="number" value={row.transport || ''} placeholder={tf('Transport (₹ Lakhs)')} onChange={(e) => update(index, { transport: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Installation (₹ Lakhs)" /></label>
                  <Input type="number" value={row.installation || ''} placeholder={tf('Installation (₹ Lakhs)')} onChange={(e) => update(index, { installation: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Expected life (years)" /></label>
                  <Input type="number" value={row.lifeYears || ''} placeholder={tf('Expected life (years)')} onChange={(e) => update(index, { lifeYears: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Yearly maintenance (₹ Lakhs)" /></label>
                  <Input type="number" value={row.annualMaintenance || ''} placeholder={tf('Yearly maintenance (₹ Lakhs)')} onChange={(e) => update(index, { annualMaintenance: parseFloat(e.target.value) || 0 })} />
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => onChange([...rows, blankMachine()])}
      >
        <Plus className="h-4 w-4" />
        {tf('Add machinery')}
      </Button>
    </div>
  );
}

export function CmepLoanTermsEditor({
  step,
  onChange,
  includeSubsidy = true,
}: {
  step: Record<string, any>;
  onChange: (field: string, value: string | number) => void;
  includeSubsidy?: boolean;
}) {
  const tf = useClusterFormText();
  const numberField = (field: string, label: string) => (
    <div>
      <label className="block text-sm font-medium mb-2"><FieldPrompt label={label} /></label>
      <Input type="number" value={step[field] || ''} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} />
    </div>
  );
  return (
    <div className="form-field-grid border rounded-md p-4">
      <h4 className="md:col-span-2 font-semibold">{tf(includeSubsidy ? 'Term loan and subsidy terms' : 'Term loan terms')}</h4>
      {includeSubsidy && numberField('cashCreditLimit', 'Cash credit / working capital limit (₹ Lakhs)')}
      <div>
        <label className="block text-sm font-medium mb-2"><FieldPrompt label="Bank name" /></label>
        <Input value={step.bankName || ''} onChange={(e) => onChange('bankName', e.target.value)} />
      </div>
      {numberField('interestRate', 'Interest rate (% per year)')}
      {numberField('moratoriumMonths', 'Moratorium (months)')}
      {numberField('loanTenureMonths', 'Loan tenure (months)')}
      {includeSubsidy && numberField('subsidyPercent', 'Subsidy rate (%)')}
    </div>
  );
}

export function CmepAssumptionsEditor({
  step,
  onChange,
}: {
  step: Record<string, any>;
  onChange: (field: string, value: number) => void;
}) {
  const tf = useClusterFormText();
  const fields: Array<[string, string]> = [
    ['capacityPerDay', 'Installed capacity per day'],
    ['workingDays', 'Working days in a year'],
    ['capacityUtilisation', 'Capacity utilisation (%)'],
    ['sellingPricePerUnit', 'Selling price per unit (₹)'],
    ['monthlyRent', 'Rent per month (₹)'],
    ['monthlySalaries', 'Salaries per month (₹)'],
    ['monthlyPower', 'Power per month (₹)'],
    ['annualExpenseGrowth', 'Annual expense increase (%)'],
  ];
  return (
    <div className="form-field-grid border rounded-md p-4">
      <h4 className="md:col-span-2 font-semibold">{tf('Projection assumptions')}</h4>
      {fields.map(([field, label]) => (
        <div key={field}>
          <label className="block text-sm font-medium mb-2"><FieldPrompt label={label} /></label>
          <Input type="number" value={step[field] || ''} onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)} />
        </div>
      ))}
    </div>
  );
}

export function CmepDerivedSheets({
  step12,
  step13,
  step15,
}: {
  step12?: Record<string, unknown> | null;
  step13?: Record<string, unknown> | null;
  step15?: Record<string, unknown> | null;
}) {
  const tf = useClusterFormText();
  const derived = deriveCmepBankSheets({ step12, step13, step15 });
  return (
    <div className="space-y-4">
      <div className="border rounded-md p-3 text-sm space-y-1">
        <h4 className="font-semibold">{tf('Repayment summary')}</h4>
        <p>{tf('Term loan (₹ Lakhs)')}: {money(derived.repayment.amount)}</p>
        <p>{tf('Interest rate (% per year)')}: {money(derived.repayment.rate)}</p>
        <p>{tf('Moratorium (months)')}: {derived.repayment.moratoriumMonths || '–'}</p>
        <p>{tf('Loan tenure (months)')}: {derived.repayment.tenureMonths || '–'}</p>
        <p>{tf('Indicative EMI (₹ Lakhs)')}: {money(derived.repayment.emi)}</p>
      </div>
      <div className="border rounded-md p-3 text-sm space-y-1">
        <h4 className="font-semibold">{tf('Break-even')}</h4>
        <p>{tf('Break-even sales (₹ Lakhs)')}: {money(derived.breakEvenSales)}</p>
        <p>{tf('Break-even capacity (%)')}: {money(derived.breakEvenCapacity)}</p>
        <p>{tf('Average DSCR')}: {money(derived.averageDscr)}</p>
      </div>
      {derived.depreciation.map((asset) => (
        <div key={asset.asset} className="overflow-x-auto">
          <h4 className="font-semibold mb-1">{tf(asset.asset)} — {tf('Depreciation')} {Math.round(asset.rate * 100)}%</h4>
          <table className="w-full text-sm border min-w-[640px]">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">{tf('Particulars')}</th>
                {asset.years.map((year) => (
                  <th key={year.label} className="p-2">{year.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['opening', 'additions', 'depreciation', 'closing'] as const).map((key) => (
                <tr key={key}>
                  <td className="p-2">{tf(key === 'opening' ? 'Opening WDV' : key === 'additions' ? 'Additions' : key === 'depreciation' ? 'Depreciation for the year' : 'Closing WDV')}</td>
                  {asset.years.map((year) => (
                    <td key={year.label} className="p-2 text-center">{money(year[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
