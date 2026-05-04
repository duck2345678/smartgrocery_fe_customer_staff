import { create } from 'zustand';
import { ShiftType, AttendanceRecord, AttendanceDayDto } from '../types/attendance';
import * as api from '../api/staffAttendance';

type StaffAttendanceState = {
  // Today state
  todayShift: ShiftType | null;
  todayRecords: AttendanceRecord[];
  note: string;
  isLoading: boolean;
  error: string | null;

  // Calendar state
  calendarData: Map<string, AttendanceDayDto>;
  calendarMonth: number;
  calendarYear: number;

  // Actions
  setNote: (note: string) => void;
  fetchTodayStatus: () => Promise<void>;
  performCheckIn: () => Promise<void>;
  performCheckOut: () => Promise<void>;
  fetchCalendar: (year: number, month: number) => Promise<void>;
};

export const useStaffAttendanceStore = create<StaffAttendanceState>((set, get) => ({
  todayShift: null,
  todayRecords: [],
  note: '',
  isLoading: false,
  error: null,

  calendarData: new Map(),
  calendarMonth: new Date().getMonth() + 1,
  calendarYear: new Date().getFullYear(),

  setNote: (note) => set({ note }),

  fetchTodayStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getTodayStatus();
      set({ 
        todayShift: data.shiftType, 
        todayRecords: data.records,
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải trạng thái hôm nay' });
    } finally {
      set({ isLoading: false });
    }
  },

  performCheckIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const { note } = get();
      const req = {
        timestamp: new Date().toISOString(),
        note: note.trim() || undefined,
      };
      await api.checkIn(req);
      await get().fetchTodayStatus();
      set({ note: '' }); // Clear note after success
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi vào ca' });
    } finally {
      set({ isLoading: false });
    }
  },

  performCheckOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { note } = get();
      const req = {
        timestamp: new Date().toISOString(),
        note: note.trim() || undefined,
      };
      await api.checkOut(req);
      await get().fetchTodayStatus();
      set({ note: '' }); // Clear note after success
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi ra ca' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCalendar: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getMonthlyCalendar(year, month);
      const map = new Map<string, AttendanceDayDto>();
      data.forEach(d => map.set(d.date, d));
      set({ 
        calendarData: map,
        calendarMonth: month,
        calendarYear: year,
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải lịch chấm công' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
