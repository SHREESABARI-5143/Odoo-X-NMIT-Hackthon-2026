import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { getFileUrl } from '../utils/fileUpload';
import { CompanyService } from '../services/company.service';
import { config } from '../config';
import prisma from '../config/prisma';

export class UploadController {
  /**
   * POST /upload/profile-picture
   * Self or Admin/HR. Updates employee profile_picture field.
   */
  static async uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Unsupported file type or file too large.');
      }

      const employeeId = req.body.employeeId
        ? parseInt(req.body.employeeId, 10)
        : req.user!.employeeId;

      // Ownership check
      if (req.user!.role !== 'ADMIN_HR' && req.user!.employeeId !== employeeId) {
        throw ApiError.forbidden('You do not have permission to perform this action.');
      }

      const fileUrl = getFileUrl(config.upload.profilePicturePath, req.file.filename);

      await prisma.employee.update({
        where: { id: employeeId },
        data: { profilePicture: fileUrl },
      });

      sendSuccess(res, { profilePicture: fileUrl }, 'Profile picture uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /upload/company-logo
   * Admin/HR only. Updates Company.logo_url globally.
   */
  static async uploadCompanyLogo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Unsupported file type or file too large.');
      }

      const fileUrl = getFileUrl(config.upload.logosPath, req.file.filename);
      const company = await CompanyService.updateLogo(fileUrl);

      sendSuccess(res, company, 'Company logo uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
}
