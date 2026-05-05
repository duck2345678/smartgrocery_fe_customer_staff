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

export const getShiftConfig = async (): Promise<ShiftConfig[]> => {
  const response = await apiClient.get('/staff/attendance/shift-config');
  return response.data;
};

export const checkIn = async (req: AttendanceCheckRequest): Promise<AttendanceRecord> => {
  const response = await apiClient.post('/staff/attendance/check-in', req);
  return response.data;
};

export const checkOut = async (req: AttendanceCheckRequest): Promise<AttendanceRecord> => {
  const response = await apiClient.post('/staff/attendance/check-out', req);
  return response.data;
};

export const getTodayStatus = async (): Promise<StaffAttendanceTodayDto> => {
  const response = await apiClient.get('/staff/attendance/today');
  return response.data;
};

export const getMonthlyCalendar = async (year: number, month: number): Promise<AttendanceDayDto[]> => {
  const response = await apiClient.get(`/staff/attendance/calendar?year=${year}&month=${month}`);
  return response.data;
};

export const getMonthlyStats = async (year: number, month: number): Promise<AttendanceMonthlyStatsDto> => {
  const response = await apiClient.get(`/staff/attendance/monthly-stats?year=${year}&month=${month}`);
  return response.data;
};

export const getAdminInsights = async (year: number, month: number): Promise<AttendanceInsightDto> => {
  const response = await apiClient.get(`/admin/attendance/insights?year=${year}&month=${month}`);
  return response.data;
};

export const createShiftRequest = async (req: ShiftRequestCreateRequest): Promise<ShiftRequestDto> => {
  const response = await apiClient.post('/staff/attendance/requests', req);
  return response.data;
};

export const cancelShiftRequest = async (id: number): Promise<ShiftRequestDto> => {
  const response = await apiClient.delete(`/staff/attendance/requests/${id}`);
  return response.data;
};
