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
        const response = await module1Api.get<{ success: boolean; vitrine: Vitrine }>(`/vitrines/${idOrSlug}`);
        return response.data.vitrine;
    },

    /**
     * Update vitrine (calls Module 1)
     */
    updateVitrine: async (slug: string, data: Partial<Vitrine>) => {
        const payload = hasFiles(data) ? await toFormData(data) : data;

        const response = await module1Api.patch<{ success: boolean; vitrine: Vitrine }>(
            `/vitrines/myvitrine/${slug}`,
            payload
        );
        return response.data.vitrine;
    },


};
