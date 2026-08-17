import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, ChevronDown, ChevronUp, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EvaluateResult } from '@/lib/ventureMatch/types';

interface VentureMatchResultsProps {
  result: EvaluateResult;
  onCreateDpr: () => void;
  onRestart: () => void;
}

export const VentureMatchResults: React.FC<VentureMatchResultsProps> = ({
  result,
  onCreateDpr,
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
                    <p className="font-semibold text-foreground">{scheme.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{scheme.benefit}</p>
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
                  <p className="font-medium text-foreground">{scheme.name}</p>
                  <p className="text-muted-foreground mt-0.5">{scheme.reason}</p>
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
