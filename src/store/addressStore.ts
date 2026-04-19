import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AddressState = {
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number | null) => void;
};

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      selectedAddressId: null,
      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
    }),
    {
      name: 'smart-grocery-selected-address-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

