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
        const response = await api.get<{ success: boolean; products: Product[] }>(
            `/products/vitrine/${vitrineId}?page=${page}&limit=${limit}`
        );
        return response.data.products;
    },

    /**
     * Get single product by slug
     */
    getProductBySlug: async (slug: string) => {
        const response = await api.get<{ success: boolean; product: Product }>(`/products/${slug}`);
        return response.data.product;
    },

    /**
     * Create new product
     */
    createProduct: async (data: Partial<Product>) => {
        const payload = hasFiles(data) ? await toFormData(data) : data;
        const config = hasFiles(data) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

        const response = await api.post<{ success: boolean; product: Product }>('/products', payload, config);
        return response.data.product;
    },

    /**
     * Update existing product
     */
    updateProduct: async (id: string, data: Partial<Product>) => {
        const payload = hasFiles(data) ? await toFormData(data) : data;
        const config = hasFiles(data) ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

        const response = await api.patch<{ success: boolean; product: Product }>(
            `/products/${id}`,
            payload,
            config
        );
        return response.data.product;
    },

    /**
     * Delete product
     */
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
};
