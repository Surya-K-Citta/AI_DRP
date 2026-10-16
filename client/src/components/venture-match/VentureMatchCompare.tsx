import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SchemeMatch } from '@/lib/ventureMatch/types';
import { relationBetween, roleOf, type Loc, type RelationType, type SchemeRole } from '@/lib/ventureMatch/combos';
import { keyFactsFor, type FactKind } from '@/lib/ventureMatch/schemeKeyFacts';
import { getSchemeBrief } from '@/lib/individualDpr/schemeBriefs';

type Lang = 'en' | 'te';
const pick = (loc: Loc, lang: Lang) => (lang === 'te' ? loc.te : loc.en) || loc.en;
const MAX_OTHERS = 3;

const ROLE_LABEL: Record<SchemeRole, Loc> = {
  margin: { en: 'Subsidy on project cost', te: 'ప్రాజెక్ట్ ఖర్చుపై సబ్సిడీ' },
  capital: { en: 'Capital subsidy', te: 'మూలధన సబ్సిడీ' },
  loan: { en: 'Loan', te: 'రుణం' },
  guarantee: { en: 'Guarantee cover', te: 'గ్యారెంటీ కవర్' },
  land: { en: 'Land rebate', te: 'భూమి రాయితీ' },
  support: { en: 'Support service', te: 'సహాయ సేవ' },
  cluster: { en: 'Cluster scheme', te: 'క్లస్టర్ పథకం' },
};

const TEXT = {
  heading: { en: 'Compare schemes', te: 'పథకాలను పోల్చండి' },
  intro: {
    en: 'Pick the scheme you are leaning towards, then add up to three to set beside it. Read across a row to see how they differ, then decide for yourself.',
    te: 'మీరు మొగ్గు చూపే పథకాన్ని ఎంచుకోండి, దానితో పోల్చడానికి గరిష్ఠంగా మూడు జోడించండి. వరుసల వెంట చదివి తేడాలు చూసి మీరే నిర్ణయించుకోండి.',
  },
  step1: { en: '1. Your scheme', te: '1. మీ పథకం' },
  step2: { en: '2. Compare it with', te: '2. దీనితో పోల్చండి' },
  limit: { en: 'Up to 3', te: 'గరిష్ఠం 3' },
  pickFirst: { en: 'Choose your scheme first.', te: 'ముందుగా మీ పథకాన్ని ఎంచుకోండి.' },
  pickMore: { en: 'Now tick at least one scheme to compare with.', te: 'ఇప్పుడు పోల్చడానికి కనీసం ఒక పథకాన్ని టిక్ చేయండి.' },
  noOthers: { en: 'There is no other matched scheme to compare with.', te: 'పోల్చడానికి ఇతర సరిపోయే పథకాలు లేవు.' },
  clear: { en: 'Start over', te: 'మళ్లీ మొదలుపెట్టండి' },
  yourPick: { en: 'Your scheme', te: 'మీ పథకం' },
  next: { en: 'Next step', te: 'తదుపరి అడుగు' },
  start: { en: 'Know more & create', te: 'మరింత తెలుసుకుని సృష్టించండి' },
  none: { en: 'No DPR to prepare', te: 'DPR తయారు చేయాల్సిన అవసరం లేదు' },
  note: {
    en: 'Amounts and rules are indicative and change. Confirm with the agency or your bank before you decide.',
    te: 'మొత్తాలు, నియమాలు సూచనప్రాయమైనవి, మారుతూ ఉంటాయి. నిర్ణయించే ముందు సంస్థ లేదా మీ బ్యాంక్‌తో నిర్ధారించుకోండి.',
  },
  fitLine: { en: 'checks match your answers', te: 'తనిఖీలు మీ సమాధానాలకు సరిపోతున్నాయి' },
  open: { en: 'still open', te: 'ఇంకా తేలలేదు' },
} satisfies Record<string, Loc>;

const ROWS: Record<string, Loc> = {
  type: { en: 'What kind of help', te: 'ఎలాంటి సహాయం' },
  level: { en: 'Run by', te: 'నిర్వహణ' },
  support: { en: 'What you may get', te: 'మీకు లభించవచ్చేది' },
  forYou: { en: 'For your answers', te: 'మీ సమాధానాలకు' },
  who: { en: 'Who can apply', te: 'ఎవరు దరఖాస్తు చేయవచ్చు' },
  bank: { en: 'Needs a bank loan?', te: 'బ్యాంకు రుణం అవసరమా?' },
  limits: { en: 'Limits to know', te: 'తెలుసుకోవాల్సిన పరిమితులు' },
  how: { en: 'How to apply', te: 'ఎలా దరఖాస్తు చేయాలి' },
  docs: { en: 'Documents to keep ready', te: 'సిద్ధంగా ఉంచాల్సిన పత్రాలు' },
  fit: { en: 'Fit with your answers', te: 'మీ సమాధానాలతో సరిపోలిక' },
  together: { en: 'Together with your scheme', te: 'మీ పథకంతో కలిపి' },
};

const BANK_LOAN: Record<SchemeRole, Loc> = {
  margin: { en: 'Yes. The subsidy is linked to a bank loan.', te: 'అవును. సబ్సిడీ బ్యాంకు రుణానికి అనుసంధానమై ఉంటుంది.' },
  capital: { en: 'Yes. Paid on an investment made with a bank loan.', te: 'అవును. బ్యాంకు రుణంతో చేసిన పెట్టుబడిపై చెల్లిస్తారు.' },
  loan: { en: 'Yes. The scheme is the loan.', te: 'అవును. పథకమే రుణం.' },
  guarantee: { en: 'Yes. It covers a bank loan.', te: 'అవును. ఇది బ్యాంకు రుణానికి కవర్.' },
  land: { en: 'No. It is about land cost in an APIIC park.', te: 'కాదు. ఇది APIIC పార్కులో భూమి ఖర్చుకు సంబంధించినది.' },
  support: { en: 'No. It is a service or support.', te: 'కాదు. ఇది సేవ లేదా సహాయం.' },
  cluster: { en: 'Not for one unit. It funds a group of units.', te: 'ఒక్క యూనిట్‌కు కాదు. యూనిట్ల సమూహానికి నిధులు ఇస్తుంది.' },
};

const TOGETHER: Record<RelationType | 'none', { label: Loc; tone: string }> = {
  stack: { label: { en: 'Can be taken together', te: 'కలిపి తీసుకోవచ్చు' }, tone: 'bg-emerald-100 text-emerald-800' },
  conditional: { label: { en: 'Possible with checks', te: 'తనిఖీలతో సాధ్యం' }, tone: 'bg-amber-100 text-amber-800' },
  exclusive: { label: { en: 'Cannot be taken together', te: 'కలిపి తీసుకోలేరు' }, tone: 'bg-red-100 text-red-800' },
  overlap: { label: { en: 'Overlaps, one is enough', te: 'ఒకదానితో ఒకటి కలుస్తాయి, ఒకటి చాలు' }, tone: 'bg-red-100 text-red-800' },
  sequence: { label: { en: 'One after the other', te: 'ఒకదాని తర్వాత మరొకటి' }, tone: 'bg-blue-100 text-blue-800' },
  none: { label: { en: 'No link between them', te: 'వీటి మధ్య సంబంధం లేదు' }, tone: 'bg-muted text-muted-foreground' },
};

const isStateScheme = (code: string) => code.startsWith('AP_') || code === 'OBMMS';

function factText(code: string, kind: FactKind, lang: Lang): string {
  const fact = keyFactsFor(code).find((item) => item.kind === kind);
  return fact ? pick(fact.text, lang) : '';
}

function briefFor(code: string) {
  const brief = getSchemeBrief(code);
  return brief.code === code ? brief : null;
}

export const VentureMatchCompare: React.FC<{
  matches: SchemeMatch[];
  lang: Lang;
  disableCreate?: boolean;
  onCreate: (code: string) => void;
  /** Enlarged view: wider columns and more room to read. */
  expanded?: boolean;
}> = ({ matches, lang, disableCreate, onCreate, expanded }) => {
  const { t } = useTranslation();
  const [first, setFirst] = useState<string | null>(null);
  const [others, setOthers] = useState<string[]>([]);

  const known = useMemo(() => new Set(matches.map((m) => m.code)), [matches]);
  useEffect(() => {
    if (first && !known.has(first)) setFirst(null);
    setOthers((current) => current.filter((code) => known.has(code) && code !== first));
  }, [known, first]);

  const name = (scheme: SchemeMatch) => t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name });
  const byCode = (code: string) => matches.find((m) => m.code === code)!;
  const columns = first ? [byCode(first), ...others.map(byCode)] : [];
  const choices = matches.filter((m) => m.code !== first);

  const toggleOther = (code: string) =>
    setOthers((current) =>
      current.includes(code)
        ? current.filter((c) => c !== code)
        : current.length >= MAX_OTHERS
          ? current
          : [...current, code]
    );

  const cell = (scheme: SchemeMatch, row: string): React.ReactNode => {
    const code = scheme.code;
    const brief = briefFor(code);
    const dash = <span className="text-muted-foreground">—</span>;
    switch (row) {
      case 'type':
        return pick(ROLE_LABEL[roleOf(code)], lang);
      case 'level':
        return lang === 'te'
          ? isStateScheme(code) ? 'రాష్ట్ర పథకం' : 'కేంద్ర పథకం'
          : isStateScheme(code) ? 'State scheme' : 'Central scheme';
      case 'support':
        return factText(code, 'support', lang) || dash;
      case 'forYou':
        return t(scheme.benefit);
      case 'who':
        return factText(code, 'who', lang) || dash;
      case 'bank':
        return pick(BANK_LOAN[roleOf(code)], lang);
      case 'limits':
        return factText(code, 'note', lang) || dash;
      case 'how': {
        const step = brief?.howToApply?.[0];
        return step ? pick(step, lang) : dash;
      }
      case 'docs': {
        const docs = brief?.documents?.slice(0, 4);
        return docs && docs.length ? (
          <ul className="list-disc space-y-0.5 pl-4">
            {docs.map((doc) => (
              <li key={doc.en}>{pick(doc, lang)}</li>
            ))}
          </ul>
        ) : (
          dash
        );
      }
      case 'fit': {
        const fit = scheme.fit;
        if (!fit) return dash;
        return (
          <span>
            <strong>{fit.passed}</strong> / {fit.total} {pick(TEXT.fitLine, lang)}
            {fit.open > 0 ? ` · ${fit.open} ${pick(TEXT.open, lang)}` : ''}
          </span>
        );
      }
      case 'together': {
        if (code === first) return dash;
        const relation = relationBetween(first as string, code);
        const view = TOGETHER[relation ? relation.type : 'none'];
        return (
          <div className="space-y-1">
            <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', view.tone)}>
              {pick(view.label, lang)}
            </span>
            {relation && <p className="text-xs text-muted-foreground">{pick(relation.note, lang)}</p>}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const rowOrder = ['type', 'level', 'support', 'forYou', 'who', 'bank', 'limits', 'fit', 'together', 'how', 'docs'];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">{pick(TEXT.heading, lang)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{pick(TEXT.intro, lang)}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">{pick(TEXT.step1, lang)}</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={pick(TEXT.step1, lang)}>
          {matches.map((scheme) => {
            const active = first === scheme.code;
            return (
              <button
                key={scheme.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setFirst(active ? null : scheme.code);
                  setOthers((current) => current.filter((c) => c !== scheme.code));
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-left text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                )}
              >
                {name(scheme)}
              </button>
            );
          })}
        </div>
      </div>

      {first && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            {pick(TEXT.step2, lang)}
            <span className="text-xs font-normal text-muted-foreground">({pick(TEXT.limit, lang)})</span>
          </p>
          {choices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{pick(TEXT.noOthers, lang)}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {choices.map((scheme) => {
                const active = others.includes(scheme.code);
                const full = !active && others.length >= MAX_OTHERS;
                return (
                  <button
                    key={scheme.code}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    disabled={full}
                    onClick={() => toggleOther(scheme.code)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm transition-colors disabled:opacity-40',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-sm border border-current opacity-50" />}
                    {name(scheme)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!first && <p className="text-sm text-muted-foreground">{pick(TEXT.pickFirst, lang)}</p>}
      {first && others.length === 0 && choices.length > 0 && (
        <p className="text-sm text-muted-foreground">{pick(TEXT.pickMore, lang)}</p>
      )}

      {first && others.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {lang === 'te' ? 'మరిన్ని పథకాలను చూడటానికి పట్టికను పక్కకు జరపండి.' : 'Slide the table sideways to see every scheme.'}
        </p>
      )}
      {first && others.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className={cn('w-full border-collapse text-left', expanded ? 'text-sm leading-6' : 'min-w-max text-[13px] leading-5')}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-24 min-w-[6rem] bg-muted px-2 py-3 align-bottom text-xs font-semibold uppercase tracking-wide text-muted-foreground" />
                {columns.map((scheme) => (
                  <th
                    key={scheme.code}
                    className={cn(expanded ? 'w-56 min-w-[14rem]' : 'w-44 min-w-[11rem]', 'px-2.5 py-3 align-bottom', scheme.code === first ? 'bg-primary/10' : 'bg-muted/60')}
                  >
                    {scheme.code === first && (
                      <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {pick(TEXT.yourPick, lang)}
                      </span>
                    )}
                    <span className="block text-sm font-semibold text-foreground">{name(scheme)}</span>
                    {scheme.code !== first && (
                      <button
                        type="button"
                        onClick={() => toggleOther(scheme.code)}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${name(scheme)}`}
                      >
                        <X className="h-3 w-3" />
                        {lang === 'te' ? 'తొలగించు' : 'Remove'}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowOrder.map((row) => (
                <tr key={row} className="border-t border-border align-top">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-muted px-2 py-3 text-xs font-semibold text-muted-foreground"
                  >
                    {pick(ROWS[row], lang)}
                  </th>
                  {columns.map((scheme) => (
                    <td
                      key={scheme.code}
                      className={cn('px-2.5 py-3 text-foreground/90', scheme.code === first && 'bg-primary/5')}
                    >
                      {cell(scheme, row)}
                    </td>
                  ))}
                </tr>
              ))}
              {!disableCreate && (
                <tr className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-muted px-2 py-3 text-xs font-semibold text-muted-foreground">
                    {pick(TEXT.next, lang)}
                  </th>
                  {columns.map((scheme) => {
                    const route = scheme.dprRoute || 'full';
                    const canCreate = route !== 'cta' && route !== 'none';
                    return (
                      <td key={scheme.code} className={cn('px-2.5 py-3', scheme.code === first && 'bg-primary/5')}>
                        {canCreate ? (
                          <Button size="sm" onClick={() => onCreate(scheme.code)}>
                            {pick(TEXT.start, lang)}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{pick(TEXT.none, lang)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {first && others.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {pick(TEXT.note, lang)}
          </p>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-primary hover:underline"
            onClick={() => {
              setFirst(null);
              setOthers([]);
            }}
          >
            {pick(TEXT.clear, lang)}
          </button>
        </div>
      )}
    </div>
  );
};
