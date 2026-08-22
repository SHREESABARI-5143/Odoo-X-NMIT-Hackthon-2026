import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { computeAttendanceStatus, getDateRangeForView, AttendanceRow } from '../services/attendance.service';

export async function checkIn(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    if (existing && existing.checkIn) {
      res.status(400).json({
        error: 'Already checked in for today.',
        message: 'Already checked in for today.'
      });
      return;
    }

    const now = new Date();
    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: { checkIn: now }
        })
      : await prisma.attendance.create({
          data: {
            employeeId,
            date: todayStart,
            checkIn: now
          }
        });

    // Check if there's an approved leave for today
    const leave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart }
      }
    });

    const salary = await prisma.salary.findUnique({ where: { employeeId } });

    const status = computeAttendanceStatus({
      hasApprovedLeave: !!leave,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      workHours: attendance.workHours,
      halfDayThresholdHours: salary?.halfDayThresholdHours || 4,
      isToday: true
    });

    res.status(200).json({
      message: 'Check-in successful.',
      attendance: {
        ...attendance,
        status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function checkOut(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    if (!existing || !existing.checkIn) {
      res.status(400).json({
        error: 'No active check-in found for today.',
        message: 'No active check-in found for today.'
      });
      return;
    }

    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - new Date(existing.checkIn).getTime();
    const rawHours = durationMs / (1000 * 60 * 60);
    const workHours = Math.round(rawHours * 100) / 100;
    const extraHours = Math.max(0, Math.round((workHours - 8) * 100) / 100);

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        workHours,
        extraHours
      }
    });

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart }
      }
    });

    const salary = await prisma.salary.findUnique({ where: { employeeId } });

    const status = computeAttendanceStatus({
      hasApprovedLeave: !!leave,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      workHours: updated.workHours,
      halfDayThresholdHours: salary?.halfDayThresholdHours || 4
    });

    res.status(200).json({
      message: 'Check-out successful.',
      attendance: {
        ...updated,
        status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getMyAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const { view = 'monthly', date, month, year } = req.query as {
      view?: 'daily' | 'weekly' | 'monthly';
      date?: string;
      month?: string;
      year?: string;
    };

    const { startDate, endDate } = getDateRangeForView(view, date, month, year);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { salary: true }
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } }
        ]
      }
    });

    // Generate date sequence for the range to return consistent rows
    const rows: AttendanceRow[] = [];
    const current = new Date(startDate);
    const halfDayThreshold = employee.salary?.halfDayThresholdHours || 4;

    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const att = attendances.find((a) => {
        const aDate = new Date(a.date);
        return aDate >= dayStart && aDate <= dayEnd;
      });

      const leave = leaves.find((l) => {
        const lStart = new Date(l.startDate);
        lStart.setHours(0, 0, 0, 0);
        const lEnd = new Date(l.endDate);
        lEnd.setHours(23, 59, 59, 999);
        return dayStart >= lStart && dayStart <= lEnd;
      });

      const isToday = new Date().toDateString() === dayStart.toDateString();

      const status = computeAttendanceStatus({
        hasApprovedLeave: !!leave,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        workHours: att?.workHours ?? null,
        halfDayThresholdHours: halfDayThreshold,
        isToday
      });

      rows.push({
        id: att?.id,
        employeeId: employee.id,
        employeeName: employee.fullName,
        employeeCode: employee.employeeCode,
        department: employee.department,
        date: dayStart.toISOString().split('T')[0],
        checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
        checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
        workHours: att?.workHours ?? null,
        extraHours: att?.extraHours ?? null,
        status
      });

      current.setDate(current.getDate() + 1);
    }

    res.json({
      view,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      records: rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getAllAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { view = 'monthly', date, month, year, department, search, employeeId } = req.query as {
      view?: 'daily' | 'weekly' | 'monthly';
      date?: string;
      month?: string;
      year?: string;
      department?: string;
      search?: string;
      employeeId?: string;
    };

    const { startDate, endDate } = getDateRangeForView(view, date, month, year);

    const whereEmployee: any = {};
    if (department) {
      whereEmployee.department = { contains: department };
    }
    if (employeeId) {
      whereEmployee.id = employeeId;
    }
    if (search) {
      whereEmployee.OR = [
        { fullName: { contains: search } },
        { employeeCode: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      include: { salary: true },
      orderBy: { fullName: 'asc' }
    });

    const empIds = employees.map((e) => e.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: { in: empIds },
        date: { gte: startDate, lte: endDate }
      }
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: empIds },
        status: 'APPROVED',
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } }
        ]
      }
    });

    const allRows: AttendanceRow[] = [];

    for (const emp of employees) {
      const halfDayThreshold = emp.salary?.halfDayThresholdHours || 4;
      const current = new Date(startDate);

      while (current <= endDate) {
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        const att = attendances.find((a) => {
          const aDate = new Date(a.date);
          return a.employeeId === emp.id && aDate >= dayStart && aDate <= dayEnd;
        });

        const leave = leaves.find((l) => {
          const lStart = new Date(l.startDate);
          lStart.setHours(0, 0, 0, 0);
          const lEnd = new Date(l.endDate);
          lEnd.setHours(23, 59, 59, 999);
          return l.employeeId === emp.id && dayStart >= lStart && dayStart <= lEnd;
        });

        const isToday = new Date().toDateString() === dayStart.toDateString();

        const status = computeAttendanceStatus({
          hasApprovedLeave: !!leave,
          checkIn: att?.checkIn || null,
          checkOut: att?.checkOut || null,
          workHours: att?.workHours ?? null,
          halfDayThresholdHours: halfDayThreshold,
          isToday
        });

        allRows.push({
          id: att?.id,
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          department: emp.department,
          date: dayStart.toISOString().split('T')[0],
          checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
          checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
          workHours: att?.workHours ?? null,
          extraHours: att?.extraHours ?? null,
          status
        });

        current.setDate(current.getDate() + 1);
      }
    }

    res.json({
      view,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalRecords: allRows.length,
      records: allRows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
