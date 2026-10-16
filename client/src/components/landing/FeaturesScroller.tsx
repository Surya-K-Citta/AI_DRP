// @ts-nocheck
import { useClusterFormText } from '@/lib/clusterDprFormText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import type { BentoFeature } from './FeaturesBento';

/*
 * Comprehensive Features — scroll-driven horizontal carousel.
 *
 * On tablet/desktop the section pins to the viewport and vertical scrolling
 * moves the row of feature cards sideways. The first card starts centred;
 * once the last card reaches the centre the section unpins and the page
 * continues. A pill switcher shows (and jumps to) the current feature.
 *
 * On phones, or for reduced-motion users, it becomes a normal swipeable row
 * with scroll-snap — no scroll hijacking.
 */

// same order as the features array in Landing.tsx
const SCENES = [SceneAIDpr, SceneBilingual, SceneBankReady, SceneChat, SceneFinancial, SceneSchemes, SceneQuality, SceneExport];

const GAP = 24;
const SCROLL_RATIO = 0.8; // vertical px needed per horizontal px of travel

const FeatureCard: React.FC<{ f: BentoFeature; i: number; n: number; active?: boolean; Scene: React.FC; replay?: number }> = ({
  f,
  i,
  n,
  active,
  Scene,
  replay,
}) => {
  const Icon = f.icon;
  return (
    <article
      className="flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-line bg-white md:flex-row"
      aria-roledescription="slide"
      aria-label={`${i + 1} of ${n}`}
    >
      {/* text */}
      <div className="flex flex-none flex-col bg-[#f3f7f6] p-6 md:w-[44%] md:p-9">
        <span className="text-xs font-semibold tabular-nums tracking-[0.12em] text-ink-muted">
          {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <span
          className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#366e6b] ring-1 ring-inset ring-[#d4e6e4]"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <h3 className="type-h3 mt-4 text-ink md:mt-auto">{f.title}</h3>
        <p className="type-body mt-2 text-ink-muted">{f.description}</p>
      </div>
      {/* visual */}
      <div className="pattern-lattice relative h-60 min-w-0 flex-none overflow-hidden md:h-auto md:flex-1" aria-hidden="true">
        <Scene key={active ? `on-${replay}` : 'off'} />
      </div>
    </article>
  );
};

export const FeaturesScroller: React.FC<{ features: BentoFeature[]; heading: React.ReactNode }> = ({ features, heading }) => {
  const tf = useClusterFormText();
  const n = features.length;
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false); // scroll-driven mode enabled?
  const [dims, setDims] = useState({ vw: 1280, vh: 800, cardW: 820, cardH: 380 });
  const [active, setActive] = useState(0);
  const [replay, setReplay] = useState(0);
  const activeRef = useRef(0);

  const step = dims.cardW + GAP;
  const travel = (n - 1) * step;
  const scrollLen = travel * SCROLL_RATIO;

  // decide mode + measure
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardW = Math.min(720, Math.round(vw * 0.6));
      const cardH = Math.max(300, Math.min(360, Math.round(vh * 0.4)));
      setDims({ vw, vh, cardW, cardH });
      setPinned(mq.matches);
    };
    measure();
    window.addEventListener('resize', measure);
    mq.addEventListener?.('change', measure);
    return () => {
      window.removeEventListener('resize', measure);
      mq.removeEventListener?.('change', measure);
    };
  }, []);

  // scroll → horizontal position
  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, scrollLen)));
      const x = dims.vw / 2 - dims.cardW / 2 - p * travel;
      track.style.transform = `translate3d(${x}px,0,0)`;
      // emphasise the card nearest the centre
      const pos = p * (n - 1);
      [...track.children].forEach((c: HTMLElement, i) => {
        const d = Math.min(1, Math.abs(i - pos));
        c.style.transform = `scale(${1 - d * 0.06})`;
        c.style.opacity = String(1 - d * 0.15);
      });
      const idx = Math.round(pos);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        setReplay((r) => r + 1);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pinned, dims, travel, scrollLen, n]);

  // swipe mode: track active card from horizontal scroll
  const onSwipeScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      const card = el.firstElementChild as HTMLElement;
      if (!card) return;
      const idx = Math.round(el.scrollLeft / (card.offsetWidth + 16));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
        setReplay((r) => r + 1);
      }
    },
    []
  );

  const goTo = (i: number) => {
    if (pinned) {
      const top = window.scrollY + sectionRef.current.getBoundingClientRect().top;
      window.scrollTo({ top: top + (i / (n - 1)) * scrollLen + 1, behavior: 'smooth' });
    } else {
      const el = trackRef.current;
      const card = el?.children[i] as HTMLElement;
      if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16, behavior: 'smooth' });
    }
  };

  const pills = (
    <div className="mt-8 flex justify-center px-4">
      <div
        role="tablist"
        aria-label={tf('Features')}
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-white p-1.5 shadow-[0_6px_20px_-14px_rgba(16,52,50,0.4)] scrollbar-hide"
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          const sel = i === active;
          return (
            <button
              key={f.title}
              type="button"
              role="tab"
              aria-selected={sel}
              aria-label={f.title}
              onClick={() => goTo(i)}
              className={`flex h-10 flex-none items-center gap-2 rounded-full px-3 text-sm font-medium transition-all duration-300 ${
                sel ? 'bg-[#c14e0b] px-4 text-white' : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className={`whitespace-nowrap ${sel ? 'inline' : 'hidden'}`}>{f.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!pinned) {
    // phones / reduced motion: swipeable row
    return (
      <section ref={sectionRef} aria-labelledby="features-title" className="bg-white py-16">
        <div className="page-container text-center">{heading}</div>
        {pills}
        <div
          ref={trackRef}
          onScroll={onSwipeScroll}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide"
        >
          {features.map((f, i) => (
            <div key={f.title} className="w-[86%] flex-none snap-center sm:w-[70%]">
              <FeatureCard f={f} i={i} n={n} Scene={SCENES[i]} active={i === active} replay={replay} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="features-title"
      className="relative bg-white"
      style={{ height: dims.vh + scrollLen }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        <div className="page-container text-center">{heading}</div>
        {pills}
        <div className="relative mt-8 md:mt-10" style={{ height: dims.cardH }}>
          <div
            ref={trackRef}
            className="absolute left-0 top-0 flex h-full will-change-transform"
            style={{ gap: GAP }}
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className="h-full flex-none origin-center transition-[opacity] duration-150"
                style={{ width: dims.cardW }}
              >
                <FeatureCard f={f} i={i} n={n} Scene={SCENES[i]} active={i === active} replay={replay} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
