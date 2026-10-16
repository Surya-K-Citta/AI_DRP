import { create } from 'zustand';
import type { ReportGuideChoices } from '@/lib/individualDpr/reportGuide';

type ReportGuideState = {
  pending: ReportGuideChoices | null;
  setPending: (choices: ReportGuideChoices | null) => void;
  /** Read once. A later Create DPR visit does not reuse these choices. */
  takePending: () => ReportGuideChoices | null;
};

export const useReportGuideStore = create<ReportGuideState>((set, get) => ({
  pending: null,
  setPending: (choices) => set({ pending: choices }),
  takePending: () => {
    const pending = get().pending;
    if (pending) set({ pending: null });
    return pending;
  },
}));
