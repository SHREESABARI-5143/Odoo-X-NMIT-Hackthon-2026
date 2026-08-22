import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';
import { sendSuccess } from '../utils/apiResponse';

export class CompanyController {
  /**
   * GET /company — Authenticated.
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.getCompany();
      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  }
}
