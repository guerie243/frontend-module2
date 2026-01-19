/**
 * Order Hooks
 * 
 * TanStack Query hooks for order data operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { Order } from '../types';

/**
 * Get orders by vitrine ID
 */
export const useOrdersByVitrine = (vitrineId: string, enabled = true) => {
    return useQuery({
        queryKey: ['orders', 'vitrine', vitrineId],
        queryFn: () => orderService.getOrdersByVitrine(vitrineId),
        enabled: enabled && !!vitrineId,
    });
};

/**
 * Get single order by ID
 */
export const useOrderDetail = (orderId: string, enabled = true) => {
    return useQuery({
        queryKey: ['orders', orderId],
        queryFn: () => orderService.getOrderById(orderId),
        enabled: enabled && !!orderId,
    });
};

/**
 * Create order mutation
 */
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Order>) => orderService.createOrder(data),
        onSuccess: (newOrder) => {
            console.log('Order created successfully:', newOrder.id);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error('Order creation error:', error.response?.data || error.message);
        },
    });
};

/**
 * Update order status mutation
 */
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
            orderService.updateOrderStatus(id, status),
        onSuccess: (updatedOrder) => {
            console.log('Order status updated:', updatedOrder.status);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.setQueryData(['orders', updatedOrder.id], updatedOrder);
        },
        onError: (error: any) => {
            console.error('Order status update error:', error.response?.data || error.message);
        },
    });
};

/**
 * Update order mutation
 */
export const useUpdateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
            orderService.updateOrder(id, data),
        onSuccess: (updatedOrder) => {
            console.log('Order updated successfully');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.setQueryData(['orders', updatedOrder.id], updatedOrder);
        },
        onError: (error: any) => {
            console.error('Order update error:', error.response?.data || error.message);
        },
    });
};
