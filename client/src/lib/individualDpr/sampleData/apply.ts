import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { loadSampleData } from './index';

/**
 * Fills every answer of the chosen scheme with realistic sample answers (uploads are not filled). Everything stays editable.
 * Used by the admin "Apply sample data" button and by the guided tour. Returns false when the scheme has no sample yet.
 */
export async function applySampleToStore(): Promise<boolean> {
  const store = useIndividualDPRStore.getState();
  const sample = await loadSampleData(store.data.matchedSchemeCode || null);
  if (!sample) return false;
  Object.entries(sample).forEach(([key, value]) => {
    const match = /^step(\d+)$/.exec(key);
    if (match && value) store.setStepData(Number(match[1]), JSON.parse(JSON.stringify(value)));
  });
  if (sample.ventureMatchAnswers) store.setVentureMatchAnswers(JSON.parse(JSON.stringify(sample.ventureMatchAnswers)));
  if (sample.schemeExtras) {
    const current = useIndividualDPRStore.getState().data.schemeExtras || {};
    store.setSchemeExtras({ ...current, ...JSON.parse(JSON.stringify(sample.schemeExtras)) });
  }
  return true;
}
