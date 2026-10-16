// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, FileCheck, FileText, Mic, Sparkles } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { A, T, Typed, Window, Toast, Tick, SampleTag, FitBox } from './mockui';

/*
 * "Comprehensive Features" bento grid.
 * Each card pairs the existing title + description with an animated mock-up
 * of the real screen for that feature (sample data only). Animations only run while the grid is
 * on screen and are disabled for reduced-motion users (see .bt-* in index.css).
 */

export interface BentoFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

/* colour literals match the tokens in index.css */
const C = {
  brand: '#366e6b',
  brandStrong: '#2a5956',
  deep: '#1e4341',
  tint: '#eef5f4',
  soft: '#d4e6e4',
  cta: '#c14e0b',
  saffronTint: '#fff1e6',
  line: '#dce3e3',
  grey: '#7f8c90',
};

const Bar: React.FC<{ w: string; c?: string; d?: number; cls?: string }> = ({ w, c = C.soft, d = 0, cls = 'bt-type' }) => (
  <span className={`bt ${cls} block h-2 rounded-full`} style={{ width: w, background: c, animationDelay: `${d}ms` }} />
);

/* ================= 1 · AI-Powered DPR Creation =================
   Guided question → answer typed → "Suggest with AI" → section drafts itself */
export const SceneAIDpr = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={480} h={300} pad={24} max={1.15}>
    <div className="relative h-full w-full">
      <Window
        title={tf('Guided DPR · Section 2 of 12')}
        right={
          <span className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold" style={{ background: T.tint, color: T.brandStrong }}>
            {tf('Auto-saved')}
          </span>
        }
      >
        <div className="p-4">
          {/* section progress */}
          <div className="mb-3 flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < 1 ? T.brand : i === 1 ? T.cta : T.line }} />
            ))}
          </div>
          <div className="text-[10.5px] font-medium" style={{ color: T.muted }}>{tf('What will your unit produce?')}</div>
          <div className="hiw-field mt-1 flex h-8 items-center rounded-lg border px-2.5 text-[12.5px] font-medium" style={{ borderColor: T.line, color: T.ink, animationDelay: '150ms' }}>
            <Typed text={tf('Cold-pressed groundnut oil')} delay={300} dur={1100} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12px] font-semibold" style={{ color: T.ink }}>{tf('Executive summary')}</span>
            <span className="hiw-press flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: T.ctaTint, color: T.ctaText, animationDelay: '1700ms' }}>
              <Sparkles className="h-3 w-3" /> {tf('Suggest with AI')}
            </span>
          </div>
          <div className="relative mt-2 rounded-lg border p-2.5 text-[11px] leading-[1.55]" style={{ borderColor: T.line, color: T.ink, background: '#fbfcfc' }}>
            <A anim="fade" delay={2000} className="absolute right-2 top-2 flex items-center gap-1 text-[9px] font-semibold" style={{ color: T.ctaText }}>
              <Sparkles className="h-2.5 w-2.5" /> {tf('AI draft')}
            </A>
            <div><Typed text={tf('The proposed unit will produce cold-pressed')} delay={2200} dur={900} /></div>
            <div><Typed text={tf('groundnut oil for local retail and bulk buyers,')} delay={3100} dur={900} /></div>
            <div><Typed text={tf('with an installed capacity of 300 litres a day.')} delay={4000} dur={900} /></div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="flex h-7 items-center rounded-lg border px-3 text-[10.5px] font-semibold" style={{ borderColor: T.line, color: T.muted }}>{tf('Edit')}</span>
            <A anim="fade" delay={4900} className="hiw-press flex h-7 items-center gap-1 rounded-lg px-3 text-[10.5px] font-semibold text-white" style={{ background: T.brand, animationDelay: '4900ms' }}>
              {tf('Accept & continue')}
            </A>
          </div>
        </div>
      </Window>
      <SampleTag dark className="-bottom-1 left-1" />
    </div>
  </FitBox>
  );
};

/* ================= 3 · Bank-Ready Quality =================
   Readiness checks tick one by one, then the report is stamped bank-ready */
const BANK_CHECKS = ['Bank-standard format', 'Cost & means of finance', 'Projections & ratios', 'Compliance details'];
export const SceneBankReady = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={280} h={150}>
    <div className="relative h-full w-full rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: T.ink }}>{tf('Bank readiness check')}</span>
        <span className="text-[9.5px] font-semibold tabular-nums" style={{ color: T.muted }}>4 / 4</span>
      </div>
      <div className="space-y-1.5">
        {BANK_CHECKS.map((c, i) => (
          <div key={c} className="flex items-center gap-2 text-[10.5px]" style={{ color: T.ink }}>
            <Tick delay={300 + i * 450} size={14} />
            {tf(c)}
          </div>
        ))}
      </div>
      <A
        anim="pop"
        delay={2300}
        className="absolute bottom-2.5 right-2.5 flex -rotate-6 items-center gap-1 rounded-lg border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
        style={{ borderColor: T.ok, color: T.ok, background: T.okTint }}
      >
        <FileCheck className="h-3.5 w-3.5" /> {tf('Bank-ready')}
      </A>
    </div>
  </FitBox>
  );
};

/* ================= 4 · AI Chat Assistant =================
   Voice question → transcribed → assistant types → answers */
export const SceneChat = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={380} h={150}>
    <div className="relative flex h-full w-full flex-col gap-2 rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      {/* user message (voice) */}
      <div className="flex items-center justify-end gap-2">
        <A anim="rise" delay={1300} className="max-w-[78%] rounded-2xl rounded-br-md px-3 py-1.5 text-[11px] text-white" style={{ background: T.brand }}>
          <Typed text={tf('How much own contribution do I need?')} delay={1400} dur={900} />
        </A>
        <span className="relative flex h-7 w-7 flex-none items-center justify-center rounded-full text-white" style={{ background: T.cta }}>
          <Mic className="h-3.5 w-3.5" />
          <span className="hiw-listen absolute inset-0 rounded-full" />
        </span>
      </div>
      {/* assistant typing then answer */}
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full" style={{ background: T.ctaTint, color: T.ctaText }}>
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="relative min-h-[46px] flex-1">
          <A anim="fade" delay={2400} className="hiw-hide-at absolute left-0 top-0 flex h-7 items-center gap-1 rounded-2xl rounded-bl-md px-3" style={{ background: T.tint, animationDelay: '2400ms' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="hiw-dot h-1.5 w-1.5 rounded-full" style={{ background: T.brand, animationDelay: `${i * 150}ms` }} />
            ))}
          </A>
          <A anim="rise" delay={3300} className="rounded-2xl rounded-bl-md px-3 py-1.5 text-[11px] leading-snug" style={{ background: T.tint, color: T.ink }}>
            {tf("It depends on your category and scheme. I've added it to your Means of finance step.")}
          </A>
        </div>
      </div>
      {/* input bar */}
      <div className="mt-auto flex h-7 items-center gap-2 rounded-full border px-3 text-[10px]" style={{ borderColor: T.line, color: T.muted }}>
        <span className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="hiw-wave w-[2px] rounded-full" style={{ background: T.cta, animationDelay: `${i * 110}ms` }} />
          ))}
        </span>
        {tf('Listening…')}
      </div>
    </div>
  </FitBox>
  );
};

/* ================= 5 · Financial Suggestions =================
   Costs entered → AI suggests value within sector benchmark band */
const FIN_ROWS = [
  ['Raw materials', '₹ 38,40,000', 300],
  ['Power & fuel', '₹ 3,60,000', 800],
  ['Wages & salaries', '₹ 6,00,000', 1300],
];
export const SceneFinancial = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={380} h={150}>
    <div className="relative grid h-full w-full grid-cols-[1.25fr_1fr] gap-2.5 rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      <div>
        <div className="mb-1.5 text-[11px] font-semibold" style={{ color: T.ink }}>{tf('Annual operating cost')}</div>
        <div className="space-y-1">
          {FIN_ROWS.map(([l, v, d], i) => (
            <div key={l} className={`flex h-[26px] items-center justify-between rounded-md border px-2 text-[10px] ${i === 0 ? 'hiw-ai-fill' : ''}`} style={{ borderColor: T.line, animationDelay: i === 0 ? '2000ms' : undefined }}>
              <span style={{ color: T.muted }}>{tf(l)}</span>
              <Typed text={v} delay={d} className="font-semibold tabular-nums" style={{ color: T.ink }} />
            </div>
          ))}
        </div>
      </div>
      {/* benchmark panel */}
      <A anim="rise" delay={1800} className="flex flex-col rounded-lg p-2.5" style={{ background: T.ctaTint }}>
        <div className="flex items-center gap-1 text-[9.5px] font-semibold" style={{ color: T.ctaText }}>
          <Sparkles className="h-3 w-3" /> {tf('Sector benchmark')}
        </div>
        <div className="mt-1 text-[9.5px] leading-snug" style={{ color: T.ink }}>{tf('Raw materials, edible oil units')}</div>
        {/* band + marker */}
        <div className="relative mt-auto h-2 rounded-full bg-white">
          <span className="absolute inset-y-0 left-[45%] right-[25%] rounded-full" style={{ background: '#f5c9ab' }} />
          <span className="hiw-marker absolute -top-1 h-4 w-1 rounded-full" style={{ background: T.brand, animationDelay: '2300ms' }} />
        </div>
        <div className="mt-1 flex justify-between text-[8.5px] tabular-nums" style={{ color: T.muted }}>
          <span>{tf('Low')}</span>
          <A anim="fade" delay={2900} as="span" className="font-semibold" style={{ color: T.ok }}>{tf('Within range')}</A>
          <span>{tf('High')}</span>
        </div>
      </A>
      <SampleTag className="-bottom-4 left-0.5" />
    </div>
  </FitBox>
  );
};

/* ================= 6 · Scheme Recommendations =================
   Profile scanned → schemes matched with eligibility */
const SCHEMES = [
  ['PMEGP', 'Eligible', 500],
  ['CGTMSE', 'Eligible', 1000],
  ['AP CMEP', 'Check criteria', 1500],
];
export const SceneSchemes = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={280} h={150}>
    <div className="relative h-full w-full rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: T.ink }}>{tf('Matched schemes')}</span>
        <span className="text-[9px] font-semibold" style={{ color: T.muted }}>{tf('AP MSME ONE')}</span>
      </div>
      {/* scanning bar */}
      <div className="mb-2 h-1 overflow-hidden rounded-full" style={{ background: T.tint }}>
        <A anim="grow-x" delay={0} className="h-full w-full rounded-full" style={{ background: T.brand, animationDuration: '1600ms', animationTimingFunction: 'linear' }} />
      </div>
      <div className="space-y-1.5">
        {SCHEMES.map(([name, status, d], i) => (
          <A
            key={name}
            anim="rise"
            delay={d}
            className={`flex h-[26px] items-center justify-between rounded-md border px-2 text-[10.5px] font-semibold ${i === 0 ? 'hiw-match' : ''}`}
            style={{ borderColor: T.line, color: T.ink, animationDelay: `${d}ms` }}
          >
            <span className="flex items-center gap-1.5">
              {i < 2 ? <Tick delay={d + 200} size={13} /> : <span className="h-[13px] w-[13px] rounded-full border-2" style={{ borderColor: T.faint }} />}
              {name}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[8.5px]"
              style={i < 2 ? { background: T.okTint, color: T.ok } : { background: T.ctaTint, color: T.ctaText }}
            >
              {tf(status)}
            </span>
          </A>
        ))}
      </div>
    </div>
  </FitBox>
  );
};

/* ================= 7 · Quality Analytics =================
   Score ring fills while the three quality measures grow */
const QUALITY = [
  ['Completeness', 92],
  ['Bankability', 84],
  ['Consistency', 78],
];
export const SceneQuality = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={280} h={150}>
    <div className="relative flex h-full w-full items-center gap-3 rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      <div className="relative flex-none">
        <svg viewBox="0 0 100 100" className="h-[92px] w-[92px] -rotate-90">
          <circle cx="50" cy="50" r="40" stroke={T.tint} strokeWidth="11" fill="none" />
          <circle className="hiw-ring" cx="50" cy="50" r="40" stroke={T.brand} strokeWidth="11" strokeLinecap="round" fill="none" pathLength="100" style={{ ['--to' as any]: 14 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <A anim="pop" delay={1300} as="span" className="text-[20px] font-bold leading-none tabular-nums" style={{ color: T.ink }}>86</A>
          <span className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{tf('Score')}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-[11px] font-semibold" style={{ color: T.ink }}>{tf('DPR quality')}</div>
        {QUALITY.map(([l, v], i) => (
          <div key={l}>
            <div className="mb-0.5 flex justify-between text-[9.5px]" style={{ color: T.muted }}>
              <span>{tf(l)}</span>
              <A anim="fade" delay={900 + i * 250} as="span" className="font-semibold tabular-nums" style={{ color: T.ink }}>{v}</A>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: T.tint }}>
              <A anim="grow-x" delay={400 + i * 250} className="h-full rounded-full" style={{ width: `${v}%`, background: i === 1 ? T.cta : T.brand, animationDuration: '900ms' }} />
            </div>
          </div>
        ))}
      </div>
      <SampleTag className="-bottom-4 left-0.5" />
    </div>
  </FitBox>
  );
};

/* ================= 8 · Fast Track Export =================
   Choose format + language → export → file ready */
export const SceneExport = () => {
  const tf = useClusterFormText();
  return (
  <FitBox w={380} h={150}>
    <div className="relative h-full w-full rounded-xl border bg-white p-3 shadow-[0_14px_30px_-20px_rgba(16,52,50,0.5)]" style={{ borderColor: T.line }}>
      <div className="mb-2 text-[11px] font-semibold" style={{ color: T.ink }}>{tf('Export DPR')}</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['PDF', T.cta, true],
          ['DOCX', T.brandStrong, false],
        ].map(([label, c, sel]) => (
          <div
            key={label}
            className={`flex h-10 items-center gap-2 rounded-lg border px-2.5 text-[11px] font-semibold ${sel ? 'hiw-select' : ''}`}
            style={{ borderColor: T.line, color: T.ink, animationDelay: sel ? '400ms' : undefined }}
          >
            <span className="flex h-6 w-5 items-center justify-center rounded-[3px] bg-white shadow-sm" style={{ borderBottom: `3px solid ${c}` }}>
              <FileText className="h-3 w-3" style={{ color: c }} />
            </span>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: T.muted }}>
        {tf('Language')}
        <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: T.tint, color: T.brandStrong }}>English</span>
        <A anim="pop" delay={900} as="span" className="rounded px-1.5 py-0.5 font-semibold" style={{ background: T.ctaTint, color: T.ctaText }} lang="te">
          + తెలుగు
        </A>
      </div>
      <div className="relative mt-2.5 h-8 overflow-hidden rounded-lg text-[11px] font-semibold text-white" style={{ background: T.brand }}>
        <A anim="grow-x" delay={1500} className="absolute inset-0" style={{ background: T.brandStrong, animationDuration: '1400ms', animationTimingFunction: 'linear' }} />
        <span className="hiw-press relative flex h-full items-center justify-center gap-1.5" style={{ animationDelay: '1300ms' }}>
          <Download className="h-3.5 w-3.5" /> {tf('Export')}
        </span>
      </div>
      <Toast text={tf('DPR ready · PDF, 24 pages')} delay={3000} className="right-2 top-2" />
    </div>
  </FitBox>
  );
};

/* 2 · Bilingual Support — two rows of language tablets drifting in opposite
   directions; the ends are blurred and faded so the rows feel endless */
const LANG_PILLS = [
  { label: 'English', lang: 'en', tone: 'brand' },
  { label: 'తెలుగు', lang: 'te', tone: 'saffron' },
  { label: 'English + తెలుగు', lang: undefined, tone: 'soft' },
];

const LangPill: React.FC<{ p: (typeof LANG_PILLS)[number] }> = ({ p }) => (
  <span
    lang={p.lang}
    className="flex h-9 flex-none items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold"
    style={
      p.tone === 'brand'
        ? { background: C.brand, color: '#fff' }
        : p.tone === 'saffron'
        ? { background: C.saffronTint, color: '#a8460d', boxShadow: `inset 0 0 0 1px #fde0cc` }
        : { background: C.tint, color: C.brandStrong, boxShadow: `inset 0 0 0 1px ${C.soft}` }
    }
  >
    {p.label}
  </span>
);

const MarqueeRow: React.FC<{ reverse?: boolean; offset?: number }> = ({ reverse = false, offset = 0 }) => {
  // rotate the order per row so the two rows don't line up
  const base = [...LANG_PILLS.slice(offset), ...LANG_PILLS.slice(0, offset)];
  const set = [...base, ...base]; // one "set" – wide enough to overflow the card
  return (
    <div className="flex overflow-hidden">
      {/* two identical sets; the track slides by exactly one set for a seamless loop */}
      <div className={`bt bt-marquee flex flex-none gap-2.5 pr-2.5 ${reverse ? 'bt-marquee-rev' : ''}`}>
        {set.map((p, i) => <LangPill key={`a${i}`} p={p} />)}
        {set.map((p, i) => <LangPill key={`b${i}`} p={p} />)}
      </div>
    </div>
  );
};

export const SceneBilingual = () => (
  <div className="relative flex h-full flex-col justify-center gap-2.5 overflow-hidden">
    <MarqueeRow />
    <MarqueeRow reverse offset={1} />
    {/* blurred + faded ends */}
    <span className="bt-edge pointer-events-none absolute inset-y-0 left-0 w-14 backdrop-blur-[3px]" style={{ WebkitMaskImage: 'linear-gradient(to right, #000, transparent)', maskImage: 'linear-gradient(to right, #000, transparent)' }} />
    <span className="bt-edge pointer-events-none absolute inset-y-0 right-0 w-14 backdrop-blur-[3px]" style={{ WebkitMaskImage: 'linear-gradient(to left, #000, transparent)', maskImage: 'linear-gradient(to left, #000, transparent)' }} />
    <span className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
    <span className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
  </div>
);


/* layout + look per feature (same order as the features list) */
const CARDS = [
  { Scene: SceneAIDpr, span: 'md:col-span-2 lg:col-span-6 lg:row-span-2', tone: 'dark', visual: 'h-72 sm:h-80 lg:h-auto lg:min-h-[340px] lg:flex-1' },
  { Scene: SceneBilingual, span: 'lg:col-span-3', tone: 'light', visual: 'h-44 !px-0' },
  { Scene: SceneBankReady, span: 'lg:col-span-3', tone: 'light', visual: 'h-44' },
  { Scene: SceneChat, span: 'lg:col-span-4', tone: 'tint', visual: 'h-44' },
  { Scene: SceneFinancial, span: 'md:col-span-2 lg:col-span-4', tone: 'light', visual: 'h-44' },
  { Scene: SceneSchemes, span: 'lg:col-span-3', tone: 'light', visual: 'h-44' },
  { Scene: SceneQuality, span: 'lg:col-span-3', tone: 'light', visual: 'h-44' },
  { Scene: SceneExport, span: 'lg:col-span-4', tone: 'light', visual: 'h-44' },
];

// Grid (lg, 12 columns):
//   [ AI DPR 6×2 ][ Bilingual 3 ][ Bank-ready 3 ]
//   [           ][ Schemes 3   ][ Analytics 3  ]
//   [ AI Chat 4 ][ Fast track export 4 ][ Financial suggestions 4 ]   <- kept together
const ORDER = [0, 1, 2, 5, 6, 3, 7, 4];

export const FeaturesBento: React.FC<{ features: BentoFeature[] }> = ({ features }) => {
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);
  const [cycle, setCycle] = useState(0);

  // Replay every card's mock-up while the grid is on screen.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setCycle((c) => c + 1);
    const t = window.setInterval(() => setCycle((c) => c + 1), 7000);
    return () => window.clearInterval(t);
  }, [inView]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ul
      ref={ref}
      data-anim={inView ? 'on' : 'off'}
      className="bt-scope grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5"
    >
      {ORDER.map((fi) => {
        const feature = features[fi];
        if (!feature) return null;
        const { Scene, span, tone, visual } = CARDS[fi];
        const Icon = feature.icon;
        const dark = tone === 'dark';
        const band = tone === 'band';
        return (
          <li
            key={feature.title}
            className={`group relative flex overflow-hidden rounded-2xl border transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(16,52,50,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${span} ${
              dark
                ? 'on-dark flex-col border-transparent bg-[#1e4341] text-white'
                : tone === 'tint'
                ? 'flex-col border-[#d4e6e4] bg-[#eef5f4]'
                : band
                ? 'flex-col border-[#dce3e3] bg-white lg:flex-row lg:items-center'
                : 'flex-col border-[#dce3e3] bg-white'
            }`}
          >
            {/* illustration */}
            <div
              className={`relative ${visual} ${band ? 'order-1 w-full p-4 lg:order-2 lg:w-[55%] lg:py-6' : 'p-4 pb-0'} ${
                dark ? 'pattern-lattice-dark !bg-transparent' : ''
              }`}
              aria-hidden="true"
            >
              {fi === 1 ? <Scene /> : <Scene key={cycle} />}
            </div>
            {/* copy */}
            <div className={`relative p-6 pt-4 ${band ? 'order-2 lg:order-1 lg:w-[45%] lg:p-8' : ''} ${dark ? 'lg:p-8 lg:pt-4' : ''}`}>
              <span
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                  dark ? 'bg-white/10 text-white ring-1 ring-inset ring-white/20' : 'bg-[#eef5f4] text-[#366e6b] ring-1 ring-inset ring-[#d4e6e4]'
                } ${tone === 'tint' ? '!bg-white' : ''}`}
                aria-hidden="true"
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <h3 className={`font-semibold leading-snug ${dark ? 'text-2xl text-white lg:text-[1.75rem]' : 'text-lg text-ink'}`}>
                {feature.title}
              </h3>
              <p
                className={`mt-1.5 leading-relaxed ${
                  dark ? 'max-w-md text-base text-[#d4e6e4] lg:text-lg' : 'text-[15px] text-ink-muted'
                }`}
              >
                {feature.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
