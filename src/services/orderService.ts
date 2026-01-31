/**
 * Order Service
 * 
 * API service for order management operations
 * Communicates with Module 2 backend
 */

import api from './api';
import { Order } from '../types';

export const orderService = {
    /**
     * Create new order
     */
    createOrder: async (data: Partial<Order>) => {
        const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
        return response.data.data;
    },

    /**
     * Get single order by ID
     */
    getOrderById: async (id: string) => {
        const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
        return response.data.data;
    },

    /**
     * Get all orders for a vitrine
     */
    getOrdersByVitrine: async (vitrineId: string, page = 1, limit = 20) => {
        console.log(`[orderService] Fetching orders for vitrineId: ${vitrineId}`);
        const response = await api.get<{ success: boolean; data: Order[] }>(
            `/orders/vitrine/${vitrineId}?page=${page}&limit=${limit}`
        );
        console.log(`[orderService] getOrdersByVitrine response success: ${response.data.success}, data length: ${response.data.data?.length}`);
        return response.data.data;
    },

    /**
     * Update order status
     */
    updateOrderStatus: async (id: string, status: Order['status']) => {
        const response = await api.patch<{ success: boolean; data: Order }>(
            `/orders/${id}`,
            { status }
        );
        return response.data.data;
    },

    /**
     * Update order details
     */
    updateOrder: async (id: string, data: Partial<Order>) => {
        const response = await api.patch<{ success: boolean; data: Order }>(
            `/orders/${id}`,
            data
        );
        return response.data.data;
    },
};
