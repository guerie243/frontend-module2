/**
 * Order Status Constants
 * 
 * Order status values with labels and colors
 */

export const ORDER_STATUS = {
    PENDING: {
        value: 'pending' as const,
        label: 'En attente',
        color: '#FF9500',
        icon: 'time-outline' as const,
    },
    CONFIRMED: {
        value: 'confirmed' as const,
        label: 'Confirmée',
        color: '#007AFF',
        icon: 'checkmark-circle-outline' as const,
    },
    PREPARING: {
        value: 'preparing' as const,
        label: 'En préparation',
        color: '#5856D6',
        icon: 'cube-outline' as const,
    },
    DELIVERING: {
        value: 'delivering' as const,
        label: 'En livraison',
        color: '#AF52DE',
        icon: 'bicycle-outline' as const,
    },
    COMPLETED: {
        value: 'completed' as const,
        label: 'Livrée',
        color: '#34C759',
        icon: 'checkmark-done-outline' as const,
    },
    CANCELLED: {
        value: 'cancelled' as const,
        label: 'Annulée',
        color: '#FF3B30',
        icon: 'close-circle-outline' as const,
    },
} as const;

export type OrderStatusValue = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]['value'];

export const getOrderStatus = (status: string) => {
    return Object.values(ORDER_STATUS).find(s => s.value === status) || ORDER_STATUS.PENDING;
};
