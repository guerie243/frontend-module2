/**
 * Order Hooks
 * 
 * TanStack Query hooks for order data operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMyVitrines } from './useVitrines';
import { useAuth } from './useAuth';

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

/**
 * Delete order mutation
 */
export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => orderService.deleteOrder(id),
        onSuccess: () => {
            console.log('Order deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error('Order deletion error:', error.response?.data || error.message);
        },
    });
};

/**
 * Get guest orders by IDs
 */
export const useGuestOrders = (ids: string[], enabled = true) => {
    return useQuery({
        queryKey: ['guestOrders', ids],
        queryFn: () => orderService.getGuestOrders(ids),
        enabled: enabled && ids.length > 0,
    });
};

/**
 * Hook to count pending orders for seller (all vitrines)
 */
export const usePendingSellerOrdersCount = () => {
    const { isAuthenticated } = useAuth();
    const { data: vitrines = [] } = useMyVitrines({ enabled: isAuthenticated });

    // For simplicity, we fetch orders for all vitrines or just the first few
    // In a real app, there might be a specific endpoint for counts
    // Here we'll combine the results of orders for each vitrine
    const vitrineIds = vitrines.map(v => v.vitrineId || v.id || v._id).filter(Boolean) as string[];

    const queries = useQuery({
        queryKey: ['orders', 'pending', 'count', vitrineIds],
        queryFn: async () => {
            if (vitrineIds.length === 0) return 0;
            const allOrders = await Promise.all(
                vitrineIds.map(id => orderService.getOrdersByVitrine(id))
            );
            const flatOrders = allOrders.flat();
            return flatOrders.filter(o => o.status === 'pending').length;
        },
        enabled: isAuthenticated && vitrineIds.length > 0,
        refetchInterval: 30000, // Refresh every 30s
    });

    return queries.data || 0;
};

/**
 * Hook to count pending orders for buyer (guest orders in storage)
 */
export const usePendingBuyerOrdersCount = () => {
    const { data: pendingCount = 0 } = useQuery({
        queryKey: ['guestOrders', 'pending', 'count'],
        queryFn: async () => {
            try {
                const savedOrdersJson = await AsyncStorage.getItem('GUEST_ORDERS');
                if (!savedOrdersJson) return 0;

                const ids = JSON.parse(savedOrdersJson);
                if (!Array.isArray(ids) || ids.length === 0) return 0;

                const orders = await orderService.getGuestOrders(ids);
                return orders.filter(o => o.status === 'pending').length;
            } catch (e) {
                console.error('Error counting pending buyer orders:', e);
                return 0;
            }
        },
        refetchInterval: 30000,
    });

    return pendingCount;
};
