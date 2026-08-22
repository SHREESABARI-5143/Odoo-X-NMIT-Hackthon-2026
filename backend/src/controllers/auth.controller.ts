import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  /**
   * POST /auth/login
   * Public — returns JWT + firstLogin flag.
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { loginId, password } = req.body;
      const result = await AuthService.login(loginId, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/change-password
   * Authenticated — enforces password policy, sets firstLogin = false.
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
