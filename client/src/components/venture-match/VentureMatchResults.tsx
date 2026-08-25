import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FolderPlus,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CriterionStatus, EvaluateResult, SchemeCriterion } from '@/lib/ventureMatch/types';
import { cn } from '@/lib/utils';

interface VentureMatchResultsProps {
  result: EvaluateResult;
  onCreateDpr: () => void;
  onCreateDprForScheme: (schemeCode: string) => void;
  onRestart: () => void;
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

export const VentureMatchResults: React.FC<VentureMatchResultsProps> = ({
  result,
  onCreateDpr,
  onCreateDprForScheme,
  onRestart,
}) => {
  const { t } = useTranslation();
  const [showExcluded, setShowExcluded] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">{t('ventureMatch.resultsTitle')}</h2>
        <p className="text-muted-foreground">
          {t('ventureMatch.resultsSubtitle', { count: result.matches.length })}
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

      {result.matches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('ventureMatch.noMatches')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.matches.map((scheme) => (
            <Card key={scheme.code} className="border-2 border-primary/15">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {t(`ventureMatch.schemes.${scheme.code}.name`, { defaultValue: scheme.name })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{t(scheme.benefit)}</p>
                    <Button
                      className="mt-3 gap-2"
                      size="sm"
                      onClick={() => onCreateDprForScheme(scheme.code)}
                    >
                      <FolderPlus className="h-4 w-4" />
                      Generate DPR for this Match
                    </Button>
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

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button onClick={onCreateDpr} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          {t('ventureMatch.createDpr')}
        </Button>
        <Button variant="outline" onClick={onRestart}>
          {t('ventureMatch.startOver')}
        </Button>
      </div>
    </div>
  );
};
