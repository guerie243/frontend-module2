/**
 * Orders List Screen
 * 
 * Display all orders for vitrine owner with filtering
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useOrdersByVitrine } from '../../hooks/useCommandes';
import { useMyVitrines } from '../../hooks/useVitrines';
import { Order } from '../../types';

export const OrdersListScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    // Get user's vitrine
    const { data: myVitrines, isLoading: vitrinesLoading, refetch: refetchVitrines } = useMyVitrines();
    const vitrineId = myVitrines?.[0]?.id || myVitrines?.[0]?._id || '';

    // Get orders for this vitrine
    const {
        data: orders = [],
        isLoading: ordersLoading,
        refetch: refetchOrders
    } = useOrdersByVitrine(vitrineId, !!vitrineId);

    const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

    // Filter orders by status
    const filteredOrders = useMemo(() => {
        if (statusFilter === 'all') return orders;
        return orders.filter(order => order.status === statusFilter);
    }, [orders, statusFilter]);

    const onRefresh = async () => {
        console.log('Refreshing orders list');
        await Promise.all([refetchVitrines(), refetchOrders()]);
    };

    const handleOrderPress = (order: Order) => {
        console.log('Opening order detail:', order.id);
        navigation.navigate('OrderVitrineDetail', { orderId: order.id || order._id });
    };

    const getStatusColor = (status: Order['status']) => {
        const colors: Record<Order['status'], string> = {
            pending: '#FF9500',
            confirmed: '#007AFF',
            preparing: '#5856D6',
            delivering: '#34C759',
            completed: '#8E8E93',
            cancelled: '#FF3B30',
        };
        return colors[status] || theme.colors.textSecondary;
    };

    const getStatusLabel = (status: Order['status']) => {
        const labels: Record<Order['status'], string> = {
            pending: 'En attente',
            confirmed: 'Confirmée',
            preparing: 'En préparation',
            delivering: 'En livraison',
            completed: 'Livrée',
            cancelled: 'Annulée',
        };
        return labels[status] || status;
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleOrderPress(item)}
        >
            <View style={styles.orderHeader}>
                <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                    Commande #{item.id?.slice(-6) || item._id?.slice(-6)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <Text style={[styles.clientName, { color: theme.colors.textSecondary }]}>
                {item.clientName}
            </Text>
            <Text style={[styles.clientPhone, { color: theme.colors.textSecondary }]}>
                📞 {item.clientPhone}
            </Text>

            <View style={styles.orderFooter}>
                <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
                    {item.products.length} article(s)
                </Text>
                <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                    {item.totalPrice.toFixed(2)} DA
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFilterButton = (status: Order['status'] | 'all', label: string) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                { backgroundColor: theme.colors.surface },
                statusFilter === status && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setStatusFilter(status)}
        >
            <Text
                style={[
                    styles.filterButtonText,
                    { color: theme.colors.text },
                    statusFilter === status && { color: theme.colors.white },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (vitrinesLoading || ordersLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Chargement des commandes...
                </Text>
            </View>
        );
    }

    if (!vitrineId) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Aucune vitrine trouvée
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {renderFilterButton('all', 'Toutes')}
                {renderFilterButton('pending', 'En attente')}
                {renderFilterButton('confirmed', 'Confirmées')}
                {renderFilterButton('completed', 'Livrées')}
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id || item._id || ''}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Aucune commande
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
    },
    orderCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    clientName: {
        fontSize: 14,
        marginBottom: 4,
    },
    clientPhone: {
        fontSize: 14,
        marginBottom: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemCount: {
        fontSize: 14,
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
});
