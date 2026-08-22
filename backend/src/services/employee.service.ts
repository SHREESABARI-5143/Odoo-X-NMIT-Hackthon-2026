import prisma from '../config/prisma';
import { Role, EmployeeStatus, Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { generateLoginId } from '../utils/loginIdGenerator';
import { hashPassword, generateTempPassword } from '../utils/password';
import { CreateEmployeeInput } from '../validators/employee.validator';

export class EmployeeService {
  /**
   * Create a new employee (Admin/HR only).
   * Auto-generates login ID + temp password.
   * Returns the plaintext temp password ONCE.
   */
  static async createEmployee(input: CreateEmployeeInput) {
    // Check for duplicate email
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: input.email },
    });
    if (existingEmployee) {
      throw ApiError.conflict('An employee with this email already exists.');
    }

    const joiningDate = new Date(input.joiningDate);
    const fullName = `${input.firstName} ${input.lastName}`;

    // Generate login ID (transaction-safe with retry)
    const loginId = await generateLoginId(input.company, input.firstName, input.lastName, joiningDate);

    // Generate and hash temp password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create employee + user + private info in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: loginId,
          firstName: input.firstName,
          lastName: input.lastName,
          fullName,
          company: input.company,
          department: input.department,
          jobPosition: input.jobPosition,
          manager: input.manager,
          location: input.location,
          email: input.email,
          phone: input.phone,
          joiningDate,
          status: (input.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
        },
      });

      const user = await tx.user.create({
        data: {
          loginId,
          email: input.email,
          passwordHash,
          role: (input.role as Role) || Role.EMPLOYEE,
          employeeId: employee.id,
          firstLogin: true,
        },
      });

      // Create default private info
      await tx.privateInfo.create({
        data: {
          employeeId: employee.id,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          address: input.address,
          nationality: input.nationality,
          personalEmail: input.personalEmail || null,
          gender: input.gender,
          maritalStatus: input.maritalStatus,
        },
      });

      // Create default security info
      await tx.securityInfo.create({
        data: {
          employeeId: employee.id,
          employeeCode: loginId,
        },
      });

      // Create default resume
      await tx.resume.create({
        data: {
          employeeId: employee.id,
        },
      });

      return { employee, user };
    });

    return {
      employee: result.employee,
      loginId,
      temporaryPassword: tempPassword, // Returned ONCE, never stored in plaintext
      userId: result.user.id,
    };
  }

  /**
   * Get all employees with search, filters, and pagination.
   */
  static async getEmployees(query: {
    search?: string;
    department?: string;
    jobPosition?: string;
    location?: string;
    status?: string;
    joiningYear?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.EmployeeWhereInput = {};

    // Search by name, login_id, email, or employee_code
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { user: { loginId: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Filters
    if (query.department) {
      where.department = { equals: query.department, mode: 'insensitive' };
    }
    if (query.jobPosition) {
      where.jobPosition = { equals: query.jobPosition, mode: 'insensitive' };
    }
    if (query.location) {
      where.location = { equals: query.location, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status as EmployeeStatus;
    }
    if (query.joiningYear) {
      const year = parseInt(query.joiningYear, 10);
      where.joiningDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    const skip = (query.page - 1) * query.limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          user: {
            select: { loginId: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total, page: query.page, limit: query.limit };
  }

  /**
   * Get single employee by ID.
   * Strips sensitive fields if requester is not ADMIN_HR and not self.
   */
  static async getEmployeeById(id: number, requesterId: number, requesterRole: Role) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            loginId: true,
            email: true,
            role: true,
            firstLogin: true,
          },
        },
        privateInfo: true,
        securityInfo: true,
        resume: true,
        skills: {
          include: { skill: true },
        },
        certifications: true,
      },
    });

    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    // Strip private/security info if requester is EMPLOYEE and not self
    if (requesterRole !== Role.ADMIN_HR && requesterId !== id) {
      const { privateInfo, securityInfo, ...publicData } = employee;
      return publicData;
    }

    // Mask account number for ALL responses
    if (employee.securityInfo && employee.securityInfo.accountNumber) {
      employee.securityInfo.accountNumber = maskAccountNumber(employee.securityInfo.accountNumber);
    }

    return employee;
  }

  /**
   * Update employee.
   * Admin can update all fields; Employee can only update address, phone, profilePicture on self.
   */
  static async updateEmployee(
    id: number,
    data: Record<string, any>,
    requesterId: number,
    requesterRole: Role
  ) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw ApiError.notFound('Employee not found.');
    }

    // If requester is EMPLOYEE, only allow limited fields on self
    if (requesterRole !== Role.ADMIN_HR) {
      if (requesterId !== id) {
        throw ApiError.forbidden('You do not have permission to perform this action.');
      }
      // Only allow these fields for self-edit
      const allowedFields = ['phone', 'profilePicture', 'address'];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      // Update address in private info, not employee table
      if (updateData.address !== undefined) {
        await prisma.privateInfo.upsert({
          where: { employeeId: id },
          create: { employeeId: id, address: updateData.address },
          update: { address: updateData.address },
        });
        delete updateData.address;
      }

      if (Object.keys(updateData).length > 0) {
        return prisma.employee.update({ where: { id }, data: updateData });
      }
      return prisma.employee.findUnique({ where: { id } });
    }

    // Admin can update all fields
    const employeeUpdate: Record<string, any> = {};
    const employeeFields = [
      'firstName', 'lastName', 'company', 'department', 'jobPosition',
      'manager', 'location', 'email', 'phone', 'joiningDate', 'status', 'profilePicture',
    ];

    for (const field of employeeFields) {
      if (data[field] !== undefined) {
        employeeUpdate[field] = data[field];
      }
    }

    if (data.firstName || data.lastName) {
      employeeUpdate.fullName = `${data.firstName || employee.firstName} ${data.lastName || employee.lastName}`;
    }
    if (data.joiningDate) {
      employeeUpdate.joiningDate = new Date(data.joiningDate);
    }

    // Handle address update via private info
    if (data.address !== undefined) {
      await prisma.privateInfo.upsert({
        where: { employeeId: id },
        create: { employeeId: id, address: data.address },
        update: { address: data.address },
      });
    }

    return prisma.employee.update({
      where: { id },
      data: employeeUpdate,
    });
  }
}

/**
 * Mask bank account number showing only last 4 digits.
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  const masked = '*'.repeat(accountNumber.length - 4);
  return `${masked}${last4}`;
}
