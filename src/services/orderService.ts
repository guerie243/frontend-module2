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
     * Get multiple orders by IDs (for guest users)
     */
    getGuestOrders: async (ids: string[]) => {
        if (!ids || ids.length === 0) return [];

        console.log(`[orderService] Fetching ${ids.length} guest orders`);

        try {
            const promises = ids.map(id =>
                api.get<{ success: boolean; data: Order }>(`/orders/${id}`)
                    .then(res => res.data.data)
                    .catch(err => {
                        console.warn(`[orderService] Failed to fetch order ${id}:`, err.message);
                        return null;
                    })
            );

            const results = await Promise.all(promises);
            // Filter out nulls
            const validOrders = results.filter((order): order is Order => order !== null);
            return validOrders;
        } catch (error) {
            console.error('[orderService] Error fetching guest orders:', error);
            throw error;
        }
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

    /**
     * Delete an order
     */
    deleteOrder: async (id: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(`/orders/${id}`);
        return response.data;
    },
};
