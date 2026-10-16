import { FieldPrompt } from '@/components/ui/FieldPrompt';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { cmepProjectionColumns } from '@/lib/individualDpr/cmepProjections';
import {
  normalizeProductMix,
  normalizeRawMaterials,
  normalizeRisks,
  normalizeStaffRoles,
  normalizeUtilisationYears,
  workingCapitalFromBuildup,
  type ProductMixRow,
  type RawMaterialRow,
  type RiskRow,
  type StaffRoleRow,
} from '@/lib/individualDpr/cmepBankPack';

const roomyInput = 'h-12 px-4 text-base';

function RowList<T>({
  title,
  rows,
  onChange,
  blank,
  render,
  addLabel,
  roomy = false,
}: {
  title: string;
  rows: T[];
  onChange: (next: T[]) => void;
  blank: T;
  render: (row: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  addLabel: string;
  roomy?: boolean;
}) {
  const tf = useClusterFormText();
  return (
    <div className="space-y-2 border rounded-md p-4">
      <h4 className="font-semibold">{tf(title)}</h4>
      {rows.map((row, index) => (
        <div key={index} className="relative rounded-md border p-3">
          <button
            type="button"
            aria-label={tf('Remove')}
            className={
              roomy
                ? 'absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'
                : 'absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'
            }
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className={roomy ? 'h-3 w-3' : 'h-4 w-4'} />
          </button>
          <div className={roomy ? 'grid grid-cols-1 gap-3 pr-6' : 'grid grid-cols-1 gap-3 pr-8'}>
            {render(row, index, (patch) => onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item))))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onChange([...rows, blank])}>
        <Plus className="h-4 w-4" />
        {tf(addLabel)}
      </Button>
    </div>
  );
}

export function ProductMixEditor({ value, onChange }: { value: unknown; onChange: (next: ProductMixRow[]) => void }) {
  const tf = useClusterFormText();
  const rows = normalizeProductMix(value);
  const shown = rows.length ? rows : [{ name: '', sharePercent: 0, sellingPrice: 0 }];
  const write = (next: ProductMixRow[]) => onChange(next);
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{tf('Products, share of output and selling price')}</h4>
      {shown.map((row, index) => (
        <div key={index} className="relative rounded-md border p-3">
          <button
            type="button"
            aria-label={tf('Remove')}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => write(shown.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-1 gap-3 pr-8">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Product Name" /></label>
              <Input
                value={row.name}
                placeholder={tf('Enter Product Name')}
                onChange={(e) => write(shown.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Share of Output (%)" /></label>
              <Input
                type="number"
                value={row.sharePercent || ''}
                placeholder={tf('Enter Percentage Share')}
                onChange={(e) => write(shown.map((item, i) => (i === index ? { ...item, sharePercent: parseFloat(e.target.value) || 0 } : item)))}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium"><FieldPrompt label="Selling Price (per unit)" /></label>
              <Input
                type="number"
                value={row.sellingPrice || ''}
                placeholder={tf('Enter Selling Price')}
                onChange={(e) => write(shown.map((item, i) => (i === index ? { ...item, sellingPrice: parseFloat(e.target.value) || 0 } : item)))}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => write([...shown, { name: '', sharePercent: 0, sellingPrice: 0 }])}
      >
        <Plus className="h-4 w-4" />
        {tf('Add product')}
      </Button>
    </div>
  );
}

export function RawMaterialEditor({ value, onChange }: { value: unknown; onChange: (next: RawMaterialRow[]) => void }) {
  const tf = useClusterFormText();
  const rows = normalizeRawMaterials(value);
  return (
    <RowList
      title={tf('Raw materials')}
      rows={rows}
      onChange={onChange}
      blank={{ name: '', use: '', basis: '' }}
      addLabel="Add raw material"
      roomy
      render={(row, _index, update) => (
        <>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Material" /></label>
            <Input className={roomyInput} value={row.name} placeholder={tf('Material')} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Use" /></label>
            <Input className={roomyInput} value={row.use} placeholder={tf('Use')} onChange={(e) => update({ use: e.target.value })} />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="How it is bought" /></label>
            <Input className={roomyInput} value={row.basis} placeholder={tf('How it is bought')} onChange={(e) => update({ basis: e.target.value })} />
          </div>
        </>
      )}
    />
  );
}

export function StaffRoleEditor({ value, onChange }: { value: unknown; onChange: (next: StaffRoleRow[]) => void }) {
  const tf = useClusterFormText();
  const rows = normalizeStaffRoles(value);
  return (
    <RowList
      title={tf('Staff by role and monthly pay')}
      rows={rows}
      onChange={onChange}
      blank={{ role: '', count: 0, monthlyPay: 0 }}
      addLabel="Add role"
      roomy
      render={(row, _index, update) => (
        <>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Role" /></label>
            <Input className={roomyInput} value={row.role} placeholder={tf('Role')} onChange={(e) => update({ role: e.target.value })} />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Number of people" /></label>
            <Input className={roomyInput} type="number" value={row.count || ''} placeholder={tf('Number of people')} onChange={(e) => update({ count: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Monthly pay (₹)" /></label>
            <Input className={roomyInput} type="number" value={row.monthlyPay || ''} placeholder={tf('Monthly pay (₹)')} onChange={(e) => update({ monthlyPay: parseFloat(e.target.value) || 0 })} />
          </div>
        </>
      )}
    />
  );
}

export function RiskEditor({ value, onChange }: { value: unknown; onChange: (next: RiskRow[]) => void }) {
  const tf = useClusterFormText();
  const rows = normalizeRisks(value);
  return (
    <RowList
      title={tf('Risks and how they will be handled')}
      rows={rows}
      onChange={onChange}
      blank={{ risk: '', mitigation: '' }}
      addLabel="Add risk"
      render={(row, _index, update) => (
        <>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="Risk" /></label>
            <Input value={row.risk} placeholder={tf('Risk')} onChange={(e) => update({ risk: e.target.value })} />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label className="block text-sm font-medium mb-2"><FieldPrompt label="How it will be handled" /></label>
            <Input value={row.mitigation} placeholder={tf('How it will be handled')} onChange={(e) => update({ mitigation: e.target.value })} />
          </div>
        </>
      )}
    />
  );
}

export function UtilisationYearEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: Array<{ label: string; percent: number }>) => void;
}) {
  const tf = useClusterFormText();
  const saved = normalizeUtilisationYears(value);
  const projected = cmepProjectionColumns().filter((col) => col.period === 'projected');
  const rows = projected.map((col) => ({
    label: col.label,
    percent: saved.find((row) => row.label === col.label)?.percent || 0,
  }));
  return (
    <div className="space-y-2 border rounded-md p-4">
      <h4 className="font-semibold">{tf('Capacity utilisation by projected year')}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <label className="block text-xs font-medium mb-1">{row.label}</label>
            <Input
              type="number"
              value={row.percent || ''}
              placeholder="%"
              onChange={(e) =>
                onChange(rows.map((item) => (item.label === row.label ? { ...item, percent: parseFloat(e.target.value) || 0 } : item)))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const WC_FIELDS: Array<[string, string]> = [
  ['wcRawStock', 'Raw material stock (₹ Lakhs)'],
  ['wcWip', 'Work in progress (₹ Lakhs)'],
  ['wcFinished', 'Finished goods (₹ Lakhs)'],
  ['wcReceivables', 'Receivables (₹ Lakhs)'],
  ['wcSupplierCredit', 'Supplier credit (₹ Lakhs)'],
  ['wcCash', 'Cash (₹ Lakhs)'],
];

export function WorkingCapitalBuildupEditor({
  step,
  onChange,
}: {
  step: Record<string, unknown>;
  onChange: (patch: Record<string, number>) => void;
}) {
  const tf = useClusterFormText();
  const edit = (field: string, value: number) => {
    const next = { ...step, [field]: value };
    onChange({ [field]: value, workingCapitalMargin: workingCapitalFromBuildup(next) });
  };
  return (
    <div className="form-field-grid border rounded-md p-4">
      <h4 className="md:col-span-2 font-semibold">{tf('Working capital buildup')}</h4>
      <p className="md:col-span-2 text-sm text-muted-foreground">
        {tf('Stock, work in progress, finished goods, receivables and cash, less supplier credit.')}
      </p>
      {WC_FIELDS.map(([field, label]) => (
        <div key={field}>
          <label className="block text-sm font-medium mb-2"><FieldPrompt label={label} /></label>
          <Input type="number" value={(step[field] as number) || ''} onChange={(e) => edit(field, parseFloat(e.target.value) || 0)} />
        </div>
      ))}
    </div>
  );
}
