export type ShiftType = 'S' | 'C' | 'G' | 'P' | 'OFF';
export type DayStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'SCHEDULED' | 'OFF' | 'NO_SCHEDULE';

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
  checkOutStatus: 'ON_TIME' | 'EARLY' | 'LATE' | 'AUTO_CLOSED' | null;
  note: string | null;
}

export interface AttendanceDayDto {
  date: string;
  shiftType: ShiftType | null;
  dayStatus: DayStatus;
  records: AttendanceRecord[];
  requestId?: number | null;
  requestShiftType?: ShiftType | null;
  requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | null;
  requestAdminNote?: string | null;
  selectedBlocks?: string | null;
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

export interface ShiftRequestCreateRequest {
  workDate: string;
  shiftType: 'S' | 'C' | 'G';
  selectedBlocks?: number[];
}

export interface ShiftRequestDto {
  id: number;
  workDate: string;
  shiftType: 'S' | 'C' | 'G';
  selectedBlocks?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceDailySummaryDto {
  date: string;
  shiftType: ShiftType;
  dayStatus: DayStatus | 'NO_SCHEDULE';
  scheduledBlocks: number;
  completedBlocks: number;
  hasLateCheckIn: boolean;
  hasEarlyCheckOut: boolean;
  workedMinutes: number;
  scheduledMinutes: number;
}

export interface AttendanceChartPointDto {
  date: string;
  workedMinutes: number;
  scheduledMinutes: number;
  completedBlocks: number;
  scheduledBlocks: number;
  late: boolean;
  early: boolean;
}

export interface AttendanceMonthlyStatsDto {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  scheduledDays: number;
  attendedDays: number;
  absentDays: number;
  lateCheckIns: number;
  earlyCheckOuts: number;
  onTimeCheckIns: number;
  onTimeCheckOuts: number;
  totalBlocks: number;
  completedBlocks: number;
  completionRate: number;
  totalWorkedMinutes: number;
  totalScheduledMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  dailySummaries: AttendanceDailySummaryDto[];
  chartPoints: AttendanceChartPointDto[];
}

export interface AttendanceRankingItemDto {
  userId: number;
  userFullName: string;
  lateCount: number;
  absentCount: number;
  earlyCount: number;
  attendedDays: number;
  score: number;
}

export interface AttendanceInsightDto {
  chartPoints: AttendanceChartPointDto[];
  lateRanking: AttendanceRankingItemDto[];
  absentRanking: AttendanceRankingItemDto[];
  earlyRanking: AttendanceRankingItemDto[];
  topLateDays: AttendanceDailySummaryDto[];
  topEarlyDays: AttendanceDailySummaryDto[];
}
