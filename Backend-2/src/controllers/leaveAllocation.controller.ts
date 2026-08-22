import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export async function getLeaveAllocations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { employeeId } = req.query as { employeeId?: string };

    const where: any = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const allocations = await prisma.leaveAllocation.findMany({
      where,
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
      },
      orderBy: [{ employeeId: 'asc' }, { leaveTypeId: 'asc' }]
    });

    const leaveTypes = await prisma.leaveType.findMany();

    res.json({
      allocations,
      leaveTypes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateLeaveAllocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { employeeId, leaveTypeId, allocatedDays } = req.body;

    if (!employeeId || !leaveTypeId || allocatedDays === undefined || allocatedDays === null) {
      res.status(400).json({ error: 'employeeId, leaveTypeId, and allocatedDays are required.' });
      return;
    }

    const newAllocated = parseInt(allocatedDays, 10);
    if (isNaN(newAllocated) || newAllocated < 0) {
      res.status(400).json({ error: 'allocatedDays must be a non-negative integer.' });
      return;
    }

    const existing = await prisma.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId: {
          employeeId,
          leaveTypeId
        }
      }
    });

    const usedDays = existing ? existing.usedDays : 0;
    if (newAllocated < usedDays) {
      res.status(400).json({
        error: `Cannot set allocation lower than already used days (${usedDays} days used).`
      });
      return;
    }

    const remainingDays = newAllocated - usedDays;

    const allocation = await prisma.leaveAllocation.upsert({
      where: {
        employeeId_leaveTypeId: {
          employeeId,
          leaveTypeId
        }
      },
      update: {
        allocatedDays: newAllocated,
        remainingDays
      },
      create: {
        employeeId,
        leaveTypeId,
        allocatedDays: newAllocated,
        usedDays: 0,
        remainingDays: newAllocated
      },
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true
          }
        }
      }
    });

    res.json({
      message: 'Leave allocation updated successfully.',
      allocation
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
