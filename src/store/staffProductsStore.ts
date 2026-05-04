import { create } from 'zustand';

type StaffProductsState = {
  search: string;
  categoryId: number | null;
  setSearch: (value: string) => void;
  setCategoryId: (value: number | null) => void;
  reset: () => void;
};

export const useStaffProductsStore = create<StaffProductsState>((set) => ({
  search: '',
  categoryId: null,
  setSearch: (value) => set({ search: value }),
  setCategoryId: (value) => set({ categoryId: value }),
  reset: () => set({ search: '', categoryId: null }),
}));
