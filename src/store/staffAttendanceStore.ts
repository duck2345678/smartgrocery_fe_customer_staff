import { create } from 'zustand';
import {
  ShiftType,
  AttendanceRecord,
  AttendanceDayDto,
  AttendanceMonthlyStatsDto,
  AttendanceInsightDto,
} from '../types/attendance';
import * as api from '../api/staffAttendance';

/** Format Date as local ISO string (no Z suffix) for Java LocalDateTime */
const toLocalISO = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

export type CheckResult = {
  success: boolean;
  message: string;
  status?: 'ON_TIME' | 'LATE' | 'EARLY' | null;
};

type StaffAttendanceState = {
  todayShift: ShiftType | null;
  todayRecords: AttendanceRecord[];
  note: string;
  isLoading: boolean;
  error: string | null;

  calendarData: Map<string, AttendanceDayDto>;
  calendarMonth: number;
  calendarYear: number;
  selectedDate: string;

  monthlyStats: AttendanceMonthlyStatsDto | null;
  insights: AttendanceInsightDto | null;

  setNote: (note: string) => void;
  setSelectedDate: (dateIso: string) => void;
  clearError: () => void;
  fetchTodayStatus: () => Promise<void>;
  performCheckIn: () => Promise<CheckResult>;
  performCheckOut: () => Promise<CheckResult>;
  fetchCalendar: (year: number, month: number) => Promise<void>;
  fetchMonthlyStats: (year: number, month: number) => Promise<void>;
  fetchInsights: (year: number, month: number) => Promise<void>;
  requestShift: (workDateIso: string, shiftType: 'S' | 'C' | 'G', selectedBlocks?: number[]) => Promise<void>;
  cancelShiftRequest: (id: number) => Promise<void>;
};

const SHIFT_LABELS: Record<string, string> = {
  S: 'Ca Sáng',
  C: 'Ca Chiều',
  G: 'Ca Gãy',
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
  selectedDate: (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })(),
  monthlyStats: null,
  insights: null,

  setNote: (note) => set({ note }),
  setSelectedDate: (dateIso) => set({ selectedDate: dateIso }),
  clearError: () => set({ error: null }),

  fetchTodayStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getTodayStatus();
      set({ todayShift: data.shiftType, todayRecords: data.records });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải trạng thái hôm nay' });
    } finally {
      set({ isLoading: false });
    }
  },

  performCheckIn: async (): Promise<CheckResult> => {
    set({ isLoading: true, error: null });
    try {
      const { note } = get();
      const req = { timestamp: toLocalISO(new Date()), note: note.trim() || undefined };
      const record = await api.checkIn(req);
      await get().fetchTodayStatus();
      const { calendarYear, calendarMonth } = get();
      get().fetchCalendar(calendarYear, calendarMonth);
      set({ note: '' });
      const shiftLabel = SHIFT_LABELS[record.shiftType] || record.shiftType;
      const blockInfo = record.shiftType === 'G' ? ` (Block ${record.blockNumber})` : '';
      const isLate = record.checkInStatus === 'LATE';
      return { success: true, status: record.checkInStatus, message: isLate ? `⚠️ Bạn đã vào ${shiftLabel}${blockInfo} nhưng bị TRỄ GIỜ.` : `✅ Vào ${shiftLabel}${blockInfo} thành công — Đúng giờ!` };
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi vào ca';
      set({ error: msg });
      return { success: false, message: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  performCheckOut: async (): Promise<CheckResult> => {
    set({ isLoading: true, error: null });
    try {
      const { note } = get();
      const req = { timestamp: toLocalISO(new Date()), note: note.trim() || undefined };
      const record = await api.checkOut(req);
      await get().fetchTodayStatus();
      const { calendarYear, calendarMonth } = get();
      get().fetchCalendar(calendarYear, calendarMonth);
      set({ note: '' });
      const shiftLabel = SHIFT_LABELS[record.shiftType] || record.shiftType;
      const blockInfo = record.shiftType === 'G' ? ` (Block ${record.blockNumber})` : '';
      const isEarly = record.checkOutStatus === 'EARLY';
      return { success: true, status: record.checkOutStatus, message: isEarly ? `⚠️ Bạn đã ra ${shiftLabel}${blockInfo} nhưng VỀ SỚM.` : `✅ Ra ${shiftLabel}${blockInfo} thành công — Đúng giờ!` };
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi ra ca';
      set({ error: msg });
      return { success: false, message: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCalendar: async (year: number, month: number) => {
    set({ error: null });
    try {
      const data = await api.getMonthlyCalendar(year, month);
      const map = new Map<string, AttendanceDayDto>();
      data.forEach((d) => map.set(d.date, d));
      set({ calendarData: map, calendarMonth: month, calendarYear: year });
    } catch (err: any) {
      console.warn('Calendar fetch error:', err.message);
    }
  },

  fetchMonthlyStats: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getMonthlyStats(year, month);
      set({ monthlyStats: data });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải thống kê tháng' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInsights: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getAdminInsights(year, month);
      set({ insights: data });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải insights' });
    } finally {
      set({ isLoading: false });
    }
  },

  requestShift: async (workDateIso: string, shiftType: 'S' | 'C' | 'G', selectedBlocks?: number[]) => {
    set({ isLoading: true, error: null });
    try {
      await api.createShiftRequest({ workDate: workDateIso, shiftType, selectedBlocks });
      const { calendarYear, calendarMonth } = get();
      await get().fetchCalendar(calendarYear, calendarMonth);
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi đăng ký ca';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelShiftRequest: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.cancelShiftRequest(id);
      const { calendarYear, calendarMonth } = get();
      await get().fetchCalendar(calendarYear, calendarMonth);
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi hủy đăng ký';
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },
}));
