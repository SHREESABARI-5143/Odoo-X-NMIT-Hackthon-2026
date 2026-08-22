import prisma from '../config/prisma';
import { DocumentType } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { deleteFile } from '../utils/fileUpload';

export class DocumentService {
  /**
   * Upload a document for an employee.
   */
  static async upload(
    employeeId: number,
    documentName: string,
    documentType: DocumentType,
    fileUrl: string,
    uploadedBy: number
  ) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    return prisma.document.create({
      data: {
        employeeId,
        documentName,
        documentType,
        fileUrl,
        uploadedBy,
      },
    });
  }

  /**
   * List documents for an employee.
   */
  static async getByEmployeeId(employeeId: number) {
    return prisma.document.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Delete a document (Admin/HR only).
   * Logs the action in AuditLog for compliance.
   */
  static async deleteDocument(documentId: number, performedBy: number) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw ApiError.notFound('Document not found.');
    }

    // Delete from DB + create audit log in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id: documentId } });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'Document',
          entityId: documentId,
          performedBy,
          details: JSON.stringify({
            documentName: document.documentName,
            documentType: document.documentType,
            employeeId: document.employeeId,
            deletedAt: new Date().toISOString(),
          }),
        },
      });
    });

    // Try to delete the actual file (non-blocking)
    try {
      const relativePath = document.fileUrl.replace(/^\/uploads\//, '');
      deleteFile(relativePath);
    } catch {
      // File deletion failure shouldn't block the operation
      console.warn(`Failed to delete file: ${document.fileUrl}`);
    }

    return { message: 'Document deleted successfully.' };
  }
}
