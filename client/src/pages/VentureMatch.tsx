import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { VentureMatchCard } from '@/components/venture-match/VentureMatchCard';
import { VentureMatchResults } from '@/components/venture-match/VentureMatchResults';
import { QUESTIONS, STORAGE_KEY } from '@/lib/ventureMatch/questions';
import { evaluate, remainingCount } from '@/lib/ventureMatch/evaluate';
import { saveHandoff } from '@/lib/ventureMatch/mapToDpr';
import { OwnerTag, QuestionId, VentureMatchAnswers } from '@/lib/ventureMatch/types';

interface SavedProgress {
  answers: VentureMatchAnswers;
  step: number;
  done?: boolean;
}

export const VentureMatch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<VentureMatchAnswers>({});
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedProgress;
        setAnswers(parsed.answers || {});
        setStep(parsed.step || 0);
        setDone(!!parsed.done);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: SavedProgress = { answers, step, done };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [answers, step, done, hydrated]);

  const question = QUESTIONS[step];
  const result = useMemo(() => evaluate(answers), [answers]);
  const remaining = remainingCount(answers);

  const goNext = (nextAnswers: VentureMatchAnswers) => {
    if (step >= QUESTIONS.length - 1) {
      setAnswers(nextAnswers);
      setDone(true);
      return;
    }
    setAnswers(nextAnswers);
    setStep(step + 1);
  };

  const handleSelect = (optionId: string) => {
    if (!question) return;
    if (question.multi) {
      const current = new Set(answers.owner || []);
      if (optionId === 'generalMale') {
        setAnswers({
          ...answers,
          owner: current.has('generalMale') ? [] : ['generalMale'],
        });
        return;
      }
      current.delete('generalMale');
      if (current.has(optionId as OwnerTag)) current.delete(optionId as OwnerTag);
      else current.add(optionId as OwnerTag);
      setAnswers({ ...answers, owner: Array.from(current) as OwnerTag[] });
      return;
    }

    const next = { ...answers, [question.id]: optionId } as VentureMatchAnswers;
    goNext(next);
  };

  const handleOwnerContinue = () => {
    if (!answers.owner?.length) return;
    if (step >= QUESTIONS.length - 1) {
      setDone(true);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (done) {
      setDone(false);
      setStep(QUESTIONS.length - 1);
      return;
    }
    if (step > 0) setStep(step - 1);
    else navigate('/dashboard');
  };

  const handleRestart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCreateDpr = () => {
    saveHandoff(answers, result.matches);
    navigate('/dpr/builder');
  };

  const selected = question ? answers[question.id as QuestionId] : undefined;

  if (!hydrated) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-6 gap-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>

        {done ? (
          <VentureMatchResults
            result={result}
            onCreateDpr={handleCreateDpr}
            onRestart={handleRestart}
          />
        ) : (
          question && (
            <VentureMatchCard
              question={question}
              index={step}
              total={QUESTIONS.length}
              selected={selected as string | string[] | undefined}
              remaining={remaining}
              onSelect={handleSelect}
              onContinue={handleOwnerContinue}
            />
          )
        )}
      </div>
    </Layout>
  );
};
