import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import {
  calculateLeaveDurationDays,
  checkLeaveOverlap,
  EXACT_OVERLAP_ERROR,
  EXACT_INSUFFICIENT_ERROR,
  EXACT_REJECTION_COMMENT_ERROR
} from '../services/leave.service';
import { sanitizeText } from '../utils/sanitize';

export async function createLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const { leaveTypeId, startDate, endDate, remarks, attachment } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      res.status(400).json({ error: 'leaveTypeId, startDate, and endDate are required.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date format.' });
      return;
    }

    if (start > end) {
      res.status(400).json({ error: 'Start date must be before or equal to end date.' });
      return;
    }

    // Server-side calculated duration
    const duration = calculateLeaveDurationDays(start, end);
    if (duration <= 0) {
      res.status(400).json({ error: 'Leave duration must be at least 1 day.' });
      return;
    }

    // Check leave type
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId }
    });

    if (!leaveType) {
      res.status(404).json({ error: 'Leave type not found.' });
      return;
    }

    // Check attachment requirement
    if (leaveType.requiresAttachment && !attachment) {
      res.status(400).json({
        error: 'Unsupported file type or file too large.',
        message: 'Unsupported file type or file too large.'
      });
      return;
    }

    // Check overlap
    const hasOverlap = await checkLeaveOverlap(employeeId, start, end);
    if (hasOverlap) {
      res.status(400).json({
        error: EXACT_OVERLAP_ERROR,
        message: EXACT_OVERLAP_ERROR
      });
      return;
    }

    // Check allocation
    const allocation = await prisma.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId: {
          employeeId,
          leaveTypeId
        }
      }
    });

    if (leaveType.paid && allocation) {
      if (allocation.remainingDays < duration) {
        res.status(400).json({
          error: EXACT_INSUFFICIENT_ERROR,
          message: EXACT_INSUFFICIENT_ERROR
        });
        return;
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        duration,
        attachment: sanitizeText(attachment),
        remarks: sanitizeText(remarks),
        status: 'PENDING'
      },
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveRequest
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getAllLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, employeeId, leaveTypeId, department } = req.query as {
      status?: string;
      employeeId?: string;
      leaveTypeId?: string;
      department?: string;
    };

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (department) {
      where.employee = { department: { contains: department } };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            jobPosition: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ leaveRequests });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getMyLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const [leaveRequests, allocations] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId },
        include: { leaveType: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveAllocation.findMany({
        where: { employeeId },
        include: { leaveType: true }
      })
    ]);

    res.json({
      leaveRequests,
      allocations
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function approveLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const comment = req.body.decisionComment || req.body.decision_comment || req.body.comment;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true }
    });

    if (!request) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (request.status === 'APPROVED') {
      res.status(400).json({ error: 'Leave request is already approved.' });
      return;
    }

    // Atomic transaction for approval
    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.leaveAllocation.findUnique({
        where: {
          employeeId_leaveTypeId: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId
          }
        }
      });

      if (allocation) {
        if (allocation.remainingDays < request.duration) {
          throw new Error(EXACT_INSUFFICIENT_ERROR);
        }

        const newUsed = allocation.usedDays + request.duration;
        const newRemaining = allocation.allocatedDays - newUsed;

        if (newRemaining < 0) {
          throw new Error(EXACT_INSUFFICIENT_ERROR);
        }

        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedDays: newUsed,
            remainingDays: newRemaining
          }
        });
      }

      const updatedRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: req.user?.id || 'ADMIN',
          approvedAt: new Date(),
          decisionComment: sanitizeText(comment) || null
        },
        include: {
          leaveType: true,
          employee: true
        }
      });

      return updatedRequest;
    });

    res.json({
      message: 'Leave request approved successfully.',
      leaveRequest: result
    });
  } catch (error: any) {
    if (error.message === EXACT_INSUFFICIENT_ERROR) {
      res.status(400).json({
        error: EXACT_INSUFFICIENT_ERROR,
        message: EXACT_INSUFFICIENT_ERROR
      });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function rejectLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const comment = req.body.decisionComment || req.body.decision_comment || req.body.comment;

    // Reject requires decision comment
    if (!comment || String(comment).trim().length === 0) {
      res.status(400).json({
        error: EXACT_REJECTION_COMMENT_ERROR,
        message: EXACT_REJECTION_COMMENT_ERROR
      });
      return;
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        decisionComment: sanitizeText(comment)
      },
      include: {
        leaveType: true,
        employee: true
      }
    });

    res.json({
      message: 'Leave request rejected.',
      leaveRequest: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
