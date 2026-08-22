import { 
  User, Employee, Attendance, LeaveRequest, 
  LeaveAllocation, Salary, Payroll, CompanySettings, 
  Skill, Certification, Document 
} from '../types';

// Helper to seed localStorage
const getItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Data Seeds
const initialUsers: User[] & { password?: string }[] = [
  { id: '1', name: 'Admin Manager', email: 'admin@dayflow.com', role: 'ADMIN', firstLogin: false, password: 'AdminPassword1!' },
  { id: '2', name: 'John Doe', email: 'john.doe@dayflow.com', role: 'EMPLOYEE', firstLogin: false, employeeId: 'EMP001', password: 'Password1!' },
  { id: '3', name: 'Jane Smith', email: 'jane.smith@dayflow.com', role: 'EMPLOYEE', firstLogin: true, employeeId: 'EMP002', password: 'TempPassword1!' }
];

const initialEmployees: Employee[] = [
  {
    id: 'EMP001',
    code: 'EMP001',
    loginId: 'john.doe@dayflow.com',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@dayflow.com',
    phone: '+1 (555) 019-2834',
    company: 'Dayflow Inc.',
    department: 'Engineering',
    jobPosition: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    dateOfJoining: '2024-01-15',
    status: 'PRESENT',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    id: 'EMP002',
    code: 'EMP002',
    loginId: 'jane.smith@dayflow.com',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@dayflow.com',
    phone: '+1 (555) 014-9921',
    company: 'Dayflow Inc.',
    department: 'Human Resources',
    jobPosition: 'HR Manager',
    location: 'New York, NY',
    dateOfJoining: '2024-03-01',
    status: 'ON LEAVE',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: 'EMP003',
    code: 'EMP003',
    loginId: 'robert.jones@dayflow.com',
    firstName: 'Robert',
    lastName: 'Jones',
    email: 'robert.jones@dayflow.com',
    phone: '+1 (555) 017-8822',
    company: 'Dayflow Inc.',
    department: 'Product',
    jobPosition: 'Product Lead',
    location: 'San Francisco, CA',
    dateOfJoining: '2024-02-10',
    status: 'ABSENT',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  }
];

const initialCompanySettings: CompanySettings = {
  name: 'Dayflow Inc.',
  logo: '',
  workingDaysPerWeek: 5,
  breakHours: 1,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  paidLeaveDefault: 20,
  sickLeaveDefault: 10,
  pfEmployeePct: 12,
  pfEmployerPct: 12,
  professionalTax: 200
};

const initialLeaveAllocations: LeaveAllocation[] = [
  { id: 'LA001', employeeId: 'EMP001', leaveType: 'PAID_TIME_OFF', allocated: 20, used: 4, remaining: 16 },
  { id: 'LA002', employeeId: 'EMP001', leaveType: 'SICK_LEAVE', allocated: 10, used: 2, remaining: 8 },
  { id: 'LA003', employeeId: 'EMP001', leaveType: 'UNPAID_LEAVE', allocated: 5, used: 0, remaining: 5 },
  { id: 'LA004', employeeId: 'EMP002', leaveType: 'PAID_TIME_OFF', allocated: 20, used: 10, remaining: 10 },
  { id: 'LA005', employeeId: 'EMP002', leaveType: 'SICK_LEAVE', allocated: 10, used: 3, remaining: 7 },
  { id: 'LA006', employeeId: 'EMP002', leaveType: 'UNPAID_LEAVE', allocated: 5, used: 0, remaining: 5 },
  { id: 'LA007', employeeId: 'EMP003', leaveType: 'PAID_TIME_OFF', allocated: 20, used: 2, remaining: 18 },
  { id: 'LA008', employeeId: 'EMP003', leaveType: 'SICK_LEAVE', allocated: 10, used: 1, remaining: 9 },
  { id: 'LA009', employeeId: 'EMP003', leaveType: 'UNPAID_LEAVE', allocated: 5, used: 0, remaining: 5 }
];

const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR001',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    leaveType: 'PAID_TIME_OFF',
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    duration: 3,
    remarks: 'Family vacation trip',
    status: 'APPROVED',
    submittedOn: '2026-08-01',
    decisionComment: 'Enjoy your trip!'
  },
  {
    id: 'LR002',
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    leaveType: 'SICK_LEAVE',
    startDate: '2026-08-21',
    endDate: '2026-08-23',
    duration: 3,
    remarks: 'Medical checkup and rest',
    status: 'PENDING',
    submittedOn: '2026-08-20'
  }
];

const initialAttendances: Attendance[] = [
  {
    id: 'AT001',
    employeeId: 'EMP001',
    employeeCode: 'EMP001',
    employeeName: 'John Doe',
    date: '2026-08-20',
    checkIn: '09:15:00',
    checkOut: '18:05:00',
    workHours: 8.83,
    extraHours: 0.83,
    status: 'PRESENT'
  },
  {
    id: 'AT002',
    employeeId: 'EMP001',
    employeeCode: 'EMP001',
    employeeName: 'John Doe',
    date: '2026-08-21',
    checkIn: '09:02:00',
    checkOut: '17:30:00',
    workHours: 8.47,
    extraHours: 0.47,
    status: 'PRESENT'
  },
  {
    id: 'AT003',
    employeeId: 'EMP003',
    employeeCode: 'EMP003',
    employeeName: 'Robert Jones',
    date: '2026-08-21',
    checkIn: '13:00:00',
    checkOut: '17:30:00',
    workHours: 4.5,
    extraHours: 0,
    status: 'HALF-DAY'
  }
];

const initialSalaries: Salary[] = [
  {
    employeeId: 'EMP001',
    monthlyWage: 8000,
    yearlyWage: 96000,
    workingDaysPerWeek: 5,
    breakHours: 1,
    basic: 4000,
    hra: 1600,
    allowance: 1200,
    bonus: 800,
    fixedAllowance: 400,
    pfEmployee: 480,
    pfEmployer: 480,
    professionalTax: 200,
    netSalary: 7320
  },
  {
    employeeId: 'EMP002',
    monthlyWage: 6000,
    yearlyWage: 72000,
    workingDaysPerWeek: 5,
    breakHours: 1,
    basic: 3000,
    hra: 1200,
    allowance: 900,
    bonus: 600,
    fixedAllowance: 300,
    pfEmployee: 360,
    pfEmployer: 360,
    professionalTax: 200,
    netSalary: 5440
  },
  {
    employeeId: 'EMP003',
    monthlyWage: 7000,
    yearlyWage: 84000,
    workingDaysPerWeek: 5,
    breakHours: 1,
    basic: 3500,
    hra: 1400,
    allowance: 1050,
    bonus: 700,
    fixedAllowance: 350,
    pfEmployee: 420,
    pfEmployer: 420,
    professionalTax: 200,
    netSalary: 6380
  }
];

const initialPayrolls: Payroll[] = [
  {
    id: 'PR001',
    employeeId: 'EMP001',
    employeeCode: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    month: 7,
    year: 2026,
    basic: 4000,
    gross: 8000,
    pf: 480,
    tax: 200,
    leaveDeduction: 0,
    otherDeduction: 0,
    netSalary: 7320,
    payableSalary: 7320,
    status: 'PAID'
  },
  {
    id: 'PR002',
    employeeId: 'EMP002',
    employeeCode: 'EMP002',
    employeeName: 'Jane Smith',
    department: 'Human Resources',
    month: 7,
    year: 2026,
    basic: 3000,
    gross: 6000,
    pf: 360,
    tax: 200,
    leaveDeduction: 150,
    otherDeduction: 0,
    netSalary: 5440,
    payableSalary: 5290,
    status: 'PAID'
  }
];

const initialSkills: Skill[] = [
  { id: 'S001', employeeId: 'EMP001', name: 'React & Redux', level: 'Expert' },
  { id: 'S002', employeeId: 'EMP001', name: 'TypeScript', level: 'Intermediate' },
  { id: 'S003', employeeId: 'EMP001', name: 'Node.js', level: 'Intermediate' },
  { id: 'S004', employeeId: 'EMP002', name: 'Recruiting', level: 'Expert' },
  { id: 'S005', employeeId: 'EMP002', name: 'Conflict Resolution', level: 'Expert' }
];

const initialCertifications: Certification[] = [
  { id: 'C001', employeeId: 'EMP001', name: 'AWS Certified Solutions Architect', organization: 'Amazon Web Services', issueDate: '2024-06-15', expiryDate: '2027-06-15' },
  { id: 'C002', employeeId: 'EMP002', name: 'SHRM Certified Professional (SHRM-CP)', organization: 'SHRM', issueDate: '2025-01-10' }
];

const initialDocuments: Document[] = [
  { id: 'D001', employeeId: 'EMP001', name: 'Offer_Letter.pdf', type: 'Offer Letter', uploadedDate: '2024-01-05', uploadedBy: 'Admin Manager', status: 'APPROVED', fileSize: '1.2 MB' },
  { id: 'D002', employeeId: 'EMP001', name: 'PAN_Card.png', type: 'PAN', uploadedDate: '2024-01-15', uploadedBy: 'John Doe', status: 'APPROVED', fileSize: '450 KB' }
];

// Database object wrapper for convenience
export const db = {
  getUsers: () => getItem<User[]>('df_users', initialUsers),
  saveUsers: (users: User[]) => setItem('df_users', users),
  
  getEmployees: () => getItem<Employee[]>('df_employees', initialEmployees),
  saveEmployees: (employees: Employee[]) => setItem('df_employees', employees),
  
  getAttendances: () => getItem<Attendance[]>('df_attendances', initialAttendances),
  saveAttendances: (attendances: Attendance[]) => setItem('df_attendances', attendances),
  
  getLeaveRequests: () => getItem<LeaveRequest[]>('df_leave_requests', initialLeaveRequests),
  saveLeaveRequests: (requests: LeaveRequest[]) => setItem('df_leave_requests', requests),
  
  getLeaveAllocations: () => getItem<LeaveAllocation[]>('df_leave_allocations', initialLeaveAllocations),
  saveLeaveAllocations: (allocations: LeaveAllocation[]) => setItem('df_leave_allocations', allocations),
  
  getSalaries: () => getItem<Salary[]>('df_salaries', initialSalaries),
  saveSalaries: (salaries: Salary[]) => setItem('df_salaries', salaries),
  
  getPayrolls: () => getItem<Payroll[]>('df_payrolls', initialPayrolls),
  savePayrolls: (payrolls: Payroll[]) => setItem('df_payrolls', payrolls),
  
  getCompanySettings: () => getItem<CompanySettings>('df_company_settings', initialCompanySettings),
  saveCompanySettings: (settings: CompanySettings) => setItem('df_company_settings', settings),
  
  getSkills: () => getItem<Skill[]>('df_skills', initialSkills),
  saveSkills: (skills: Skill[]) => setItem('df_skills', skills),
  
  getCertifications: () => getItem<Certification[]>('df_certifications', initialCertifications),
  saveCertifications: (certs: Certification[]) => setItem('df_certifications', certs),
  
  getDocuments: () => getItem<Document[]>('df_documents', initialDocuments),
  saveDocuments: (docs: Document[]) => setItem('df_documents', docs),
  
  reset: () => {
    localStorage.removeItem('df_users');
    localStorage.removeItem('df_employees');
    localStorage.removeItem('df_attendances');
    localStorage.removeItem('df_leave_requests');
    localStorage.removeItem('df_leave_allocations');
    localStorage.removeItem('df_salaries');
    localStorage.removeItem('df_payrolls');
    localStorage.removeItem('df_company_settings');
    localStorage.removeItem('df_skills');
    localStorage.removeItem('df_certifications');
    localStorage.removeItem('df_documents');
    window.location.reload();
  }
};
