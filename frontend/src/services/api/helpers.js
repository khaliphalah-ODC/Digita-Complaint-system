import axios from 'axios';
import apiClient from './client.js';

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

export const ensureSuccess = (payload, fallbackMessage = 'Request failed') => {
  if (!payload?.success) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
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

export const request = async (config, fallbackMessage = 'Request failed') => {
  const response = await apiClient.request(config);
  return ensureSuccess(unwrapResponse(response), fallbackMessage);
};

export const get = (url, config, fallbackMessage) =>
  request({ url, method: 'GET', ...config }, fallbackMessage);

export const post = (url, data, config, fallbackMessage) =>
  request({ url, method: 'POST', data, ...config }, fallbackMessage);

export const put = (url, data, config, fallbackMessage) =>
  request({ url, method: 'PUT', data, ...config }, fallbackMessage);

export const patch = (url, data, config, fallbackMessage) =>
  request({ url, method: 'PATCH', data, ...config }, fallbackMessage);

export const remove = (url, config, fallbackMessage) =>
  request({ url, method: 'DELETE', ...config }, fallbackMessage);
