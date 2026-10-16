import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  FolderPlus,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CriterionStatus, EvaluateResult, SchemeCriterion, SchemeMatch } from '@/lib/ventureMatch/types';
import { cn } from '@/lib/utils';
import { VentureMatchCombos } from './VentureMatchCombos';
import { analyzeCombinations } from '@/lib/ventureMatch/combos';
import { briefLangFromI18n, getSchemeBrief, loc } from '@/lib/individualDpr/schemeBriefs';
import { FACT_LABEL, keyFactsFor } from '@/lib/ventureMatch/schemeKeyFacts';

interface VentureMatchResultsProps {
  result: EvaluateResult;
  onCreateDpr: () => void;
  onCreateDprForScheme: (schemeCode: string) => void;
  onOpenClusterDpr?: () => void;
  onRestart: () => void;
  disableCreate?: boolean;
}

const STATUS_ICON: Record<CriterionStatus, React.ElementType> = {
  fail: X,
  unknown: HelpCircle,
  pass: Check,
};

function CriterionRow({ item }: { item: SchemeCriterion }) {
  const { t } = useTranslation();
  const Icon = STATUS_ICON[item.status];
  return (
    <li
      className={cn(
        'flex items-start gap-2 text-sm',
        item.status === 'fail' && 'text-red-700',
        item.status === 'unknown' && 'text-muted-foreground',
        item.status === 'pass' && 'text-emerald-700'
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>
        {item.status === 'unknown' ? `${t('ventureMatch.notAnswered')}: ` : ''}
        {t(item.labelKey)}
      </span>
    </li>
  );
}

function CreateButton({
  scheme,
  onCreateDprForScheme,
  disableCreate,
  className,
}: {
  scheme: SchemeMatch;
  onCreateDprForScheme: (schemeCode: string) => void;
  disableCreate?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const route = scheme.dprRoute || 'full';
  if (disableCreate || route === 'cta' || route === 'none') return null;
  return (
    <Button className={cn('gap-2', className)} size="sm" onClick={() => onCreateDprForScheme(scheme.code)}>
      <FolderPlus className="h-4 w-4" />
      {t('ventureMatch.knowMoreCreate', { defaultValue: 'Know more & create' })}
    </Button>
  );
}

export const VentureMatchResults: React.FC<VentureMatchResultsProps> = ({
  result,
  onCreateDpr,
  onCreateDprForScheme,
  onRestart,
  disableCreate,
}) => {
  const { t, i18n } = useTranslation();
  const [showExcluded, setShowExcluded] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const inPlan = new Set(
    analyzeCombinations(result.matches).core.map((item) => item.scheme.code)
  );
  const briefLang = briefLangFromI18n(i18n.language);

  return (
    <div className="vm-rise w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">{t('ventureMatch.resultsTitle')}</h2>
        <p className="text-muted-foreground">
          {t('ventureMatch.resultsSubtitle', { count: result.matches.length })}
        </p>
        <p className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('ventureMatch.noGuarantee')}
        </p>
      </div>

      {result.showOwnershipHint && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('ventureMatch.ownershipHint.title')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('ventureMatch.ownershipHint.body')}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                  <li>{t('ventureMatch.ownershipHint.subsidy')}</li>
                  <li>{t('ventureMatch.ownershipHint.debt')}</li>
                  <li>{t('ventureMatch.ownershipHint.guarantee')}</li>
                  <li>{t('ventureMatch.ownershipHint.ecosystem')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={cn('grid items-start gap-6', result.matches.length > 0 && 'lg:grid-cols-2')}>
        <div className="min-w-0 space-y-6">
          {result.matches.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{t('ventureMatch.noMatches')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {result.matches.map((scheme, index) => (
                <Card
                  key={scheme.code}
                  style={{ ['--vm-delay' as any]: `${120 + Math.min(index, 10) * 70}ms` }}
                  className="vm-rise vm-lift border-2 border-primary/15"
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {scheme.dprRoute === 'cluster' ? (
                            <ExternalLink className="h-5 w-5 text-primary" />
                          ) : (
                            <Award className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name })}
                            {inPlan.has(scheme.code) && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 align-middle text-[11px] font-medium text-primary-foreground">
                                <Sparkles className="h-3 w-3" />
                                {t('ventureMatch.inBestPlan', { defaultValue: 'In your suggested plan' })}
                              </span>
                            )}
                          </p>
                          {keyFactsFor(scheme.code).length > 0 ? (
                            <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
                              {keyFactsFor(scheme.code).map((fact) => (
                                <li key={fact.kind + fact.text.en} className="flex gap-2">
                                  <span
                                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                    aria-hidden="true"
                                  />
                                  <span className="min-w-0">
                                    <span className="font-semibold text-foreground">
                                      {briefLang === 'te' ? FACT_LABEL[fact.kind].te : FACT_LABEL[fact.kind].en}:
                                    </span>{' '}
                                    {briefLang === 'te' ? fact.text.te : fact.text.en}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 line-clamp-3 text-sm text-foreground/80">
                              {loc(getSchemeBrief(scheme.code).intro, briefLang)}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-muted-foreground">{t(scheme.benefit)}</p>
                          {scheme.dprRoute === 'cluster' && (
                            <p className="mt-2 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded-md px-2 py-1.5">
                              {t('ventureMatch.clusterRedirectHint')}
                            </p>
                          )}
                          {scheme.code === 'AP_CMEP' && scheme.boosted && (
                            <div className="mt-3 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2">
                              <p className="text-sm font-semibold text-red-700">
                                {t('ventureMatch.cmepBoosterTitle')}
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                {t('ventureMatch.cmepBoosterBody')}
                              </p>
                            </div>
                          )}
                          {(scheme.dprRoute === 'cta' || scheme.dprRoute === 'none') && !disableCreate && (
                            <p className="mt-3 text-sm text-muted-foreground">{t('ventureMatch.ctaOnlyHint')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <CreateButton
                          scheme={scheme}
                          onCreateDprForScheme={onCreateDprForScheme}
                          disableCreate={disableCreate}
                          className="w-full sm:w-auto"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {result.excluded.length > 0 && (
            <div>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setShowExcluded((v) => !v)}
              >
                {showExcluded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {t('ventureMatch.notEligible', { count: result.excluded.length })}
              </button>
              {showExcluded && (
                <div className="mt-3 space-y-2">
                  {result.excluded.map((scheme) => (
                    <div
                      key={scheme.code}
                      className="rounded-[12px] border border-border px-4 py-3 text-sm"
                    >
                      <p className="font-medium text-foreground">
                        {t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name })}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {scheme.criteria.map((item) => (
                          <CriterionRow key={`${scheme.code}-${item.id}`} item={item} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {result.matches.length > 0 && (
          <div
            style={{ ['--vm-delay' as any]: '250ms' }}
            className={cn(
              'vm-rise min-w-0',
              !panelExpanded && 'lg:sticky lg:top-40 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto'
            )}
          >
            <VentureMatchCombos
              onExpandedChange={setPanelExpanded}
              matches={result.matches}
              disableCreate={disableCreate}
              onCreate={onCreateDprForScheme}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {!disableCreate && (
          <Button onClick={onCreateDpr} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            {t('ventureMatch.createDpr')}
          </Button>
        )}
        <Button variant="outline" onClick={onRestart}>
          {t('ventureMatch.startOver')}
        </Button>
      </div>
    </div>
  );
};
