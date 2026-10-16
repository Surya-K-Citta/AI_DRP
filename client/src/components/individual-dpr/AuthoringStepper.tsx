import React from 'react';
import { Check, CheckCircle2, Save } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
  MILESTONES,
  nextMilestone,
  type OverallProgress,
  type SectionProgress,
} from '@/lib/individualDpr/authoringProgress';

type Props = {
  sections: SectionProgress[];
  overall: OverallProgress;
  /** Overall percentage of the last saved copy (what survives a refresh). */
  savedPercent: number;
  unsaved: Set<number>;
  /** Anything typed that the server does not have yet (the whole draft, not just counted answers). */
  dirty: boolean;
  saveStatus: 'idle' | 'saving' | 'error';
  lastSavedAt: Date | null;
  currentStep: number;
  onSelect: (step: number) => void;
  /** 'full' shows the summary and milestone bar; 'compact' fits inside a toolbar. */
  variant?: 'full' | 'compact';
  activeClass?: string;
  idleClass?: string;
  stepLabel: (step: number) => string;
  lang: 'en' | 'te';
};

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CIRCUMFERENCE_STR = String(CIRCUMFERENCE);

/** Small ring that fills as the section's questions are answered. */
function Ring({ percent, tone }: { percent: number; tone: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-hidden="true">
      <circle cx="12" cy="12" r={RADIUS} fill="none" strokeWidth="3" className="stroke-current opacity-20" />
      <circle
        cx="12"
        cy="12"
        r={RADIUS}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className={`${tone} stroke-current transition-[stroke-dashoffset] duration-500 ease-out`}
        strokeDasharray={CIRCUMFERENCE_STR}
        strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
      />
    </svg>
  );
}

export const AuthoringStepper: React.FC<Props> = ({
  sections,
  overall,
  savedPercent,
  unsaved,
  dirty: draftDirty,
  saveStatus,
  lastSavedAt,
  currentStep,
  onSelect,
  variant = 'full',
  activeClass,
  idleClass,
  stepLabel,
  lang,
}) => {
  const tf = useClusterFormText();
  const compact = variant === 'compact';
  const upcoming = nextMilestone(overall.percent);
  const dirty = draftDirty || unsaved.size > 0;
  const time = lastSavedAt
    ? lastSavedAt.toLocaleTimeString(lang === 'te' ? 'te-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const statusText =
    saveStatus === 'saving'
      ? tf('Saving…')
      : saveStatus === 'error'
        ? tf('Could not save. Will retry.')
        : dirty
          ? tf('Unsaved changes. Auto-saves every 30 seconds.')
          : time
            ? `${tf('Saved')} ${time}`
            : tf('Saved');
  const statusTone = saveStatus === 'error' ? 'text-destructive' : dirty || saveStatus === 'saving' ? 'text-amber-600' : 'text-success';
  const livePercent = overall.percent;
  const savedShown = Math.min(savedPercent, livePercent);

  const summary = (
    <div className={compact ? 'mb-1.5' : 'mb-3'}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-foreground" aria-live="polite">
          <span className="text-lg font-bold tabular-nums">{livePercent}%</span>{' '}
          <span className="text-muted-foreground">
            {tf('complete')} · {overall.sectionsComplete} / {overall.sectionsTotal} {tf('sections done')}
          </span>
        </p>
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          {upcoming ? (
            <span>
              {tf('Next milestone')}: <strong className="text-foreground">{upcoming.label[lang]}</strong> ({upcoming.at}%)
            </span>
          ) : (
            <span className="font-semibold text-success">{MILESTONES[3].label[lang]}</span>
          )}
          <span
            className={`inline-flex items-center gap-1 font-medium ${statusTone}`}
            title={dirty ? tf('Changes since the last save') : tf('Everything on screen is saved')}
            role="status"
          >
            {dirty || saveStatus !== 'idle' ? <Save className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {statusText}
          </span>
        </p>
      </div>
      <div className="relative mx-2 mt-2 h-2.5 rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={livePercent} aria-label={tf('DPR progress')}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/35 transition-[width] duration-500 ease-out"
          style={{ width: `${livePercent}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${savedShown}%` }}
        />
        {MILESTONES.map((milestone) => {
          const reached = livePercent >= milestone.at;
          return (
            <span
              key={milestone.id}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${Math.min(milestone.at, 99)}%` }}
              title={`${milestone.label[lang]} · ${milestone.at}%`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                  reached ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-transparent'
                }`}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
            </span>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-2 hidden justify-between text-[11px] text-muted-foreground sm:flex" aria-hidden="true">
          {MILESTONES.map((milestone) => (
            <span key={milestone.id} className={livePercent >= milestone.at ? 'font-semibold text-primary' : ''}>
              {milestone.at}% {milestone.label[lang]}
            </span>
          ))}
        </div>
      )}
      {!compact && !overall.readyToGenerate && (
        <p className="mt-1 text-xs text-muted-foreground">
          {overall.requiredMissing} {tf('required answers still missing before you can generate')}
        </p>
      )}
      {!compact && overall.readyToGenerate && (
        <p className="mt-1 text-xs font-medium text-success">{tf('All required answers are in. You can generate the DPR.')}</p>
      )}
    </div>
  );

  return (
    <div>
      {summary}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="list">
        {sections.map((section) => {
          const current = section.step === currentStep;
          const done = section.status === 'complete';
          const isUnsaved = unsaved.has(section.step);
          const tone = done ? 'text-success' : section.status === 'ready' ? 'text-success' : 'text-primary';
          return (
            <button
              key={section.step}
              type="button"
              role="listitem"
              onClick={() => onSelect(section.step)}
              aria-current={current ? 'step' : undefined}
              title={`${tf(section.title)} · ${section.answered}/${section.total} ${tf('answered')} (${section.percent}%)${isUnsaved ? ` · ${tf('unsaved')}` : ''}`}
              className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                current
                  ? activeClass || 'bg-primary text-primary-foreground shadow-sm'
                  : done
                    ? 'border border-success/20 bg-success/10 text-success hover:bg-success/20'
                    : idleClass || 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Ring percent={section.percent} tone={current ? 'text-primary-foreground' : tone} />
                <span className="absolute text-[10px] font-bold">
                  {done && !current ? <Check className="h-3 w-3" strokeWidth={4} /> : section.step}
                </span>
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="hidden sm:inline">{stepLabel(section.step)}</span>
                <span className={`text-[10px] font-semibold tabular-nums ${current ? 'opacity-90' : 'opacity-80'}`}>{section.percent}%</span>
              </span>
              {isUnsaved && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-amber-500"
                  aria-label={tf('unsaved')}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
