import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/apiError';
import { Role } from '@prisma/client';

export interface JwtPayload {
  id: number;       // User.id
  role: Role;
  employeeId: number;
  loginId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT verification middleware.
 * Extracts token from Authorization: Bearer <token> header.
 * Attaches decoded payload to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid or expired token.'));
    } else {
      next(ApiError.unauthorized('Authentication failed.'));
    }
  }
}
