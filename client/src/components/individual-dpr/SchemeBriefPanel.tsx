import { safeUrl } from '@/lib/security/sanitizeText';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, FileText, HelpCircle, ListChecks, MapPinned, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  briefLangFromI18n,
  getSchemeBrief,
  loc,
  SchemeBriefTab,
} from '@/lib/individualDpr/schemeBriefs';

type FormNotes = {
  title: string;
  bullets: string[];
};

interface SchemeBriefPanelProps {
  schemeCode: string | null | undefined;
  formNotes?: FormNotes;
}

const TABS: { id: SchemeBriefTab; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'benefits', labelKey: 'individualDpr.brief.benefits', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'eligibility', labelKey: 'individualDpr.brief.eligibility', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'howToApply', labelKey: 'individualDpr.brief.howToApply', icon: <MapPinned className="h-4 w-4" /> },
  { id: 'documents', labelKey: 'individualDpr.brief.documents', icon: <FileText className="h-4 w-4" /> },
  { id: 'faqs', labelKey: 'individualDpr.brief.faqs', icon: <HelpCircle className="h-4 w-4" /> },
];

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-sm leading-6 text-foreground">{children}</span>
    </li>
  );
}

export const SchemeBriefPanel: React.FC<SchemeBriefPanelProps> = ({ schemeCode, formNotes }) => {
  const { t, i18n } = useTranslation();
  const lang = briefLangFromI18n(i18n.language);
  const brief = useMemo(() => getSchemeBrief(schemeCode), [schemeCode]);
  const [tab, setTab] = useState<SchemeBriefTab>('benefits');

  useEffect(() => {
    setTab('benefits');
  }, [schemeCode]);

  const items =
    tab === 'benefits'
      ? brief.benefits
      : tab === 'eligibility'
        ? brief.eligibility
        : tab === 'howToApply'
          ? brief.howToApply
          : tab === 'documents'
            ? brief.documents
            : [];

  return (
    <div className="rounded-[14px] border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {loc(brief.title, lang)}
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-6 text-muted-foreground">{loc(brief.intro, lang)}</p>

          <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="hidden sm:inline">{item.icon}</span>
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 min-h-[160px]">
            {tab === 'faqs' ? (
              <dl className="space-y-4">
                {brief.faqs.map((faq, i) => (
                  <div key={`${brief.code}-faq-${i}`} className="rounded-lg border border-border bg-muted/30 p-4">
                    <dt className="text-sm font-semibold text-foreground">{loc(faq.q, lang)}</dt>
                    <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">{loc(faq.a, lang)}</dd>
                  </div>
                ))}
              </dl>
            ) : tab === 'howToApply' ? (
              <ol className="space-y-3">
                {items.map((item, i) => (
                  <li key={`${brief.code}-${tab}-${i}`} className="flex gap-3 items-start">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-6 text-foreground">{loc(item, lang)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <CheckRow key={`${brief.code}-${tab}-${i}`}>{loc(item, lang)}</CheckRow>
                ))}
              </ul>
            )}
          </div>

          {brief.sourceUrl ? (
            <a
              href={safeUrl(brief.sourceUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              {t('individualDpr.brief.source')}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">{t('individualDpr.brief.disclaimer')}</p>
        </div>

        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-muted/40 p-6">
          <h3 className="text-sm font-semibold tracking-wide text-foreground">{t('individualDpr.brief.quickInfo')}</h3>
          <dl className="mt-4 space-y-4">
            {(
              [
                ['ministry', brief.quickInfo.ministry],
                ['category', brief.quickInfo.category],
                ['type', brief.quickInfo.type],
                ['status', brief.quickInfo.status],
              ] as const
            ).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t(`individualDpr.brief.${key}`)}</dt>
                <dd className={`mt-1 text-sm font-semibold ${key === 'status' ? 'text-emerald-700' : 'text-foreground'}`}>
                  {loc(value, lang)}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {formNotes ? (
        <div className="border-t border-red-200 bg-red-50 px-6 sm:px-8 py-4">
          <p className="text-sm font-semibold text-red-700">
            {t('individualDpr.brief.formNotes', { title: formNotes.title })}
          </p>
          <ul className="mt-1 text-sm text-red-700 list-disc pl-5 space-y-0.5">
            {formNotes.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
