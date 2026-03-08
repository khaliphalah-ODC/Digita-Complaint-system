import { defineStore } from "pinia";
import {ref} from 'vue'
import api, {extractApiError, unwrapResponse} from '../services/api.js'

export const useComplaintStore = defineStore ('complaint', () => {
    const complaints = ref([]);
    const loading = ref(false);
    const error = ref('');

    const ensureSuccess = (payload, fallbackMessage = 'Request') => {
        if(!payload?.success) {
            throw new Error(payload?.message || fallbackMessage);
        }
        return payload.data
    };
    
    const fetchComplaints = async () => {
        loading.value = true;
        error.value = '';

        try {
            const response = await api.get('/complaint')//get api/complaint
            complaints.value = ensureSuccess(unwrapResponse(response),'Failed to fetch complaint');

        } catch (error) {
            error.value = extractApiError(error, 'Failed to fetch complaints');
        }finally{
            loading.value = false
        }
    };

    const createComplaint = async (payload) => {
        loading.value = true;
        error.value = '';

        try {
            const response = await api.post('/complaint', payload);//Post /api/complaint
            const created = ensureSuccess(unwrapResponse(response), 'Failed to create complaint');
            complaints.value.unshift(created)
            return created
        } catch (error) {
            error.value = extractApiError(error, 'Failed to create complaint')
            throw error;
        } finally {
            loading.value = false;

        }
    };

    const updateComplaint = async (id, payload) => {
        loading.value = true;
        error.value = '';

        try {
            const response = await api.put(`/complaint/${id}`, payload)//PUT /api/complaint
            const updated = ensureSuccess(unwrapResponse(response), 'Failed to update complaing');
            complaints.value = complaints.value.map((c) => (c.id === updated.id ? updated : c));
            return updated
        } catch (error) {
            error.value = extractApiError(error, 'Failed to update complaint')
            throw error
        } finally {
            loading.value = false;
        }
    };


    const deleteComplaint =  async (id) => {
        loading.value = true
        error.value = '';

        try {
            const response = await api.delete(`/complaint/${id}`)// Delete /api/complaint
           ensureSuccess(unwrapResponse(response), 'Failed to delete complaint');
           complaints.value = complaints.value.filter((c) => c.id !== id);

        } catch (error) {
            error.value = extractApiError(error, 'Failed to delete complaint')
            throw error;
            
        } finally {
            loading.value = false
        }
    }

    return{
        complaints,
        loading,
        error,
        fetchComplaints,
        createComplaint,
        updateComplaint,
        deleteComplaint
    }
});
