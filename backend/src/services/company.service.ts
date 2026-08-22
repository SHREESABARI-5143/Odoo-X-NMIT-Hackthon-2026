import prisma from '../config/prisma';
import { ApiError } from '../utils/apiError';

export class CompanyService {
  /**
   * Get company info (first company record).
   */
  static async getCompany() {
    const company = await prisma.company.findFirst();
    if (!company) {
      throw ApiError.notFound('No company information found.');
    }
    return company;
  }

  /**
   * Update company logo URL.
   */
  static async updateLogo(logoUrl: string) {
    const company = await prisma.company.findFirst();
    if (!company) {
      throw ApiError.notFound('No company information found.');
    }
    return prisma.company.update({
      where: { id: company.id },
      data: { logoUrl },
    });
  }
}
