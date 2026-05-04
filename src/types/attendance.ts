export type ShiftType = 'S' | 'C' | 'G' | 'P' | 'F' | 'OFF';
export type DayStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'SCHEDULED' | 'OFF';

export interface ShiftBlock {
  blockNumber: number;
  startTime: string; // 'HH:mm:ss'
  endTime: string;
}

export interface ShiftConfig {
  shiftType: ShiftType;
  blocks: ShiftBlock[];
}

export interface AttendanceRecord {
  id: number;
  workDate: string;
  shiftType: ShiftType;
  blockNumber: number;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInStatus: 'ON_TIME' | 'LATE' | null;
  checkOutStatus: 'ON_TIME' | 'EARLY' | null;
  note: string | null;
}

export interface AttendanceDayDto {
  date: string;
  shiftType: ShiftType | null;
  dayStatus: DayStatus;
  records: AttendanceRecord[];
}

export interface StaffAttendanceTodayDto {
  date: string;
  shiftType: ShiftType | null;
  records: AttendanceRecord[];
}

export interface AttendanceCheckRequest {
  timestamp: string; // ISO 8601 string
  latitude?: number;
  longitude?: number;
  note?: string;
}
