/**
 * Number boxes take zero and above only, everywhere in the app: no minus sign, the arrows and arrow keys stop at 0,
 * pasted or spoken negatives become positive, and the mouse wheel never nudges the value. A box that really needs a negative
 * says so with its own negative `min`, and is left alone.
 */
const isNumberBox = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.type === 'number';

const allowsNegative = (el: HTMLInputElement) => {
  const min = el.getAttribute('min');
  return min !== null && min !== '' && Number(min) < 0;
};

let installed = false;

export function installPositiveNumbers() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'focusin',
    (event) => {
      const el = event.target;
      if (isNumberBox(el) && !el.hasAttribute('min')) el.min = '0'; // the spin arrows and up/down keys now stop at 0
    },
    true
  );

  document.addEventListener(
    'keydown',
    (event) => {
      const el = event.target;
      if (!isNumberBox(el) || allowsNegative(el) || event.ctrlKey || event.metaKey) return;
      if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') event.preventDefault();
    },
    true
  );

  document.addEventListener(
    'beforeinput',
    (event) => {
      const el = event.target;
      if (!isNumberBox(el) || allowsNegative(el)) return;
      const data = (event as InputEvent).data;
      if (data && /[-+eE]/.test(data)) event.preventDefault();
    },
    true
  );

  document.addEventListener(
    'paste',
    (event) => {
      const el = event.target;
      if (!isNumberBox(el) || allowsNegative(el)) return;
      const text = event.clipboardData?.getData('text') ?? '';
      if (/[-+eE]/.test(text)) event.preventDefault();
    },
    true
  );

  // A negative that still gets in (filled by code, voice or autofill) is turned into its positive.
  document.addEventListener(
    'input',
    (event) => {
      const el = event.target;
      if (!isNumberBox(el) || allowsNegative(el)) return;
      const n = Number(el.value);
      if (el.value !== '' && Number.isFinite(n) && n < 0) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, String(Math.abs(n)));
      }
    },
    true
  );

  // Scrolling the page over a focused number box must not change its value.
  document.addEventListener(
    'wheel',
    (event) => {
      const el = event.target;
      if (isNumberBox(el) && document.activeElement === el) el.blur();
    },
    { capture: true, passive: true }
  );
}
