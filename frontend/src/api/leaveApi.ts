import { api } from './client';

export const leaveApi = {
  requestLeave: async (data: any) => {
    const res = await api.post('/leaves/request', data);
    return res.data;
  },
  getMyLeaves: async () => {
    const res = await api.get('/leaves/my-leaves');
    return res.data;
  },
  getAllLeaves: async () => {
    const res = await api.get('/leaves/all');
    return res.data;
  },
  approveLeave: async (id: string, comment?: string) => {
    const res = await api.post(`/leaves/${id}/approve`, { comment });
    return res.data;
  },
  rejectLeave: async (id: string, comment: string) => {
    const res = await api.post(`/leaves/${id}/reject`, { comment });
    return res.data;
  },
};
