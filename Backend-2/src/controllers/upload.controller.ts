import { Request, Response } from 'express';

export async function uploadLeaveAttachment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Unsupported file type or file too large.',
        message: 'Unsupported file type or file too large.'
      });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      message: 'Attachment uploaded successfully.',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
