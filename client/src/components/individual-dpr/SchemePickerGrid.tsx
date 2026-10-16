import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgePercent,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Landmark,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SCHEME_OPTIONS } from '@/lib/individualDpr/schemeFormConfig';
import {
  briefLangFromI18n,
  getSchemeBrief,
  loc,
} from '@/lib/individualDpr/schemeBriefs';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { cardMatchesFilters, schemeKind, schemeLevel, type SchemeKind, type SchemeLevel } from '@/lib/schemePickerFilters';
import { Input } from '@/components/ui/Input';
import { useFinderSuggestion } from '@/lib/ventureMatch/savedSuggestion';
import { Button } from '@/components/ui/Button';

interface SchemePickerGridProps {
  onSelect: (schemeCode: string | null) => void;
}

const LEVELS: Array<{ id: SchemeLevel; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'central', label: 'Central schemes', icon: Landmark },
  { id: 'state', label: 'Andhra Pradesh schemes', icon: MapPinned },
  { id: 'bank', label: 'Bank term loan', icon: Banknote },
];

const KINDS: Array<{ id: SchemeKind; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'subsidy', label: 'Subsidy', icon: BadgePercent },
  { id: 'loan', label: 'Loan', icon: Wallet },
  { id: 'guarantee', label: 'Guarantee', icon: ShieldCheck },
  { id: 'other', label: 'Other support', icon: Sparkles },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function MultiFilter<T extends string>({
  emptyLabel,
  options,
  selected,
  onToggle,
  labelOf,
}: {
  emptyLabel: string;
  options: Array<{ id: T; label: string; icon: React.ComponentType<{ className?: string }> }>;
  selected: T[];
  onToggle: (id: T) => void;
  labelOf: (label: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const summary = selected.length
    ? options.filter((item) => selected.includes(item.id)).map((item) => labelOf(item.label)).join(', ')
    : emptyLabel;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          selected.length
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background text-foreground hover:border-primary/30'
        }`}
      >
        <span className="min-w-0 truncate text-sm font-medium">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={emptyLabel}
          className="absolute z-30 mt-2 w-full min-w-[16rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {options.map((item) => {
            const on = selected.includes(item.id);
            const Icon = item.icon;
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={on}
                  onChange={() => onToggle(item.id)}
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    on ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-medium">{labelOf(item.label)}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export const SchemePickerGrid: React.FC<SchemePickerGridProps> = ({ onSelect }) => {
  const { t, i18n } = useTranslation();
  const tf = useClusterFormText();
  const lang = briefLangFromI18n(i18n.language);
  const [query, setQuery] = useState('');
  // Only people who finished Scheme Finder get suggestions; everyone else sees plain cards.
  const finder = useFinderSuggestion();
  const [levels, setLevels] = useState<SchemeLevel[]>([]);
  const [kinds, setKinds] = useState<SchemeKind[]>([]);

  const cards = useMemo(
    () =>
      SCHEME_OPTIONS.map((opt) => {
        const code = opt.code || null;
        const brief = getSchemeBrief(code);
        const categoryEn = brief.quickInfo.category.en;
        const typeEn = brief.quickInfo.type.en;
        const haystack = [
          brief.title.en,
          brief.title.te,
          brief.intro.en,
          brief.intro.te,
          brief.quickInfo.ministry.en,
          brief.quickInfo.ministry.te,
          categoryEn,
          brief.quickInfo.category.te,
          typeEn,
          brief.quickInfo.type.te,
          code || '',
        ]
          .join(' ')
          .toLowerCase();
        return {
          code,
          title: loc(brief.title, lang),
          intro: loc(brief.intro, lang),
          ministry: loc(brief.quickInfo.ministry, lang),
          category: loc(brief.quickInfo.category, lang),
          type: loc(brief.quickInfo.type, lang),
          isVanilla: !code,
          level: schemeLevel(typeEn),
          kind: schemeKind(categoryEn),
          haystack,
        };
      }),
    [lang]
  );

  const filtered = cards.filter((card) => cardMatchesFilters(card, levels, kinds, query));

  const filtersActive = query.trim() !== '' || levels.length > 0 || kinds.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {t('individualDpr.picker.title', { defaultValue: 'Choose how to draft this DPR' })}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('individualDpr.picker.subtitle', {
            defaultValue:
              'Pick a scheme to overlay subsidy rules and documents, or continue with a plain bank term loan.',
          })}
        </p>
      </div>

      <div className="mb-5 space-y-3">
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tf('Search by name, ministry, or support')}
              aria-label={tf('Search schemes')}
              className="h-12 pl-10"
            />
          </div>
          <MultiFilter
            emptyLabel={tf('All levels')}
            options={LEVELS}
            selected={levels}
            onToggle={(id) => setLevels((current) => toggleValue(current, id))}
            labelOf={tf}
          />
          <MultiFilter
            emptyLabel={tf('All kinds')}
            options={KINDS}
            selected={kinds}
            onToggle={(id) => setKinds((current) => toggleValue(current, id))}
            labelOf={tf}
          />
        </div>
          {filtersActive && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setQuery('');
                  setLevels([]);
                  setKinds([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {tf('Clear')}
              </Button>
            </div>
          )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} {tf('schemes')}
      </p>

      {finder && (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{tf('Tags come from your Scheme Finder answers. They are suggestions, not a promise.')}</span>
          <a href="/venture-match" className="font-medium text-primary underline-offset-2 hover:underline">
            {tf('Change my answers')}
          </a>
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {tf('No schemes match this search.')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((card) => (
            <button
              key={card.code || 'vanilla'}
              type="button"
              onClick={() => onSelect(card.code)}
              className="group text-left rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    card.isVanilla ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {card.isVanilla ? <Landmark className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
                {card.code && finder?.suggested.has(card.code) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {tf('Suggested for you')}
                  </span>
                ) : card.code && finder?.alsoMatches.has(card.code) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    {tf('May also suit you')}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 mt-1" />
                )}
              </div>

              <h3 className="mt-4 text-base font-semibold text-foreground leading-snug line-clamp-2">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-5 line-clamp-3">{card.intro}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {card.category}
                </span>
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {card.type}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground line-clamp-1">{card.ministry}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
