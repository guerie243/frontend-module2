/**
 * Product Service
 * 
 * API service for product CRUD operations
 * Communicates with Module 2 backend
 * Pattern from Module 1 annonceService
 */

import api from './api';
import { Product, PaginatedResponse } from '../types';
import { toFormData, hasFiles } from '../utils/formDataHelper';

export const productService = {
    /**
     * Get all products with pagination and filters
     */
    getAllProducts: async (page = 1, limit = 20, category = '', search = '') => {
        let url = `/products?page=${page}&limit=${limit}`;
        if (category) url += `&category=${category}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await api.get<PaginatedResponse<Product>>(url);
        return response.data;
    },

    /**
     * Get products by vitrine ID
     */
    getProductsByVitrine: async (vitrineId: string, page = 1, limit = 20) => {
        const response = await api.get<{ success: boolean; data: Product[] }>(
            `/products/vitrine/${vitrineId}?page=${page}&limit=${limit}`
        );
        return response.data.data;
    },

    /**
     * Get single product by slug
     */
    getProductBySlug: async (slug: string) => {
        const response = await api.get<{ success: boolean; data: Product }>(`/products/${slug}`);
        return response.data.data;
    },

    /**
     * Create new product
     */
    createProduct: async (data: Partial<Product>) => {
        console.log('[productService] createProduct called with data keys:', Object.keys(data));
        const hasImages = hasFiles(data);
        console.log('[productService] hasFiles(data) result:', hasImages);

        const payload = hasImages ? await toFormData(data) : data;
        console.log('[productService] Payload type:', payload instanceof FormData ? 'FormData' : 'JSON');

        const config = hasImages ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        console.log('[productService] Request config:', JSON.stringify(config));

        const response = await api.post<{ success: boolean; data: Product }>('/products', payload, config);
        console.log('[productService] Response received:', response.data.success ? 'Success' : 'Failure');
        return response.data.data;
    },

    /**
     * Update existing product
     */
    updateProduct: async (id: string, data: Partial<Product>) => {
        const hasImages = hasFiles(data);
        const payload = hasImages ? await toFormData(data) : data;
        const config = hasImages ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

        const response = await api.patch<{ success: boolean; data: Product }>(
            `/products/${id}`,
            payload,
            config
        );
        return response.data.data;
    },

    /**
     * Delete product
     */
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
};
