// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DPR {
  _id: string;
  projectId: any;
  versionNumber: number;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  qualityScore?: number;
  generatedAt?: Date;
  createdAt?: Date;
  [key: string]: any;
}

interface DPRState {
  dprs: DPR[];
  lastFetched: number | null;
  setDPRs: (dprs: DPR[]) => void;
  addDPR: (dpr: DPR) => void;
  updateDPR: (id: string, data: Partial<DPR>) => void;
  deleteDPR: (id: string) => void;
  setLastFetched: (timestamp: number) => void;
  isStale: () => boolean;
  clearDPRs: () => void;
}

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const useDPRStore = create<DPRState>()(
  persist(
    (set, get) => ({
      dprs: [],
      lastFetched: null,
      setDPRs: (dprs) => set({ dprs, lastFetched: Date.now() }),
      addDPR: (dpr) =>
        set((state) => ({ dprs: [dpr, ...state.dprs] })),
      updateDPR: (id, data) =>
        set((state) => ({
          dprs: state.dprs.map((d) =>
            d._id === id ? { ...d, ...data } : d
          ),
        })),
      deleteDPR: (id) =>
        set((state) => ({
          dprs: state.dprs.filter((d) => d._id !== id),
        })),
      setLastFetched: (timestamp) => set({ lastFetched: timestamp }),
      isStale: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > CACHE_TTL;
      },
      clearDPRs: () => set({ dprs: [], lastFetched: null }),
    }),
    {
      name: 'dpr-storage',
      partialize: (state) => ({
        dprs: state.dprs,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

