import { api } from './client';

export const attendanceApi = {
  checkIn: async () => {
    const res = await api.post('/attendance/check-in');
    return res.data;
  },
  checkOut: async () => {
    const res = await api.post('/attendance/check-out');
    return res.data;
  },
  getToday: async () => {
    const res = await api.get('/attendance/today');
    return res.data;
  },
  getHistory: async (params?: { employeeId?: string; view?: string; month?: string; year?: string }) => {
    const res = await api.get('/attendance/history', { params });
    return res.data;
  },
};
