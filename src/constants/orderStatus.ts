export const ORDER_STATUS = {
    PENDING: {
        value: 'pending' as const,
        label: 'En attente',
        color: '#FF9500', // Orange
        icon: 'time-outline' as const,
    },
    CONFIRMED: {
        value: 'confirmed' as const,
        label: 'Acceptée',
        color: '#007AFF', // Blue
        icon: 'checkmark-circle-outline' as const,
    },
    PREPARING: {
        value: 'preparing' as const,
        label: 'En préparation',
        color: '#5856D6', // Purple
        icon: 'hammer-outline' as const,
    },
    DELIVERING: {
        value: 'delivering' as const,
        label: 'En livraison',
        color: '#34C759', // Green
        icon: 'bicycle-outline' as const,
    },
    COMPLETED: {
        value: 'completed' as const,
        label: 'Livrée',
        color: '#34C759', // Changed to Green to match delivery success
        icon: 'checkmark-done-circle-outline' as const,
    },
    CANCELLED: {
        value: 'cancelled' as const,
        label: 'Annulée',
        color: '#FF3B30', // Red
        icon: 'close-circle-outline' as const,
    },
} as const;

export type OrderStatusValue = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]['value'];

export const getOrderStatus = (status: string) => {
    return Object.values(ORDER_STATUS).find(s => s.value === status) || ORDER_STATUS.PENDING;
};
