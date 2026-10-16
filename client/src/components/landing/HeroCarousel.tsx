// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { HERO_CAROUSEL_IMAGES, type HeroCarouselImage } from './heroCarouselImages';

/*
 * Curved "inside a cylinder" image carousel.
 *
 * Cards drift continuously from right to left. Each card's size and 3D tilt
 * are derived from its horizontal position: large and angled towards the
 * viewer at the edges, small and flat in the centre. Position-to-screen
 * mapping is non-linear so the larger edge cards get proportionally more room
 * and the gaps stay even.
 */

// Base card box. Cards are scaled down from this, so keep it >= the largest
// rendered size to avoid upscaling images.
const BASE_W = 300;
const BASE_H = 400; // unused height reference (aspect is dynamic)
const ASPECT_CENTER = 1.3; // height / width at the centre
const ASPECT_EDGE = 1.5; // height / width at the viewport edge
const GAP = 8; // px between neighbouring cards
const K = 0.76; // centre-to-edge size ratio control (lower = stronger effect)
const MAX_TILT = 44; // degrees at the viewport edge
const SECONDS_PER_SLOT = 3.2; // drift speed

// Placeholder tones (APMSME palette) so the motion reads before images arrive.
const PLACEHOLDER_TONES = [
  'bg-[#dcebe9] text-[#2a5956]',
  'bg-[#fde6d8] text-[#a8460d]',
  'bg-[#e6ecee] text-[#44535a]',
  'bg-[#cfe3e0] text-[#1e4341]',
  'bg-[#fff1e6] text-[#a8460d]',
  'bg-[#e3eef0] text-[#2a5956]',
];

const slotsFor = (width: number) => (width >= 1024 ? 4 : width >= 640 ? 3 : 2.2);
const gapFor = (width: number) => (width >= 640 ? GAP : 6);
const CTA_GAP = 52; // px between the buttons row and the top of the centre cards
const ABOVE_ALLOWANCE = 40; // px the tall side cards may rise beside the buttons (desktop only)
const TOP_OFFSET = 16; // matches the margin above the carousel in Landing.tsx

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const HeroCarousel: React.FC<{ images?: HeroCarouselImage[] }> = ({ images = HERO_CAROUSEL_IMAGES }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetRef = useRef(0); // current drift, in slot units
  // Reduced-motion users get a static arrangement.
  const userPausedRef = useRef(prefersReducedMotion());
  const [height, setHeight] = useState(360);
  const widthRef = useRef(0);
  const fitRef = useRef(1); // height factor so the carousel fits the first screen
  const centreLineRef = useRef<number | null>(null); // y of the card centre line inside the box

  // Repeat the image list so the loop always has enough cards to cover the
  // viewport plus off-screen buffer on both sides.
  const cards = useMemo(() => {
    const list = images.length ? images : [{ src: '', alt: '' }];
    const needed = 13;
    const out = [];
    // repeat whole sets only, so the sequence never shows a partial repeat
    const total = Math.ceil(Math.max(needed, list.length) / list.length) * list.length;
    for (let i = 0; out.length < total; i++) {
      const img = list[i % list.length];
      out.push({ ...img, key: i, repeat: i >= list.length, tone: i % list.length });
    }
    return out;
  }, [images]);

  const layout = useCallback(() => {
    const W = widthRef.current;
    if (!W) return;
    const half = W / 2;
    const S = slotsFor(W); // slots between centre and edge
    const du = 1 / S; // slot spacing in normalised units (edge = 1)
    const span = cards.length * du;
    const t = offsetRef.current * du;

    cards.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      // position in [-span/2, span/2), drifting leftwards
      let u = ((i * du - t) % span + span) % span;
      if (u >= span / 2) u -= span;
      const a = Math.abs(u);
      const sign = u < 0 ? -1 : 1;

      const f = u * (K + (1 - K) * a); // screen position (edge ≈ ±1)
      const df = K + 2 * (1 - K) * a; // local stretch => card size
      const x = half + half * f;
      const tilt = -sign * Math.pow(Math.min(a, 1.3), 1.25) * MAX_TILT;
      // widen tilted cards a little so their projected width still fills the slot
      const w = Math.max(24, (half * du * df - gapFor(W)) / Math.pow(Math.cos((tilt * Math.PI) / 180), 0.7));
      const s = w / BASE_W;
      const aspect = ASPECT_CENTER + (ASPECT_EDGE - ASPECT_CENTER) * Math.min(a, 1.25);
      const opacity = a <= 0.92 ? 1 : Math.max(0, 1 - (a - 0.92) * 2.6);

      el.style.top = centreLineRef.current == null ? '50%' : `${centreLineRef.current}px`;
      el.style.transform = `translate3d(${x - BASE_W / 2}px, -50%, 0) perspective(${w * 2.3}px) rotateY(${tilt}deg) scale(${s})`;
      el.style.height = `${BASE_W * aspect * fitRef.current}px`;
      el.style.opacity = String(opacity);
      el.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
      el.style.zIndex = String(Math.round(a * 100));
    });
  }, [cards]);

  // Size tracking
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      widthRef.current = W;
      const half = W / 2;
      const S = slotsFor(W);
      const du = 1 / S;
      const gap = gapFor(W);
      // Measure real rendered heights (incl. perspective) of a card at the
      // centre and at the edge by briefly placing card 0 there at full size.
      // This runs synchronously, so nothing is painted in between.
      const probe = (u: number) => {
        const saved = offsetRef.current;
        offsetRef.current = -u * S; // puts card 0 at position u
        layout();
        const h = cardRefs.current[0]?.getBoundingClientRect().height || 0;
        offsetRef.current = saved;
        return h;
      };
      fitRef.current = 1;
      const centreH = probe(0);
      const edgeH = probe(0.97);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const available = window.innerHeight - top - 16;
      // Centre cards start just below the buttons. On tablet/desktop the tall
      // side cards may rise a little beside the buttons (clear of the text);
      // on phones the buttons are full width, so nothing rises above the box.
      const wide = W >= 768;
      const lead = wide ? CTA_GAP - TOP_OFFSET : 20;
      const allowance = wide ? ABOVE_ALLOWANCE : 0;
      const byRise = ((lead + allowance) * 2) / Math.max(1, edgeH - centreH);
      const byScreen = (available - lead) / ((centreH + edgeH) / 2);
      let fit = Math.min(1, byRise, byScreen);
      fit = Math.max(wide ? 0.78 : 0.75, fit);
      const centreLine = wide
        ? lead + (centreH * fit) / 2
        : Math.max(lead + (centreH * fit) / 2, (edgeH * fit) / 2 + 4);
      centreLineRef.current = centreLine;
      setHeight(Math.round(Math.max(centreLine + (edgeH * fit) / 2 + 12, 160)));
      fitRef.current = fit;
      layout();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    // re-measure once web fonts settle, as the heading height can change
    document.fonts?.ready?.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [layout]);

  // Animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!userPausedRef.current) {
        offsetRef.current += dt / SECONDS_PER_SLOT;
      }
      layout();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout]);

  return (
    // isolate: keep the cards' z-index stacking inside the carousel so they
    // never paint over the sticky header
    <div className="relative isolate">
      <div
        ref={wrapRef}
        className="relative w-full"
        style={{
          height,
          overflowX: 'clip',
          overflowY: 'visible',
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card.key}
            ref={(el) => (cardRefs.current[i] = el)}
            className="absolute left-0 top-1/2 origin-center will-change-transform"
            style={{ width: BASE_W, height: BASE_H, visibility: 'hidden' }}
            aria-hidden={card.repeat || !card.src || !card.alt ? true : undefined}
          >
            <div className="h-full w-full overflow-hidden rounded-[28px] bg-surface shadow-[0_24px_48px_-28px_rgba(16,40,40,0.55)] ring-1 ring-black/5">
              {card.src ? (
                <img
                  src={card.src}
                  alt={card.repeat ? '' : card.alt}
                  className="h-full w-full object-cover"
                  loading={i < 9 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i < 4 ? 'high' : 'auto'}
                  draggable={false}
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center ${PLACEHOLDER_TONES[card.tone % PLACEHOLDER_TONES.length]}`}
                >
                  <ImageIcon className="h-16 w-16 opacity-50" strokeWidth={1.4} aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
