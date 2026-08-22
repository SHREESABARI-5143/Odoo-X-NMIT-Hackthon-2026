import { Request, Response, NextFunction } from 'express';
import { PrivateInfoService } from '../services/privateInfo.service';
import { sendSuccess } from '../utils/apiResponse';

export class PrivateInfoController {
  /**
   * GET /employees/:id/private-info
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const privateInfo = await PrivateInfoService.getByEmployeeId(employeeId);
      sendSuccess(res, privateInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /employees/:id/private-info
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const privateInfo = await PrivateInfoService.update(employeeId, req.body);
      sendSuccess(res, privateInfo, 'Private info updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
