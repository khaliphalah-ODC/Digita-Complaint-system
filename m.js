import { defineStore } from 'pinia';
import { ref } from 'vue';
import api, { extractApiError, unwrapResponse } from '../services/api';

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref([]);
  const loading = ref(false);
  const error = ref('');

  const ensureSuccess = (payload, fallbackMessage = 'Request failed') => {
    if (!payload?.success) {
      throw new Error(payload?.message || fallbackMessage);
    }
    return payload.data;
  };

  const fetchComplaints = async () => {
    loading.value = true;
    error.value = '';
    try {
      const response = await api.get('/complaint'); // GET /api/complaint
      complaints.value = ensureSuccess(unwrapResponse(response), 'Failed to fetch complaints');
    } catch (err) {
      error.value = extractApiError(err, 'Failed to fetch complaints');
    } finally {
      loading.value = false;
    }
  };

  const createComplaint = async (payload) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await api.post('/complaint', payload); // POST /api/complaint
      const created = ensureSuccess(unwrapResponse(response), 'Failed to create complaint');
      complaints.value.unshift(created);
      return created;
    } catch (err) {
      error.value = extractApiError(err, 'Failed to create complaint');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateComplaint = async (id, payload) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await api.put(`/complaint/${id}`, payload); // PUT /api/complaint/:id
      const updated = ensureSuccess(unwrapResponse(response), 'Failed to update complaint');
      complaints.value = complaints.value.map((c) => (c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      error.value = extractApiError(err, 'Failed to update complaint');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteComplaint = async (id) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await api.delete(`/complaint/${id}`); // DELETE /api/complaint/:id
      ensureSuccess(unwrapResponse(response), 'Failed to delete complaint');
      complaints.value = complaints.value.filter((c) => c.id !== id);
    } catch (err) {
      error.value = extractApiError(err, 'Failed to delete complaint');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    complaints,
    loading,
    error,
    fetchComplaints,
    createComplaint,
    updateComplaint,
    deleteComplaint
  };
});
