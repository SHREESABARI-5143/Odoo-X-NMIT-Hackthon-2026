import prisma from '../config/prisma';
import { sanitizeText } from '../utils/sanitize';

export const EXACT_OVERLAP_ERROR = 'Selected dates overlap with an existing leave request.';
export const EXACT_INSUFFICIENT_ERROR = 'You do not have enough leave allocation.';
export const EXACT_REJECTION_COMMENT_ERROR = 'A rejection comment is required.';

export function calculateLeaveDurationDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  // Inclusive of start and end day
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

export async function checkLeaveOverlap(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  excludeRequestId?: string
): Promise<boolean> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const existing = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      id: excludeRequestId ? { not: excludeRequestId } : undefined,
      status: { in: ['PENDING', 'APPROVED'] },
      AND: [
        { startDate: { lte: end } },
        { endDate: { gte: start } }
      ]
    }
  });

  return !!existing;
}
