import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { calculateSalary, EXACT_SALARY_EXCEEDS_ERROR } from '../services/salaryEngine.service';

export async function getEmployeeSalary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requesterRole = req.user?.role;
    const requesterEmployeeId = req.user?.employeeId;

    // Self (READ-ONLY) or Admin/HR (full)
    const isSelf = requesterEmployeeId === id;
    const isAdmin = requesterRole === 'ADMIN_HR';

    if (!isSelf && !isAdmin) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        salary: true,
        salaryComponents: true,
        pfConfig: true,
        taxConfig: true
      }
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    if (!employee.salary) {
      res.status(404).json({ error: 'Salary configuration not found for employee.' });
      return;
    }

    const breakdown = calculateSalary({
      employeeId: employee.id,
      salary: employee.salary,
      components: employee.salaryComponents,
      pfConfig: employee.pfConfig,
      taxConfig: employee.taxConfig
    });

    res.json({
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        department: employee.department,
        jobPosition: employee.jobPosition
      },
      salary: employee.salary,
      salaryComponents: employee.salaryComponents,
      pfConfig: employee.pfConfig,
      taxConfig: employee.taxConfig,
      breakdown
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateEmployeeSalary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requesterRole = req.user?.role;

    // Allowed ONLY for ADMIN_HR - Employee hitting their own ID still gets 403
    if (requesterRole !== 'ADMIN_HR') {
      res.status(403).json({
        error: 'You do not have permission to perform this action.',
        message: 'You do not have permission to perform this action.'
      });
      return;
    }

    const {
      monthlyWage,
      workingDaysPerWeek,
      breakHours,
      halfDayThresholdHours,
      components,
      pfConfig,
      taxConfig
    } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        salary: true,
        salaryComponents: true,
        pfConfig: true,
        taxConfig: true
      }
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const effectiveWage = monthlyWage !== undefined ? Number(monthlyWage) : (employee.salary?.monthlyWage || 0);

    // Validate calculations and wage limits
    if (components && Array.isArray(components)) {
      try {
        calculateSalary({
          employeeId: id,
          salary: {
            monthlyWage: effectiveWage,
            workingDaysPerWeek: workingDaysPerWeek ?? employee.salary?.workingDaysPerWeek ?? 5,
            breakHours: breakHours ?? employee.salary?.breakHours ?? 1,
            halfDayThresholdHours: halfDayThresholdHours ?? employee.salary?.halfDayThresholdHours ?? 4
          },
          components,
          pfConfig,
          taxConfig
        });
      } catch (err: any) {
        if (err.message === EXACT_SALARY_EXCEEDS_ERROR) {
          res.status(400).json({
            error: EXACT_SALARY_EXCEEDS_ERROR,
            message: EXACT_SALARY_EXCEEDS_ERROR
          });
          return;
        }
        throw err;
      }
    }

    // Execute atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update or create Salary
      const salary = await tx.salary.upsert({
        where: { employeeId: id },
        update: {
          ...(monthlyWage !== undefined && { monthlyWage: Number(monthlyWage) }),
          ...(workingDaysPerWeek !== undefined && { workingDaysPerWeek: Number(workingDaysPerWeek) }),
          ...(breakHours !== undefined && { breakHours: Number(breakHours) }),
          ...(halfDayThresholdHours !== undefined && { halfDayThresholdHours: Number(halfDayThresholdHours) })
        },
        create: {
          employeeId: id,
          monthlyWage: Number(monthlyWage || 0),
          workingDaysPerWeek: Number(workingDaysPerWeek || 5),
          breakHours: Number(breakHours || 1),
          halfDayThresholdHours: Number(halfDayThresholdHours || 4)
        }
      });

      // 2. Update Components if provided
      if (components && Array.isArray(components)) {
        await tx.salaryComponent.deleteMany({ where: { employeeId: id } });
        for (const comp of components) {
          await tx.salaryComponent.create({
            data: {
              employeeId: id,
              componentName: comp.componentName,
              calculationType: comp.calculationType,
              percentage: comp.percentage !== undefined ? Number(comp.percentage) : null,
              amount: comp.amount !== undefined ? Number(comp.amount) : null,
              salaryBase: comp.salaryBase || null
            }
          });
        }
      }

      // 3. Update PF Config
      if (pfConfig) {
        await tx.pFConfiguration.upsert({
          where: { employeeId: id },
          update: {
            ...(pfConfig.employeePercentage !== undefined && { employeePercentage: Number(pfConfig.employeePercentage) }),
            ...(pfConfig.employerPercentage !== undefined && { employerPercentage: Number(pfConfig.employerPercentage) })
          },
          create: {
            employeeId: id,
            employeePercentage: Number(pfConfig.employeePercentage ?? 12),
            employerPercentage: Number(pfConfig.employerPercentage ?? 12)
          }
        });
      }

      // 4. Update Tax Config
      if (taxConfig) {
        await tx.taxConfiguration.upsert({
          where: { employeeId: id },
          update: {
            ...(taxConfig.professionalTax !== undefined && { professionalTax: Number(taxConfig.professionalTax) })
          },
          create: {
            employeeId: id,
            professionalTax: Number(taxConfig.professionalTax ?? 200)
          }
        });
      }

      const updatedEmp = await tx.employee.findUnique({
        where: { id },
        include: {
          salary: true,
          salaryComponents: true,
          pfConfig: true,
          taxConfig: true
        }
      });

      return updatedEmp;
    });

    const finalBreakdown = calculateSalary({
      employeeId: id,
      salary: result!.salary!,
      components: result!.salaryComponents,
      pfConfig: result!.pfConfig,
      taxConfig: result!.taxConfig
    });

    res.json({
      message: 'Salary updated successfully.',
      employee: {
        id: result!.id,
        fullName: result!.fullName,
        employeeCode: result!.employeeCode
      },
      salary: result!.salary,
      salaryComponents: result!.salaryComponents,
      pfConfig: result!.pfConfig,
      taxConfig: result!.taxConfig,
      breakdown: finalBreakdown
    });
  } catch (error: any) {
    if (error.message === EXACT_SALARY_EXCEEDS_ERROR) {
      res.status(400).json({
        error: EXACT_SALARY_EXCEEDS_ERROR,
        message: EXACT_SALARY_EXCEEDS_ERROR
      });
      return;
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
