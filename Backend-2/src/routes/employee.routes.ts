import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

// GET /employees - list all employees (Admin only)
router.get('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, department, location, status } = req.query as {
      search?: string;
      department?: string;
      location?: string;
      status?: string;
    };

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { employeeCode: { contains: search } },
        { email: { contains: search } },
        { jobPosition: { contains: search } }
      ];
    }

    if (department) where.department = department;
    if (location) where.location = { contains: location };
    if (status) where.status = status;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { fullName: 'asc' }
    });

    const mapped = employees.map(emp => ({
      id: emp.id,
      code: emp.employeeCode,
      loginId: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      company: emp.company,
      department: emp.department,
      jobPosition: emp.jobPosition,
      managerName: emp.manager || undefined,
      location: emp.location || '',
      dateOfJoining: emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
      profilePicture: emp.profilePicture || undefined,
      status: emp.status || 'ABSENT'
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /employees/:id - get single employee
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const emp = await prisma.employee.findUnique({
      where: { id }
    });

    if (!emp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    res.json({
      id: emp.id,
      code: emp.employeeCode,
      loginId: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      company: emp.company,
      department: emp.department,
      jobPosition: emp.jobPosition,
      managerName: emp.manager || undefined,
      location: emp.location || '',
      dateOfJoining: emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
      profilePicture: emp.profilePicture || undefined,
      status: emp.status || 'ABSENT'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /employees - create employee
router.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, email, phone, company, department, jobPosition, location, dateOfJoining, managerName } = req.body;

    const count = await prisma.employee.count();
    const code = `EMP${String(count + 1).padStart(3, '0')}`;
    const tempPassword = `Password${Math.floor(100 + Math.random() * 900)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newEmp = await prisma.employee.create({
      data: {
        employeeCode: code,
        firstName: firstName || 'First',
        lastName: lastName || 'Last',
        fullName: `${firstName || 'First'} ${lastName || 'Last'}`,
        email: email,
        phone: phone || null,
        company: company || 'Dayflow Technologies',
        department: department || 'Engineering',
        jobPosition: jobPosition || 'Developer',
        location: location || 'Bangalore, India',
        manager: managerName || null,
        joiningDate: dateOfJoining ? new Date(dateOfJoining) : new Date(),
        status: 'ACTIVE'
      }
    });

    await prisma.user.create({
      data: {
        loginId: code,
        email: email,
        passwordHash,
        role: 'EMPLOYEE',
        firstLogin: true,
        employeeId: newEmp.id
      }
    });

    // Seed default leave allocations
    const leaveTypes = await prisma.leaveType.findMany();
    for (const lt of leaveTypes) {
      await prisma.leaveAllocation.create({
        data: {
          employeeId: newEmp.id,
          leaveTypeId: lt.id,
          allocatedDays: lt.allocation,
          usedDays: 0,
          remainingDays: lt.allocation
        }
      });
    }

    // Seed default salary
    await prisma.salary.create({
      data: {
        employeeId: newEmp.id,
        monthlyWage: 50000,
        workingDaysPerWeek: 5,
        breakHours: 1,
        halfDayThresholdHours: 4
      }
    });

    const mapped = {
      id: newEmp.id,
      code: newEmp.employeeCode,
      loginId: newEmp.email,
      firstName: newEmp.firstName,
      lastName: newEmp.lastName,
      email: newEmp.email,
      phone: newEmp.phone || '',
      company: newEmp.company,
      department: newEmp.department,
      jobPosition: newEmp.jobPosition,
      managerName: newEmp.manager || undefined,
      location: newEmp.location || '',
      dateOfJoining: newEmp.joiningDate.toISOString().split('T')[0],
      status: 'ABSENT' as const
    };

    res.status(201).json({ employee: mapped, tempPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /employees/:id - update employee
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, department, jobPosition, location, managerName } = req.body;

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (firstName || lastName) {
      data.fullName = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (phone !== undefined) data.phone = phone;
    if (department) data.department = department;
    if (jobPosition) data.jobPosition = jobPosition;
    if (location) data.location = location;
    if (managerName !== undefined) data.manager = managerName;

    const updated = await prisma.employee.update({
      where: { id },
      data
    });

    res.json({
      id: updated.id,
      code: updated.employeeCode,
      loginId: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone || '',
      company: updated.company,
      department: updated.department,
      jobPosition: updated.jobPosition,
      managerName: updated.manager || undefined,
      location: updated.location || '',
      dateOfJoining: updated.joiningDate ? updated.joiningDate.toISOString().split('T')[0] : '',
      profilePicture: updated.profilePicture || undefined,
      status: updated.status || 'ABSENT'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
