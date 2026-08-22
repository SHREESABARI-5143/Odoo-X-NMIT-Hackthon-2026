import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getCompanySettings(req: AuthRequest, res: Response) {
  try {
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Dayflow Technologies',
          companyLogo: null,
          workingDays: 5,
          breakHours: 1,
          defaultPaidLeave: 15,
          defaultSickLeave: 10,
          defaultUnpaidLeave: 5,
          pfPercentage: 12,
          professionalTaxAmount: 200,
        },
      });
    }

    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching company settings.' });
  }
}

export async function updateCompanySettings(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN_HR') {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const {
      companyName,
      workingDays,
      breakHours,
      defaultPaidLeave,
      defaultSickLeave,
      defaultUnpaidLeave,
      pfPercentage,
      professionalTaxAmount,
    } = req.body;

    let companyLogo = undefined;
    if (req.file) {
      companyLogo = `/uploads/${req.file.filename}`;
    }

    let settings = await prisma.companySettings.findFirst();

    const dataToUpdate: any = {};
    if (companyName) dataToUpdate.companyName = companyName;
    if (companyLogo) dataToUpdate.companyLogo = companyLogo;
    if (workingDays) dataToUpdate.workingDays = Number(workingDays);
    if (breakHours) dataToUpdate.breakHours = Number(breakHours);
    if (defaultPaidLeave) dataToUpdate.defaultPaidLeave = Number(defaultPaidLeave);
    if (defaultSickLeave) dataToUpdate.defaultSickLeave = Number(defaultSickLeave);
    if (defaultUnpaidLeave) dataToUpdate.defaultUnpaidLeave = Number(defaultUnpaidLeave);
    if (pfPercentage) dataToUpdate.pfPercentage = Number(pfPercentage);
    if (professionalTaxAmount) dataToUpdate.professionalTaxAmount = Number(professionalTaxAmount);

    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: dataToUpdate,
      });
    } else {
      settings = await prisma.companySettings.create({
        data: {
          companyName: companyName || 'Dayflow Technologies',
          companyLogo: companyLogo || null,
          workingDays: Number(workingDays) || 5,
          breakHours: Number(breakHours) || 1,
          defaultPaidLeave: Number(defaultPaidLeave) || 15,
          defaultSickLeave: Number(defaultSickLeave) || 10,
          defaultUnpaidLeave: Number(defaultUnpaidLeave) || 5,
          pfPercentage: Number(pfPercentage) || 12,
          professionalTaxAmount: Number(professionalTaxAmount) || 200,
        },
      });
    }

    return res.json({
      message: 'Company settings updated successfully.',
      settings,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error updating company settings.' });
  }
}
