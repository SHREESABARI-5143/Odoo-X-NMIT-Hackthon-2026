import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().min(1, 'Company is required'),
  department: z.string().optional(),
  jobPosition: z.string().optional(),
  manager: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  joiningDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  role: z.enum(['ADMIN_HR', 'EMPLOYEE']).optional(),
  // Optional initial private info
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  department: z.string().optional(),
  jobPosition: z.string().optional(),
  manager: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  joiningDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid date is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  // Fields employees can self-edit
  address: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const employeeQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  jobPosition: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  joiningYear: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
