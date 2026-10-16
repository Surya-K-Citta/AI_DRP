// @ts-nocheck
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Maximize2, Sparkles, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useAuthStore } from '@/store/authStore';
import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { AISuggestionsService } from '@/services/aiSuggestions.service';
import { getUnitName } from '@/lib/individualDpr/toIndividualPayload';
import { BUSINESS_SKILLS, matchBusinessSkillLocal } from '@/lib/individualDpr/businessSkills';
import { useTranslation } from 'react-i18next';

type EditorKind = 'input' | 'textarea' | 'select';

const NON_IMPROVE_INPUT_TYPES = new Set([
  'number',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
  'file',
  'checkbox',
  'radio',
  'hidden',
  'color',
  'range',
]);

function canImproveKind(kind: EditorKind, inputType?: string) {
  if (kind === 'select') return false;
  if (kind === 'input' && inputType && NON_IMPROVE_INPUT_TYPES.has(inputType)) return false;
  return true;
}

async function resolveSkillMatch(
  text: string,
  context: Record<string, any>
): Promise<string | null> {
  const local = matchBusinessSkillLocal(text);
  if (local) return local;
  return AISuggestionsService.matchBusinessSkill(text, [...BUSINESS_SKILLS], context);
}

function FieldExpandModal({
  open,
  title,
  kind,
  draft,
  setDraft,
  inputType,
  placeholder,
  selectChildren,
  onConfirm,
  onCancel,
  enableSkillMatch = false,
  allowImprove = true,
  fieldKey,
}: {
  open: boolean;
  title?: string;
  fieldKey?: string;
  kind: EditorKind;
  draft: string;
  setDraft: (v: string) => void;
  inputType?: string;
  placeholder?: string;
  selectChildren?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  enableSkillMatch?: boolean;
  allowImprove?: boolean;
}) {
  const tf = useClusterFormText();
  const { t } = useTranslation();
  const titleId = useId();
  const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement | null>(null);
  const [improving, setImproving] = useState(false);
  const [matching, setMatching] = useState(false);
  const { user } = useAuthStore();
  const aiAllowed = !!user?.privacy?.aiAssist;
  const data = useIndividualDPRStore((s) => s.data);
  // Step 1 (cover / basics) is manual — no AI improve on any field.
  const onStep1 = (data?.currentStep ?? 1) === 1;
  const showImprove = allowImprove && canImproveKind(kind, inputType) && !onStep1 && !enableSkillMatch;
  const showMatchSkill = !!enableSkillMatch && canImproveKind(kind, inputType);
  const busy = improving || matching;

  useEffect(() => {
    if (!open) {
      setImproving(false);
      setMatching(false);
      return;
    }
    const tmr = window.setTimeout(() => editorRef.current?.focus?.(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(tmr);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, onConfirm]);

  const matchContext = () => {
    const step1 = data?.step1 || {};
    return {
      unitName: getUnitName(step1),
      district: step1.district || '',
      location: step1.location || '',
      schemeCode: data?.matchedSchemeCode || null,
    };
  };

  const handleImprove = async () => {
    if (!aiAllowed) {
      toast.error(t('privacy.aiOffWarning'));
      return;
    }
    const text = String(draft || '').trim();
    if (!text) {
      toast.error(tf('Type something first, then Improve this.'));
      return;
    }
    setImproving(true);
    try {
      const step1 = data?.step1 || {};
      const improved = await AISuggestionsService.improveFieldText(
        fieldKey || title || 'field',
        text,
        {
          fieldLabel: title || '',
          schemeCode: data?.matchedSchemeCode || null,
          isIndividualDPR: true,
          unitName: getUnitName(step1),
          clusterName: step1.clusterName || '',
          district: step1.district || '',
          location: step1.location || '',
          natureOfBusiness: step1.natureOfBusiness || '',
        }
      );
      if (!improved) {
        toast.error(tf('Could not improve this text. Try again.'));
        return;
      }
      setDraft(improved);
      toast.success(tf('Improved — review, then Confirm to save.'));
    } catch (error) {
      console.error(error);
      toast.error(tf('Could not improve this text. Try again.'));
    } finally {
      setImproving(false);
    }
  };

  const handleMatchSkill = async () => {
    const text = String(draft || '').trim();
    if (!text) {
      toast.error(tf('Type what you do first, then Match me.'));
      return;
    }
    // Local keyword match works offline / without AI consent
    const local = matchBusinessSkillLocal(text);
    if (local) {
      setDraft(local);
      toast.success(tf('Matched to: {skill}').replace('{skill}', local));
      return;
    }
    if (!aiAllowed) {
      toast.error(t('privacy.aiOffWarning'));
      return;
    }
    setMatching(true);
    try {
      const skill = await resolveSkillMatch(text, matchContext());
      if (!skill) {
        toast.error(tf('Could not match a skill. Try again with a clearer description.'));
        return;
      }
      setDraft(skill);
      toast.success(tf('Matched to: {skill}').replace('{skill}', skill));
    } catch (error) {
      console.error(error);
      toast.error(tf('Could not match a skill. Try again with a clearer description.'));
    } finally {
      setMatching(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="motion-overlay fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={tf('Cancel')}
        onClick={onCancel}
      />
      <div className="relative z-10 flex w-full max-w-3xl max-h-[90vh] flex-col rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <p id={titleId} className="min-w-0 flex-1 text-base font-semibold text-foreground truncate">
            {title || tf('Edit field')}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showMatchSkill && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMatchSkill}
                disabled={busy}
                className="gap-1.5"
              >
                {matching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {matching ? tf('Matching…') : tf('Match me')}
              </Button>
            )}
            {showImprove && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImprove}
                disabled={busy}
                className="gap-1.5"
              >
                {improving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {improving ? tf('Improving…') : tf('Improve this')}
              </Button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={tf('Cancel')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 sm:px-5">
          {kind === 'textarea' && (
            <textarea
              ref={editorRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              disabled={busy}
              className="w-full min-h-[50vh] rounded-lg border border-input bg-background px-4 py-3 text-base leading-relaxed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          )}
          {kind === 'input' && (
            <input
              ref={editorRef as React.RefObject<HTMLInputElement>}
              type={inputType && inputType !== 'file' ? inputType : 'text'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              disabled={busy}
              className="w-full h-14 rounded-lg border border-input bg-background px-4 py-3 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          )}
          {kind === 'select' && (
            <select
              ref={editorRef as React.RefObject<HTMLSelectElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full min-h-[3.5rem] rounded-lg border border-input bg-background px-4 py-3 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              size={Math.min(12, React.Children.count(selectChildren) || 8)}
            >
              {selectChildren}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {tf('Cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {tf('Confirm')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function cleanLabelText(raw: string): string {
  return raw
    .replace(/\s*\*\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pick the visible field title near a control (sibling / parent label). */
function findNearbyFieldTitle(el: HTMLElement | null): string {
  if (!el) return '';
  const aria = el.getAttribute('aria-label');
  if (aria?.trim()) return cleanLabelText(aria);

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const node = document.getElementById(labelledBy);
    if (node?.textContent) return cleanLabelText(node.textContent);
  }

  const wrap = el.closest('div');
  const container = wrap?.parentElement || wrap;
  const labelInContainer = container?.querySelector('label');
  if (labelInContainer?.textContent) return cleanLabelText(labelInContainer.textContent);

  let sibling = wrap?.previousElementSibling as HTMLElement | null;
  while (sibling) {
    if (sibling.tagName === 'LABEL' || sibling.classList.contains('font-medium') || sibling.classList.contains('font-semibold')) {
      if (sibling.textContent) return cleanLabelText(sibling.textContent);
    }
    const nested = sibling.querySelector?.('label');
    if (nested?.textContent) return cleanLabelText(nested.textContent);
    sibling = sibling.previousElementSibling as HTMLElement | null;
  }
  return '';
}

function useExpandEditor(
  value: unknown,
  onChange?: (e: any) => void
) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [resolvedTitle, setResolvedTitle] = useState('');

  const openEditor = (e?: React.SyntheticEvent, explicitTitle?: string) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const target = (e?.currentTarget || e?.target) as HTMLElement | null;
    const fromDom = findNearbyFieldTitle(target);
    setResolvedTitle((explicitTitle || fromDom || '').trim());
    setDraft(value == null ? '' : String(value));
    setOpen(true);
  };

  const cancel = () => setOpen(false);

  const confirm = () => {
    if (onChange) {
      onChange({
        target: { value: draft },
        currentTarget: { value: draft },
      });
    }
    setOpen(false);
  };

  return { open, draft, setDraft, openEditor, cancel, confirm, resolvedTitle };
}

/** Drop-in for `@/components/ui/Input` — single-line; no enlarge modal. */
export const ExpandableInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & {
    enableSkillMatch?: boolean;
    expandTitle?: string;
    /** Kept for API compat; display uses stored value directly for single-line edit. */
    formatDisplay?: (value: string) => string;
  }
>(
  (
    {
      enableSkillMatch: _enableSkillMatch,
      expandTitle: _expandTitle,
      formatDisplay: _formatDisplay,
      ...props
    },
    ref
  ) => {
    return <Input ref={ref} {...props} />;
  }
);
ExpandableInput.displayName = 'ExpandableInput';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  expandTitle?: string;
  /** Hide the Improve this action. Used for location and address fields. */
  allowImprove?: boolean;
};

/** Drop-in for native `<textarea>` — click opens enlarged editor (descriptive answers only). */
export const ExpandableTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      onChange,
      value,
      defaultValue,
      placeholder,
      label,
      expandTitle,
      allowImprove = true,
      disabled,
      readOnly,
      onFocus,
      onClick,
      ...props
    },
    ref
  ) => {
    const tf = useClusterFormText();
    const resolvedValue = value ?? defaultValue ?? '';
    const { open, draft, setDraft, openEditor, cancel, confirm, resolvedTitle } = useExpandEditor(
      resolvedValue,
      onChange
    );
    const modalTitle = (expandTitle || label || resolvedTitle || '').trim() || tf('Edit field');

    return (
      <>
        <div className="relative w-full">
          <textarea
            ref={ref}
            className={cn('pr-8 cursor-pointer', className)}
            onChange={onChange}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly
            onFocus={(e) => {
              if (!disabled) openEditor(e, expandTitle || label);
              onFocus?.(e);
            }}
            onClick={(e) => {
              if (!disabled) openEditor(e, expandTitle || label);
              onClick?.(e);
            }}
            {...props}
            aria-label={expandTitle || label || props['aria-label']}
          />
          {!disabled && (
            <span className="pointer-events-none absolute right-2 top-2 text-muted-foreground/70" aria-hidden>
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <FieldExpandModal
          open={open}
          title={modalTitle}
          fieldKey={typeof props.name === 'string' ? props.name : undefined}
          kind="textarea"
          draft={draft}
          setDraft={setDraft}
          placeholder={placeholder}
          onConfirm={confirm}
          onCancel={cancel}
          allowImprove={allowImprove}
        />
      </>
    );
  }
);
ExpandableTextarea.displayName = 'ExpandableTextarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

/** Drop-in for native `<select>` — normal dropdown; no enlarge modal. */
export const ExpandableSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label: _label, ...props }, ref) => {
    return (
      <select ref={ref} className={className} {...props}>
        {children}
      </select>
    );
  }
);
ExpandableSelect.displayName = 'ExpandableSelect';
