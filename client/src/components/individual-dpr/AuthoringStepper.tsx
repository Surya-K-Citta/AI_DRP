import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import {
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

const RING_R = 13.5;
const RING_LENGTH = 2 * Math.PI * RING_R;

export const AuthoringStepper: React.FC<Props> = ({
  sections,
  overall,
  unsaved,
  currentStep,
  onSelect,
  stepLabel,
}) => {
  const tf = useClusterFormText();
  const livePercent = overall.percent;

  // The strip scrolls sideways only. overflow-y-hidden matters: a hovered (enlarged) dot or a name bubble can overflow it by a
  // pixel, and on systems with classic scrollbars that made a vertical scrollbar appear and vanish under the pointer, so the
  // strip flickered when the pointer crossed the lines between the dots. The current step's name hides only while a dot is
  // hovered (not over the lines), so crossing a line never blanks the names.

  // Keep the current step in view when the strip is wider than the screen, scrolling only the strip (not the page).
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    const button = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!strip || !button) return;
    const item = (button.parentElement as HTMLElement) || button;
    const target = item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' });
  }, [currentStep]);

  // Arrow keys move between the dots; Enter or Space opens one (they are buttons).
  // Esc puts the name bubbles away until the pointer or focus moves again (WCAG 1.4.13: content on hover or focus can be dismissed).
  const [hush, setHush] = useState(false);
  const onStripKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setHush(true);
      return;
    }
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (!(event.key in keys)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-step-dot]'));
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    event.preventDefault();
    const step = keys[event.key];
    const next = Math.max(0, Math.min(items.length - 1, Number.isFinite(step) ? at + step : step < 0 ? 0 : items.length - 1));
    items[next]?.focus();
  };

  return (
    <div>
      <div
        ref={stripRef}
        onKeyDown={onStripKey}
        onPointerMove={() => hush && setHush(false)}
        onFocusCapture={() => hush && setHush(false)}
        className="group/strip relative flex items-start overflow-x-auto overflow-y-hidden py-[26px] [scrollbar-width:thin] max-sm:pb-2 max-sm:pt-3"
        role="list"
        aria-label={tf('DPR steps')}
      >
        {/* Centred in the row while it fits; when it is wider than the screen it scrolls from the left instead. */}
        <div className="mx-auto flex w-max items-start">
        {sections.map((section, index) => {
          const current = section.step === currentStep;
          const done = section.status === 'complete';
          const isUnsaved = unsaved.has(section.step);
          const needed = section.requiredMissing || 0;
          const neededText = needed ? tf('{n} required answers missing').replace('{n}', String(needed)) : '';
          const first = index === 0;
          const last = index === sections.length - 1;
          const label = tf(section.title).replace(/^\s*(Step|దశ)\s*\d+\s*[:.\-–]\s*/i, "");
          // The name's bubble sits under the dot; at either end of the strip it is held to that side so it is never cut off.
          const bubbleSide = first ? 'left-0' : last ? 'right-0' : 'left-1/2 -translate-x-1/2';
          const arrowSide = first ? 'left-3' : last ? 'right-3' : 'left-1/2 -translate-x-1/2';
          return (
            <div key={section.step} role="listitem" className="relative flex w-9 shrink-0 justify-center sm:w-10">
              {!last ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[15px] h-0.5 w-full -translate-y-1/2 ${done ? 'bg-success/60' : 'bg-border'}`}
                />
              ) : null}
              <button
                type="button"
                data-step-dot
                onClick={() => onSelect(section.step)}
                aria-current={current ? 'step' : undefined}
                aria-label={`${stepLabel(index + 1)}: ${label}, ${section.percent}%${neededText ? `, ${neededText}` : ''}`}
                className="group/dot relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg viewBox="0 0 30 30" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="15" cy="15" r={RING_R} fill="none" strokeWidth="3" className="stroke-border" />
                  <circle
                    cx="15"
                    cy="15"
                    r={RING_R}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={`${done ? 'stroke-success' : 'stroke-primary'} transition-[stroke-dashoffset] duration-500 ease-out`}
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - Math.max(0, Math.min(100, section.percent)) / 100)}
                  />
                </svg>
                <span
                  className={`relative flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                    current
                      ? 'bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.16),0_2px_6px_rgba(16,24,40,0.25)]'
                      : done
                        ? 'bg-white text-success'
                        : 'bg-background text-muted-foreground group-hover/dot:text-foreground'
                  }`}
                >
                  {done && !current ? <Check className="h-3 w-3" strokeWidth={4} /> : index + 1}
                </span>
                {needed ? (
                  <span className="absolute -left-1.5 -top-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full border-2 border-background bg-red-600 px-0.5 text-[8px] font-bold leading-none text-white" aria-hidden="true">
                    {needed > 9 ? '9+' : needed}
                  </span>
                ) : null}
                {isUnsaved ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-amber-500" aria-hidden="true" /> : null}
                {/* The name of the step you are on stays in view; pointing at (or tabbing to) any dot shows that dot's name instead. */}
                <span
                  role="presentation"
                  className={`pointer-events-none absolute top-full z-20 mt-1 whitespace-nowrap max-sm:hidden rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium leading-none text-white shadow-md transition-opacity duration-150 ${hush ? 'invisible' : ''} ${bubbleSide} ${
                    current
                      ? 'opacity-100 group-has-[[data-step-dot]:hover]/strip:opacity-0 group-hover/dot:!opacity-100 group-focus-visible/dot:!opacity-100'
                      : 'opacity-0 group-hover/dot:opacity-100 group-focus-visible/dot:opacity-100'
                  }`}
                >
                  <span aria-hidden="true" className={`absolute -top-1 h-2 w-2 rotate-45 bg-slate-900 ${arrowSide}`} />
                  <span className="relative">{label}</span>
                </span>
              </button>
            </div>
          );
        })}
        </div>
      </div>
      {/* On a phone the step's name is a line of its own (a floating name would be cut off at the edge of the strip). */}
      {(() => {
        const at = sections.findIndex((section) => section.step === currentStep);
        const name = at >= 0 ? tf(sections[at].title).replace(/^\s*(Step|దశ)\s*\d+\s*[:.\-–]\s*/i, '') : '';
        return name ? (
          <p className="px-1 pb-2 text-xs font-medium text-foreground break-words sm:hidden" aria-hidden="true">
            {stepLabel(at + 1)} · {name}
          </p>
        ) : null;
      })()}
      {/* The bottom edge of the whole stepper is the progress bar: it fills along the border as the report is filled in. */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={livePercent}
        aria-label={tf('DPR progress')}
        className="pointer-events-none absolute inset-x-0 -bottom-px h-[3px] bg-border"
      >
        <div className="h-full rounded-r-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${livePercent}%` }} />
      </div>
    </div>
  );
};
