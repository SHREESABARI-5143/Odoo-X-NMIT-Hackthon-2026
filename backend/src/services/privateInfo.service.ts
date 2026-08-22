import prisma from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { UpdatePrivateInfoInput } from '../validators/privateInfo.validator';

export class PrivateInfoService {
  static async getByEmployeeId(employeeId: number) {
    const privateInfo = await prisma.privateInfo.findUnique({
      where: { employeeId },
    });
    if (!privateInfo) {
      throw ApiError.notFound('Private info not found for this employee.');
    }
    return privateInfo;
  }

  static async update(employeeId: number, data: UpdatePrivateInfoInput) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    const updateData: Record<string, any> = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return prisma.privateInfo.upsert({
      where: { employeeId },
      create: { employeeId, ...updateData },
      update: updateData,
    });
  }
}
