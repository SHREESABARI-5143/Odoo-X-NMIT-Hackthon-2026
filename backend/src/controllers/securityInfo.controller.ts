import { Request, Response, NextFunction } from 'express';
import { SecurityInfoService } from '../services/securityInfo.service';
import { sendSuccess } from '../utils/apiResponse';

export class SecurityInfoController {
  /**
   * GET /employees/:id/security
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const securityInfo = await SecurityInfoService.getByEmployeeId(employeeId);
      sendSuccess(res, securityInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /employees/:id/security
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const securityInfo = await SecurityInfoService.update(employeeId, req.body);
      sendSuccess(res, securityInfo, 'Security info updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
