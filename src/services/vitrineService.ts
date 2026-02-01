/**
 * Vitrine Service
 * 
 * API service for vitrine operations
 * Communicates with Module 1 backend
 * Pattern from Module 1 vitrineService
 */

import { module1Api } from './api';
import { Vitrine } from '../types';
import { toFormData, hasFiles } from '../utils/formDataHelper';

export const vitrineService = {
    /**
     * Get all vitrines with pagination and filters
     */
    getAllVitrines: async (page = 1, limit = 6, category = '', search = '') => {
        const response = await module1Api.get<{ success: boolean; vitrines: Vitrine[] }>(
            `/vitrines?page=${page}&limit=${limit}&category=${category || ''}&search=${search || ''}`
        );
        return response.data;
    },

    /**
     * Get all vitrines owned by authenticated user
     */
    getAllOwnerVitrines: async () => {
        const response = await module1Api.get<{ success: boolean; vitrines: Vitrine[] }>('/vitrines/myvitrines');
        return response.data.vitrines;
    },

    /**
     * Get single vitrine by slug or ID
     */
    getVitrineBySlug: async (idOrSlug: string) => {
        if (!idOrSlug || idOrSlug === 'undefined') {
            console.warn('[vitrineService] getVitrineBySlug called with invalid slug:', idOrSlug);
            return null;
        }
        const response = await module1Api.get<{ success: boolean; vitrine: Vitrine }>(`/vitrines/${idOrSlug}`);
        return response.data.vitrine;
    },

    /**
     * Create vitrine (calls Module 1)
     */
    updateVitrine: async (slug: string, data: Partial<Vitrine>) => {
        console.log('[vitrineService] updateVitrine called for slug:', slug);
        console.log('[vitrineService] Data to update:', JSON.stringify(data, null, 2));

        const payload = hasFiles(data) ? await toFormData(data) : data;
        const config = hasFiles(data) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

        if (hasFiles(data)) {
            console.log('[vitrineService] Sending FormData payload.');
        } else {
            console.log('[vitrineService] Sending JSON payload.');
        }

        const response = await module1Api.patch<{ success: boolean; vitrine: Vitrine }>(
            `/vitrines/myvitrine/${slug}`,
            payload,
            config  // Ajouter le config avec le Content-Type
        );
        console.log('[vitrineService] Update response:', response.status);
        return response.data.vitrine;
    },

    /**
     * Delete vitrine (calls Module 1)
     */
    deleteVitrine: async (slug: string) => {
        const response = await module1Api.delete(`/vitrines/myvitrine/${slug}`);
        return response.data;
    },
};
