import { create } from 'zustand';

type StaffHomeState = {
  selectedDateIso: string;
  setSelectedDateIso: (value: string) => void;
  handbookOpenCategoryIds: string[];
  toggleHandbookCategory: (id: string) => void;
};

export const useStaffHomeStore = create<StaffHomeState>((set) => ({
  selectedDateIso: new Date().toISOString().slice(0, 10),
  setSelectedDateIso: (value) => set({ selectedDateIso: value }),
  handbookOpenCategoryIds: ['getting-started'],
  toggleHandbookCategory: (id) =>
    set((s) => ({
      handbookOpenCategoryIds: s.handbookOpenCategoryIds.includes(id)
        ? s.handbookOpenCategoryIds.filter((x) => x !== id)
        : [...s.handbookOpenCategoryIds, id],
    })),
}));
