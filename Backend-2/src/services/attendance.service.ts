import prisma from '../config/prisma';

export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT';

export interface AttendanceRow {
  id?: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  date: string; // ISO YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
  status: AttendanceStatus;
}

export function computeAttendanceStatus(params: {
  hasApprovedLeave: boolean;
  checkIn: Date | null;
  checkOut: Date | null;
  workHours: number | null;
  halfDayThresholdHours?: number;
  isToday?: boolean;
}): AttendanceStatus {
  const { hasApprovedLeave, checkIn, checkOut, workHours, halfDayThresholdHours = 4, isToday = false } = params;

  // 1. If an approved LeaveRequest covers today -> ON_LEAVE
  if (hasApprovedLeave) {
    return 'ON_LEAVE';
  }

  // 2. Else if no check-in today -> ABSENT
  if (!checkIn) {
    return 'ABSENT';
  }

  // 3. Check hours
  let effectiveHours = workHours;
  if (effectiveHours === null || effectiveHours === undefined) {
    if (checkOut) {
      effectiveHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    } else if (isToday) {
      effectiveHours = (Date.now() - checkIn.getTime()) / (1000 * 60 * 60);
    } else {
      effectiveHours = 0;
    }
  }

  if (effectiveHours < halfDayThresholdHours) {
    return 'HALF_DAY';
  }

  // 4. Else -> PRESENT
  return 'PRESENT';
}

export function getDateRangeForView(
  view: 'daily' | 'weekly' | 'monthly' = 'monthly',
  dateStr?: string,
  monthStr?: string,
  yearStr?: string
): { startDate: Date; endDate: Date } {
  const refDate = dateStr ? new Date(dateStr) : new Date();

  if (view === 'daily') {
    const start = new Date(refDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(refDate);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (view === 'weekly') {
    const current = new Date(refDate);
    const day = current.getDay();
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(current.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { startDate: monday, endDate: sunday };
  }

  // view === 'monthly'
  let year = refDate.getFullYear();
  let month = refDate.getMonth();

  if (yearStr) year = parseInt(yearStr, 10);
  if (monthStr) month = parseInt(monthStr, 10) - 1; // 1-indexed input to 0-indexed

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end };
}
