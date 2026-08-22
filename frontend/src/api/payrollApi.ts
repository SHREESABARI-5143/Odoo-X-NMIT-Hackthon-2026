import { api } from './client';

export const payrollApi = {
  getPayrollDashboard: async (params?: { department?: string; employeeId?: string; month?: string; year?: string }) => {
    const res = await api.get('/payroll/dashboard', { params });
    return res.data;
  },
};
