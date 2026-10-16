import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, Check, Info, ListOrdered, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { VentureMatchCompare } from '@/components/venture-match/VentureMatchCompare';
import { cn } from '@/lib/utils';
import type { SchemeMatch } from '@/lib/ventureMatch/types';
import {
  analyzeCombinations,
  type Loc,
  type PairView,
  type PlanItem,
  type Relation,
  type SchemeRole,
} from '@/lib/ventureMatch/combos';

type Lang = 'en' | 'te';

const ROLE_LABEL: Record<SchemeRole, Loc> = {
  margin: { en: 'Subsidy on project cost', te: 'ప్రాజెక్ట్ ఖర్చుపై సబ్సిడీ' },
  capital: { en: 'Capital subsidy', te: 'మూలధన సబ్సిడీ' },
  loan: { en: 'Loan', te: 'రుణం' },
  guarantee: { en: 'Guarantee', te: 'గ్యారంటీ' },
  land: { en: 'Land rebate', te: 'భూమి రాయితీ' },
  support: { en: 'Support', te: 'సహాయం' },
  cluster: { en: 'Cluster', te: 'క్లస్టర్' },
};

const TEXT = {
  title: { en: 'A suggested plan', te: 'సూచిత ప్రణాళిక' },
  intro: {
    en: 'Some schemes usually cannot be taken together, while others can be used as a set. This is one combination from your matches that is worth discussing with your DIC or bank.',
    te: 'కొన్ని పథకాలను సాధారణంగా కలిపి తీసుకోలేరు, మరికొన్నింటిని కలిపి ఉపయోగించవచ్చు. మీ సరిపోలికల్లో ఇది మీ DIC లేదా బ్యాంక్‌తో చర్చించదగిన ఒక కలయిక.',
  },
  lead: { en: 'Consider applying for these', te: 'వీటికి దరఖాస్తు చేయడాన్ని పరిశీలించండి' },
  addOn: { en: 'Add on top', te: 'వీటిని అదనంగా జోడించండి' },
  cluster: { en: 'Through a cluster', te: 'క్లస్టర్ ద్వారా' },
  order: { en: 'Do it in this order', te: 'ఈ క్రమంలో చేయండి' },
  leftOut: { en: 'Matched, but not in the plan', te: 'సరిపోయాయి, కానీ ప్రణాళికలో లేవు' },
  leftOutBecause: { en: 'Choose it instead of', te: 'దీనికి బదులు ఇది ఎంచుకోవచ్చు' },
  can: { en: 'Can be taken together', te: 'కలిపి తీసుకోవచ్చు' },
  cannot: { en: 'Cannot be taken together', te: 'కలిపి తీసుకోలేరు' },
  check: { en: 'Check before applying', te: 'దరఖాస్తుకు ముందు చూడండి' },
  confirm: { en: 'Confirm with DIC / bank', te: 'DIC / బ్యాంక్‌తో నిర్ధారించండి' },
  disclaimer: {
    en: 'This is guidance only. It does not guarantee or assure eligibility, approval, subsidy amount or timelines. It is based on published scheme guidelines and usual bank practice; tags marked “Confirm with DIC / bank” are standard practice, not written in the scheme documents. Rates and rules change, and the scheme authority or your bank decides.',
    te: 'ఇది కేవలం మార్గదర్శనం. అర్హత, ఆమోదం, సబ్సిడీ మొత్తం లేదా సమయం గురించి హామీ ఇవ్వదు. ప్రచురిత పథక మార్గదర్శకాలు మరియు సాధారణ బ్యాంక్ పద్ధతి ఆధారంగా; “DIC / బ్యాంక్‌తో నిర్ధారించండి” అని ఉన్నవి పథక పత్రాల్లో రాసి లేని సాధారణ పద్ధతులు. రేట్లు, నియమాలు మారుతాయి, నిర్ణయం పథక అధికారి లేదా మీ బ్యాంక్‌దే.',
  },
  noPlan: { en: 'No combinations to compare yet.', te: 'పోల్చడానికి కలయికలు లేవు.' },
  expand: { en: 'Expand', te: 'విస్తరించు' },
  shrink: { en: 'Close', te: 'మూసివేయి' },
} satisfies Record<string, Loc>;

const pick = (loc: Loc, lang: Lang) => (lang === 'te' ? loc.te : loc.en) || loc.en;

function ConfirmTag({ relation, lang }: { relation: Relation; lang: Lang }) {
  if (relation.source !== 'practice') return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      <Info className="h-3 w-3" />
      {pick(TEXT.confirm, lang)}
    </span>
  );
}

export const VentureMatchCombos: React.FC<{
  matches: SchemeMatch[];
  disableCreate?: boolean;
  onCreate?: (code: string) => void;
  tab?: 'suggested' | 'compare';
  onTab?: (tab: 'suggested' | 'compare') => void;
  /** Tells the page when the block is enlarged, so it can drop its own sticky positioning (a sticky parent would trap the overlay under the page header). */
  onExpandedChange?: (expanded: boolean) => void;
}> = ({ matches, disableCreate, onCreate, tab: tabProp, onTab, onExpandedChange }) => {
  const [localTab, setLocalTab] = useState<'suggested' | 'compare'>('suggested');
  const tab = tabProp ?? localTab;
  const setTab = (next: 'suggested' | 'compare') => (onTab ? onTab(next) : setLocalTab(next));
  // Expanded view: the same block, enlarged over the page. It is the same element (only its classes change),
  // so a comparison in progress is kept when you expand or shrink it.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previous;
    };
  }, [expanded]);
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('te') ? 'te' : 'en';
  const analysis = useMemo(() => analyzeCombinations(matches), [matches]);
  const name = (scheme: SchemeMatch) =>
    t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name });

  if (matches.length === 0) return null;

  const planItem = (item: PlanItem, index?: number) => (
    <li
      key={item.scheme.code}
      style={{ ['--vm-delay' as any]: `${350 + (index ?? 0) * 90}ms` }}
      className="vm-rise vm-lift rounded-[12px] border border-border bg-background px-3 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {index !== undefined && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index}
          </span>
        )}
        <span className="font-semibold text-foreground">{name(item.scheme)}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {pick(ROLE_LABEL[item.role], lang)}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{pick(item.why, lang)}</p>
      {item.checks.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            {pick(TEXT.check, lang)}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-amber-900">
            {Array.from(new Set(item.checks.map((note) => pick(note, lang)))).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );

  const pairRow = (pair: PairView, tone: 'good' | 'bad') => (
    <li key={`${pair.a.code}-${pair.b.code}`} className="flex items-start gap-2 text-sm">
      {tone === 'good' ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {name(pair.a)} <span className="text-muted-foreground">+</span> {name(pair.b)}
          <ConfirmTag relation={pair.relation} lang={lang} />
        </p>
        <p className="text-xs text-muted-foreground">{pick(pair.relation.note, lang)}</p>
      </div>
    </li>
  );

  const stepsOf = (pair: PairView) => {
    const firstIsA = pair.relation.first === pair.a.code;
    return { from: firstIsA ? pair.a : pair.b, to: firstIsA ? pair.b : pair.a };
  };

  return (
    <div
      className={expanded ? 'motion-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-8' : undefined}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      onClick={expanded ? () => setExpanded(false) : undefined}
    >
    <Card
      className={cn(
        'border-2 border-primary/30 bg-primary/5',
        expanded && 'max-h-full w-full max-w-6xl overflow-y-auto bg-background shadow-2xl'
      )}
      onClick={expanded ? (event: React.MouseEvent) => event.stopPropagation() : undefined}
    >
      <CardContent className={cn('space-y-5 pb-5 pt-5', expanded && 'sm:px-8')}>
        <div className="flex items-center gap-2">
        <div role="tablist" className="flex flex-1 gap-1 rounded-lg border border-border bg-background p-1">
          {(
            [
              ['suggested', { en: 'Suggested', te: 'సూచించినవి' }],
              ['compare', { en: 'Compare', te: 'పోల్చండి' }],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                tab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {pick(label, lang)}
            </button>
          ))}
        </div>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            aria-label={pick(expanded ? TEXT.shrink : TEXT.expand, lang)}
            title={pick(expanded ? TEXT.shrink : TEXT.expand, lang)}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{pick(expanded ? TEXT.shrink : TEXT.expand, lang)}</span>
          </button>
        </div>

        {tab === 'compare' ? (
          <VentureMatchCompare
            matches={matches}
            lang={lang}
            disableCreate={disableCreate}
            onCreate={(code) => onCreate?.(code)}
            expanded={expanded}
          />
        ) : (
          <div className={expanded ? 'space-y-5 lg:columns-2 lg:gap-8 lg:space-y-0 [&>*]:mb-5 [&>*]:break-inside-avoid' : 'space-y-5'}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{pick(TEXT.title, lang)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{pick(TEXT.intro, lang)}</p>
          </div>
        </div>

        {analysis.core.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{pick(TEXT.lead, lang)}</p>
            <ol className="space-y-2">{analysis.core.map((item, index) => planItem(item, index + 1))}</ol>
          </div>
        )}

        {analysis.addOns.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{pick(TEXT.addOn, lang)}</p>
            <ul className="space-y-2">{analysis.addOns.map((item) => planItem(item))}</ul>
          </div>
        )}

        {analysis.clusters.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{pick(TEXT.cluster, lang)}</p>
            <ul className="space-y-2">{analysis.clusters.map((item) => planItem(item))}</ul>
          </div>
        )}

        {analysis.sequence.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListOrdered className="h-4 w-4" />
              {pick(TEXT.order, lang)}
            </p>
            <ul className="space-y-2">
              {analysis.sequence.map((pair) => {
                const { from, to } = stepsOf(pair);
                return (
                  <li key={`${pair.a.code}-${pair.b.code}`} className="text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                      {name(from)} <ArrowRight className="h-4 w-4 text-primary" /> {name(to)}
                      <ConfirmTag relation={pair.relation} lang={lang} />
                    </p>
                    <p className="text-xs text-muted-foreground">{pick(pair.relation.note, lang)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {analysis.leftOut.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{pick(TEXT.leftOut, lang)}</p>
            <ul className="space-y-2">
              {analysis.leftOut.map((item) => (
                <li key={item.scheme.code} className={cn('rounded-[12px] border border-border bg-background px-3 py-2 text-sm')}>
                  <p className="font-medium text-foreground">
                    {name(item.scheme)}
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {pick(TEXT.leftOutBecause, lang)} {name(item.because)}
                    </span>
                    <ConfirmTag relation={item.relation} lang={lang} />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{pick(item.relation.note, lang)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(analysis.canCombine.length > 0 || analysis.cannotCombine.length > 0) && (
          <div className="grid gap-4 2xl:grid-cols-2">
            {analysis.canCombine.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-emerald-700">{pick(TEXT.can, lang)}</p>
                <ul className="space-y-3">{analysis.canCombine.map((pair) => pairRow(pair, 'good'))}</ul>
              </div>
            )}
            {analysis.cannotCombine.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-red-700">{pick(TEXT.cannot, lang)}</p>
                <ul className="space-y-3">{analysis.cannotCombine.map((pair) => pairRow(pair, 'bad'))}</ul>
              </div>
            )}
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {pick(TEXT.disclaimer, lang)}
        </p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};
