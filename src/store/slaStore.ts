import { create } from 'zustand';

type SLAState = {
  now: number;
  setNow: (now: number) => void;
};

export const useSLAStore = create<SLAState>((set) => ({
  now: Date.now(),
  setNow: (now) => set({ now }),
}));
