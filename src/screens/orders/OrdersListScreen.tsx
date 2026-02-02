/**
 * Orders List Screen
 * 
 * Display all orders for vitrine owner with filtering
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useOrdersByVitrine } from '../../hooks/useCommandes';
import { useMyVitrines } from '../../hooks/useVitrines';
import { useAuth } from '../../hooks/useAuth';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { GuestPrompt } from '../../components/GuestPrompt';
import { LoadingComponent } from '../../components/LoadingComponent';
import { CustomButton } from '../../components/CustomButton';
import { Order } from '../../types';
import { ScreenHeader } from '../../components/ScreenHeader';

export const OrdersListScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { isAuthenticated, isGuest, isLoading } = useAuth();

    // Get specific vitrine from params if coming from a specific vitrine management
    const requestedVitrineId = route.params?.vitrineId;

    // Get user's vitrine
    const { data: myVitrines = [], isLoading: vitrinesLoading, refetch: refetchVitrines } = useMyVitrines({
        enabled: isAuthenticated
    });

    // Determine active vitrine
    const activeVitrine = requestedVitrineId
        ? (myVitrines.find(v => v.id === requestedVitrineId || v._id === requestedVitrineId) || myVitrines[0])
        : myVitrines[0];

    const vitrineId = activeVitrine?.vitrineId || activeVitrine?.id || activeVitrine?._id || '';

    console.log('[OrdersListScreen] Active Vitrine:', activeVitrine?.name, 'vitrineId:', vitrineId);

    // Get orders for this vitrine
    const {
        data: orders = [],
        isLoading: ordersLoading,
        refetch: refetchOrders
    } = useOrdersByVitrine(vitrineId, !!vitrineId);

    console.log('[OrdersListScreen] Orders fetched count:', orders?.length);

    const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
    const [selectedOrderForShare, setSelectedOrderForShare] = useState<Order | null>(null);

    // Filter and sort orders
    const filteredOrders = useMemo(() => {
        let result = orders;
        if (statusFilter !== 'all') {
            result = orders.filter(order => order.status === statusFilter);
        }

        // Sort by newest first
        return [...result].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
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
            <Text style={[styles.clientPhone, { color: theme.colors.textSecondary }]}>
                📞 {item.clientPhone}
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

    // Redirection si non authentifié
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log('[OrdersListScreen] Not authenticated, redirecting to Login');
            navigation.navigate('Login');
        }
    }, [isLoading, isAuthenticated, navigation]);

    // 2. Show loading while fetching vitrines or orders (initial load)
    if (vitrinesLoading || (ordersLoading && orders.length === 0)) {
        return <LoadingComponent message="Chargement de vos commandes..." />;
    }

    // 3. Show message if no vitrines found
    if (isAuthenticated && myVitrines.length === 0) {
        return (
            <ScreenWrapper>
                <View style={styles.centerContainer}>
                    <Text style={[styles.title, { color: theme.colors.text, marginBottom: 12 }]}>
                        Oups ! Aucune vitrine trouvée
                    </Text>
                    <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 24, paddingHorizontal: 40 }}>
                        Vous devez posséder une vitrine pour recevoir et gérer des commandes.
                    </Text>
                    <CustomButton
                        title="Créer ma Vitrine"
                        onPress={() => navigation.navigate('CreateVitrine')}
                        style={{ paddingHorizontal: 40 }}
                    />
                    <TouchableOpacity
                        onPress={() => refetchVitrines()}
                        style={{ marginTop: 20 }}
                    >
                        <Text style={{ color: theme.colors.primary }}>Actualiser</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Mes Commandes"
                showBack={false}
            />

            {activeVitrine && (
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                    Vitrine : {activeVitrine.name}
                </Text>
            )}

            {/* Filter Buttons */}
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
    header: {
        paddingTop: 20,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
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
