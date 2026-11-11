// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/*
 * Small building blocks for the animated product mock-ups on the homepage.
 * Everything here is decorative (callers render it inside aria-hidden
 * containers) and uses the one-shot .hiw-* animations from index.css; callers
 * remount a scene (change its key) to replay it.
 */

export const T = {
  brand: '#366e6b',
  brandStrong: '#2a5956',
  deep: '#1e4341',
  tint: '#eef5f4',
  soft: '#d4e6e4',
  cta: '#c14e0b',
  ctaText: '#a8460d',
  ctaTint: '#fff1e6',
  line: '#e3e9e9',
  ink: '#162326',
  muted: '#5b686e',
  faint: '#9aa6aa',
  ok: '#1f7a55',
  okTint: '#e4f4ec',
};

type Anim = 'rise' | 'pop' | 'grow-x' | 'grow-y' | 'fade';

/** Element that plays a one-shot entrance animation after `delay` ms. */
export const A: React.FC<{
  as?: any;
  anim: Anim;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ as: Tag = 'div', anim, delay = 0, className = '', style, children }) => (
  <Tag className={`hiw-anim hiw-${anim} ${className}`} style={{ animationDelay: `${delay}ms`, ...style }}>
    {children}
  </Tag>
);

/** Text that types in from left to right. */
export const Typed: React.FC<{ text: string; delay: number; dur?: number; className?: string; style?: React.CSSProperties }> = ({
  text,
  delay,
  dur = 700,
  className = '',
  style,
}) => (
  <span
    className={`hiw-type inline-block whitespace-nowrap ${className}`}
    style={{
      animationDelay: `${delay}ms`,
      animationDuration: `${dur}ms`,
      animationTimingFunction: `steps(${Math.max(4, text.length)})`,
      ...style,
    }}
  >
    {text}
  </span>
);

/** App-window frame with a title bar. */
export const Window: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  right,
  children,
  className = '',
}) => (
  <div
    className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left shadow-[0_24px_50px_-28px_rgba(16,52,50,0.55)] ${className}`}
    style={{ borderColor: T.line }}
  >
    <div className="flex items-center gap-1.5 border-b px-3.5 py-2.5" style={{ borderColor: T.line }}>
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="h-2 w-2 rounded-full bg-[#e3e9e9]" />
      <span className="ml-2 truncate text-[11px] font-semibold tracking-wide" style={{ color: T.muted }}>
        {title}
      </span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
    {children}
  </div>
);

/** Dark pill notification. */
export const Toast: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className = '' }) => (
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

/** Round tick that pops in after `delay`. */
export const Tick: React.FC<{ delay: number; size?: number; color?: string }> = ({ delay, size = 16, color = T.brand }) => (
  <span
    className="relative flex flex-none items-center justify-center rounded-full border"
    style={{ width: size, height: size, borderColor: T.line }}
  >
    <A anim="pop" delay={delay} className="absolute inset-[-1px] flex items-center justify-center rounded-full" style={{ background: color }}>
      <Check style={{ width: size * 0.62, height: size * 0.62 }} className="text-white" strokeWidth={4} />
    </A>
  </span>
);

/** Small "Sample data" caption so illustrative figures are never read as real. */
export const SampleTag: React.FC<{ className?: string; dark?: boolean }> = ({ className = '', dark }) => {
  const tf = useClusterFormText();
  return (
  <span
    className={`absolute text-[9px] font-semibold uppercase tracking-wider ${className}`}
    style={{ color: dark ? 'rgba(255,255,255,0.75)' : T.muted }}
  >
    {tf('Sample data')}
  </span>
  );
};

/**
 * Lays a scene out at a fixed design size (w × h) and scales it down to fit
 * its container, so the mock-up looks the same on every screen.
 */
export const FitBox: React.FC<{ w: number; h: number; pad?: number; max?: number; children: React.ReactNode }> = ({ w, h, pad = 12, max = 1, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(max, (el.clientWidth - pad * 2) / w, (el.clientHeight - pad) / h);
      setScale(Math.max(0.4, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h, pad, max]);
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex-none" style={{ width: w, height: h, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
};
