import prisma from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { UpdateSecurityInfoInput } from '../validators/securityInfo.validator';

export class SecurityInfoService {
  /**
   * Get security info with account number masked (last 4 digits only).
   */
  static async getByEmployeeId(employeeId: number) {
    const securityInfo = await prisma.securityInfo.findUnique({
      where: { employeeId },
    });
    if (!securityInfo) {
      throw ApiError.notFound('Security info not found for this employee.');
    }

    // Mask account number in response
    return {
      ...securityInfo,
      accountNumber: securityInfo.accountNumber
        ? maskAccountNumber(securityInfo.accountNumber)
        : null,
    };
  }

  static async update(employeeId: number, data: UpdateSecurityInfoInput) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    const result = await prisma.securityInfo.upsert({
      where: { employeeId },
      create: { employeeId, ...data },
      update: data,
    });

    // Mask account number in response
    return {
      ...result,
      accountNumber: result.accountNumber
        ? maskAccountNumber(result.accountNumber)
        : null,
    };
  }
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  const masked = '*'.repeat(accountNumber.length - 4);
  return `${masked}${last4}`;
}
