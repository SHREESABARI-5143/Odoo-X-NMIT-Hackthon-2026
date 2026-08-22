import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError';

/**
 * Ownership verification middleware for employee-scoped routes.
 * Checks that the requester is accessing their own data OR is ADMIN_HR.
 *
 * Uses req.params.id as the employee ID being accessed.
 * Compares against req.user.employeeId from JWT.
 */
export function ownershipCheck(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized('Authentication required.'));
    return;
  }

  // Admin/HR can access any employee's data
  if (req.user.role === Role.ADMIN_HR) {
    next();
    return;
  }

  const requestedEmployeeId = parseInt(String(req.params.id), 10);

  if (isNaN(requestedEmployeeId)) {
    next(ApiError.badRequest('Invalid employee ID.'));
    return;
  }

  // Employee can only access their own data
  if (req.user.employeeId !== requestedEmployeeId) {
    next(ApiError.forbidden('You do not have permission to perform this action.'));
    return;
  }

  next();
}
