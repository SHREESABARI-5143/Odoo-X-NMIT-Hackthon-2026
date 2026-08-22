import prisma from '../config/prisma';
import { calculateSalary, SalaryBreakdown } from './salaryEngine.service';
import { computeAttendanceStatus } from './attendance.service';

export interface EmployeePayrollRow {
  employee_id: string;
  employee_code: string;
  name: string;
  department: string;
  job_position: string;
  month: number;
  year: number;
  monthly_wage: number;
  basic: number;
  hra: number;
  gross: number;
  pf: number;
  tax: number;
  net: number;
  total_working_days: number;
  present_days: number;
  half_days: number;
  approved_paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  payable_days: number;
  payable_salary: number;
  salary_breakdown: SalaryBreakdown;
}

export async function calculateEmployeeMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number // 1-indexed (1..12)
): Promise<EmployeePayrollRow | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      salary: true,
      salaryComponents: true,
      pfConfig: true,
      taxConfig: true
    }
  });

  if (!employee || !employee.salary) {
    return null;
  }

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = endOfMonth.getDate();

  // Fetch all attendances in this month
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  // Fetch approved leave requests in this month
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      AND: [
        { startDate: { lte: endOfMonth } },
        { endDate: { gte: startOfMonth } }
      ]
    },
    include: {
      leaveType: true
    }
  });

  const workingDaysPerWeek = employee.salary.workingDaysPerWeek || 5;
  const halfDayThreshold = employee.salary.halfDayThresholdHours || 4;

  let totalWorkingDays = 0;
  let presentDays = 0;
  let halfDays = 0;
  let approvedPaidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat

    // Check if weekend based on workingDaysPerWeek
    const isWeekend = workingDaysPerWeek === 5 ? dayOfWeek === 0 || dayOfWeek === 6 : dayOfWeek === 0;

    if (!isWeekend) {
      totalWorkingDays++;
    }

    // Check if approved leave applies to this day
    const leaveForDay = approvedLeaves.find((l) => {
      const start = new Date(l.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(l.endDate);
      end.setHours(23, 59, 59, 999);
      return currentDate >= start && currentDate <= end;
    });

    // Check attendance for day
    const currentDayMidnight = new Date(currentDate);
    currentDayMidnight.setHours(0, 0, 0, 0);
    const nextDayMidnight = new Date(currentDate);
    nextDayMidnight.setDate(currentDate.getDate() + 1);
    nextDayMidnight.setHours(0, 0, 0, 0);

    const att = attendances.find((a) => {
      const aDate = new Date(a.date);
      return aDate >= currentDayMidnight && aDate < nextDayMidnight;
    });

    const status = computeAttendanceStatus({
      hasApprovedLeave: !!leaveForDay,
      checkIn: att?.checkIn || null,
      checkOut: att?.checkOut || null,
      workHours: att?.workHours ?? null,
      halfDayThresholdHours: halfDayThreshold
    });

    if (leaveForDay) {
      if (leaveForDay.leaveType.paid) {
        if (!isWeekend) approvedPaidLeaveDays++;
      } else {
        if (!isWeekend) unpaidLeaveDays++;
      }
    } else if (status === 'PRESENT') {
      if (!isWeekend) presentDays++;
    } else if (status === 'HALF_DAY') {
      if (!isWeekend) halfDays++;
    } else {
      if (!isWeekend) absentDays++;
    }
  }

  // Policy: Each half-day counts as 0.5 payable day
  const rawPayableDays = presentDays + halfDays * 0.5 + approvedPaidLeaveDays;
  const payableDays = Math.min(totalWorkingDays, Math.round(rawPayableDays * 10) / 10);

  const salaryBreakdown = calculateSalary({
    employeeId: employee.id,
    salary: employee.salary,
    components: employee.salaryComponents,
    pfConfig: employee.pfConfig,
    taxConfig: employee.taxConfig,
    payableDays,
    totalWorkingDays: totalWorkingDays > 0 ? totalWorkingDays : 30
  });

  return {
    employee_id: employee.id,
    employee_code: employee.employeeCode,
    name: employee.fullName,
    department: employee.department,
    job_position: employee.jobPosition,
    month,
    year,
    monthly_wage: salaryBreakdown.monthlyWage,
    basic: salaryBreakdown.basic,
    hra: salaryBreakdown.hra,
    gross: salaryBreakdown.grossSalary,
    pf: salaryBreakdown.employeePF,
    tax: salaryBreakdown.professionalTax,
    net: salaryBreakdown.netSalary,
    total_working_days: totalWorkingDays,
    present_days: presentDays,
    half_days: halfDays,
    approved_paid_leave_days: approvedPaidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    payable_days: payableDays,
    payable_salary: salaryBreakdown.payableSalary,
    salary_breakdown: salaryBreakdown
  };
}
