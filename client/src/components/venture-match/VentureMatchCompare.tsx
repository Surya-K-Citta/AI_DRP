import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SchemeMatch } from '@/lib/ventureMatch/types';
import { relationBetween, roleOf, type Loc, type RelationType, type SchemeRole } from '@/lib/ventureMatch/combos';
import { keyFactsFor, type FactKind } from '@/lib/ventureMatch/schemeKeyFacts';
import { getSchemeBrief } from '@/lib/individualDpr/schemeBriefs';

type Lang = 'en' | 'te';
const pick = (loc: Loc, lang: Lang) => (lang === 'te' ? loc.te : loc.en) || loc.en;

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
    en: 'Choose up to three other schemes from the lists to set beside this one. Read across a row to see how they differ, then decide for yourself.',
    te: 'దీని పక్కన పెట్టడానికి జాబితాల నుండి గరిష్ఠంగా మూడు ఇతర పథకాలను ఎంచుకోండి. వరుసల వెంట చదివి తేడాలు చూసి మీరే నిర్ణయించుకోండి.',
  },
  step1: { en: 'Your scheme', te: 'మీ పథకం' },
  step2: { en: 'Compare it with', te: 'దీనితో పోల్చండి' },
  limit: { en: 'Up to 3', te: 'గరిష్ఠం 3' },
  choose: { en: 'Choose a scheme', te: 'పథకాన్ని ఎంచుకోండి' },
  slot: { en: 'Scheme to compare', te: 'పోల్చడానికి పథకం' },
  pickMore: { en: 'Choose at least one scheme from the lists above to see the comparison.', te: 'పోలికను చూడటానికి పైన ఉన్న జాబితాల నుండి కనీసం ఒక పథకాన్ని ఎంచుకోండి.' },
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
  /** The scheme whose card the person pressed Compare on. It can be changed from the first list. */
  baseCode: string;
  lang: Lang;
  disableCreate?: boolean;
  onCreate: (code: string) => void;
}> = ({ matches, baseCode, lang, disableCreate, onCreate }) => {
  const { t } = useTranslation();
  const [first, setFirst] = useState<string>(baseCode);
  // Three lists, one per column to compare with. '' = nothing chosen yet.
  const [slots, setSlots] = useState<string[]>(['', '', '']);

  const known = useMemo(() => new Set(matches.map((m) => m.code)), [matches]);
  useEffect(() => {
    setFirst((current) => (known.has(current) ? current : baseCode));
    setSlots((current) => current.map((code) => (known.has(code) && code !== first ? code : '')));
  }, [known, first, baseCode]);

  const name = (scheme: SchemeMatch) => t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name });
  const byCode = (code: string) => matches.find((m) => m.code === code)!;
  const others = slots.filter(Boolean);
  const columns = [byCode(first), ...others.map(byCode)];
  /** What a list may offer: every matched scheme except this one's own, the first scheme, and those picked in the other lists. */
  const optionsFor = (index: number) => matches.filter((m) => m.code !== first && !slots.some((code, i) => i !== index && code === m.code));

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
  const selectClass = 'h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-foreground">{pick(TEXT.heading, lang)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{pick(TEXT.intro, lang)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{pick(TEXT.step1, lang)}</span>
          <select
            value={first}
            onChange={(event) => setFirst(event.target.value)}
            className={cn(selectClass, 'border-primary bg-primary/5 font-medium')}
            aria-label={pick(TEXT.step1, lang)}
          >
            {matches.map((scheme) => (
              <option key={scheme.code} value={scheme.code}>{name(scheme)}</option>
            ))}
          </select>
        </label>
        {slots.map((value, index) => (
          <label key={index} className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {pick(TEXT.step2, lang)} {index + 1}
              {index === 0 && <span className="ml-1 font-normal normal-case">({pick(TEXT.limit, lang)})</span>}
            </span>
            <select
              value={value}
              onChange={(event) => setSlots((current) => current.map((code, i) => (i === index ? event.target.value : code)))}
              className={selectClass}
              aria-label={`${pick(TEXT.slot, lang)} ${index + 1}`}
            >
              <option value="">{pick(TEXT.choose, lang)}</option>
              {optionsFor(index).map((scheme) => (
                <option key={scheme.code} value={scheme.code}>{name(scheme)}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {others.length === 0 && <p className="text-sm text-muted-foreground">{pick(TEXT.pickMore, lang)}</p>}

      {others.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {lang === 'te' ? 'మరిన్ని పథకాలను చూడటానికి పట్టికను పక్కకు జరపండి.' : 'Slide the table sideways to see every scheme.'}
        </p>
      )}
      {others.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full border-collapse text-left text-sm leading-6">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-24 min-w-[6rem] bg-muted px-2 py-3 align-bottom text-xs font-semibold uppercase tracking-wide text-muted-foreground" />
                {columns.map((scheme) => (
                  <th
                    key={scheme.code}
                    className={cn('w-56 min-w-[14rem] px-2.5 py-3 align-bottom', scheme.code === first ? 'bg-primary/10' : 'bg-muted/60')}
                  >
                    {scheme.code === first && (
                      <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {pick(TEXT.yourPick, lang)}
                      </span>
                    )}
                    <span className="block text-sm font-semibold text-foreground">{name(scheme)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowOrder.map((row) => (
                <tr key={row} className="border-t border-border align-top">
                  <th scope="row" className="sticky left-0 z-10 bg-muted px-2 py-3 text-xs font-semibold text-muted-foreground">
                    {pick(ROWS[row], lang)}
                  </th>
                  {columns.map((scheme) => (
                    <td key={scheme.code} className={cn('px-2.5 py-3 text-foreground/90', scheme.code === first && 'bg-primary/5')}>
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

      {others.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {pick(TEXT.note, lang)}
          </p>
          <button type="button" className="shrink-0 text-xs font-medium text-primary hover:underline" onClick={() => setSlots(['', '', ''])}>
            {pick(TEXT.clear, lang)}
          </button>
        </div>
      )}
    </div>
  );
};
