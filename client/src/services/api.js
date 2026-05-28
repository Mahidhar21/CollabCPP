import axios from 'axios';
import { getStoredToken, clearStoredToken } from '../utils/token.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearStoredToken();
    }

    const normalized = {
      message,
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(normalized);
  }
);

export const healthApi = {
  getHealth: () => api.get('/health'),
  getInfo: () => api.get('/'),
};

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const roomsApi = {
  create: (data) => api.post('/rooms/create', data),
  join: (data) => api.post('/rooms/join', data),
  getRecent: () => api.get('/rooms/recent'),
  getById: (roomId) => api.get(`/rooms/${roomId}`),
};

export default api;
