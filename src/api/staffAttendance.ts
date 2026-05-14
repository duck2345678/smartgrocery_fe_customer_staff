import apiClient from './client';
import {
  ShiftConfig,
  AttendanceCheckRequest,
  AttendanceRecord,
  StaffAttendanceTodayDto,
  AttendanceDayDto,
  ShiftRequestCreateRequest,
  ShiftRequestDto,
  AttendanceMonthlyStatsDto,
  AttendanceInsightDto,
} from '../types/attendance';

const unwrap = <T>(value: unknown): T => {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
};

const coerceArray = <T>(value: unknown): T[] => {
  const unwrapped = unwrap<unknown>(value);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (unwrapped && typeof unwrapped === 'object') {
    if ('items' in unwrapped && Array.isArray((unwrapped as { items?: unknown }).items)) return (unwrapped as { items: T[] }).items;
    if ('content' in unwrapped && Array.isArray((unwrapped as { content?: unknown }).content)) return (unwrapped as { content: T[] }).content ?? [];
  }
  return [];
};

const coerceObject = <T>(value: unknown): T => unwrap<T>(value);

export const getShiftConfig = async (): Promise<ShiftConfig[]> => {
  const response = await apiClient.get('/staff/attendance/shift-config');
  return coerceArray<ShiftConfig>(response.data);
};

export const checkIn = async (req: AttendanceCheckRequest): Promise<AttendanceRecord> => {
  const response = await apiClient.post('/staff/attendance/check-in', req);
  return coerceObject<AttendanceRecord>(response.data);
};

export const checkOut = async (req: AttendanceCheckRequest): Promise<AttendanceRecord> => {
  const response = await apiClient.post('/staff/attendance/check-out', req);
  return coerceObject<AttendanceRecord>(response.data);
};

export const getTodayStatus = async (): Promise<StaffAttendanceTodayDto> => {
  const response = await apiClient.get('/staff/attendance/today');
  return coerceObject<StaffAttendanceTodayDto>(response.data);
};

export const getMonthlyCalendar = async (year: number, month: number): Promise<AttendanceDayDto[]> => {
  const response = await apiClient.get(`/staff/attendance/calendar?year=${year}&month=${month}`);
  return coerceArray<AttendanceDayDto>(response.data);
};

export const getMonthlyStats = async (year: number, month: number): Promise<AttendanceMonthlyStatsDto> => {
  const response = await apiClient.get(`/staff/attendance/monthly-stats?year=${year}&month=${month}`);
  return coerceObject<AttendanceMonthlyStatsDto>(response.data);
};

export const getAdminInsights = async (year: number, month: number): Promise<AttendanceInsightDto> => {
  const response = await apiClient.get(`/admin/attendance/insights?year=${year}&month=${month}`);
  return coerceObject<AttendanceInsightDto>(response.data);
};

export const createShiftRequest = async (req: ShiftRequestCreateRequest): Promise<ShiftRequestDto> => {
  const response = await apiClient.post('/staff/attendance/requests', req);
  return coerceObject<ShiftRequestDto>(response.data);
};

export const cancelShiftRequest = async (id: number): Promise<ShiftRequestDto> => {
  const response = await apiClient.delete(`/staff/attendance/requests/${id}`);
  return coerceObject<ShiftRequestDto>(response.data);
};
