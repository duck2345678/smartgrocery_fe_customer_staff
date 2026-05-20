import { create } from 'zustand';

export type StaffOrdersView = 'QUEUE' | 'MY_ACTIVE';

type StaffOrdersState = {
  view: StaffOrdersView;
  setView: (value: StaffOrdersView) => void;
};

export const useStaffOrdersStore = create<StaffOrdersState>((set) => ({
  view: 'QUEUE',
  setView: (value) => set({ view: value }),
}));
