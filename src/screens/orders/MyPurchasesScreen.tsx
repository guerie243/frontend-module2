/**
 * My Purchases Screen (Acheteur)
 * 
 * Display all orders passed by the user (stored locally in AsyncStorage)
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useGuestOrders } from '../../hooks/useCommandes';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { LoadingComponent } from '../../components/LoadingComponent';
import { Order } from '../../types';
import { ScreenHeader } from '../../components/ScreenHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export const MyPurchasesScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    const [guestOrderIds, setGuestOrderIds] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadGuestOrders = async () => {
        try {
            const savedOrdersJson = await AsyncStorage.getItem('GUEST_ORDERS');
            if (savedOrdersJson) {
                const ids = JSON.parse(savedOrdersJson);
                setGuestOrderIds(ids);
            }
        } catch (e) {
            console.error('Failed to load guest orders:', e);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadGuestOrders();
        }, [])
    );

    const {
        data: guestOrders = [],
        isLoading: guestOrdersLoading,
        refetch: refetchGuestOrders
    } = useGuestOrders(guestOrderIds, guestOrderIds.length > 0);

    const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
    const [selectedOrderForShare, setSelectedOrderForShare] = useState<Order | null>(null);

    // Filter and sort orders
    const filteredOrders = useMemo(() => {
        let result = guestOrders || [];
        if (statusFilter !== 'all') {
            result = result.filter(order => order.status === statusFilter);
        }

        // Sort by newest first
        return [...result].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [guestOrders, statusFilter]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await loadGuestOrders();
        await refetchGuestOrders();
        setIsRefreshing(false);
    };

    const handleOrderPress = (order: Order) => {
        const orderId = order.id || order._id;
        navigation.navigate('OrderClientDetail', { orderId });
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
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        setSelectedOrderForShare(item);
                    }}
                    style={styles.cardShareButton}
                >
                    <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.clientName, { color: theme.colors.textSecondary }]}>
                {item.clientName}
            </Text>

            <View style={styles.orderFooter}>
                <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
                    {item.products.length} article(s)
                </Text>
                <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                    {item.totalPrice.toFixed(2)} {item.products[0]?.currency || 'USD'}
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

    if (guestOrdersLoading && guestOrders.length === 0) {
        return <LoadingComponent message="Chargement de vos achats..." />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Mes Achats"
                showBack={true}
            />

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {renderFilterButton('all', 'Toutes')}
                    {renderFilterButton('pending', 'En attente')}
                    {renderFilterButton('confirmed', 'Confirmées')}
                    {renderFilterButton('preparing', 'Préparation')}
                    {renderFilterButton('delivering', 'Livraison')}
                    {renderFilterButton('completed', 'Livrées')}
                    {renderFilterButton('cancelled', 'Annulées')}
                </ScrollView>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id || item._id || ''}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Vous n'avez pas encore passé de commande.
                        </Text>
                    </View>
                }
            />

            {selectedOrderForShare && (
                <ShareMenuModal
                    isVisible={!!selectedOrderForShare}
                    onClose={() => setSelectedOrderForShare(null)}
                    url={getOrderUrl(selectedOrderForShare.id || selectedOrderForShare._id)}
                    title="Suivi de commande"
                    message={`Lien de suivi pour la commande #${selectedOrderForShare.id?.slice(-6) || selectedOrderForShare._id?.slice(-6)} sur Andy Business.`}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    cardShareButton: {
        padding: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
});
