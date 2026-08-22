import { 
  User, Employee, Attendance, LeaveRequest, 
  LeaveAllocation, Salary, Payroll, CompanySettings, 
  Skill, Certification, Document 
} from '../types';

// Read API URL from Vite Environment Variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const request = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
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
    if (response.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('df_token');
      localStorage.removeItem('df_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API Error: ${response.status}`);
  }
  
  const json = await response.json();
  // Unwrap backend standard response format { success, data, message, meta }
  if (json && typeof json.success === 'boolean' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
};

// API Services
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      const response = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: email, password })
      });
      
      // Map backend Role enum 'ADMIN_HR' to frontend expected 'ADMIN'
      if ((response.user.role as any) === 'ADMIN_HR') {
        response.user.role = 'ADMIN';
      }

      // Map backend employee details to frontend User object expectations
      const backendUser = response.user as any;
      if (backendUser.employee) {
        response.user.name = backendUser.employee.fullName || backendUser.employee.firstName || 'User';
        response.user.profilePicture = backendUser.employee.profilePicture;
      } else if (!response.user.name) {
        response.user.name = 'User';
      }

      localStorage.setItem('df_token', response.token);
      localStorage.setItem('df_user', JSON.stringify(response.user));
      return response;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      return request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    },

    logout: async (): Promise<void> => {
      localStorage.removeItem('df_token');
      localStorage.removeItem('df_user');
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
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/employees${query}`);
    },

    getById: async (id: string): Promise<Employee> => {
      return request(`/employees/${id}`);
    },

    create: async (data: Omit<Employee, 'id' | 'code' | 'status'>): Promise<{ employee: Employee; tempPassword: string }> => {
      return request('/employees', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
      return request(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  attendance: {
    checkIn: async (employeeId: string): Promise<Attendance> => {
      return request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      });
    },

    checkOut: async (employeeId: string): Promise<Attendance> => {
      return request('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      });
    },

    getAll: async (search = '', month?: number, year?: number): Promise<Attendance[]> => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/attendance${query}`);
    },

    getByEmployeeId: async (employeeId: string): Promise<Attendance[]> => {
      return request(`/attendance/my?employeeId=${employeeId}`);
    }
  },

  timeOff: {
    getAllRequests: async (): Promise<LeaveRequest[]> => {
      return request('/time-off');
    },

    getByEmployeeId: async (employeeId: string): Promise<LeaveRequest[]> => {
      return request(`/time-off/my?employeeId=${employeeId}`);
    },

    createRequest: async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status' | 'submittedOn'>): Promise<LeaveRequest> => {
      return request('/time-off', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    approve: async (id: string, comment = ''): Promise<LeaveRequest> => {
      return request(`/time-off/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
      });
    },

    reject: async (id: string, comment: string): Promise<LeaveRequest> => {
      return request(`/time-off/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
      });
    },

    getAllocations: async (employeeId: string): Promise<LeaveAllocation[]> => {
      return request(`/leave-allocation?employeeId=${employeeId}`);
    }
  },

  salary: {
    getByEmployeeId: async (employeeId: string): Promise<Salary> => {
      return request(`/employees/${employeeId}/salary`);
    },

    update: async (employeeId: string, data: Partial<Salary>): Promise<Salary> => {
      return request(`/employees/${employeeId}/salary`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  payroll: {
    getAll: async (month?: number, year?: number): Promise<Payroll[]> => {
      const params = new URLSearchParams();
      if (month !== undefined) params.append('month', month.toString());
      if (year !== undefined) params.append('year', year.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/payroll${query}`);
    },

    getByEmployeeId: async (employeeId: string): Promise<Payroll[]> => {
      return request(`/payroll/${employeeId}`);
    },

    generateMonthly: async (month: number, year: number): Promise<Payroll[]> => {
      return request(`/payroll/generate?month=${month}&year=${year}`, { method: 'POST' });
    }
  },

  skills: {
    add: async (employeeId: string, name: string, level: string): Promise<Skill> => {
      return request('/skills', {
        method: 'POST',
        body: JSON.stringify({ employeeId, name, level })
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/skills/${id}`, { method: 'DELETE' });
    },

    getByEmployeeId: async (employeeId: string): Promise<Skill[]> => {
      return request(`/employees/${employeeId}/skills`);
    }
  },

  certifications: {
    add: async (employeeId: string, name: string, organization: string, issueDate: string, expiryDate?: string): Promise<Certification> => {
      return request('/certifications', {
        method: 'POST',
        body: JSON.stringify({ employeeId, name, organization, issueDate, expiryDate })
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/certifications/${id}`, { method: 'DELETE' });
    },

    getByEmployeeId: async (employeeId: string): Promise<Certification[]> => {
      return request(`/employees/${employeeId}/certifications`);
    }
  },

  documents: {
    upload: async (employeeId: string, name: string, type: string, fileSize = '1.0 MB'): Promise<Document> => {
      return request(`/employees/${employeeId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ name, type })
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/documents/${id}`, { method: 'DELETE' });
    },

    getByEmployeeId: async (employeeId: string): Promise<Document[]> => {
      return request(`/employees/${employeeId}/documents`);
    }
  },

  settings: {
    get: async (): Promise<CompanySettings> => {
      return request('/company');
    },

    update: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
      const updated = await request<CompanySettings>('/company', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      window.dispatchEvent(new CustomEvent('company-settings-updated', { detail: updated }));
      return updated;
    }
  }
};
