import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBackTarget } from '@/lib/navHistory';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { VentureMatchCard } from '@/components/venture-match/VentureMatchCard';
import {
  VentureMatchHelpBubble,
  VentureMatchHelpTrigger,
} from '@/components/venture-match/VentureMatchHelpBubble';
import { VentureMatchResults } from '@/components/venture-match/VentureMatchResults';
import { VentureMatchStepExclusions } from '@/components/venture-match/VentureMatchStepExclusions';
import {
  getVisibleQuestions,
  pruneInvisibleAnswers,
  STORAGE_KEY,
  scopedVentureMatchKey,
} from '@/lib/ventureMatch/questions';
import { evaluate, excludedSchemes, remainingCount } from '@/lib/ventureMatch/evaluate';
import { saveHandoff } from '@/lib/ventureMatch/mapToDpr';
import { OwnerTag, QuestionId, VentureMatchAnswers } from '@/lib/ventureMatch/types';
import { sanitizeOwnerTags, toggleOwner } from '@/lib/ventureMatch/ownerSelection';
import { GuardianNotice } from '@/components/privacy/GuardianNotice';
import { useAuthStore } from '@/store/authStore';

interface SavedProgress {
  answers: VentureMatchAnswers;
  step: number;
  done?: boolean;
}

export const VentureMatch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const back = useBackTarget({ path: '/dashboard' });
  const userId = useAuthStore((s) => s.user?.userId);
  const progressKey = scopedVentureMatchKey(STORAGE_KEY, userId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<VentureMatchAnswers>({});
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setHydrated(false);
    setAnswers({});
    setStep(0);
    setDone(false);
    const raw = localStorage.getItem(progressKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedProgress;
        const pruned = pruneInvisibleAnswers(parsed.answers || {});
        setAnswers(pruned);
        setStep(parsed.step || 0);
        setDone(!!parsed.done);
      } catch {
        /* ignore */
      }
    }
    // Old shared key leaked answers across accounts on the same browser — remove it
    localStorage.removeItem(STORAGE_KEY);
    setHydrated(true);
  }, [progressKey]);

  useEffect(() => {
    if (!hydrated || !userId) return;
    const payload: SavedProgress = { answers, step, done };
    localStorage.setItem(progressKey, JSON.stringify(payload));
  }, [answers, step, done, hydrated, progressKey, userId]);

  useEffect(() => {
    setHelpOpen(false);
  }, [step]);

  const visible = useMemo(() => getVisibleQuestions(answers), [answers]);

  useEffect(() => {
    if (done) return;
    if (step > visible.length - 1 && visible.length > 0) {
      setStep(visible.length - 1);
    }
  }, [visible.length, step, done]);

  const prevStep = useRef(step);
  const direction: 'forward' | 'back' = step >= prevStep.current ? 'forward' : 'back';
  useEffect(() => {
    prevStep.current = step;
  }, [step]);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const question = visible[step];
  const result = useMemo(() => evaluate(answers), [answers]);
  const remaining = remainingCount(answers, question?.id);
  const stepExcluded = useMemo(
    () => excludedSchemes(answers, question?.id),
    [answers, question?.id]
  );

  const goNext = (nextAnswers: VentureMatchAnswers) => {
    const pruned = pruneInvisibleAnswers(nextAnswers);
    const nextVisible = getVisibleQuestions(pruned);
    setAnswers(pruned);
    if (step >= nextVisible.length - 1) {
      setDone(true);
      return;
    }
    setStep(step + 1);
  };

  const applyHelpOptions = (optionIds: string[]) => {
    if (!question) return;
    const valid = optionIds.filter((id) => question.optionIds.includes(id));
    if (!valid.length) return;
    if (question.multi) {
      const owners = sanitizeOwnerTags(valid) as OwnerTag[];
      if (!owners.length) return;
      goNext({ ...answers, owner: owners });
      return;
    }
    goNext({ ...answers, [question.id]: valid[0] } as VentureMatchAnswers);
  };

  const handleSelect = (optionId: string) => {
    if (!question) return;
    if (question.multi) {
      setAnswers(
        pruneInvisibleAnswers({
          ...answers,
          owner: toggleOwner(answers.owner || [], optionId as OwnerTag),
        })
      );
      return;
    }

    const next = { ...answers, [question.id]: optionId } as VentureMatchAnswers;
    goNext(next);
  };

  const handleOwnerContinue = () => {
    if (!answers.owner?.length) return;
    const pruned = pruneInvisibleAnswers(answers);
    const nextVisible = getVisibleQuestions(pruned);
    setAnswers(pruned);
    if (step >= nextVisible.length - 1) {
      setDone(true);
      return;
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    if (done) {
      setDone(false);
      const last = Math.max(0, getVisibleQuestions(answers).length - 1);
      setStep(last);
      return;
    }
    if (step > 0) setStep(step - 1);
  };

  const canGoPrevious = done || step > 0;

  const handleRestart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
    localStorage.removeItem(progressKey);
    localStorage.removeItem(STORAGE_KEY);
  };

  const under18 = answers.age === 'under18';

  const handleCreateDprForScheme = (schemeCode: string) => {
    if (under18) return;
    saveHandoff(answers, result.matches);
    navigate(`/individual-dpr/create?new=true&scheme=${encodeURIComponent(schemeCode)}`);
  };

  const handleCreateDpr = () => {
    if (under18) return;
    saveHandoff(answers, result.matches);
    navigate('/individual-dpr/create?new=true');
  };

  const selected = question ? answers[question.id as QuestionId] : undefined;
  const answered = question?.multi ? Boolean(answers.owner?.length) : Boolean(selected);
  const canGoNext = !done && answered;
  const handleNext = () => {
    if (!canGoNext) return;
    if (question?.multi) handleOwnerContinue();
    else goNext(answers);
  };

  if (!hydrated) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`mx-auto overflow-x-visible ${done ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <div className={`sticky top-16 z-30 -mx-4 -mt-8 mb-6 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-background/60 ${scrolled ? 'shadow-md' : 'shadow-none'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-2" onClick={back.go}>
                <ArrowLeft className="h-4 w-4" />
                {back.label}
              </Button>
              <h1 className="truncate text-2xl font-bold">{t('ventureMatch.title')}</h1>
            </div>
          </div>
          {!done && question && (
            <div className="mt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 text-sm text-muted-foreground">
                <span>{t('ventureMatch.progress', { current: step + 1, total: visible.length })}</span>
                <span>{t('ventureMatch.remaining', { count: remaining })}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${((step + 1) / visible.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Previous / Next sit beside the question on wide screens and in the bottom corners on small ones.
            Fixed elements without a left/top keep their in-flow spot, so each sits next to the block. */}
        <div className={`relative mx-auto ${done ? 'max-w-6xl pb-24 lg:pb-0 lg:pl-14' : 'max-w-2xl pb-24 lg:pb-0'}`}>
          <div className={done ? 'lg:absolute lg:left-0 lg:top-0 lg:w-12' : 'lg:absolute lg:right-full lg:top-0 lg:mr-3 lg:w-12'}>
            <Button
              variant="outline"
              className={`fixed bottom-4 left-4 z-40 h-11 w-11 rounded-full bg-background p-0 shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 disabled:hover:scale-100 lg:bottom-auto lg:left-auto lg:top-1/2 lg:h-12 lg:w-12 lg:-translate-y-1/2`}
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              aria-label={t('common.previous')}
              title={t('common.previous')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          {!done && (
            <div className="lg:absolute lg:left-full lg:top-0 lg:ml-3 lg:w-12">
              <Button
                variant="primary"
                className={`fixed bottom-4 right-4 z-40 h-11 w-11 rounded-full p-0 shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 disabled:hover:scale-100 lg:bottom-auto lg:right-auto lg:top-1/2 lg:h-12 lg:w-12 lg:-translate-y-1/2`}
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label={t('common.next')}
                title={t('common.next')}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
          {!done && question && !helpOpen && (
            <VentureMatchHelpTrigger
              onClick={() => setHelpOpen(true)}
              className="vm-pop fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition-shadow duration-200 hover:shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
            />
          )}

          {(under18 || question?.id === 'age') && (
            <div className="mb-4">
              <GuardianNotice />
            </div>
          )}

          {done ? (
            <VentureMatchResults
              result={result}
              onCreateDpr={handleCreateDpr}
              onCreateDprForScheme={handleCreateDprForScheme}
              onRestart={handleRestart}
              disableCreate={under18}
            />
          ) : (
            question && (
              <>
                <VentureMatchCard
                  key={question.id}
                  direction={direction}
                  question={question}
                  selected={selected as string | string[] | undefined}
                  onSelect={handleSelect}
                  onContinue={handleOwnerContinue}
                />
                <VentureMatchStepExclusions excluded={stepExcluded} />
                <VentureMatchHelpBubble
                  question={question}
                  answers={answers}
                  onApply={applyHelpOptions}
                  open={helpOpen}
                  onOpenChange={setHelpOpen}
                />
              </>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};
