import { checkFormat, isIndividualPan, type FormatKind } from './formats';

export type FormatProblem = { key: string; label: string; message: { en: string; te: string } };

const FIELDS: { key: string; label: string; kind: FormatKind; firmPan?: boolean }[] = [
  { key: 'gstin', label: 'GSTIN', kind: 'gstin' },
  { key: 'firmPan', label: 'Firm PAN', kind: 'pan', firmPan: true },
  { key: 'udyamNumber', label: 'Udyam Registration No.', kind: 'udyam' },
  { key: 'applicantMobile', label: 'Contact mobile', kind: 'mobile' },
];

/** Filled fields whose format is invalid (blank optional fields pass). Blocks moving forward. */
export function invalidFormats(
  stepData: Record<string, unknown> | null | undefined
): FormatProblem[] {
  const data = stepData || {};
  const out: FormatProblem[] = [];
  for (const field of FIELDS) {
    const raw = String(data[field.key] ?? '').trim();
    if (!raw) continue;
    const result = checkFormat(field.kind, raw);
    if (!result.ok) {
      out.push({ key: field.key, label: field.label, message: result.message });
    } else if (field.firmPan && isIndividualPan(raw.toUpperCase())) {
      out.push({
        key: field.key,
        label: field.label,
        message: {
          en: 'Individual PANs are not stored. Enter the firm/company PAN or leave blank.',
          te: 'వ్యక్తిగత PAN నిల్వ చేయబడదు. సంస్థ PAN నమోదు చేయండి లేదా ఖాళీగా ఉంచండి.',
        },
      });
    }
  }
  return out;
}
