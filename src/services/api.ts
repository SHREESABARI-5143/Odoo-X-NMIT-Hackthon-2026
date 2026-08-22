import { db } from './db';
import { 
  User, Employee, Attendance, LeaveRequest, 
  LeaveAllocation, Salary, Payroll, CompanySettings, 
  Skill, Certification, Document 
} from '../types';

// Read API URL from Vite Environment Variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Latency simulator for the mock database
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// A generic request wrapper that routes to real backend if VITE_API_BASE_URL is active,
// or falls back to local storage db simulation.
const request = async <T>(
  endpoint: string, 
  options: RequestInit = {}, 
  mockAction: () => Promise<T> | T
): Promise<T> => {
  if (BASE_URL) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const token = localStorage.getItem('df_token');
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('df_token');
          localStorage.removeItem('df_user');
          window.dispatchEvent(new Event('auth-expired'));
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `API Error: ${response.status}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.warn(`Real API failed for ${endpoint}. Falling back to mock.`, error);
      // Fallback if configured or desired, but prompt says "REMOVE ALL MOCK DATA once backend begins".
      // We default to mock during workspace testing.
      await delay();
      return mockAction();
    }
  } else {
    // Pure mock mode
    await delay();
    return mockAction();
  }
};

// API Services
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, () => {
        const users = db.getUsers();
        // Check either email or loginId
        const userMatch = users.find(u => u.email === email && (u as any).password === password);
        if (!userMatch) {
          throw new Error('Invalid credentials');
        }
        const { password: _, ...userWithoutPassword } = userMatch as any;
        const token = 'mock_jwt_token_for_' + userMatch.id;
        localStorage.setItem('df_token', token);
        localStorage.setItem('df_user', JSON.stringify(userWithoutPassword));
        return { token, user: userWithoutPassword };
      });
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      return request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      }, () => {
        const activeUser = JSON.parse(localStorage.getItem('df_user') || '{}') as User;
        if (!activeUser.id) throw new Error('Unauthorized');
        
        const users = db.getUsers();
        const userIndex = users.findIndex(u => u.id === activeUser.id);
        if (userIndex === -1) throw new Error('User not found');

        const user = users[userIndex] as any;
        if (user.password !== currentPassword) {
          throw new Error('Incorrect current password');
        }

        user.password = newPassword;
        user.firstLogin = false;
        users[userIndex] = user;
        db.saveUsers(users);

        // Update stored user
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem('df_user', JSON.stringify(userWithoutPassword));
      });
    },

    logout: async (): Promise<void> => {
      localStorage.removeItem('df_token');
      localStorage.removeItem('df_user');
      // Dispatch custom event for routing updates
      window.dispatchEvent(new Event('auth-logout'));
    },

    getCurrentUser: (): User | null => {
      const userStr = localStorage.getItem('df_user');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
  },

  employees: {
    getAll: async (search = '', filters: Record<string, string> = {}): Promise<Employee[]> => {
      return request('/employees', {}, () => {
        let employees = db.getEmployees();
        
        if (search) {
          const s = search.toLowerCase();
          employees = employees.filter(e => 
            e.firstName.toLowerCase().includes(s) ||
            e.lastName.toLowerCase().includes(s) ||
            e.code.toLowerCase().includes(s) ||
            e.email.toLowerCase().includes(s) ||
            e.jobPosition.toLowerCase().includes(s)
          );
        }

        if (filters.department) {
          employees = employees.filter(e => e.department === filters.department);
        }
        if (filters.location) {
          employees = employees.filter(e => e.location === filters.location);
        }
        if (filters.status) {
          employees = employees.filter(e => e.status === filters.status);
        }

        return employees;
      });
    },

    getById: async (id: string): Promise<Employee> => {
      return request(`/employees/${id}`, {}, () => {
        const employees = db.getEmployees();
        const emp = employees.find(e => e.id === id);
        if (!emp) throw new Error('Employee not found');
        return emp;
      });
    },

    create: async (data: Omit<Employee, 'id' | 'code' | 'status'>): Promise<{ employee: Employee; tempPassword: string }> => {
      return request('/employees', {
        method: 'POST',
        body: JSON.stringify(data)
      }, () => {
        const employees = db.getEmployees();
        const users = db.getUsers();
        
        const count = employees.length + 1;
        const code = `EMP${String(count).padStart(3, '0')}`;
        const id = code;
        const tempPassword = `TempPass${Math.floor(100 + Math.random() * 900)}!`;
        
        const newEmployee: Employee = {
          ...data,
          id,
          code,
          status: 'ABSENT' // Default when created
        };

        const newUser: User & { password?: string } = {
          id: String(users.length + 1),
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          role: 'EMPLOYEE',
          firstLogin: true,
          employeeId: id,
          password: tempPassword
        };

        employees.push(newEmployee);
        users.push(newUser);

        db.saveEmployees(employees);
        db.saveUsers(users);

        // Seed empty allocations for new employee
        const allocations = db.getLeaveAllocations();
        const settings = db.getCompanySettings();
        allocations.push(
          { id: `LA${allocations.length + 1}`, employeeId: id, leaveType: 'PAID_TIME_OFF', allocated: settings.paidLeaveDefault, used: 0, remaining: settings.paidLeaveDefault },
          { id: `LA${allocations.length + 2}`, employeeId: id, leaveType: 'SICK_LEAVE', allocated: settings.sickLeaveDefault, used: 0, remaining: settings.sickLeaveDefault },
          { id: `LA${allocations.length + 3}`, employeeId: id, leaveType: 'UNPAID_LEAVE', allocated: 5, used: 0, remaining: 5 }
        );
        db.saveLeaveAllocations(allocations);

        // Seed default salary for new employee
        const salaries = db.getSalaries();
        salaries.push({
          employeeId: id,
          monthlyWage: 4000,
          yearlyWage: 48000,
          workingDaysPerWeek: settings.workingDaysPerWeek,
          breakHours: settings.breakHours,
          basic: 2000,
          hra: 800,
          allowance: 600,
          bonus: 400,
          fixedAllowance: 200,
          pfEmployee: 240,
          pfEmployer: 240,
          professionalTax: settings.professionalTax,
          netSalary: 3560
        });
        db.saveSalaries(salaries);

        return { employee: newEmployee, tempPassword };
      });
    },

    update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
      return request(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }, () => {
        const employees = db.getEmployees();
        const index = employees.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Employee not found');
        
        employees[index] = { ...employees[index], ...data };
        db.saveEmployees(employees);
        return employees[index];
      });
    }
  },

  attendance: {
    checkIn: async (employeeId: string): Promise<Attendance> => {
      return request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      }, () => {
        const employees = db.getEmployees();
        const emp = employees.find(e => e.id === employeeId);
        if (!emp) throw new Error('Employee not found');

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        const attendances = db.getAttendances();
        
        // Double check-in prevention
        const existing = attendances.find(a => a.employeeId === employeeId && a.date === dateStr && !a.checkOut);
        if (existing) {
          throw new Error('Already checked in');
        }

        const newAttendance: Attendance = {
          id: `AT${attendances.length + 1}`,
          employeeId,
          employeeCode: emp.code,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          date: dateStr,
          checkIn: timeStr,
          status: 'PRESENT'
        };

        attendances.push(newAttendance);
        db.saveAttendances(attendances);

        // Update employee status
        emp.status = 'PRESENT';
        db.saveEmployees(employees);

        return newAttendance;
      });
    },

    checkOut: async (employeeId: string): Promise<Attendance> => {
      return request('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      }, () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        const attendances = db.getAttendances();
        const active = attendances.find(a => a.employeeId === employeeId && !a.checkOut);
        if (!active) {
          throw new Error('No active check-in found');
        }

        // Calculate hours
        const [inH, inM, inS] = active.checkIn.split(':').map(Number);
        const [outH, outM, outS] = timeStr.split(':').map(Number);
        
        const inDate = new Date(2000, 0, 1, inH, inM, inS);
        const outDate = new Date(2000, 0, 1, outH, outM, outS);
        const diffMs = outDate.getTime() - inDate.getTime();
        const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        
        // Assume standard 8 hours check, extra hours
        const extraHours = Math.max(0, workHours - 8);
        const status = workHours < 4 ? 'HALF-DAY' : 'PRESENT';

        active.checkOut = timeStr;
        active.workHours = workHours;
        active.extraHours = extraHours;
        active.status = status;

        db.saveAttendances(attendances);

        // Update employee status
        const employees = db.getEmployees();
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
          emp.status = 'ABSENT'; // After check out, set status back to absent/inactive for the day
          db.saveEmployees(employees);
        }

        return active;
      });
    },

    getAll: async (search = '', month?: number, year?: number): Promise<Attendance[]> => {
      return request('/attendance', {}, () => {
        let attendances = db.getAttendances();
        
        if (search) {
          const s = search.toLowerCase();
          attendances = attendances.filter(a => a.employeeName.toLowerCase().includes(s) || a.employeeCode.toLowerCase().includes(s));
        }

        if (month !== undefined && year !== undefined) {
          attendances = attendances.filter(a => {
            const [y, m] = a.date.split('-');
            return Number(y) === year && Number(m) === month;
          });
        }

        return attendances;
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<Attendance[]> => {
      return request(`/attendance/my?employeeId=${employeeId}`, {}, () => {
        const attendances = db.getAttendances();
        return attendances.filter(a => a.employeeId === employeeId);
      });
    }
  },

  timeOff: {
    getAllRequests: async (): Promise<LeaveRequest[]> => {
      return request('/time-off', {}, () => {
        return db.getLeaveRequests();
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<LeaveRequest[]> => {
      return request(`/time-off/my?employeeId=${employeeId}`, {}, () => {
        return db.getLeaveRequests().filter(r => r.employeeId === employeeId);
      });
    },

    createRequest: async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status' | 'submittedOn'>): Promise<LeaveRequest> => {
      return request('/time-off', {
        method: 'POST',
        body: JSON.stringify(data)
      }, () => {
        const employees = db.getEmployees();
        const emp = employees.find(e => e.id === data.employeeId);
        if (!emp) throw new Error('Employee not found');

        const requests = db.getLeaveRequests();
        const allocations = db.getLeaveAllocations();
        
        // Verify balance
        const allocation = allocations.find(a => a.employeeId === data.employeeId && a.leaveType === data.leaveType);
        if (!allocation || allocation.remaining < data.duration) {
          throw new Error('Insufficient leave balance');
        }

        const newRequest: LeaveRequest = {
          ...data,
          id: `LR${requests.length + 1}`,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          status: 'PENDING',
          submittedOn: new Date().toISOString().split('T')[0]
        };

        requests.push(newRequest);
        db.saveLeaveRequests(requests);
        return newRequest;
      });
    },

    approve: async (id: string, comment = ''): Promise<LeaveRequest> => {
      return request(`/time-off/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
      }, () => {
        const requests = db.getLeaveRequests();
        const req = requests.find(r => r.id === id);
        if (!req) throw new Error('Request not found');

        req.status = 'APPROVED';
        req.decisionComment = comment;

        // Deduct from allocation
        const allocations = db.getLeaveAllocations();
        const allocation = allocations.find(a => a.employeeId === req.employeeId && a.leaveType === req.leaveType);
        if (allocation) {
          allocation.used += req.duration;
          allocation.remaining = Math.max(0, allocation.allocated - allocation.used);
          db.saveLeaveAllocations(allocations);
        }

        // Update employee status to 'ON LEAVE' if current date is within leave range
        const now = new Date().toISOString().split('T')[0];
        if (now >= req.startDate && now <= req.endDate) {
          const employees = db.getEmployees();
          const emp = employees.find(e => e.id === req.employeeId);
          if (emp) {
            emp.status = 'ON LEAVE';
            db.saveEmployees(employees);
          }
        }

        db.saveLeaveRequests(requests);
        return req;
      });
    },

    reject: async (id: string, comment: string): Promise<LeaveRequest> => {
      if (!comment) throw new Error('Comment is required for rejection');
      return request(`/time-off/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
      }, () => {
        const requests = db.getLeaveRequests();
        const req = requests.find(r => r.id === id);
        if (!req) throw new Error('Request not found');

        req.status = 'REJECTED';
        req.decisionComment = comment;

        db.saveLeaveRequests(requests);
        return req;
      });
    },

    getAllocations: async (employeeId: string): Promise<LeaveAllocation[]> => {
      return request(`/leave-allocation?employeeId=${employeeId}`, {}, () => {
        const allocations = db.getLeaveAllocations();
        return allocations.filter(a => a.employeeId === employeeId);
      });
    }
  },

  salary: {
    getByEmployeeId: async (employeeId: string): Promise<Salary> => {
      return request(`/employees/${employeeId}/salary`, {}, () => {
        const salaries = db.getSalaries();
        const sal = salaries.find(s => s.employeeId === employeeId);
        if (!sal) throw new Error('Salary not found');
        return sal;
      });
    },

    update: async (employeeId: string, data: Partial<Salary>): Promise<Salary> => {
      return request(`/employees/${employeeId}/salary`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }, () => {
        const salaries = db.getSalaries();
        const index = salaries.findIndex(s => s.employeeId === employeeId);
        if (index === -1) throw new Error('Salary config not found');

        // Recalculate components based on monthlyWage if changing
        const updated = { ...salaries[index], ...data };
        
        // Recalculate formula: Basic = 50%, HRA = 20%, Allowance = 15%, Bonus = 10%, Fixed = 5%
        if (data.monthlyWage !== undefined) {
          const w = data.monthlyWage;
          updated.yearlyWage = w * 12;
          updated.basic = w * 0.5;
          updated.hra = w * 0.2;
          updated.allowance = w * 0.15;
          updated.bonus = w * 0.1;
          updated.fixedAllowance = w * 0.05;
          
          // PF is 12% of basic
          updated.pfEmployee = updated.basic * 0.12;
          updated.pfEmployer = updated.basic * 0.12;
          
          // Net = gross - employee PF - Professional tax
          updated.netSalary = w - updated.pfEmployee - updated.professionalTax;
        }

        salaries[index] = updated;
        db.saveSalaries(salaries);
        return updated;
      });
    }
  },

  payroll: {
    getAll: async (month?: number, year?: number): Promise<Payroll[]> => {
      return request('/payroll', {}, () => {
        let payrolls = db.getPayrolls();
        if (month !== undefined) payrolls = payrolls.filter(p => p.month === month);
        if (year !== undefined) payrolls = payrolls.filter(p => p.year === year);
        return payrolls;
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<Payroll[]> => {
      return request(`/payroll/${employeeId}`, {}, () => {
        return db.getPayrolls().filter(p => p.employeeId === employeeId);
      });
    },

    generateMonthly: async (month: number, year: number): Promise<Payroll[]> => {
      return request(`/payroll/generate?month=${month}&year=${year}`, { method: 'POST' }, () => {
        const payrolls = db.getPayrolls();
        
        // Prevent duplicate generation
        const existing = payrolls.some(p => p.month === month && p.year === year);
        if (existing) {
          throw new Error('Payroll for this month already exists');
        }

        const employees = db.getEmployees();
        const salaries = db.getSalaries();
        const attendances = db.getAttendances();
        const leaveRequests = db.getLeaveRequests();

        const newPayrolls: Payroll[] = [];

        employees.forEach(emp => {
          const sal = salaries.find(s => s.employeeId === emp.id);
          if (!sal) return; // skip if no salary

          // Calculate attendance issues / unpaid leave deductions
          const employeeLeaves = leaveRequests.filter(
            r => r.employeeId === emp.id && 
                 r.leaveType === 'UNPAID_LEAVE' && 
                 r.status === 'APPROVED' &&
                 // check if overlapping with month/year
                 new Date(r.startDate).getMonth() + 1 === month &&
                 new Date(r.startDate).getFullYear() === year
          );

          const unpaidDays = employeeLeaves.reduce((sum, r) => sum + r.duration, 0);
          
          // Unpaid deduction = (Monthly wage / 30) * unpaidDays
          const gross = sal.monthlyWage;
          const basic = sal.basic;
          const pf = sal.pfEmployee;
          const tax = sal.professionalTax;
          
          const leaveDeduction = Math.round(((gross / 30) * unpaidDays) * 100) / 100;
          const otherDeduction = 0;
          
          const netSalary = gross - pf - tax;
          const payableSalary = Math.max(0, netSalary - leaveDeduction);

          const record: Payroll = {
            id: `PR${payrolls.length + newPayrolls.length + 1}`,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            employeeCode: emp.code,
            department: emp.department,
            month,
            year,
            basic,
            gross,
            pf,
            tax,
            leaveDeduction,
            otherDeduction,
            netSalary,
            payableSalary,
            status: 'PENDING'
          };

          newPayrolls.push(record);
        });

        const updatedPayrolls = [...payrolls, ...newPayrolls];
        db.savePayrolls(updatedPayrolls);
        return newPayrolls;
      });
    }
  },

  skills: {
    add: async (employeeId: string, name: string, level: string): Promise<Skill> => {
      return request('/skills', {
        method: 'POST',
        body: JSON.stringify({ employeeId, name, level })
      }, () => {
        const skills = db.getSkills();
        const newSkill: Skill = {
          id: `S${String(skills.length + 1).padStart(3, '0')}`,
          employeeId,
          name,
          level
        };
        skills.push(newSkill);
        db.saveSkills(skills);
        return newSkill;
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/skills/${id}`, { method: 'DELETE' }, () => {
        let skills = db.getSkills();
        skills = skills.filter(s => s.id !== id);
        db.saveSkills(skills);
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<Skill[]> => {
      return request(`/skills?employeeId=${employeeId}`, {}, () => {
        return db.getSkills().filter(s => s.employeeId === employeeId);
      });
    }
  },

  certifications: {
    add: async (employeeId: string, name: string, organization: string, issueDate: string, expiryDate?: string): Promise<Certification> => {
      return request('/certifications', {
        method: 'POST',
        body: JSON.stringify({ employeeId, name, organization, issueDate, expiryDate })
      }, () => {
        const certs = db.getCertifications();
        const newCert: Certification = {
          id: `C${String(certs.length + 1).padStart(3, '0')}`,
          employeeId,
          name,
          organization,
          issueDate,
          expiryDate
        };
        certs.push(newCert);
        db.saveCertifications(certs);
        return newCert;
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/certifications/${id}`, { method: 'DELETE' }, () => {
        let certs = db.getCertifications();
        certs = certs.filter(c => c.id !== id);
        db.saveCertifications(certs);
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<Certification[]> => {
      return request(`/certifications?employeeId=${employeeId}`, {}, () => {
        return db.getCertifications().filter(c => c.employeeId === employeeId);
      });
    }
  },

  documents: {
    upload: async (employeeId: string, name: string, type: string, fileSize = '1.0 MB'): Promise<Document> => {
      return request(`/employees/${employeeId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ name, type })
      }, () => {
        const docs = db.getDocuments();
        const activeUser = api.auth.getCurrentUser();
        const newDoc: Document = {
          id: `D${String(docs.length + 1).padStart(3, '0')}`,
          employeeId,
          name,
          type,
          uploadedDate: new Date().toISOString().split('T')[0],
          uploadedBy: activeUser ? activeUser.name : 'Unknown User',
          status: 'PENDING',
          fileSize
        };
        docs.push(newDoc);
        db.saveDocuments(docs);
        return newDoc;
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/documents/${id}`, { method: 'DELETE' }, () => {
        let docs = db.getDocuments();
        docs = docs.filter(d => d.id !== id);
        db.saveDocuments(docs);
      });
    },

    getByEmployeeId: async (employeeId: string): Promise<Document[]> => {
      return request(`/employees/${employeeId}/documents`, {}, () => {
        return db.getDocuments().filter(d => d.employeeId === employeeId);
      });
    }
  },

  settings: {
    get: async (): Promise<CompanySettings> => {
      return request('/company', {}, () => {
        return db.getCompanySettings();
      });
    },

    update: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
      return request('/company', {
        method: 'PUT',
        body: JSON.stringify(data)
      }, () => {
        const settings = db.getCompanySettings();
        const updated = { ...settings, ...data };
        db.saveCompanySettings(updated);
        
        // Dispatch custom settings update event so header responds instantly
        window.dispatchEvent(new CustomEvent('company-settings-updated', { detail: updated }));
        return updated;
      });
    }
  }
};
