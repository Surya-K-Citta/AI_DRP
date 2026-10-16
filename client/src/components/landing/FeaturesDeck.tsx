// @ts-nocheck
import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SceneAIDpr,
  SceneBilingual,
  SceneBankReady,
  SceneChat,
  SceneFinancial,
  SceneSchemes,
  SceneQuality,
  SceneExport,
} from './FeaturesBento';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import type { BentoFeature } from './FeaturesBento';

/*
 * Comprehensive Features: heading stays fixed on the left; the eight feature
 * cards come forward one at a time on the right as a stacked deck. The deck
 * advances on its own, pauses while the visitor interacts, and can be driven
 * with the feature list, the arrow buttons or the keyboard.
 */

const AUTO_MS = 7000;

// same order as the features array in Landing.tsx
const SCENES = [SceneAIDpr, SceneBilingual, SceneBankReady, SceneChat, SceneFinancial, SceneSchemes, SceneQuality, SceneExport];

const useDeck = (count: number) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setInView(true);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !paused && !reduced;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % count), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, running, count]);

  const bind = {
    ref,
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
    },
  };
  return { active, setActive, running, bind };
};

const ArrowButton: React.FC<{ dir: 'prev' | 'next'; onClick: () => void }> = ({ dir, onClick }) => {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous feature' : 'Next feature'}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink-muted transition-colors hover:border-[#366e6b] hover:text-[#2a5956]"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export const FeaturesShowcase: React.FC<{ features: BentoFeature[]; heading: React.ReactNode }> = ({ features, heading }) => {
  const tf = useClusterFormText();
  const n = features.length;
  const { active, setActive, running, bind } = useDeck(n);
  const panelId = `features-deck-${useId()}`;
  const prev = () => setActive((active - 1 + n) % n);
  const next = () => setActive((active + 1) % n);

  return (
    <div {...bind} className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      {/* ---------- static left column ---------- */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {heading}

        {/* feature index (desktop) */}
        <ol role="tablist" aria-label={tf('Features')} aria-orientation="vertical" className="mt-8 hidden space-y-0.5 lg:block">
          {features.map((f, i) => {
            const selected = i === active;
            return (
              <li key={f.title} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  onClick={() => setActive(i)}
                  className="group flex w-full items-center gap-3 rounded-lg py-1.5 pr-2 text-left"
                >
                  <span className={`w-6 flex-none text-xs font-bold tabular-nums ${selected ? 'text-[#a8460d]' : 'text-ink-subtle'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`relative h-0.5 flex-none overflow-hidden rounded-full bg-line transition-all duration-500 ${selected ? 'w-10' : 'w-4'}`} aria-hidden="true">
                    {selected && (
                      <span
                        key={`${active}-${running}`}
                        className="absolute inset-0 origin-left rounded-full bg-[#366e6b]"
                        style={running ? { animation: `fd-progress ${AUTO_MS}ms linear forwards` } : undefined}
                      />
                    )}
                  </span>
                  <span className={`text-[15px] transition-colors ${selected ? 'font-semibold text-ink' : 'text-ink-subtle group-hover:text-ink-muted'}`}>
                    {f.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* counter + arrows (all sizes) */}
        <div className="mt-6 flex items-center gap-3 lg:mt-8">
          <ArrowButton dir="prev" onClick={prev} />
          <ArrowButton dir="next" onClick={next} />
          <span className="ml-1 text-sm font-semibold tabular-nums text-ink-muted" aria-live="polite">
            <span className="text-ink">{String(active + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ---------- moving deck ---------- */}
      <div id={panelId} role="tabpanel" aria-roledescription="carousel" aria-label={tf('Comprehensive features')}>
        <div className="relative grid pb-10">
          {features.map((f, i) => {
            const pos = (i - active + n) % n; // 0 front, 1–2 peeking behind, n-1 just left
            const Scene = SCENES[i];
            const Icon = f.icon;
            let style;
            if (pos === 0) style = { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, zIndex: 30 };
            else if (pos === n - 1) style = { transform: 'translate3d(-10%,0,0) scale(0.96)', opacity: 0, zIndex: 31, pointerEvents: 'none' };
            else if (pos <= 2) style = { transform: `translate3d(0,${pos * 18}px,0) scale(${1 - pos * 0.045})`, opacity: 1 - pos * 0.3, zIndex: 30 - pos };
            else style = { transform: 'translate3d(0,36px,0) scale(0.91)', opacity: 0, zIndex: 1 };
            return (
              <article
                key={f.title}
                aria-hidden={pos !== 0}
                inert={pos !== 0 ? '' : undefined}
                className="fd-card col-start-1 row-start-1 flex origin-bottom flex-col overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_28px_60px_-36px_rgba(16,52,50,0.55)]"
                style={style}
              >
                <div className="pattern-lattice relative h-64 border-b border-line sm:h-80" aria-hidden="true">
                  {pos === 0 ? <Scene key={`scene-${active}`} /> : pos <= 2 ? <Scene /> : null}
                </div>
                <div className="flex items-start gap-4 p-6 sm:p-8">
                  <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#eef5f4] text-[#366e6b] ring-1 ring-inset ring-[#d4e6e4]" aria-hidden="true">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div className={`min-w-0 ${pos === 0 ? 'fd-item' : ''}`}>
                    <h3 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">{f.title}</h3>
                    <p className="mt-1.5 text-base leading-relaxed text-ink-muted sm:text-[17px]">{f.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
