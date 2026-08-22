import { api } from './client';

export const employeeApi = {
  getEmployees: async (params?: { search?: string; department?: string; status?: string }) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  getEmployeeById: async (id: string) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  createEmployee: async (data: any) => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  updateEmployee: async (id: string, data: any) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  addSkill: async (id: string, skill: string) => {
    const res = await api.post(`/employees/${id}/skills`, { skill });
    return res.data;
  },
  addCertification: async (id: string, cert: any) => {
    const res = await api.post(`/employees/${id}/certifications`, cert);
    return res.data;
  },
};
