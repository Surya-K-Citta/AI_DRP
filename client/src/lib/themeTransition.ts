/**
 * Light <-> dark switch with a ripple: the new theme spreads out from the button as a circle whose edge is a
 * soft, translucent band (old and new themes blend through it), with thin faint rings riding in that band. Uses the View Transitions API where the browser has it (a true
 * reveal: old page underneath, new page spreading over it); elsewhere the colours fade and the rings still
 * play. Skipped entirely when the person asks for reduced motion.
 *
 * Kept light on purpose: the circle is a clip-path on the browser's own snapshot (GPU), the rings are three
 * stroked circles in one SVG driven by the same clock, with no blur or shadow, so every frame is cheap.
 */
let running = false;

const DURATION = 900;
const BEZIER = [0.45, 0.05, 0.2, 1] as const;
const EASING = `cubic-bezier(${BEZIER.join(',')})`;
/** Where each ring rides inside the soft edge (0 = outer edge, 1 = inner edge), and how strong it is. */
const RINGS = [
  { depth: 0.02, width: 2.5, alpha: 0.5 },
  { depth: 0.38, width: 2, alpha: 0.3 },
  { depth: 0.75, width: 1.5, alpha: 0.16 },
];
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Same curve as the CSS easing above, so the rings stay locked to the circle. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const err = sampleX(t) - x;
      const slope = slopeX(t);
      if (Math.abs(err) < 1e-4 || Math.abs(slope) < 1e-6) break;
      t -= err / slope;
    }
    return sampleY(Math.min(1, Math.max(0, t)));
  };
}
const ease = bezier(...BEZIER);

function buildRings(x: number, y: number) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;view-transition-name:theme-rings;';
  const circles = RINGS.map((ring) => {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', '0');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'hsl(var(--primary))');
    circle.setAttribute('stroke-width', String(ring.width));
    circle.setAttribute('stroke-opacity', '0');
    svg.appendChild(circle);
    return circle;
  });
  document.body.appendChild(svg);
  return { svg, circles };
}

export function rippleThemeChange(origin: { x: number; y: number }, apply: () => void): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || running) {
    apply();
    return;
  }
  running = true;
  const { x, y } = origin;
  const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const { svg, circles } = buildRings(x, y);
  // Width of the translucent band at the edge of the spreading circle.
  const feather = Math.round(Math.min(260, Math.max(120, maxRadius * 0.14)));
  const reach = maxRadius + feather;
  const soft = typeof CSS !== 'undefined' && 'registerProperty' in CSS;
  const root = document.documentElement;

  let frame = 0;
  const finish = () => {
    cancelAnimationFrame(frame);
    svg.remove();
    root.classList.remove('theme-switching', 'theme-ripple-soft');
    ['--ripple-x', '--ripple-y', '--ripple-feather'].forEach((name) => root.style.removeProperty(name));
    running = false;
  };

  /** One clock for the rings. `start` is when the circle begins to grow. */
  const play = (start: number) => {
    const tick = (now: number) => {
      const raw = Math.min(1, Math.max(0, (now - start) / DURATION));
      const edge = ease(raw) * reach;
      // Rings fade as the wave nears the corners, so nothing is left hanging at the end.
      const fade = 1 - Math.pow(raw, 2.2);
      circles.forEach((circle, index) => {
        const ring = RINGS[index];
        circle.setAttribute('r', String(Math.max(0, edge - ring.depth * feather)));
        circle.setAttribute('stroke-opacity', String(ring.alpha * fade * Math.min(1, raw * 12)));
      });
      if (raw < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  const doc = document as any;
  if (typeof doc.startViewTransition === 'function') {
    if (soft) {
      root.style.setProperty('--ripple-x', `${x}px`);
      root.style.setProperty('--ripple-y', `${y}px`);
      root.style.setProperty('--ripple-feather', `${feather}px`);
      root.classList.add('theme-ripple-soft');
    }
    const transition = doc.startViewTransition(apply);
    transition.ready
      .then(() => {
        // Soft edge: a feathered mask whose radius grows. Without custom-property animation, a hard circle.
        root.animate(
          soft
            ? { '--ripple-r': ['0px', `${reach}px`] }
            : { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
          { duration: DURATION, easing: EASING, fill: 'forwards', pseudoElement: '::view-transition-new(root)' }
        );
        play(performance.now());
      })
      .catch(() => undefined);
    transition.finished.then(finish, finish);
    return;
  }

  document.documentElement.classList.add('theme-switching');
  apply();
  play(performance.now());
  window.setTimeout(finish, DURATION + 100);
}
