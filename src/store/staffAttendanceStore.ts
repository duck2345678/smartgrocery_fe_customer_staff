import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StaffAttendanceState = {
  checkInAt: number | null;
  checkOutAt: number | null;
  note: string;
  setNote: (value: string) => void;
  checkIn: (at: number) => void;
  checkOut: (at: number) => void;
  resetToday: () => void;
};

export const useStaffAttendanceStore = create<StaffAttendanceState>()(
  persist(
    (set) => ({
      checkInAt: null,
      checkOutAt: null,
      note: '',
      setNote: (value) => set({ note: value }),
      checkIn: (at) => set({ checkInAt: at, checkOutAt: null }),
      checkOut: (at) => set({ checkOutAt: at }),
      resetToday: () => set({ checkInAt: null, checkOutAt: null, note: '' }),
    }),
    {
      name: 'sg_staff_attendance_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
