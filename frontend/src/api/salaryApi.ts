import { api } from './client';

export const salaryApi = {
  getSalaryConfig: async (employeeId: string) => {
    const res = await api.get(`/salary/${employeeId}`);
    return res.data;
  },
  updateSalaryConfig: async (employeeId: string, data: any) => {
    const res = await api.put(`/salary/${employeeId}`, data);
    return res.data;
  },
};
