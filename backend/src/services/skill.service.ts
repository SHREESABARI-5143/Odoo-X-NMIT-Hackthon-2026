import prisma from '../config/prisma';
import { ApiError } from '../utils/apiError';

export class SkillService {
  /**
   * Add a skill to an employee. Creates the skill if it doesn't exist.
   */
  static async addSkillToEmployee(employeeId: number, skillName: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    // Find or create the skill
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      create: { name: skillName },
      update: {},
    });

    // Check if already linked
    const existing = await prisma.employeeSkill.findUnique({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId: skill.id,
        },
      },
    });

    if (existing) {
      return { message: 'Skill already assigned to this employee.', skill };
    }

    await prisma.employeeSkill.create({
      data: {
        employeeId,
        skillId: skill.id,
      },
    });

    return { message: 'Skill added successfully.', skill };
  }

  /**
   * Get all skills for an employee.
   */
  static async getByEmployeeId(employeeId: number) {
    const skills = await prisma.employeeSkill.findMany({
      where: { employeeId },
      include: { skill: true },
    });
    return skills.map((es) => es.skill);
  }
}

export class CertificationService {
  /**
   * Add a certification to an employee.
   */
  static async addCertification(
    employeeId: number,
    data: {
      name: string;
      issuingOrganization?: string;
      issueDate?: string;
      expiryDate?: string;
    }
  ) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    return prisma.certification.create({
      data: {
        employeeId,
        name: data.name,
        issuingOrganization: data.issuingOrganization,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });
  }

  /**
   * Get all certifications for an employee.
   */
  static async getByEmployeeId(employeeId: number) {
    return prisma.certification.findMany({
      where: { employeeId },
      orderBy: { issueDate: 'desc' },
    });
  }
}
