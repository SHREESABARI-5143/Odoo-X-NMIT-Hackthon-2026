import { Request, Response, NextFunction } from 'express';
import { SkillService, CertificationService } from '../services/skill.service';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class SkillController {
  /**
   * POST /skills
   * Body: { employeeId, name }
   */
  static async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, name } = req.body;
      if (!employeeId || !name) {
        throw ApiError.badRequest('Employee ID and skill name are required.');
      }

      // Ownership check: Employee can only add skills to self
      if (req.user!.role !== 'ADMIN_HR' && req.user!.employeeId !== employeeId) {
        throw ApiError.forbidden('You do not have permission to perform this action.');
      }

      const result = await SkillService.addSkillToEmployee(employeeId, name);
      sendSuccess(res, result, 'Skill added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /employees/:id/skills
   */
  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const skills = await SkillService.getByEmployeeId(employeeId);
      sendSuccess(res, skills);
    } catch (error) {
      next(error);
    }
  }
}

export class CertificationController {
  /**
   * POST /certifications
   * Body: { employeeId, name, issuingOrganization?, issueDate?, expiryDate? }
   */
  static async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, name, issuingOrganization, issueDate, expiryDate } = req.body;
      if (!employeeId || !name) {
        throw ApiError.badRequest('Employee ID and certification name are required.');
      }

      // Ownership check
      if (req.user!.role !== 'ADMIN_HR' && req.user!.employeeId !== employeeId) {
        throw ApiError.forbidden('You do not have permission to perform this action.');
      }

      const cert = await CertificationService.addCertification(employeeId, {
        name,
        issuingOrganization,
        issueDate,
        expiryDate,
      });
      sendSuccess(res, cert, 'Certification added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /employees/:id/certifications
   */
  static async getByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const certs = await CertificationService.getByEmployeeId(employeeId);
      sendSuccess(res, certs);
    } catch (error) {
      next(error);
    }
  }
}
