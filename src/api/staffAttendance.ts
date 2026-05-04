import apiClient from './client';
import {
  ShiftConfig,
  AttendanceCheckRequest,
  AttendanceRecord,
  StaffAttendanceTodayDto,
  AttendanceDayDto,
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
