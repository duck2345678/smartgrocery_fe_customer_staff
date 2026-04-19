import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SubstitutionState = {
  byProductId: Record<number, boolean>;
  setAllowed: (productId: number, allowed: boolean) => void;
  isAllowed: (productId: number) => boolean;
  clear: () => void;
};

export const useSubstitutionStore = create<SubstitutionState>()(
  persist(
    (set, get) => ({
      byProductId: {},
      setAllowed: (productId, allowed) =>
        set((s) => ({ byProductId: { ...s.byProductId, [productId]: allowed } })),
      isAllowed: (productId) => Boolean(get().byProductId[productId]),
      clear: () => set({ byProductId: {} }),
    }),
    {
      name: 'smart-grocery-substitution-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

