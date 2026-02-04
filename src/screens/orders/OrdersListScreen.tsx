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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGuestOrders } from '../../hooks/useCommandes';
import { useFocusEffect } from '@react-navigation/native';

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

    const isSellerMode = isAuthenticated && activeVitrine;

    // --- MODE VENDEUR : Commandes reçues ---
    const {
        data: sellerOrders = [],
        isLoading: sellerOrdersLoading,
        refetch: refetchSellerOrders
    } = useOrdersByVitrine(vitrineId, !!vitrineId && !!isSellerMode);

    // --- MODE ACHETEUR : Commandes passées (Local Storage) ---
    const [guestOrderIds, setGuestOrderIds] = useState<string[]>([]);

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
            if (!isSellerMode) {
                loadGuestOrders();
            }
        }, [isSellerMode])
    );

    const {
        data: guestOrders = [],
        isLoading: guestOrdersLoading,
        refetch: refetchGuestOrders
    } = useGuestOrders(guestOrderIds, !isSellerMode && guestOrderIds.length > 0);


    // Fusion / Sélection des commandes à afficher
    const orders = (isSellerMode ? sellerOrders : guestOrders) || [];
    const ordersLoading = isSellerMode ? sellerOrdersLoading : guestOrdersLoading;

    console.log('[OrdersListScreen] Mode:', isSellerMode ? 'SELLER' : 'BUYER', 'Count:', orders?.length);

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
        if (isSellerMode) {
            await Promise.all([refetchVitrines(), refetchSellerOrders()]);
        } else {
            await loadGuestOrders();
            await refetchGuestOrders();
        }
    };

    const handleOrderPress = (order: Order) => {
        const orderId = order.id || order._id;
        console.log('Opening order detail:', orderId);
        if (isSellerMode) {
            navigation.navigate('OrderVitrineDetail', { orderId });
        } else {
            navigation.navigate('OrderClientDetail', { orderId });
        }
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

    // Suppression de la redirection automatique si non authentifié
    // Car maintenant accessible aux invités pour voir l'historique
    /*
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log('[OrdersListScreen] Not authenticated, redirecting to Login');
            navigation.navigate('Login');
        }
    }, [isLoading, isAuthenticated, navigation]);
    */

    // 2. Show loading while fetching vitrines or orders (initial load)
    if (vitrinesLoading || (ordersLoading && orders.length === 0)) {
        return <LoadingComponent message="Chargement de vos commandes..." />;
    }

    // 3. Show message if no vitrines found AND authenticated (Maybe user wants to be a seller but has no vitrine)
    // But wait, if authenticated and no vitrine, we should probably show Guest Orders (My Purchases) instead of blocking?
    // User said: "Si c'est une personne connecté et propriétaire... ça doit le ramener vers la liste de ces commandes"
    // "Si c'est une personne non connectée... on va regarder dans ses données"
    // What if connected but NOT owner? He is a buyer then.
    // So the condition `isAuthenticated && myVitrines.length === 0` should probably fall back to Buyer Mode (Guest Orders) logic.
    // Let's remove the blocking return and handle it in the render.

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title={isSellerMode ? "Commandes Reçues" : "Mes Achats"}
                showBack={true} // Allow back navigation
            />

            {isSellerMode && activeVitrine && (
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
                            {isSellerMode
                                ? "Aucune commande reçue pour le moment."
                                : "Vous n'avez pas encore passé de commande."}
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
