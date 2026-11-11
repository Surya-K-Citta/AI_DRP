import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QuestionDef } from '@/lib/ventureMatch/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface VentureMatchCardProps {
  question: QuestionDef;
  selected: string | string[] | undefined;
  onSelect: (optionId: string) => void;
  onContinue?: () => void;
  /** Which way the person moved, so the card slides in from the matching side. */
  direction?: 'forward' | 'back';
}

export const VentureMatchCard: React.FC<VentureMatchCardProps> = ({
  question,
  selected,
  onSelect,
  onContinue,
  direction = 'forward',
}) => {
  const { t } = useTranslation();
  const selectedSet = new Set(Array.isArray(selected) ? selected : selected ? [selected] : []);
  const canContinue = question.multi && selectedSet.size > 0;

  return (
    <div className="w-full">
      <div className={cn('max-w-2xl mx-auto', direction === 'back' ? 'vm-step-back' : 'vm-step-forward')}>
        <div className="rounded-[18px] border-2 border-primary/20 bg-card shadow-lg p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
            {t(`ventureMatch.questions.${question.id}.label`)}
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t(`ventureMatch.questions.${question.id}.title`)}
          </h2>
          {question.multi && (
            <p className="text-sm text-muted-foreground mb-4">
              {t('ventureMatch.selectAll')}
              {question.id === 'owner' && <span className="mt-1 block">{t('ventureMatch.ownerPickOne')}</span>}
            </p>
          )}

          <div className="space-y-3">
            {question.optionIds.map((optionId, optionIndex) => {
              const active = selectedSet.has(optionId);
              const letter = String.fromCharCode(65 + optionIndex);
              return (
                <button
                  key={optionId}
                  type="button"
                  onClick={() => onSelect(optionId)}
                  style={{ ['--vm-delay' as any]: `${80 + optionIndex * 45}ms` }}
                  className={cn(
                    'vm-rise vm-lift flex w-full items-center text-left rounded-[12px] border-2 px-4 py-4',
                    active
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 hover:bg-muted/60'
                  )}
                >
                  <span className="font-semibold text-primary mr-2">{letter}.</span>
                  <span className="min-w-0 flex-1">
                    {t(`ventureMatch.questions.${question.id}.options.${optionId}`)}
                  </span>
                  {active && (
                    <span className="vm-pop ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {question.multi && (
            <Button className="w-full mt-6" disabled={!canContinue} onClick={onContinue}>
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
