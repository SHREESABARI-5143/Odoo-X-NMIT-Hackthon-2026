import { Request, Response, NextFunction } from 'express';
import { DocumentType } from '@prisma/client';
import { DocumentService } from '../services/document.service';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { getFileUrl } from '../utils/fileUpload';
import { config } from '../config';

export class DocumentController {
  /**
   * POST /employees/:id/documents
   * Multipart upload with document_type field.
   */
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);

      if (!req.file) {
        throw ApiError.badRequest('Unsupported file type or file too large.');
      }

      const documentType = req.body.documentType as DocumentType;
      if (!documentType || !Object.values(DocumentType).includes(documentType)) {
        throw ApiError.badRequest('Invalid document type.');
      }

      const fileUrl = getFileUrl(config.upload.documentsPath, req.file.filename);

      const document = await DocumentService.upload(
        employeeId,
        req.file.originalname,
        documentType,
        fileUrl,
        req.user!.id
      );

      sendSuccess(res, document, 'Document uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /employees/:id/documents
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      const documents = await DocumentService.getByEmployeeId(employeeId);
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /employees/:id/documents/:documentId
   * Admin/HR only. Logs deletion for audit.
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = parseInt(String(req.params.documentId), 10);
      if (isNaN(documentId)) {
        throw ApiError.badRequest('Invalid document ID.');
      }

      const result = await DocumentService.deleteDocument(documentId, req.user!.id);
      sendSuccess(res, result, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
