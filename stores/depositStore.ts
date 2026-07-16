import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DepositDraft {
  memberId: string;
  qty: number;
  grade?: 'A' | 'B' | null;
  notes?: string;
}

interface DepositStore {
  // Current date being edited
  currentDate: Date;

  // Draft deposits (not yet saved)
  drafts: Record<string, DepositDraft>;

  // Auto-save timestamp
  lastSaved: Date | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  updateDraft: (memberId: string, draft: Partial<DepositDraft>) => void;
  getDraft: (memberId: string) => DepositDraft | undefined;
  clearDrafts: () => void;
  setLastSaved: (date: Date) => void;

  // Bulk operations
  setAllDrafts: (drafts: Record<string, DepositDraft>) => void;
}

export const useDepositStore = create<DepositStore>()(
  persist(
    (set, get) => ({
      currentDate: new Date(),
      drafts: {},
      lastSaved: null,

      setCurrentDate: (date) => set({ currentDate: date }),

      updateDraft: (memberId, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [memberId]: {
              ...state.drafts[memberId],
              ...draft,
              memberId,
            },
          },
        })),

      getDraft: (memberId) => get().drafts[memberId],

      clearDrafts: () => set({ drafts: {}, lastSaved: new Date() }),

      setLastSaved: (date) => set({ lastSaved: date }),

      setAllDrafts: (drafts) => set({ drafts }),
    }),
    {
      name: 'kud-deposit-drafts',
      partialize: (state) => ({
        drafts: state.drafts,
        currentDate: state.currentDate.toISOString(),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.currentDate) {
          state.currentDate = new Date(state.currentDate);
        }
      },
    }
  )
);

// Auto-save hook
export function useAutoSaveDrafts() {
  const { drafts, lastSaved, setLastSaved } = useDepositStore();
  const SAVE_INTERVAL = 30000; // 30 seconds

  const saveDrafts = async () => {
    // TODO: Call API to save drafts to server
    console.log('Auto-saving drafts:', drafts);
    setLastSaved(new Date());
  };

  // Auto-save every 30 seconds if there are changes
  // This would be called in a useEffect in the component
  return { saveDrafts, lastSaved, SAVE_INTERVAL };
}
