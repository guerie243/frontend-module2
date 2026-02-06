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
import { ScreenHeader } from '../../components/ScreenHeader';
import { getOrderStatus } from '../../constants/orderStatus';

export const OrdersListScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

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

    // --- MODE VENDEUR : Commandes reçues ---
    const {
        data: sellerOrders = [],
        isLoading: sellerOrdersLoading,
        refetch: refetchSellerOrders
    } = useOrdersByVitrine(vitrineId, !!vitrineId);

    const orders = sellerOrders || [];
    const ordersLoading = sellerOrdersLoading;

    console.log('[OrdersListScreen] Seller Mode, Count:', orders?.length);

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
        await Promise.all([refetchVitrines(), refetchSellerOrders()]);
    };

    const handleOrderPress = (order: Order) => {
        navigation.navigate('OrderVitrineDetail', { orderId: order.id || order._id });
    };


    const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

    const renderFilterButton = (status: Order['status'] | 'all', label: string) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                { backgroundColor: theme.colors.surface },
                statusFilter === status && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setStatusFilter(status)}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                    style={[
                        styles.filterButtonText,
                        { color: theme.colors.text },
                        statusFilter === status && { color: theme.colors.white },
                    ]}
                >
                    {label}
                </Text>
                {status === 'pending' && pendingCount > 0 && (
                    <View style={[
                        styles.filterBadge,
                        { backgroundColor: statusFilter === 'pending' ? theme.colors.white : '#FF3B30' }
                    ]}>
                        <Text style={[
                            styles.filterBadgeText,
                            { color: statusFilter === 'pending' ? theme.colors.primary : theme.colors.white }
                        ]}>
                            {pendingCount}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleOrderPress(item)}
        >
            <View style={styles.orderHeader}>
                <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                    Commande #{item.id?.slice(-6) || item._id?.slice(-6)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getOrderStatus(item.status).color + '20' }]}>
                    <Text style={[styles.statusText, { color: getOrderStatus(item.status).color }]}>
                        {getOrderStatus(item.status).label}
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


    if (!isAuthenticated && !authLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScreenHeader title="Commandes Reçues" showBack={false} />
                <View style={styles.centerContainer}>
                    <Ionicons name="lock-closed" size={64} color={theme.colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center', paddingHorizontal: 32 }]}>
                        Veuillez vous connecter pour gérer les commandes de votre vitrine.
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (vitrinesLoading || (ordersLoading && orders.length === 0)) {
        return <LoadingComponent message="Chargement des commandes reçues..." />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Commandes Reçues"
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
                            Aucune commande reçue pour le moment.
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
    loginButton: {
        height: 44,
        paddingHorizontal: 24,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadge: {
        marginLeft: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
