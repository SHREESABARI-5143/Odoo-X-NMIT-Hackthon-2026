import { api } from './client';

export const documentApi = {
  uploadDocument: async (formData: FormData) => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getEmployeeDocuments: async (employeeId: string) => {
    const res = await api.get(`/documents/employee/${employeeId}`);
    return res.data;
  },
  downloadDocument: (id: string) => {
    window.open(`/api/documents/${id}/download`, '_blank');
  },
  deleteDocument: async (id: string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};
