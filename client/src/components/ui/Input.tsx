// @ts-nocheck
import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MicButton } from '@/components/ui/MicButton';
import { useVoiceEnabled } from '@/components/ui/VoiceContext';
import { findNearbyFieldTitle } from '@/lib/fieldTitle';
import {
  CHECKS,
  FORMAT_EXAMPLE,
  FORMAT_LENGTH,
  MASKS,
  checkRange,
  isIndividualPan,
  type FormatKind,
  type Msg,
} from '@/lib/validation/formats';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /**
   * Shape and check what is typed as an identifier: PAN, GSTIN, Udyam, mobile, IFSC, PIN code or e-mail.
   * The text is masked as it is typed (upper-case, only the characters allowed at each position), and a red
   * message appears as soon as the value cannot be right (or, while it is merely unfinished, when you leave
   * the box).
   */
  format?: FormatKind;
  /** With `format="pan"`: also flag an individual's PAN (4th letter P), which is personal data we do not store. */
  firmPanOnly?: boolean;
  /** A short line under the box saying what to enter. Shown until there is an error. */
  hint?: string;
}

const NAV_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/** Input types a person can speak into. Dates, files, choices and passwords are left out. */
const VOICE_TYPES = new Set([undefined, '', 'text', 'number', 'tel', 'email', 'search', 'url']);

/** Digits and a single decimal point. Blocks letters, including e/E from Shift+E. */
export function sanitizeNumericString(value: string): string {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}

export function blockNonNumericKey(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (NAV_KEYS.has(event.key)) return;
  if (event.key === '.') {
    if (event.currentTarget.value.includes('.')) event.preventDefault();
    return;
  }
  if (!/^\d$/.test(event.key)) event.preventDefault();
}

export function blockNonNumericBeforeInput(event: React.FormEvent<HTMLInputElement>) {
  const data = event.nativeEvent?.data;
  if (data == null || data === '') return;
  if (!/^[\d.]+$/.test(data)) {
    event.preventDefault();
    return;
  }
  if (data.includes('.') && event.currentTarget.value.includes('.')) event.preventDefault();
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      type,
      step,
      inputMode,
      onChange,
      onKeyDown,
      onPaste,
      onBeforeInput,
      onBlur,
      format,
      firmPanOnly,
      hint,
      ...props
    },
    ref
  ) => {
    const numeric = type === 'number';
    const { i18n } = useTranslation();
    const lang: 'en' | 'te' = i18n.language?.startsWith('te') ? 'te' : 'en';
    const uid = useId();
    const voiceOn = useVoiceEnabled();
    const innerRef = useRef<HTMLInputElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };
    const voiceShown =
      voiceOn && VOICE_TYPES.has(type) && !props.readOnly && !props.disabled && !(props as any)['data-no-voice'];
    const voiceKind = numeric ? 'number' : format ? 'identifier' : 'text';
    const speak = (spoken: string) => {
      const el = innerRef.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      el.focus();
      setter?.call(el, spoken); // a spoken answer replaces what is there; say it again to redo it
      el.dispatchEvent(new Event('input', { bubbles: true })); // so the form's own onChange (masks, checks, saving) runs
    };
    const [touched, setTouched] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const blockedTimer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(blockedTimer.current), []);

    // What is wrong with the value right now, if anything.
    const current = String(props.value ?? '');
    let problem: Msg | null = null;
    if (format) {
      const masked = MASKS[format](current);
      const result = CHECKS[format](masked);
      if (!result.ok && (touched || !result.incomplete)) problem = result.message;
      if (!problem && format === 'pan' && firmPanOnly && isIndividualPan(masked)) {
        problem = {
          en: 'This looks like an individual’s PAN (4th letter P). We do not store personal PAN numbers. Enter the firm’s PAN or leave this blank.',
          te: 'ఇది వ్యక్తిగత PAN లా ఉంది (4వ అక్షరం P). వ్యక్తిగత PAN నంబర్లను మేము నిల్వ చేయం. సంస్థ PAN ఇవ్వండి లేదా ఖాళీగా వదలండి.',
        };
      }
    } else if (numeric && (props.min != null || props.max != null)) {
      const result = checkRange(current, {
        min: props.min != null ? Number(props.min) : undefined,
        max: props.max != null ? Number(props.max) : undefined,
      });
      if (!result.ok) problem = result.message;
    }
    const message =
      error ||
      (problem ? problem[lang] : '') ||
      (blocked
        ? lang === 'te'
          ? 'ఈ స్థానంలో ఆ అక్షరం అనుమతించబడదు.'
          : 'That character is not allowed in this position.'
        : '');
    const describedBy = message ? `${uid}-err` : hint ? `${uid}-hint` : undefined;

    return (
      <div className="w-full" ref={rootRef}>
        {label && (
          <label htmlFor={(props as any).id ?? `${uid}-input`} className="block text-sm font-medium mb-2">
            {label}
          </label>
        )}
        {voiceShown ? (
          <div className="relative">
          <input
            type={type}
            inputMode={numeric ? inputMode || 'decimal' : format === 'mobile' || format === 'pincode' ? 'numeric' : inputMode}
            maxLength={format ? FORMAT_LENGTH[format] : props.maxLength}
            placeholder={props.placeholder ?? (format ? FORMAT_EXAMPLE[format] : undefined)}
            aria-invalid={message ? true : undefined}
            aria-describedby={describedBy}
            autoCapitalize={format === 'email' ? 'none' : format ? 'characters' : undefined}
            spellCheck={format ? false : undefined}
            step={numeric ? step ?? 'any' : step}
            className={cn(
              'flex h-10 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              message && 'border-red-600 bg-red-50/40 focus-visible:ring-red-600',
              voiceShown && 'pr-11',
              voiceShown && numeric && '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              className
            )}
            ref={setRefs}
            onKeyDown={(event) => {
              if (numeric && !event.defaultPrevented) blockNonNumericKey(event);
              onKeyDown?.(event);
            }}
            onBeforeInput={(event) => {
              if (numeric && !event.defaultPrevented) blockNonNumericBeforeInput(event);
              onBeforeInput?.(event);
            }}
            onPaste={(event) => {
              if (numeric) {
                const pasted = event.clipboardData.getData('text');
                const cleaned = sanitizeNumericString(pasted);
                if (cleaned !== pasted) {
                  event.preventDefault();
                  const el = event.currentTarget;
                  const start = el.selectionStart ?? el.value.length;
                  const end = el.selectionEnd ?? el.value.length;
                  const next = sanitizeNumericString(
                    el.value.slice(0, start) + cleaned + el.value.slice(end)
                  );
                  const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                  )?.set;
                  setter?.call(el, next);
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }
              onPaste?.(event);
            }}
            onChange={(event) => {
              if (numeric) {
                const cleaned = sanitizeNumericString(event.target.value);
                if (cleaned !== event.target.value) event.target.value = cleaned;
              }
              if (format) {
                const typed = event.target.value;
                const masked = MASKS[format](typed);
                if (masked !== typed) {
                  // A typed character that does not fit is dropped; say why for a moment.
                  const strip = (text: string) => text.replace(/[\s-]/g, '').toUpperCase();
                  if (format !== 'email' && strip(masked).length < Math.min(strip(typed).length, FORMAT_LENGTH[format] ?? 99)) {
                    setBlocked(true);
                    window.clearTimeout(blockedTimer.current);
                    blockedTimer.current = window.setTimeout(() => setBlocked(false), 2500);
                  }
                  event.target.value = masked;
                }
              }
              onChange?.(event);
            }}
            onBlur={(event) => {
              setTouched(true);
              onBlur?.(event);
            }}
            id={`${uid}-input`}
            {...props}
          />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <MicButton
                kind={voiceKind}
                format={format}
                label={label || (props as any)['aria-label'] || findNearbyFieldTitle(rootRef.current)}
                getLakh={() => /lakh/i.test(`${label || ''} ${findNearbyFieldTitle(rootRef.current)} ${props.placeholder || ''} ${hint || ''}`)}
                onText={speak}
              />
            </span>
          </div>
        ) : (
          <input
            type={type}
            inputMode={numeric ? inputMode || 'decimal' : format === 'mobile' || format === 'pincode' ? 'numeric' : inputMode}
            maxLength={format ? FORMAT_LENGTH[format] : props.maxLength}
            placeholder={props.placeholder ?? (format ? FORMAT_EXAMPLE[format] : undefined)}
            aria-invalid={message ? true : undefined}
            aria-describedby={describedBy}
            autoCapitalize={format === 'email' ? 'none' : format ? 'characters' : undefined}
            spellCheck={format ? false : undefined}
            step={numeric ? step ?? 'any' : step}
            className={cn(
              'flex h-10 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              message && 'border-red-600 bg-red-50/40 focus-visible:ring-red-600',
              voiceShown && 'pr-11',
              voiceShown && numeric && '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              className
            )}
            ref={setRefs}
            onKeyDown={(event) => {
              if (numeric && !event.defaultPrevented) blockNonNumericKey(event);
              onKeyDown?.(event);
            }}
            onBeforeInput={(event) => {
              if (numeric && !event.defaultPrevented) blockNonNumericBeforeInput(event);
              onBeforeInput?.(event);
            }}
            onPaste={(event) => {
              if (numeric) {
                const pasted = event.clipboardData.getData('text');
                const cleaned = sanitizeNumericString(pasted);
                if (cleaned !== pasted) {
                  event.preventDefault();
                  const el = event.currentTarget;
                  const start = el.selectionStart ?? el.value.length;
                  const end = el.selectionEnd ?? el.value.length;
                  const next = sanitizeNumericString(
                    el.value.slice(0, start) + cleaned + el.value.slice(end)
                  );
                  const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                  )?.set;
                  setter?.call(el, next);
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }
              onPaste?.(event);
            }}
            onChange={(event) => {
              if (numeric) {
                const cleaned = sanitizeNumericString(event.target.value);
                if (cleaned !== event.target.value) event.target.value = cleaned;
              }
              if (format) {
                const typed = event.target.value;
                const masked = MASKS[format](typed);
                if (masked !== typed) {
                  // A typed character that does not fit is dropped; say why for a moment.
                  const strip = (text: string) => text.replace(/[\s-]/g, '').toUpperCase();
                  if (format !== 'email' && strip(masked).length < Math.min(strip(typed).length, FORMAT_LENGTH[format] ?? 99)) {
                    setBlocked(true);
                    window.clearTimeout(blockedTimer.current);
                    blockedTimer.current = window.setTimeout(() => setBlocked(false), 2500);
                  }
                  event.target.value = masked;
                }
              }
              onChange?.(event);
            }}
            onBlur={(event) => {
              setTouched(true);
              onBlur?.(event);
            }}
            id={`${uid}-input`}
            {...props}
          />
        )}
        {message ? (
          <p
            id={`${uid}-err`}
            role="alert"
            className="mt-1 flex items-start gap-1.5 text-sm font-medium text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </p>
        ) : hint ? (
          <p id={`${uid}-hint`} className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
