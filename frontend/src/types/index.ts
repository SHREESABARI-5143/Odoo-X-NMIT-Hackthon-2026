export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  firstLogin: boolean;
  profilePicture?: string;
  employeeId?: string;
}

export type EmployeeStatus = 'PRESENT' | 'HALF-DAY' | 'ON LEAVE' | 'ABSENT';

export interface Employee {
  id: string;
  code: string;
  loginId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  department: string;
  jobPosition: string;
  managerId?: string;
  managerName?: string;
  location: string;
  dateOfJoining: string;
  profilePicture?: string;
  status: EmployeeStatus;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM:SS
  checkOut?: string; // HH:MM:SS
  workHours?: number; // Decimals representing hours
  extraHours?: number; // Decimals representing hours
  status: 'PRESENT' | 'HALF-DAY' | 'ABSENT';
}

export type LeaveType = 'PAID_TIME_OFF' | 'SICK_LEAVE' | 'UNPAID_LEAVE';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // in days
  remarks: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  submittedOn: string; // YYYY-MM-DD
  decisionComment?: string;
  attachmentUrl?: string;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}

export interface Salary {
  employeeId: string;
  monthlyWage: number;
  yearlyWage: number;
  workingDaysPerWeek: number;
  breakHours: number;
  basic: number;
  hra: number;
  allowance: number;
  bonus: number;
  fixedAllowance: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  netSalary: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  month: number; // 1-12
  year: number;
  basic: number;
  gross: number;
  pf: number;
  tax: number;
  leaveDeduction: number;
  otherDeduction: number;
  netSalary: number;
  payableSalary: number;
  status: 'PAID' | 'PENDING';
}

export interface CompanySettings {
  name: string;
  logo?: string;
  workingDaysPerWeek: number;
  breakHours: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  paidLeaveDefault: number;
  sickLeaveDefault: number;
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
}

export interface Skill {
  id: string;
  employeeId: string;
  name: string;
  level: string; // e.g. Beginner, Intermediate, Expert
}

export interface Certification {
  id: string;
  employeeId: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate?: string;
}

export interface Document {
  id: string;
  employeeId: string;
  name: string;
  type: string; // Aadhaar, PAN, Offer Letter, etc.
  uploadedDate: string;
  uploadedBy: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  fileSize?: string;
}
