import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  userId?: string;
  employeeId?: string | null;
  role: 'ADMIN_HR' | 'EMPLOYEE' | string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dayflow-super-secret-jwt-key-2026';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication token required.',
      message: 'Authentication token required.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      employeeId: decoded.employeeId,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired token.',
      message: 'Invalid or expired token.'
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.',
        message: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN_HR');
