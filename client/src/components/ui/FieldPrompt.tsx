import React, { useMemo } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { describeField, PLAIN_PROMPTS, STEP_INTROS } from '@/lib/plainLanguage';

/**
 * A form label exactly as the form words it, the older (i) tooltip when the field has one (`extra`), and a short note underneath: what it means, an example, the unit, and a one-line
 * meaning for each technical word.
 */
export const FieldPrompt: React.FC<{ label: string; extra?: string; required?: boolean; compact?: boolean }> = ({
  label,
  extra,
  required = false,
  compact = false,
}) => {
  const tf = useClusterFormText();
  const copy = useMemo(() => describeField(label, PLAIN_PROMPTS), [label]);
  if (import.meta.env.DEV && !copy.ask && /[A-Za-z]{3,}/.test(label)) {
    // Dev aid: `window.__plainMissing` lists labels shown without a plain-language version.
    const w = window as unknown as { __plainMissing?: Set<string> };
    (w.__plainMissing ||= new Set()).add(label);
  }

  return (
    <>
      <span>{tf(label)}</span>
      {required ? <span className="ml-1 text-red-500">*</span> : null}
      {extra ? <InfoTooltip className="ml-1.5 align-middle" content={tf(extra)} /> : null}
      {!compact && <FieldHelp label={label} />}
    </>
  );
};

/** The short note under a label: meaning, example, unit and the meaning of technical words. */
export const FieldHelp: React.FC<{ label: string }> = ({ label }) => {
  const tf = useClusterFormText();
  const copy = useMemo(() => describeField(label, PLAIN_PROMPTS), [label]);
  if (!copy.help && !copy.example && !copy.units.length && !copy.terms.length) return null;
  return (
    <span className="mt-1 block text-xs font-normal leading-snug text-muted-foreground" data-plain-help>
      {copy.help ? <span className="block">{tf(copy.help)}</span> : null}
      {copy.example ? (
        <span className="block">
          {tf('For example')}: {tf(copy.example)}
        </span>
      ) : null}
      {copy.units.map((unit) => (
        <span key={unit} className="block">{tf(unit)}</span>
      ))}
      {copy.terms.map((item) => (
        <span key={item.term} className="block">
          {tf(item.means).toLowerCase().startsWith(item.term.toLowerCase()) ? null : (
            <strong className="font-semibold">{item.term}: </strong>
          )}
          {tf(item.means)}
        </span>
      ))}
    </span>
  );
};

/** One sentence under a step heading saying what the step is about, in plain words. */
export const StepIntro: React.FC<{ title: string }> = ({ title }) => {
  const tf = useClusterFormText();
  const key = title.replace(/^Step \d+:\s*/, '');
  const text = STEP_INTROS[key];
  if (!text) return null;
  return <p className="mt-1 text-sm text-muted-foreground" data-step-intro>{tf(text)}</p>;
};
