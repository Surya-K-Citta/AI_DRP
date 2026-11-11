/**
 * Safety net for form labels across the whole app. Many screens write a <label> next to a control without linking the two, so a
 * screen reader reads the control with no name. This links each such label to the control that follows it (only where the control has no
 * name of its own). New screens should still use `htmlFor` / `id` or the shared Input component; this catches the ones that do not.
 */
const CONTROL = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea';
const done = new WeakSet<Element>();
let counter = 0;

const hasName = (control: HTMLElement) =>
  control.hasAttribute('aria-label') ||
  control.hasAttribute('aria-labelledby') ||
  ((control as HTMLInputElement).labels?.length ?? 0) > 0;

function linkLabels(root: ParentNode) {
  root.querySelectorAll<HTMLLabelElement>('label:not([for])').forEach((label) => {
    if (done.has(label)) return;
    done.add(label);
    if (label.querySelector(CONTROL)) return; // the control is inside the label: already linked
    const next = label.nextElementSibling as HTMLElement | null;
    if (!next) return;
    const control = (next.matches(CONTROL) ? next : next.querySelector<HTMLElement>(CONTROL)) as HTMLElement | null;
    if (!control || hasName(control)) return;
    // Only when the label is the single label of that control's neighbourhood (a control wrapped with several controls is left alone).
    if (next !== control && next.querySelectorAll(CONTROL).length !== 1) return;
    if (!control.id) control.id = `a11y-field-${(counter += 1)}`;
    label.htmlFor = control.id;
  });
}

export function installLabelLinks() {
  if (typeof document === 'undefined') return;
  let timer = 0;
  const run = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => linkLabels(document), 250);
  };
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  run();
}
