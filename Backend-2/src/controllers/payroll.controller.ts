import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { calculateEmployeeMonthlyPayroll, EmployeePayrollRow } from '../services/payroll.service';

export async function getPayrollDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { department, employee, month, year } = req.query as {
      department?: string;
      employee?: string;
      month?: string;
      year?: string;
    };

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const whereEmployee: any = {};
    if (department) {
      whereEmployee.department = { contains: department };
    }
    if (employee) {
      whereEmployee.OR = [
        { fullName: { contains: employee } },
        { employeeCode: { contains: employee } },
        { email: { contains: employee } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      include: {
        salary: true
      },
      orderBy: { fullName: 'asc' }
    });

    const payrollRows: EmployeePayrollRow[] = [];

    for (const emp of employees) {
      if (emp.salary) {
        const payroll = await calculateEmployeeMonthlyPayroll(emp.id, targetYear, targetMonth);
        if (payroll) {
          payrollRows.push(payroll);
        }
      }
    }

    const summary = {
      totalEmployees: payrollRows.length,
      totalGrossSalary: Math.round(payrollRows.reduce((acc, r) => acc + r.gross, 0) * 100) / 100,
      totalNetSalary: Math.round(payrollRows.reduce((acc, r) => acc + r.net, 0) * 100) / 100,
      totalPayableSalary: Math.round(payrollRows.reduce((acc, r) => acc + r.payable_salary, 0) * 100) / 100,
      totalPF: Math.round(payrollRows.reduce((acc, r) => acc + r.pf, 0) * 100) / 100,
      totalTax: Math.round(payrollRows.reduce((acc, r) => acc + r.tax, 0) * 100) / 100
    };

    res.json({
      month: targetMonth,
      year: targetYear,
      summary,
      payroll: payrollRows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getEmployeePayrollDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query as {
      month?: string;
      year?: string;
    };

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const payroll = await calculateEmployeeMonthlyPayroll(employeeId, targetYear, targetMonth);

    if (!payroll) {
      res.status(404).json({ error: 'Payroll details or employee salary configuration not found.' });
      return;
    }

    res.json({
      payroll
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function generateMonthlyPayroll(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { month, year } = req.query as { month?: string; year?: string };
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const employees = await prisma.employee.findMany({
      include: { salary: true },
      orderBy: { fullName: 'asc' }
    });

    const payrollRows: EmployeePayrollRow[] = [];

    for (const emp of employees) {
      if (emp.salary) {
        const payroll = await calculateEmployeeMonthlyPayroll(emp.id, targetYear, targetMonth);
        if (payroll) {
          payrollRows.push(payroll);
        }
      }
    }

    res.status(201).json({
      message: 'Monthly payroll generated successfully',
      month: targetMonth,
      year: targetYear,
      payroll: payrollRows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
