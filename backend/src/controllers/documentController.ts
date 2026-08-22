import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    const uploadedById = req.user?.id;
    if (!uploadedById) return res.status(401).json({ message: 'Unauthorized' });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { employeeId, name, type } = req.body;
    const targetEmployeeId = employeeId || uploadedById;

    // Check permission: if target isn't self, must be admin
    if (targetEmployeeId !== uploadedById && req.user?.role !== 'ADMIN_HR') {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const document = await prisma.document.create({
      data: {
        employeeId: targetEmployeeId,
        name: name || file.originalname,
        type: type || 'Other',
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById,
      },
    });

    return res.status(201).json({
      message: 'Document uploaded successfully.',
      document,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error uploading document.' });
  }
}

export async function getEmployeeDocuments(req: AuthRequest, res: Response) {
  try {
    const { employeeId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (currentUserId !== employeeId && currentUserRole !== 'ADMIN_HR') {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const documents = await prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(documents);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching documents.' });
  }
}

export async function downloadDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const filePath = path.join(__dirname, '../../', document.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File asset not found on server.' });
    }

    return res.download(filePath, document.name);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error downloading document.' });
  }
}

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserRole = req.user?.role;

    if (currentUserRole !== 'ADMIN_HR') {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const filePath = path.join(__dirname, '../../', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({ where: { id } });

    return res.json({ message: 'Document deleted.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error deleting document.' });
  }
}
