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
        const response = await api.post<{ success: boolean; order: Order }>('/orders', data);
        return response.data.order;
    },

    /**
     * Get single order by ID
     */
    getOrderById: async (id: string) => {
        const response = await api.get<{ success: boolean; order: Order }>(`/orders/${id}`);
        return response.data.order;
    },

    /**
     * Get all orders for a vitrine
     */
    getOrdersByVitrine: async (vitrineId: string, page = 1, limit = 20) => {
        const response = await api.get<{ success: boolean; orders: Order[] }>(
            `/orders/vitrine/${vitrineId}?page=${page}&limit=${limit}`
        );
        return response.data.orders;
    },

    /**
     * Update order status
     */
    updateOrderStatus: async (id: string, status: Order['status']) => {
        const response = await api.patch<{ success: boolean; order: Order }>(
            `/orders/${id}`,
            { status }
        );
        return response.data.order;
    },

    /**
     * Update order details
     */
    updateOrder: async (id: string, data: Partial<Order>) => {
        const response = await api.patch<{ success: boolean; order: Order }>(
            `/orders/${id}`,
            data
        );
        return response.data.order;
    },
};
