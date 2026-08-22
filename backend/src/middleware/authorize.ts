import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError';

/**
 * Role-based authorization middleware factory.
 * Only allows users with one of the specified roles to proceed.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to perform this action.'));
      return;
    }

    next();
  };
}
