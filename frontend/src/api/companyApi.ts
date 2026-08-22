import { api } from './client';

export const companyApi = {
  getSettings: async () => {
    const res = await api.get('/company/settings');
    return res.data;
  },
  updateSettings: async (formData: FormData) => {
    const res = await api.put('/company/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
