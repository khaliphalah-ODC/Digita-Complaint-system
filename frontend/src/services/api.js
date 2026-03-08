import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const unwrapResponse = (response) => response?.data || {};

export const extractApiError = (error, fallbackMessage = 'Request failed') => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const payload = error.response.data || {};
      const detail = typeof payload.error === 'string' ? `: ${payload.error}` : '';
      return `${payload.message || fallbackMessage} (${error.response.status})${detail}`;
    }

    if (error.request) {
      return 'Cannot reach backend API. Start backend server and verify API URL.';
    }
  }

  return error?.message || fallbackMessage;
};

export default api;
