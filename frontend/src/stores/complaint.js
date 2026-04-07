import { defineStore } from "pinia";
import {ref} from 'vue'
import { complaintsApi, extractApiError } from '../services/api.js'

export const useComplaintStore = defineStore ('complaint', () => {
    const complaints = ref([]);
    const loading = ref(false);
    const error = ref('');

    const fetchComplaints = async () => {
        loading.value = true;
        error.value = '';

        try {
            complaints.value = await complaintsApi.list();

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
            const created = await complaintsApi.create(payload);
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
            const updated = await complaintsApi.update(id, payload);
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
           await complaintsApi.remove(id);
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
