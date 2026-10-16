import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
  ASSET_CATEGORIES,
  assetTotalLakhs,
  detectKind,
  normalizeAssetItems,
  type AssetItem,
  type BusinessKind,
} from '@/lib/individualDpr/businessKind';

type AnyData = Record<string, any>;

const KIND_OPTIONS: { id: BusinessKind; label: string }[] = [
  { id: 'manufacturing', label: 'Making things' },
  { id: 'service', label: 'A service' },
  { id: 'trading', label: 'Buying and selling' },
];

/** Lets the person confirm or change the kind of business, which decides which cost tables the form shows. */
export const BusinessKindPicker: React.FC<{ data: AnyData; onChange: (kind: BusinessKind) => void }> = ({ data, onChange }) => {
  const tf = useClusterFormText();
  const { kind, source } = detectKind(data);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3" data-kind-picker>
      <label className="block text-sm font-medium">
        {tf('What kind of business is this?')}
        <select
          value={kind}
          onChange={(event) => onChange(event.target.value as BusinessKind)}
          className="mt-1 h-10 w-full rounded-[10px] border border-input bg-background px-3 text-sm sm:w-72"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {tf(option.label)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        {tf(
          kind === 'manufacturing'
            ? 'You make or process something, so we ask for plant and machinery.'
            : kind === 'service'
              ? 'You do work for customers, so we ask for the equipment and other assets you need instead of machinery.'
              : 'You buy goods and resell them, so we ask for shop fittings and other assets instead of machinery.'
        )}
        {source === 'default' ? ` ${tf('Change it if this is not right.')}` : ''}
      </p>
    </div>
  );
};

/** The assets a service or trading business needs: equipment, furniture, a vehicle, computers. The total feeds the cost. */
export const AssetListEditor: React.FC<{ value: unknown; onChange: (items: AssetItem[], total: number) => void; collapsedWhenEmpty?: boolean }> = ({
  value,
  onChange,
  collapsedWhenEmpty = false,
}) => {
  const tf = useClusterFormText();
  const rows = normalizeAssetItems(value);
  const [open, setOpen] = useState(!collapsedWhenEmpty || rows.length > 0);
  const commit = (next: AssetItem[]) => onChange(next, assetTotalLakhs(next));
  const update = (index: number, patch: Partial<AssetItem>) => commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        {tf('Add a list of your assets (optional)')}
      </Button>
    );
  }
  return (
    <div className="space-y-2" data-asset-list>
      <h4 className="font-semibold">{tf('Assets list')}</h4>
      <p className="text-xs text-muted-foreground">{tf('List what you need to start: equipment, furniture, a vehicle, computers and software. The total goes into the cost below.')}</p>
      {rows.map((row, index) => (
        <div key={index} className="relative rounded-md border p-3">
          <button
            type="button"
            aria-label={tf('Remove')}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => commit(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">{tf('Asset')}</span>
              <Input value={row.item} placeholder={tf('For example: Salon chair')} onChange={(e) => update(index, { item: e.target.value })} />
            </div>
            <div className="min-w-0">
              <span className="mb-1 block text-sm font-medium">{tf('Type')}</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={row.category}
                onChange={(e) => update(index, { category: e.target.value })}
              >
                {ASSET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {tf(category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <span className="mb-1 block text-sm font-medium">{tf('Qty')}</span>
                <Input type="number" min={1} value={row.quantity || ''} onChange={(e) => update(index, { quantity: parseFloat(e.target.value) || 1 })} />
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-sm font-medium">{tf('Unit cost (₹ Lakhs)')}</span>
                <Input type="number" min={0} value={row.unitCost || ''} onChange={(e) => update(index, { unitCost: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => commit([...rows, { item: '', category: 'Equipment & tools', quantity: 1, unitCost: 0 }])}>
          <Plus className="h-4 w-4" aria-hidden />
          {tf('Add asset')}
        </Button>
        <span className="text-sm font-medium">
          {tf('Total')}: ₹{assetTotalLakhs(rows)} {tf('lakh')}
        </span>
      </div>
    </div>
  );
};
