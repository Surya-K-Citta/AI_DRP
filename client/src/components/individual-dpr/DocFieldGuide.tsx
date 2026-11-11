// @ts-nocheck
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useAuthStore } from '@/store/authStore';
import { FieldHelp } from '@/components/ui/FieldPrompt';
import { AISuggestions } from '@/components/cluster-dpr/AISuggestions';
import { AISuggestionsService } from '@/services/aiSuggestions.service';
import { getIndividualDocFields, readDocField } from '@/lib/individualDpr/individualDocModel';
import { getStepTitle, getContentStep, hideComplexCapex } from '@/lib/individualDpr/schemeFormConfig';
import { isLongProseField } from '@/lib/individualDpr/stepSuggestionCheck';
import { regenerateStepFieldSuggestion, applyCatalogSuggestionToForm } from '@/lib/individualDpr/fillAllStepsWithAi';
import { BUSINESS_SKILLS, matchBusinessSkillLocal } from '@/lib/individualDpr/businessSkills';
import { getUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { MicButton } from '@/components/ui/MicButton';
import { ModalFocus } from '@/components/ui/ModalFocus';
import { appendSpoken } from '@/lib/voice/spokenValue';
import { applyFieldValue } from '@/lib/individualDpr/applyFieldValue';
import { missingIndividualRequired } from '@/lib/requiredStepFields';

type Rect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

/** "step4.productionCapacity", "step12.machineryItems[2].unitCost" or "schemeExtras.craft" -> where the answer lives. */
function parsePath(path: string | null): { contentStep: number | null; name: string } | null {
  if (!path) return null;
  const step = /^step(\d+)\.([^.[]+)/.exec(path);
  if (step) return { contentStep: Number(step[1]), name: step[2] };
  const extra = /^schemeExtras\.([^.[]+)/.exec(path);
  return extra ? { contentStep: null, name: extra[1] } : null;
}

const selectorFor = (path: string) => `.individual-dpr-document [data-dpr-field="${path.replace(/"/g, '')}"]`;
const scrollerOf = (el: Element | null) => el?.closest('[data-dpr-scroll], #dpr-preview-scroll') as HTMLElement | null;

function rectOf(el: Element | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

/** Follows an element on screen: moves with scrolling, zoom, page re-flow and window resizes. */
function useLiveRect(path: string | null, active: boolean): { rect: Rect | null; visible: boolean; bounds: Rect | null } {
  const [state, setState] = useState<{ rect: Rect | null; visible: boolean; bounds: Rect | null }>({ rect: null, visible: false, bounds: null });
  useEffect(() => {
    if (!active || !path) {
      setState({ rect: null, visible: false, bounds: null });
      return undefined;
    }
    let frame = 0;
    let last = '';
    const tick = () => {
      const el = document.querySelector(selectorFor(path));
      const rect = rectOf(el);
      const scroller = scrollerOf(el);
      const raw = rectOf(scroller);
      // A toolbar can float over the top of the report; the guide keeps clear of that strip too.
      const inset = Number(scroller?.getAttribute('data-dpr-inset')) || 0;
      const box = raw ? { ...raw, top: raw.top + inset, height: raw.height - inset } : raw;
      const visible = !!rect && (!box || (rect.bottom > box.top + 4 && rect.top < box.bottom - 4 && rect.right > box.left && rect.left < box.right));
      const key = rect ? `${Math.round(rect.top)}|${Math.round(rect.left)}|${Math.round(rect.right)}|${Math.round(rect.bottom)}|${visible}|${box ? `${Math.round(box.top)}|${Math.round(box.bottom)}|${Math.round(box.left)}|${Math.round(box.right)}` : ''}` : 'none';
      if (key !== last) {
        last = key;
        setState({ rect, visible, bounds: box });
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [path, active]);
  return state;
}

function fillTokens(text: string, vars: Record<string, any> = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''));
}

/**
 * Document mode: the report is the form. This floats beside the answer you are typing in (never in the report, so nothing
 * is printed or exported and the page breaks do not move): what the answer means, an example, whether it is required,
 * anything the data checks say about it, and the AI tools for that one answer. Required answers that are still empty
 * carry a small floating "Required" tag, and a chip at the foot of the report jumps to the next one.
 */
export function DocFieldGuide({
  schemeCode,
  focusedPath,
  onDismiss,
  missing,
  findings,
  data,
  setStepData,
  getStepData,
  setSchemeExtras,
  onApplyText,
  onJump,
}: {
  schemeCode: string | null;
  focusedPath: string | null;
  onDismiss: () => void;
  missing: Array<{ path: string; label: string; step: number }>;
  findings: any[];
  data: any;
  setStepData: (step: number, stepData: any) => void;
  getStepData: (step: number) => any;
  setSchemeExtras: (extras: Record<string, any>) => void;
  onApplyText: (path: string, text: string) => void;
  onJump: (path: string) => void;
}) {
  const tf = useClusterFormText();
  const { t } = useTranslation();
  const aiAllowed = !!useAuthStore((s) => s.user?.privacy?.aiAssist);
  const popRef = useRef<HTMLDivElement>(null);
  const [popSize, setPopSize] = useState({ w: 340, h: 200 });
  const [busy, setBusy] = useState<'improve' | 'match' | 'suggest' | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [sectionAi, setSectionAi] = useState(false);

  const focus = parsePath(focusedPath);
  const contentStep = focus?.contentStep ?? null;
  const field = useMemo(
    () => (focus ? getIndividualDocFields(contentStep ?? 1, schemeCode, data?.ventureMatchAnswers?.budget).find((f) => f.name === focus.name) : null),
    [focus?.name, contentStep, schemeCode, data?.ventureMatchAnswers?.budget]
  );
  const stepOfField = contentStep ?? 1;
  const required = useMemo(
    () => (focus ? missingIndividualRequired(stepOfField, {}, schemeCode).some((item) => item.key === focus.name) : false),
    [focus?.name, stepOfField, schemeCode]
  );
  const isMissing = !!focusedPath && missing.some((item) => item.path === focusedPath);
  const notes = useMemo(
    // "Required and empty" is already said by the red note, so it is left out of the list of check results.
    () => (focus ? (findings || []).filter((f) => f.field === focus.name && (f.step == null || f.step === stepOfField) && !String(f.id).startsWith('required.')) : []),
    [findings, focus?.name, stepOfField]
  );
  const { rect, visible, bounds } = useLiveRect(focusedPath, !!focusedPath);

  // A new field: forget the last field's suggestion.
  useEffect(() => {
    setSuggestion(null);
    setBusy(null);
  }, [focusedPath]);

  useLayoutEffect(() => {
    const el = popRef.current;
    if (el && (Math.abs(el.offsetHeight - popSize.h) > 1 || Math.abs(el.offsetWidth - popSize.w) > 1)) setPopSize({ w: el.offsetWidth, h: el.offsetHeight });
  });

  // Esc, or a click away from the report and from this guide, puts it away.
  useEffect(() => {
    if (!focusedPath) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || popRef.current?.contains(target) || target.closest?.('.individual-dpr-document [data-dpr-field], [data-doc-guide-modal]')) return;
      onDismiss();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [focusedPath, onDismiss]);

  const write = (target: number, name: string, value: unknown) =>
    applyFieldValue({
      contentStep: target,
      schemeCode,
      field: name,
      value,
      getStepData,
      setStepData,
      getExtras: () => (data?.schemeExtras ? { ...data.schemeExtras } : {}),
      setSchemeExtras,
    });

  // Dictation into the answer that is being edited in the report, the same as the microphone in the form.
  const voiceEl = (): HTMLElement | null => (focusedPath ? (document.querySelector(selectorFor(focusedPath)) as HTMLElement | null) : null);
  const voiceKind: 'text' | 'number' = voiceEl()?.getAttribute('type') === 'number' ? 'number' : 'text';
  const speak = (spoken: string) => {
    const el = voiceEl();
    if (!el || !focusedPath) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const proto = el instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
      el.focus({ preventScroll: true });
      Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, spoken);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const long = !!field && isLongProseField(field.name);
      const next = long ? appendSpoken(el.textContent || '', spoken) : spoken;
      el.textContent = next;
      onApplyText(focusedPath, next);
    }
  };
  const canSpeak = (() => {
    const el = voiceEl();
    if (!el) return false;
    if (el instanceof HTMLSelectElement) return false;
    if (el instanceof HTMLInputElement) return ['text', 'number', 'tel', 'email', ''].includes(el.type) || !el.getAttribute('type');
    return true;
  })();

  const fieldText = field ? String(readDocField(field, data) ?? '').trim() : '';
  const manual = stepOfField === 1; // the cover is typed by hand, as in the form
  const canImprove = !!field && !manual && (isLongProseField(field.name) || fieldText.length > 60);
  const canMatch = field?.name === 'natureOfBusiness';
  const canSuggest = !!field && !manual && field.source !== undefined && !canMatch;

  const improve = async () => {
    if (!aiAllowed) return toast.error(t('privacy.aiOffWarning'));
    if (!fieldText) return toast.error(tf('Type something first, then Improve this.'));
    setBusy('improve');
    try {
      const step1 = data?.step1 || {};
      const improved = await AISuggestionsService.improveFieldText(field.name, fieldText, {
        fieldLabel: field.label,
        schemeCode,
        isIndividualDPR: true,
        unitName: getUnitName(step1),
        clusterName: step1.clusterName || '',
        district: step1.district || '',
        location: step1.location || '',
        natureOfBusiness: step1.natureOfBusiness || '',
      });
      if (!improved) return toast.error(tf('Could not improve this text. Try again.'));
      onApplyText(focusedPath, improved);
      toast.success(tf('Improved. Check it in the report.'));
    } catch {
      toast.error(tf('Could not improve this text. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const match = async () => {
    if (!fieldText) return toast.error(tf('Type what you do first, then Match me.'));
    const local = matchBusinessSkillLocal(fieldText);
    if (local) {
      write(1, 'natureOfBusiness', local);
      return toast.success(tf('Matched to: {skill}').replace('{skill}', local));
    }
    if (!aiAllowed) return toast.error(t('privacy.aiOffWarning'));
    setBusy('match');
    try {
      const step1 = data?.step1 || {};
      const skill = await AISuggestionsService.matchBusinessSkill(fieldText, [...BUSINESS_SKILLS], {
        unitName: getUnitName(step1),
        district: step1.district || '',
        location: step1.location || '',
        schemeCode,
      });
      if (!skill) return toast.error(tf('Could not match a skill. Try again with a clearer description.'));
      write(1, 'natureOfBusiness', skill);
      toast.success(tf('Matched to: {skill}').replace('{skill}', skill));
    } catch {
      toast.error(tf('Could not match a skill. Try again with a clearer description.'));
    } finally {
      setBusy(null);
    }
  };

  const suggest = async () => {
    if (!aiAllowed) return toast.error(t('privacy.aiOffWarning'));
    setBusy('suggest');
    try {
      const result = await regenerateStepFieldSuggestion({
        contentStep: stepOfField,
        field: field.name,
        label: field.label,
        source: field.source === 'extras' ? 'extras' : 'step',
        instruction: 'Suggest a suitable answer for this question.',
        currentSuggestion: fieldText,
        data,
        getStepData,
        schemeCode,
        answers: data?.ventureMatchAnswers || null,
      });
      if (!result?.suggestion) return toast.error(tf('Could not get a suggestion. Try again.'));
      setSuggestion(String(result.suggestion));
    } catch {
      toast.error(tf('Could not get a suggestion. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const applySuggestion = () => {
    if (!suggestion || !field) return;
    const result = applyCatalogSuggestionToForm({
      contentStep: stepOfField,
      suggestion: { field: field.name, label: field.label, suggestion, source: field.source === 'extras' ? 'extras' : 'step' },
      getStepData,
      setStepData,
      setSchemeExtras,
      schemeExtras: data?.schemeExtras,
      schemeCode,
    });
    if (!result.ok) return toast.error(tf('That suggestion does not fit this answer. Try again.'));
    setSuggestion(null);
    toast.success(tf('Applied. Check it in the report.'));
  };

  // ---- where to put the guide: beside the answer if there is room, otherwise under (or above) it. It is kept inside the report's own
  // visible area, so it never lies over the toolbar, the step strip or the side pane.
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const bl = bounds ? bounds.left : 0;
  const br = bounds ? bounds.right : winW;
  const bt = bounds ? bounds.top : 0;
  const bb = bounds ? bounds.bottom : winH;
  const maxH = Math.max(120, bb - bt - 16);
  const cardH = Math.min(popSize.h, maxH);
  let place: { left: number; top: number; side: 'right' | 'below' } | null = null;
  if (rect) {
    const roomRight = br - rect.right - 16;
    if (roomRight >= popSize.w) {
      const top = Math.min(Math.max(bt + 8, rect.top + rect.height / 2 - 28), Math.max(bt + 8, bb - cardH - 8));
      place = { left: rect.right + 14, top, side: 'right' };
    } else {
      const left = Math.min(Math.max(bl + 8, rect.left), Math.max(bl + 8, br - popSize.w - 8));
      const below = rect.bottom + 12;
      const aboveTop = rect.top - cardH - 12;
      // Under the answer if it fits, else above it, else held inside the report (never past its top or bottom edge).
      const top = below + cardH <= bb - 8 ? below : aboveTop >= bt + 8 ? aboveTop : Math.max(bt + 8, bb - cardH - 8);
      place = { left, top, side: 'below' };
    }
  }

  // One pointer for every case: a small triangle on the card's edge, turned to point at the answer. Level with the answer it points
  // straight at it; when the card has been held inside the window (answer near an edge, or the card above it) it tilts toward it.
  let triangle: { x: number; y: number; deg: number } | null = null;
  if (rect && place) {
    let baseX: number;
    let baseY: number;
    let anchorX: number;
    let anchorY: number;
    if (place.side === 'right') {
      anchorX = rect.right + 2;
      anchorY = rect.top + rect.height / 2;
      baseX = place.left;
      baseY = Math.min(Math.max(anchorY, place.top + 16), place.top + cardH - 16);
    } else {
      anchorX = rect.left + Math.min(rect.width, 80) / 2;
      const above = place.top + cardH <= rect.top;
      anchorY = above ? rect.top - 2 : rect.bottom + 2;
      baseX = Math.min(Math.max(anchorX, place.left + 16), place.left + popSize.w - 16);
      baseY = above ? place.top + cardH : place.top;
    }
    // The drawn triangle points left (180 degrees); turn it from there to the direction of the answer.
    const toAnchor = (Math.atan2(anchorY - baseY, anchorX - baseX) * 180) / Math.PI;
    triangle = { x: baseX - place.left, y: baseY - place.top, deg: toAnchor - 180 };
  }

  // Shown only when the whole card lies inside the report's visible area (and that area is known): never over the header or toolbar.
  const shown =
    visible &&
    !!bounds &&
    !!place &&
    place.top >= bt + 4 &&
    place.top + cardH <= bb + 4 &&
    place.left >= bl &&
    place.left + popSize.w <= br + 4;

  const sectionStep = stepOfField;

  const aiExclude =
    sectionStep === 1
      ? ['clusterName', 'unitName', 'location', 'district']
      : hideComplexCapex(schemeCode, data?.ventureMatchAnswers?.budget) && sectionStep === 12
        ? ['land', 'building', 'utilitiesAndInfrastructure', 'preliminaryAndPreOperative']
        : [];

  return (
    <>
      <RequiredMarks missing={missing} skipPath={focusedPath} />
      <NextRequiredChip missing={missing} focusedPath={focusedPath} onJump={onJump} />
      {focusedPath && field && rect && place
        ? createPortal(
            <div
              ref={popRef}
              role="dialog"
              aria-label={tf('Guide for this answer')}
              data-doc-guide
              className="no-print motion-pop fixed z-50 w-[340px] max-w-[92vw] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-2xl"
              // It fades in, but goes at once when its answer scrolls out of the report, so it is never seen over the toolbar or the headers.
              style={{ left: place.left, top: place.top, maxHeight: maxH, overflowY: 'auto', opacity: shown ? 1 : 0, pointerEvents: shown ? 'auto' : 'none', transition: shown ? 'opacity 150ms' : 'none' }}
              // Pressing a button here must not take the cursor out of the answer being typed.
              onMouseDown={(event) => {
                if (!(event.target as HTMLElement).closest('input, select, textarea')) event.preventDefault();
              }}
            >
              {triangle ? (
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="pointer-events-none absolute overflow-visible"
                  style={{ left: triangle.x - 15, top: triangle.y - 8, transformOrigin: '15px 8px', transform: `rotate(${triangle.deg}deg)` }}
                >
                  <polygon points="15,0.5 0,8 15,15.5" fill="#ffffff" />
                  <polyline points="15,0.5 0,8 15,15.5" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinejoin="round" />
                </svg>
              ) : null}
              <div style={{ maxHeight: maxH - 24, overflowY: 'auto' }}>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-semibold leading-snug text-slate-900">{tf(field.label)}</p>
                <span className="flex shrink-0 items-center gap-1.5">
                  {required ? (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">{tf('Required')}</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">{tf('Optional')}</span>
                  )}
                  {canSpeak ? (
                    <MicButton kind={voiceKind} label={tf(field.label)} onText={speak} />
                  ) : null}
                  <button type="button" onClick={onDismiss} aria-label={tf('Close')} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              </div>
              {isMissing ? (
                <p className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800">
                  {tf('This answer is needed before the DPR can be generated.')}
                </p>
              ) : null}
              <div className="mt-1">
                <FieldHelp label={field.label} />
              </div>
              {notes.length ? (
                <ul className="mt-2 space-y-1">
                  {notes.slice(0, 3).map((note) => (
                    <li key={note.id} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">
                      {fillTokens(tf(note.message), note.vars)}
                      {note.hint ? <span className="block text-red-700/80">{fillTokens(tf(note.hint), note.vars)}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {manual ? (
                <p className="mt-2 text-xs text-slate-500">{tf('The cover details are typed by hand. AI help starts from the next section.')}</p>
              ) : !aiAllowed ? (
                <p className="mt-2 text-xs text-slate-500">
                  {tf('AI help is off.')}{' '}
                  <Link to="/account/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
                    {tf('Turn on AI assist in Privacy settings')}
                  </Link>
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {canSuggest ? (
                    <button type="button" onClick={() => void suggest()} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
                      {busy === 'suggest' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3" aria-hidden="true" />}
                      {busy === 'suggest' ? tf('Getting suggestions…') : tf('Suggest an answer')}
                    </button>
                  ) : null}
                  {canImprove ? (
                    <button type="button" onClick={() => void improve()} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
                      {busy === 'improve' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3" aria-hidden="true" />}
                      {busy === 'improve' ? tf('Improving…') : tf('Improve this')}
                    </button>
                  ) : null}
                  {canMatch ? (
                    <button type="button" onClick={() => void match()} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
                      {busy === 'match' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3" aria-hidden="true" />}
                      {busy === 'match' ? tf('Matching…') : tf('Match me')}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setSectionAi(true)} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                    {tf('Fill the whole section with AI')}
                  </button>
                </div>
              )}
              {suggestion ? (
                <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
                  <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-xs text-slate-800">{suggestion}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={applySuggestion} className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90">{tf('Apply')}</button>
                    <button type="button" onClick={() => void suggest()} disabled={busy !== null} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{tf('Regenerate')}</button>
                    <button type="button" onClick={() => setSuggestion(null)} className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-800">{tf('Discard')}</button>
                  </div>
                </div>
              ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
      {sectionAi
        ? createPortal(
            <ModalFocus onEscape={() => setSectionAi(false)}>
            <div className="motion-overlay fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 no-print" data-doc-guide-modal onMouseDown={(event) => { if (event.target === event.currentTarget) setSectionAi(false); }}>
              <div role="dialog" aria-modal="true" aria-label={tf('AI help for this section')} className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{tf('AI help for this section')}</p>
                  <button type="button" onClick={() => setSectionAi(false)} aria-label={tf('Close')} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <AISuggestions
                  key={sectionStep}
                  data={data}
                  setStepData={setStepData}
                  getStepData={getStepData}
                  setSchemeExtras={setSchemeExtras}
                  isIndividualDPR
                  contextHint="This is an individual entrepreneur unit (one firm), not a multi-unit CFC / SPV report."
                  excludeFields={aiExclude}
                  currentStep={sectionStep}
                  currentStepData={data?.[`step${sectionStep}`] || {}}
                  onApplySuggestion={(name, content) => write(sectionStep, name, content)}
                />
              </div>
            </div>
            </ModalFocus>,
            document.body
          )
        : null}
    </>
  );
}

/**
 * A small "Required" tag at the corner of each required answer that is still empty. The tags live inside the report, positioned
 * from the report's own corner, so they scroll with the answers and never lag (they are measured again only when the layout
 * changes: zoom, page re-flow, typing). They are screen only (`no-print`).
 */
function RequiredMarks({ missing, skipPath }: { missing: Array<{ path: string; label: string; step: number }>; skipPath: string | null }) {
  const tf = useClusterFormText();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [marks, setMarks] = useState<Array<{ path: string; left: number; top: number }>>([]);

  // The report element can be replaced (mode switch, new step list): follow it.
  useEffect(() => {
    const find = () => {
      const el = document.querySelector('.individual-dpr-document') as HTMLElement | null;
      setRoot((current) => (current === el ? current : el));
    };
    find();
    const timer = window.setInterval(find, 600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!root || !missing.length) {
      setMarks([]);
      return undefined;
    }
    let frame = 0;
    let last = '';
    const measure = () => {
      frame = 0;
      const box = root.getBoundingClientRect();
      const scale = box.width / (root.offsetWidth || box.width) || 1;
      const next: Array<{ path: string; left: number; top: number }> = [];
      for (const item of missing) {
        if (next.length >= 60) break;
        const el = root.querySelector(`[data-dpr-field="${item.path.replace(/"/g, '')}"]`);
        const r = el?.getBoundingClientRect();
        if (!r || r.width === 0) continue;
        next.push({ path: item.path, left: Math.round((r.right - box.left) / scale), top: Math.round((r.top - box.top) / scale) });
      }
      const key = next.map((m) => `${m.path}:${m.left}:${m.top}`).join(',');
      if (key !== last) {
        last = key;
        setMarks(next);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const mutate = new MutationObserver((records) => {
      // Our own tags are added under the report; they must not trigger another measuring pass.
      if (records.every((record) => [...record.addedNodes, ...record.removedNodes].every((node) => (node as HTMLElement).dataset?.docGuide !== undefined))) return;
      schedule();
    });
    mutate.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    window.addEventListener('resize', schedule);
    const safety = window.setInterval(schedule, 1000);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resize.disconnect();
      mutate.disconnect();
      window.removeEventListener('resize', schedule);
      window.clearInterval(safety);
    };
  }, [root, missing]);

  if (!root || !marks.length) return null;
  return createPortal(
    <>
      {marks
        .filter((mark) => mark.path !== skipPath)
        .map((mark) => (
          <span
            key={mark.path}
            aria-hidden
            data-doc-guide
            className="no-print pointer-events-none absolute z-[5] rounded bg-red-600 px-1.5 py-px font-sans text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow"
            style={{ left: mark.left, top: mark.top, transform: 'translate(-100%, -60%)' }}
          >
            {tf('Required')}
          </span>
        ))}
    </>,
    root
  );
}

/** A floating chip at the foot of the report: how many required answers are left, and a button to the next one. */
function NextRequiredChip({ missing, focusedPath, onJump }: { missing: Array<{ path: string; label: string; step: number }>; focusedPath: string | null; onJump: (path: string) => void }) {
  const tf = useClusterFormText();
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!missing.length) {
      setAnchor(null);
      return undefined;
    }
    let frame = 0;
    let last = '';
    const tick = () => {
      const doc = document.querySelector('.individual-dpr-document');
      const box = rectOf(scrollerOf(doc));
      const next = box ? { left: Math.round(box.left + box.width / 2), top: Math.round(box.bottom - 14) } : null;
      const key = next ? `${next.left}:${next.top}` : '';
      if (key !== last) {
        last = key;
        setAnchor(next);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [missing.length]);
  if (!missing.length || !anchor) return null;
  const order = missing.map((item) => item.path);
  const after = focusedPath ? order.indexOf(focusedPath) : -1;
  const next = order[(after + 1) % order.length];
  return createPortal(
    <button
      type="button"
      data-doc-guide
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onJump(next)}
      className="no-print fixed z-[25] inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
      style={{ left: anchor.left, top: anchor.top, transform: 'translate(-50%, -100%)' }}
    >
      {tf('{n} required left').replace('{n}', String(missing.length))}
      <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5">
        {tf('Jump to next')}
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </button>,
    document.body
  );
}
