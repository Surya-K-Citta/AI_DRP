/**
 * Build the payload Create New Latest DPR sends to existing draft/generate/preview APIs.
 * Wire format still uses legacy keys (`clusterName`, etc.) expected by the shared backend —
 * callers should use this helper and prefer `unitName` in the individual UI/store.
 */
export function getUnitName(step1?: Record<string, any> | null): string {
  if (!step1) return '';
  return String(step1.unitName || step1.clusterName || '').trim();
}

/** Keep unitName + legacy clusterName in sync when the user edits the unit title. */
export function withSyncedUnitName(
  step1: Record<string, any> | undefined,
  name: string
): Record<string, any> {
  const next = { ...(step1 || {}) };
  next.unitName = name;
  next.clusterName = name;
  return next;
}

export function toIndividualPayload(data: any) {
  const step1 = data.step1 || {};
  const extras = data.schemeExtras || {};
  const step15 = data.step15 || {};
  const years = step15.yearProjections || [];
  const unitName = getUnitName(step1) || 'Individual unit';

  return {
    ...data,
    isIndividualDPR: true,
    projectId: data.projectId || undefined,
    matchedSchemeCode: data.matchedSchemeCode || null,
    step1: {
      ...step1,
      unitName,
      // Legacy key still written for shared draft APIs — document view uses unitName.
      clusterName: unitName,
    },
    step11: {
      ...(data.step11 || {}),
      spvName:
        data.step11?.spvName ||
        data.step11?.applicantName ||
        unitName,
    },
    step15: {
      ...step15,
      profitAndLossProjections: years.length
        ? years.map((row: any) => ({
            year: row.year,
            revenue: row.sales,
            expenses: (row.rm || 0) + (row.wages || 0) + (row.power || 0),
            profit: row.netProfit,
          }))
        : step15.profitAndLossProjections,
    },
    schemeExtras: extras,
    metadata: {
      isIndividualDPR: true,
      matchedSchemeCode: data.matchedSchemeCode || null,
    },
  };
}
