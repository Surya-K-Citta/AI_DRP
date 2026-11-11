import { isLeanUnitScheme } from '@/lib/individualDpr/individualDocModel';

type RequiredField = { key: string; label: string };

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some((item) => isFilled(item));
  return true;
}

function missingFrom(
  stepData: Record<string, unknown> | null | undefined,
  fields: RequiredField[]
): RequiredField[] {
  const data = stepData || {};
  return fields.filter((field) => !isFilled(data[field.key]));
}

/** Required inputs on the Latest DPR form for this content step. Optional fields are omitted. */
export function missingIndividualRequired(
  contentStep: number,
  stepData: Record<string, unknown> | null | undefined,
  schemeCode?: string | null
): RequiredField[] {
  const lean = isLeanUnitScheme(schemeCode);
  if (contentStep === 1) {
    const data = stepData || {};
    const fields: RequiredField[] = [
      { key: 'district', label: 'District' },
      { key: 'location', label: 'Location' },
    ];
    const missing = missingFrom(data, fields);
    if (!isFilled(data.unitName) && !isFilled(data.clusterName)) {
      missing.unshift({ key: 'unitName', label: 'Unit / Project Name' });
    }
    return missing;
  }
  if (contentStep === 2) {
    return missingFrom(stepData, [
      {
        key: 'sectorType',
        label: lean ? 'Sector / industry type' : 'Sector / Industry Type',
      },
      {
        key: 'sectorDescription',
        label: lean ? 'Short intro — what the unit does' : 'Sector Description',
      },
    ]);
  }
  if (contentStep === 9) {
    return missingFrom(stepData, [{ key: 'interventionType', label: 'Intervention Type' }]);
  }
  if (contentStep === 10) {
    const fields: RequiredField[] = [
      {
        key: 'name',
        label: lean ? 'Shop / shed / workplace' : 'Unit / shed / workplace name',
      },
    ];
    if (!lean) fields.push({ key: 'location', label: 'Location' });
    return missingFrom(stepData, fields);
  }
  return [];
}

/** Required inputs on the cluster DPR form. Optional fields are omitted. */
export function missingClusterRequired(
  step: number,
  stepData: Record<string, unknown> | null | undefined
): RequiredField[] {
  if (step === 1) {
    return missingFrom(stepData, [
      { key: 'clusterName', label: 'Cluster Name' },
      { key: 'district', label: 'District' },
      { key: 'location', label: 'Location' },
    ]);
  }
  if (step === 2) {
    return missingFrom(stepData, [
      { key: 'sectorType', label: 'Sector / Industry Type' },
      { key: 'sectorDescription', label: 'Sector Description' },
    ]);
  }
  if (step === 9) {
    return missingFrom(stepData, [{ key: 'interventionType', label: 'Intervention Type' }]);
  }
  if (step === 10) {
    return missingFrom(stepData, [
      { key: 'name', label: 'CFC Name' },
      { key: 'location', label: 'Location' },
    ]);
  }
  if (step === 11) {
    return missingFrom(stepData, [{ key: 'spvName', label: 'SPV Name' }]);
  }
  return [];
}
