import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export async function requestLeave(req: AuthRequest, res: Response) {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: 'Unauthorized' });

    const { leaveType, startDate, endDate, reason, attachmentUrl } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide leave type, start date, and end date.' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date cannot be after end date.' });
    }

    // Check overlapping requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Selected dates overlap with an existing leave request.' });
    }

    const duration = calculateDaysBetween(startDate, endDate);

    // Check allocation
    let allocation = await prisma.leaveAllocation.findUnique({
      where: { employeeId },
    });

    if (!allocation) {
      allocation = await prisma.leaveAllocation.create({
        data: {
          employeeId,
          paidAllocated: 15,
          paidUsed: 0,
          sickAllocated: 10,
          sickUsed: 0,
          unpaidAllocated: 5,
          unpaidUsed: 0,
          year: 2026,
        },
      });
    }

    const typeLower = leaveType.toLowerCase();
    let remaining = 0;
    if (typeLower === 'paid') {
      remaining = allocation.paidAllocated - allocation.paidUsed;
    } else if (typeLower === 'sick') {
      remaining = allocation.sickAllocated - allocation.sickUsed;
    } else if (typeLower === 'unpaid') {
      remaining = allocation.unpaidAllocated - allocation.unpaidUsed;
    }

    if (duration > remaining) {
      return res.status(400).json({ message: 'You do not have enough leave allocation.' });
    }

    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate,
        endDate,
        duration,
        reason: reason || '',
        attachmentUrl: attachmentUrl || '',
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Leave request submitted.',
      leaveRequest: newRequest,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error submitting leave request.' });
  }
}

export async function getMyLeaves(req: AuthRequest, res: Response) {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: 'Unauthorized' });

    let allocation = await prisma.leaveAllocation.findUnique({
      where: { employeeId },
    });

    if (!allocation) {
      allocation = await prisma.leaveAllocation.create({
        data: {
          employeeId,
          paidAllocated: 15,
          paidUsed: 0,
          sickAllocated: 10,
          sickUsed: 0,
          unpaidAllocated: 5,
          unpaidUsed: 0,
          year: 2026,
        },
      });
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      allocation: {
        paid: {
          allocated: allocation.paidAllocated,
          used: allocation.paidUsed,
          remaining: Math.max(0, allocation.paidAllocated - allocation.paidUsed),
        },
        sick: {
          allocated: allocation.sickAllocated,
          used: allocation.sickUsed,
          remaining: Math.max(0, allocation.sickAllocated - allocation.sickUsed),
        },
        unpaid: {
          allocated: allocation.unpaidAllocated,
          used: allocation.unpaidUsed,
          remaining: Math.max(0, allocation.unpaidAllocated - allocation.unpaidUsed),
        },
      },
      requests,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching leave records.' });
  }
}

export async function getAllLeaves(req: AuthRequest, res: Response) {
  try {
    const requests = await prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const employeeIds = [...new Set(requests.map((r) => r.employeeId))];
    const employees = await prisma.user.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true, email: true, loginId: true, department: true },
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));

    const formatted = requests.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        ...r,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
        employeeLoginId: emp ? emp.loginId : '',
        department: emp ? emp.department : '',
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching all leaves.' });
  }
}

export async function approveLeave(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const { comment } = req.body;

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ message: `Leave is already ${leave.status.toLowerCase()}.` });
    }

    // Update leave request status
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: adminId,
        rejectionComment: comment || null,
      },
    });

    // Deduct allocation
    const allocation = await prisma.leaveAllocation.findUnique({
      where: { employeeId: leave.employeeId },
    });

    if (allocation) {
      const typeLower = leave.leaveType.toLowerCase();
      if (typeLower === 'paid') {
        await prisma.leaveAllocation.update({
          where: { employeeId: leave.employeeId },
          data: { paidUsed: allocation.paidUsed + leave.duration },
        });
      } else if (typeLower === 'sick') {
        await prisma.leaveAllocation.update({
          where: { employeeId: leave.employeeId },
          data: { sickUsed: allocation.sickUsed + leave.duration },
        });
      } else if (typeLower === 'unpaid') {
        await prisma.leaveAllocation.update({
          where: { employeeId: leave.employeeId },
          data: { unpaidUsed: allocation.unpaidUsed + leave.duration },
        });
      }
    }

    // Check if leave covers today, update today's attendance to ON_LEAVE
    const todayStr = new Date().toISOString().split('T')[0];
    if (leave.startDate <= todayStr && leave.endDate >= todayStr) {
      const todayAttendance = await prisma.attendance.findFirst({
        where: { employeeId: leave.employeeId, date: todayStr },
      });
      if (todayAttendance) {
        await prisma.attendance.update({
          where: { id: todayAttendance.id },
          data: { status: 'ON_LEAVE' },
        });
      } else {
        await prisma.attendance.create({
          data: {
            employeeId: leave.employeeId,
            date: todayStr,
            status: 'ON_LEAVE',
          },
        });
      }
    }

    return res.json({
      message: 'Leave approved.',
      leaveRequest: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error approving leave.' });
  }
}

export async function rejectLeave(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'A rejection comment is required.' });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ message: `Leave is already ${leave.status.toLowerCase()}.` });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionComment: comment.trim(),
      },
    });

    return res.json({
      message: 'Leave rejected.',
      leaveRequest: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error rejecting leave.' });
  }
}
