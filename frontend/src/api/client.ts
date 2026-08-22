import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if not on login route
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('dayflow_token');
        localStorage.removeItem('dayflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
