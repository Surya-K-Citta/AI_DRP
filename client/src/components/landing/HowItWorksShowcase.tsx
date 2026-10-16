// @ts-nocheck
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileText,
  Landmark,
  Shield,
  Sparkles,
  User,
  UserCog,
} from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/*
 * "How It Works" – step list on the left, visual panel on the right.
 * Hovering, focusing or clicking a step swaps the panel. Each panel is a
 * looping mock-up of the real screens for that step (sample data only) (placeholder for real imagery:
 * pass `image` on a step to show a picture instead).
 */

export interface HowItWorksStep {
  title: string;
  description: string;
  image?: string; // optional real image to replace the animation later
  imageAlt?: string;
}

const LOOP_MS = 6000; // replay the step animation every few seconds
const AUTO_MS = 6000; // time on each step before moving to the next

/* Small helper: element that plays a keyframe animation after a delay */
const A: React.FC<{
  as?: any;
  anim: 'rise' | 'pop' | 'grow-x' | 'grow-y' | 'fade';
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ as: Tag = 'div', anim, delay = 0, className = '', style, children }) => (
  <Tag className={`hiw-anim hiw-${anim} ${className}`} style={{ animationDelay: `${delay}ms`, ...style }}>
    {children}
  </Tag>
);

/* ---------- shared mock-UI pieces (decorative; the panel is aria-hidden) ---------- */
const T = {
  brand: '#366e6b',
  brandStrong: '#2a5956',
  tint: '#eef5f4',
  soft: '#d4e6e4',
  cta: '#c14e0b',
  line: '#e3e9e9',
  ink: '#162326',
  muted: '#5b686e',
};

/* Text that "types" in from left to right */
const Typed: React.FC<{ text: string; delay: number; dur?: number; className?: string }> = ({
  text,
  delay,
  dur = 700,
  className = '',
}) => (
  <span
    className={`hiw-type inline-block whitespace-nowrap ${className}`}
    style={{ animationDelay: `${delay}ms`, animationDuration: `${dur}ms`, animationTimingFunction: `steps(${Math.max(4, text.length)})` }}
  >
    {text}
  </span>
);

const Window: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left shadow-[0_24px_50px_-28px_rgba(16,52,50,0.55)] ${className}`} style={{ borderColor: T.line }}>
    <div className="flex items-center gap-1.5 border-b px-3.5 py-2.5" style={{ borderColor: T.line }}>
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="ml-2 text-[11px] font-semibold tracking-wide" style={{ color: T.muted }}>{title}</span>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: string; delay: number; caret?: boolean; focusDelay?: number }> = ({ label, value, delay, caret }) => (
  <div>
    <div className="mb-1 text-[10.5px] font-medium" style={{ color: T.muted }}>{label}</div>
    <div
      className="hiw-field flex h-8 items-center rounded-lg border px-2.5 text-[12.5px] font-medium"
      style={{ borderColor: T.line, color: T.ink, animationDelay: `${delay - 150}ms` }}
    >
      <Typed text={value} delay={delay} />
      {caret && <span className="hiw-caret ml-0.5 h-3.5 w-px" style={{ background: T.brand }} />}
    </div>
  </div>
);

const Toast: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className = '' }) => (
  <A
    anim="rise"
    delay={delay}
    className={`absolute z-20 flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#162326] px-3 py-2 text-[11.5px] font-medium text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] ${className}`}
  >
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#34a37a]">
      <Check className="h-2.5 w-2.5" strokeWidth={4} />
    </span>
    {text}
  </A>
);

/* ---- Step 1: Create account — fill the form, pick a role, agree, register ---- */
const CreateAccountScene = () => {
  const tf = useClusterFormText();
  return (
  <div className="relative w-[400px]">
    <Window title={tf('Create New Account')}>
      <div className="space-y-2.5 p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={tf('Full Name')} value="Ravi Kumar" delay={300} />
          <Field label={tf('Phone Number')} value="9876543210" delay={1100} />
        </div>
        <Field label={tf('Email')} value="ravi@example.com" delay={1900} caret />
        {/* role picker */}
        <div>
          <div className="mb-1 text-[10.5px] font-medium" style={{ color: T.muted }}>{tf('Select role')}</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              [Shield, 'Super Admin'],
              [UserCog, 'Consultant'],
              [Landmark, 'Govt Official'],
            ].map(([Icon, label], i) => (
              <div
                key={label}
                className={`relative flex h-9 items-center justify-center gap-1 rounded-lg border px-1 text-[10.5px] font-semibold ${i === 1 ? 'hiw-select' : ''}`}
                style={{ borderColor: T.line, color: T.muted }}
              >
                <Icon className="h-3.5 w-3.5 flex-none" />
                <span className="truncate">{tf(label)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* consent */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: T.ink }}>
          <span className="relative flex h-4 w-4 flex-none items-center justify-center rounded border" style={{ borderColor: '#9aa6aa' }}>
            <A anim="pop" delay={3100} className="absolute inset-[-1px] flex items-center justify-center rounded" style={{ background: T.brand }}>
              <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
            </A>
          </span>
          {tf('I have read the privacy notice')}
        </div>
        <div className="hiw-press flex h-9 items-center justify-center rounded-lg text-[12.5px] font-semibold text-white" style={{ background: T.brand, animationDelay: '3600ms' }}>
          {tf('Register')}
        </div>
      </div>
    </Window>
    <Toast text={tf('Registration successful!')} delay={4100} className="-bottom-7 left-1/2 -translate-x-1/2" />
  </div>
  );
};

/* ---- Step 2: Build your project — guided steps, AI suggestion, totals ---- */
const COST_ROWS = [
  ['Land & building', '₹ 6,00,000', 300],
  ['Plant & machinery', '₹ 12,50,000', 900],
  ['Working capital', '₹ 3,40,000', 2600],
];
const BuildProjectScene = () => {
  const tf = useClusterFormText();
  return (
  <div className="relative w-[440px]">
    <Window title={tf('DPR Builder · Step 3 of 5')}>
      <div className="grid grid-cols-[140px_1fr]">
        {/* guided steps */}
        <div className="space-y-1 border-r p-2.5" style={{ borderColor: T.line, background: '#f7fafa' }}>
          {['Project details', 'Promoter profile', 'Project cost', 'Means of finance', 'Projections'].map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1.5 text-[10px] font-medium ${i === 2 ? 'bg-white shadow-sm' : ''}`}
              style={{ color: i <= 2 ? T.ink : '#9aa6aa' }}
            >
              <span
                className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full"
                style={{ background: i < 2 ? T.brand : i === 2 ? T.cta : T.line }}
              >
                {i < 2 && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
              </span>
              <span>{tf(s)}</span>
            </div>
          ))}
        </div>
        {/* project cost form */}
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold" style={{ color: T.ink }}>{tf('Project cost')}</span>
            <span className="hiw-press flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: '#fff1e6', color: '#a8460d', animationDelay: '1700ms' }}>
              <Sparkles className="h-3 w-3" /> {tf('Fill with AI')}
            </span>
          </div>
          <div className="space-y-1.5">
            {COST_ROWS.map(([label, val, d], i) => (
              <div
                key={label}
                className={`flex h-8 items-center justify-between rounded-lg border px-2.5 text-[11px] ${i === 2 ? 'hiw-ai-fill' : ''}`}
                style={{ borderColor: T.line, animationDelay: i === 2 ? '2400ms' : undefined }}
              >
                <span style={{ color: T.muted }}>{tf(label)}</span>
                <Typed text={val} delay={d} className="font-semibold tabular-nums" />
              </div>
            ))}
          </div>
          <A anim="fade" delay={3300} className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-[11.5px] font-semibold" style={{ borderColor: T.line, color: T.ink }}>
            <span>{tf('Total project cost')}</span>
            <span className="tabular-nums" style={{ color: T.brandStrong }}>₹ 21,90,000</span>
          </A>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: T.tint }}>
            <A anim="grow-x" delay={3600} className="h-full w-[60%] rounded-full" style={{ background: T.brand, animationDuration: '900ms' }} />
          </div>
        </div>
      </div>
    </Window>
    {/* AI suggestion */}
    <A
      anim="rise"
      delay={2000}
      className="absolute -bottom-12 right-4 z-20 w-[58%] rounded-xl border bg-white p-2.5 shadow-[0_16px_34px_-16px_rgba(16,52,50,0.55)]"
      style={{ borderColor: '#fde0cc' }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: '#a8460d' }}>
        <Sparkles className="h-3 w-3" /> {tf('AI suggestion')}
      </div>
      <div className="text-[10.5px] leading-snug" style={{ color: T.ink }}>
        {tf('Working capital based on sector benchmarks')}
      </div>
    </A>
    <span className="absolute -bottom-6 left-1 text-[9.5px] font-medium uppercase tracking-wider" style={{ color: '#5b686e' }}>{tf('Sample data')}</span>
  </div>
  );
};

/* ---- Step 3: Generate & export — sections compile, report ready, download ---- */
const SECTIONS = ['Executive summary', 'Project cost & finance', 'Financial projections', 'Scheme eligibility'];
const ExportScene = () => {
  const tf = useClusterFormText();
  return (
  <div className="relative w-[440px]">
    <Window title={tf('Generate DPR')}>
      <div className="grid grid-cols-[1fr_128px] gap-3 p-3.5">
        {/* generation checklist */}
        <div>
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold" style={{ color: T.ink }}>
            <span>{tf('Generating report')}</span>
            <A anim="fade" delay={2400} as="span" className="rounded-full px-1.5 py-0.5 text-[9.5px]" style={{ background: '#e4f4ec', color: '#1f7a55' }}>{tf('Ready')}</A>
          </div>
          <div className="mb-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: T.tint }}>
            <A anim="grow-x" delay={200} className="h-full w-full rounded-full" style={{ background: T.brand, animationDuration: '2200ms', animationTimingFunction: 'linear' }} />
          </div>
          <div className="space-y-1.5">
            {SECTIONS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-[11px]" style={{ color: T.ink }}>
                <span className="relative flex h-4 w-4 flex-none items-center justify-center rounded-full border" style={{ borderColor: T.line }}>
                  <A anim="pop" delay={500 + i * 500} className="absolute inset-[-1px] flex items-center justify-center rounded-full" style={{ background: T.brand }}>
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                  </A>
                </span>
                <span className="truncate">{tf(s)}</span>
              </div>
            ))}
          </div>
          {/* export buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ['PDF', T.cta, 3000],
              ['DOCX', T.brandStrong, 3200],
            ].map(([label, c, d]) => (
              <A key={label} anim="rise" delay={d} className={`flex h-8 items-center justify-center gap-1.5 rounded-lg border text-[11px] font-semibold `} style={{ borderColor: T.line, color: c, animationDelay: `${d}ms` }}>
                <Download className="h-3.5 w-3.5" /> {label}
              </A>
            ))}
          </div>
        </div>
        {/* report preview */}
        <A anim="rise" delay={1400} className="relative rounded-lg border bg-white p-2.5 shadow-sm" style={{ borderColor: T.line }}>
          <div className="mb-1.5 h-1 w-6 rounded-full" style={{ background: T.cta }} />
          <div className="text-[9.5px] font-bold leading-tight" style={{ color: T.ink }}>{tf('Detailed Project Report')}</div>
          <div className="mt-1 flex gap-1">
            <span className="rounded px-1 text-[8px] font-semibold" style={{ background: T.tint, color: T.brandStrong }}>{tf('English')}</span>
            <span className="rounded px-1 text-[8px] font-semibold" style={{ background: '#fff1e6', color: '#a8460d' }} lang="te">తెలుగు</span>
          </div>
          <div className="mt-2 flex h-10 items-end gap-1 rounded bg-[#f7fafa] p-1">
            {[40, 60, 50, 75, 90].map((h, i) => (
              <A key={i} anim="grow-y" delay={1700 + i * 90} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 4 ? T.cta : T.brand }} />
            ))}
          </div>
          <div className="mt-2 space-y-1">
            {['95%', '80%', '88%'].map((w, i) => (
              <div key={i} className="h-1 rounded-full" style={{ width: w, background: T.soft }} />
            ))}
          </div>
        </A>
      </div>
    </Window>
    <Toast text={tf('DPR downloaded as PDF')} delay={3900} className="-bottom-7 right-4" />
  </div>
  );
};

const SCENES = [CreateAccountScene, BuildProjectScene, ExportScene];

export const HowItWorksShowcase: React.FC<{ steps: HowItWorksStep[] }> = ({ steps }) => {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false); // user is hovering / focused inside
  const [reduced, setReduced] = useState(false);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Scenes are laid out at a fixed desktop size and scaled to fit the panel,
  // so they look identical (just smaller) on phones.
  const panelRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - 40;
      const h = el.clientHeight - 90;
      setFit(Math.min(1, w / 440, h / 330));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!mq?.matches);
  }, []);

  // Step through 01 → 02 → 03 automatically; pause while the visitor interacts.
  const auto = !paused && !reduced;
  useEffect(() => {
    if (!auto) {
      const t = window.setInterval(() => setCycle((c) => c + 1), LOOP_MS);
      return () => window.clearInterval(t);
    }
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % steps.length);
      setCycle(0);
    }, AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, auto, steps.length]);

  const select = (i: number) => {
    if (i === active) return;
    setActive(i);
    setCycle(0);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = steps.length - 1;
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = last;
    if (next != null) {
      e.preventDefault();
      select(next);
      tabRefs.current[next]?.focus();
    }
  };

  const Scene = SCENES[active] || SCENES[0];
  const step = steps[active];

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      {/* Steps */}
      <ol
        role="tablist"
        aria-orientation="vertical"
        className="order-2 lg:order-1"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
        }}
      >
        {steps.map((s, i) => {
          const selected = i === active;
          const done = i < active;
          const isLast = i === steps.length - 1;
          return (
            <li key={s.title} role="presentation" className="relative">
              {/* connector to the next step: grey track, teal fill */}
              {!isLast && (
                <span
                  className="absolute bottom-0 left-[1.625rem] top-[4.25rem] w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-line sm:left-[1.875rem] sm:top-[4.75rem]"
                  style={{ bottom: '-0.5rem' }}
                  aria-hidden="true"
                >
                  <span
                    key={selected ? `run-${active}-${auto}` : 'static'}
                    className={`hiw-connector absolute inset-0 origin-top rounded-full bg-[#366e6b] ${
                      done ? 'scale-y-100' : selected && auto ? 'hiw-connector-run' : 'scale-y-0'
                    }`}
                    style={selected && auto ? { animationDuration: `${AUTO_MS}ms` } : undefined}
                  />
                </span>
              )}
              <button
                ref={(el) => (tabRefs.current[i] = el)}
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onMouseEnter={() => select(i)}
                onFocus={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group relative flex w-full items-start gap-4 rounded-2xl py-4 pl-1 pr-2 text-left sm:gap-5 sm:py-5"
              >
                {/* numbered circle */}
                <span
                  className={`relative z-10 flex h-11 w-11 flex-none items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors duration-300 sm:h-12 sm:w-12 sm:text-base ${
                    selected
                      ? 'hiw-glow bg-[#366e6b] text-white'
                      : done
                      ? 'border-2 border-[#366e6b] bg-white text-[#2a5956]'
                      : 'border-2 border-line bg-white text-ink-subtle group-hover:border-[#366e6b]/60'
                  }`}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 pt-1.5 sm:pt-2">
                  <span
                    className={`type-h3 block transition-colors ${
                      selected ? 'text-ink' : 'text-ink-subtle group-hover:text-ink-muted'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span
                    className={`type-body mt-1.5 block transition-colors ${
                      selected ? 'text-ink-muted' : 'text-ink-subtle'
                    }`}
                  >
                    {s.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Visual panel */}
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="order-1 min-w-0 lg:order-2"
      >
        <div ref={panelRef} className="pattern-lattice relative flex aspect-[1/1] w-full min-[480px]:aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-line">
          {step?.image ? (
            <img
              key={step.image}
              src={step.image}
              alt={step.imageAlt || ''}
              className="hiw-anim hiw-fade absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div key={`${active}-${cycle}`} className="hiw-anim hiw-fade absolute inset-0 flex items-center justify-center pb-6" aria-hidden="true">
              <div className="flex items-center justify-center" style={{ transform: `scale(${fit})` }}>
                <Scene />
              </div>
            </div>
          )}
          {/* step progress dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 bg-[#366e6b]' : 'w-1.5 bg-[#366e6b]/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
