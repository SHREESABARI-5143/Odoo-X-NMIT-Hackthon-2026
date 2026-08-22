import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';
import { comparePassword, hashPassword, validatePasswordPolicy } from '../utils/password';
import { ApiError } from '../utils/apiError';
import { JwtPayload } from '../middleware/authenticate';

export class AuthService {
  /**
   * Authenticate user with loginId and password.
   * Returns JWT token and firstLogin flag.
   */
  static async login(loginId: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { loginId },
          { email: loginId }
        ]
      },
      include: { employee: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid Login ID or password.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid Login ID or password.');
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      employeeId: user.employeeId,
      loginId: user.loginId,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    return {
      token,
      firstLogin: user.firstLogin,
      user: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          fullName: user.employee.fullName,
          profilePicture: user.employee.profilePicture,
        },
      },
    };
  }

  /**
   * Change password for authenticated user.
   * Validates old password, enforces policy, sets firstLogin to false.
   */
  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    // Validate password policy server-side
    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.valid) {
      throw ApiError.badRequest(policyCheck.message!);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        firstLogin: false,
      },
    });

    return { message: 'Password changed successfully.' };
  }
}
