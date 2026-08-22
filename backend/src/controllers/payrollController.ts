import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getPayrollDashboard(req: AuthRequest, res: Response) {
  try {
    const { department, employeeId, month, year } = req.query;

    const whereUser: any = {};
    if (department && department !== 'all') {
      whereUser.department = String(department);
    }
    if (employeeId && employeeId !== 'all') {
      whereUser.id = String(employeeId);
    }

    const employees = await prisma.user.findMany({
      where: whereUser,
      select: {
        id: true,
        loginId: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        jobPosition: true,
      },
    });

    const empIds = employees.map((e) => e.id);
    const salaryConfigs = await prisma.salaryConfig.findMany({
      where: { employeeId: { in: empIds } },
    });

    const salaryMap = new Map(salaryConfigs.map((s) => [s.employeeId, s]));

    let totalPayroll = 0;
    let totalDeductions = 0;
    let totalPfContribution = 0;

    const payrollRows = employees.map((emp) => {
      let config = salaryMap.get(emp.id);
      if (!config) {
        config = {
          id: '',
          employeeId: emp.id,
          monthlyWage: 60000,
          yearlyWage: 720000,
          workingDays: 22,
          breakHours: 1.0,
          basicSalary: 30000,
          hra: 15000,
          standardAllowance: 5000,
          performanceBonus: 5000,
          lta: 2500,
          fixedAllowance: 2500,
          employeePf: 1800,
          employerPf: 1800,
          professionalTax: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const gross =
        config.basicSalary +
        config.hra +
        config.standardAllowance +
        config.performanceBonus +
        config.lta +
        config.fixedAllowance;

      const deductions = config.employeePf + config.professionalTax;
      const net = Math.max(0, gross - deductions);
      const payableDays = config.workingDays;
      const payableSalary = net;

      totalPayroll += gross;
      totalDeductions += deductions;
      totalPfContribution += config.employeePf + config.employerPf;

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        loginId: emp.loginId,
        department: emp.department || 'Engineering',
        jobPosition: emp.jobPosition || 'Employee',
        basicSalary: config.basicSalary,
        grossSalary: gross,
        pf: config.employeePf,
        tax: config.professionalTax,
        netSalary: net,
        payableDays,
        payableSalary,
      };
    });

    return res.json({
      summary: {
        totalMonthlyPayroll: totalPayroll,
        totalDeductions,
        totalPfContribution,
        employeeCount: payrollRows.length,
      },
      rows: payrollRows,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching payroll dashboard.' });
  }
}
