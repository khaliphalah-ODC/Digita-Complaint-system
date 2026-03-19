import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
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

const formatFieldName = (value) => String(value || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeValidationMessage = (message) => {
  const raw = String(message || '');
  const notAllowedMatch = raw.match(/^"([^"]+)" is not allowed$/i);
  if (notAllowedMatch) {
    return `${formatFieldName(notAllowedMatch[1])} is not supported in this form.`;
  }

  const requiredMatch = raw.match(/^"([^"]+)" is required$/i);
  if (requiredMatch) {
    return `${formatFieldName(requiredMatch[1])} is required.`;
  }

  const emptyMatch = raw.match(/^"([^"]+)" is not allowed to be empty$/i);
  if (emptyMatch) {
    return `${formatFieldName(emptyMatch[1])} cannot be empty.`;
  }

  return raw.replace(/"/g, '');
};

export const extractApiError = (error, fallbackMessage = 'Request failed') => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const payload = error.response.data || {};
      const status = Number(error.response.status || 0);
      const message = String(payload.message || fallbackMessage);
      const detail = typeof payload.error === 'string' ? String(payload.error) : '';

      if (/SQLITE_BUSY|database is locked/i.test(`${message} ${detail}`)) {
        return 'The system is busy right now. Please try again in a moment.';
      }

      if (/^".+" (is not allowed|is required|is not allowed to be empty)/i.test(message)) {
        return normalizeValidationMessage(message);
      }

      if (status >= 500) {
        return `${message} (${status})`;
      }

      const friendlyDetail = detail && !/^SQLITE_|^Error:/i.test(detail)
        ? `: ${normalizeValidationMessage(detail)}`
        : '';
      return `${message} (${status})${friendlyDetail}`;
    }

    if (error.request) {
      return 'Cannot reach backend API. Start backend server and verify API URL.';
    }
  }

  return error?.message || fallbackMessage;
};

export default api;
