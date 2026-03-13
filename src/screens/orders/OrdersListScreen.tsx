/**
 * Orders List Screen
 * 
 * Display all orders for vitrine owner with filtering
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useOrdersByVitrine, useDeleteOrder } from '../../hooks/useCommandes';
import { useMyVitrines } from '../../hooks/useVitrines';
import { useAuth } from '../../hooks/useAuth';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { GuestPrompt } from '../../components/GuestPrompt';
import { LoadingComponent } from '../../components/LoadingComponent';
import { CustomButton } from '../../components/CustomButton';
import { Order } from '../../types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getOrderStatus } from '../../constants/orderStatus';
import { useAlert } from '../../components/AlertProvider';

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

    const statusFilters: { status: Order['status'] | 'all'; label: string }[] = [
        { status: 'pending', label: 'En attente' },
        { status: 'preparing', label: 'En préparation' },
        { status: 'completed', label: 'Livrée' },
        { status: 'cancelled', label: 'Annulée' },
        { status: 'all', label: 'Toutes' },
    ];

    const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('pending');
    const [dateFilter, setDateFilter] = useState<{
        key: 'today' | '7d' | '30d' | 'all' | 'custom';
        startDate?: Date;
        endDate?: Date;
    }>({ key: 'all' });
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);

    const datePresets: { key: 'today' | '7d' | '30d' | 'all'; label: string }[] = [
        { key: 'all', label: 'Tout' },
        { key: 'today', label: "Aujourd'hui" },
        { key: '7d', label: '7 jours' },
        { key: '30d', label: '30 jours' },
    ];

    // 1. Get orders filtered by DATE first (so counts are correct)
    const dateFilteredOrders = useMemo(() => {
        if (dateFilter.key === 'all') return orders;

        const now = new Date();
        let start: Date;
        let end = now;

        if (dateFilter.key === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateFilter.key === '7d') {
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateFilter.key === '30d') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (dateFilter.key === 'custom' && dateFilter.startDate) {
            start = dateFilter.startDate;
            if (dateFilter.endDate) {
                end = new Date(dateFilter.endDate);
                end.setHours(23, 59, 59, 999);
            }
        } else {
            return orders;
        }

        return orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }, [orders, dateFilter]);

    // 2. Filter by STATUS based on dateFilteredOrders
    const filteredOrders = useMemo(() => {
        let result = dateFilteredOrders;
        if (statusFilter !== 'all') {
            result = dateFilteredOrders.filter(order => order.status === statusFilter);
        }

        // Sort logic
        const isHistory = statusFilter === 'all' || statusFilter === 'completed' || statusFilter === 'cancelled';
        return [...result].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return isHistory ? dateB - dateA : dateA - dateB;
        });
    }, [dateFilteredOrders, statusFilter]);

    const [selectedOrderForShare, setSelectedOrderForShare] = useState<Order | null>(null);

    // --- SELECTION & DELETION STATE ---
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const countdownInterval = React.useRef<NodeJS.Timeout | null>(null);
    const deleteOrderMutation = useDeleteOrder();
    const { showAlert } = useAlert();

    const onRefresh = async () => {
        console.log('Refreshing orders list');
        await Promise.all([refetchVitrines(), refetchSellerOrders()]);
    };

    const handleOrderPress = (order: Order) => {
        const id = order.id || order._id;
        if (selectionMode) {
            toggleSelection(id);
        } else {
            navigation.navigate('OrderVitrineDetail', { orderId: id });
        }
    };

    const handleOrderLongPress = (order: Order) => {
        if (selectionMode) return;

        const id = order.id || order._id;
        setSelectionMode(true);
        setSelectedOrderIds([id]);
    };

    const toggleSelection = (id: string) => {
        setSelectedOrderIds(prev => {
            const next = prev.includes(id)
                ? prev.filter(orderId => orderId !== id)
                : [...prev, id];

            if (next.length === 0) {
                setSelectionMode(false);
            }
            return next;
        });
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedOrderIds([]);
    };

    const initiateDelete = () => {
        console.log('[OrdersListScreen] initiateDelete called with', selectedOrderIds.length, 'orders');
        if (selectedOrderIds.length > 0) {
            showAlert(
                "Confirmation",
                `Voulez-vous vraiment supprimer ${selectedOrderIds.length} commande(s) ?`,
                'confirm',
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => {
                            console.log('[OrdersListScreen] Deletion confirmed, starting countdown');
                            startDeletionCountdown();
                        }
                    }
                ]
            );
        }
    };

    const startDeletionCountdown = () => {
        setIsDeleting(true);
        setCountdown(5);

        countdownInterval.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval.current!);
                    performDeletion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelDeletion = () => {
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
        }
        setIsDeleting(false);
        setCountdown(0);
    };

    const performDeletion = async () => {
        try {
            await Promise.all(selectedOrderIds.map(id => deleteOrderMutation.mutateAsync(id)));
            setSelectionMode(false);
            setSelectedOrderIds([]);
            setIsDeleting(false);
            refetchSellerOrders();
        } catch (error) {
            console.error('Error during batch deletion:', error);
            setIsDeleting(false);
        }
    };

    const pendingCount = useMemo(() => dateFilteredOrders.filter(o => o.status === 'pending').length, [dateFilteredOrders]);
    const preparingCount = useMemo(() => dateFilteredOrders.filter(o => o.status === 'preparing').length, [dateFilteredOrders]);

    const renderFilterButton = (status: Order['status'] | 'all', label: string) => {
        let count = 0;
        if (status === 'pending') count = pendingCount;
        if (status === 'preparing') count = preparingCount;

        return (
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    { backgroundColor: theme.colors.surface },
                    statusFilter === status && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setStatusFilter(status)}
                disabled={selectionMode}
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
                    {count > 0 && (
                        <View style={[
                            styles.filterBadge,
                            { backgroundColor: statusFilter === status ? theme.colors.white : (status === 'pending' ? '#FF3B30' : theme.colors.primary) }
                        ]}>
                            <Text style={[
                                styles.filterBadgeText,
                                { color: statusFilter === status ? theme.colors.primary : theme.colors.white }
                            ]}>
                                {count}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const id = item.id || item._id;
        const isSelected = selectedOrderIds.includes(id);

        return (
            <TouchableOpacity
                style={[
                    styles.orderCard,
                    { backgroundColor: theme.colors.surface },
                    isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleOrderPress(item)}
                onLongPress={() => handleOrderLongPress(item)}
                delayLongPress={1500}
            >
                <View style={styles.orderHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {selectionMode && (
                            <View style={[
                                styles.selectionCircle,
                                { borderColor: theme.colors.border },
                                isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                            ]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                        )}
                        <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                            Commande #{item.id?.slice(-6) || item._id?.slice(-6)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getOrderStatus(item.status).color + '20' }]}>
                        <Text style={[styles.statusText, { color: getOrderStatus(item.status).color }]}>
                            {getOrderStatus(item.status).label}
                        </Text>
                    </View>
                    {!selectionMode && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForShare(item);
                            }}
                            style={styles.cardShareButton}
                        >
                            <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
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
    };


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
                title={selectionMode ? `${selectedOrderIds.length} sélectionnée(s)` : "Commandes Reçues"}
                showBack={selectionMode}
                onBackPress={selectionMode ? handleCancelSelection : undefined}
                hideGlobalButtons={selectionMode}
                rightElement={selectionMode ? (
                    <TouchableOpacity
                        style={styles.deleteButtonHeader}
                        onPress={() => {
                            console.log('[OrdersListScreen] Delete button pressed');
                            initiateDelete();
                        }}
                        disabled={isDeleting}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Supprimer</Text>
                        <View style={[styles.selectionCountBadge, { backgroundColor: theme.colors.error }]}>
                            <Text style={styles.selectionCountText}>{selectedOrderIds.length}</Text>
                        </View>
                    </TouchableOpacity>
                ) : null}
            />

            {isDeleting && (
                <View style={[styles.countdownOverlay, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.countdownText, { color: theme.colors.text }]}>
                        Suppression dans {countdown}s...
                    </Text>
                    <TouchableOpacity style={styles.undoButton} onPress={cancelDeletion}>
                        <Text style={[styles.undoButtonText, { color: theme.colors.primary }]}>ANNULER</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Filter Buttons */}
            {!selectionMode && (
                <View style={styles.filterBar}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filtersContainer}
                        contentContainerStyle={styles.filtersContent}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterIconButton,
                                { backgroundColor: theme.colors.surface },
                                dateFilter.key !== 'all' && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary, borderWidth: 1 }
                            ]}
                            onPress={() => setIsDateModalVisible(true)}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={dateFilter.key !== 'all' ? theme.colors.primary : theme.colors.text}
                            />
                        </TouchableOpacity>

                        {statusFilters.map(filter => renderFilterButton(filter.status, filter.label))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id || item._id || ''}
                contentContainerStyle={[styles.listContainer, selectionMode && { paddingTop: 16 }]}
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

            <DateFilterModal
                isVisible={isDateModalVisible}
                onClose={() => setIsDateModalVisible(false)}
                activeFilter={dateFilter}
                onSelect={setDateFilter}
                theme={theme}
            />
        </View>
    );
};

interface DateFilterModalProps {
    isVisible: boolean;
    onClose: () => void;
    activeFilter: any;
    onSelect: (filter: any) => void;
    theme: any;
}

const DateFilterModal = ({ isVisible, onClose, activeFilter, onSelect, theme }: DateFilterModalProps) => {
    const [isCustom, setIsCustom] = useState(activeFilter.key === 'custom');
    const [tempStart, setTempStart] = useState(activeFilter.startDate ? activeFilter.startDate.toISOString().split('T')[0] : '');
    const [tempEnd, setTempEnd] = useState(activeFilter.endDate ? activeFilter.endDate.toISOString().split('T')[0] : '');

    const presets: { key: string; label: string }[] = [
        { key: 'all', label: 'Toutes les dates (Tout)' },
        { key: 'today', label: "Aujourd'hui" },
        { key: '7d', label: '7 derniers jours' },
        { key: '30d', label: '30 derniers jours' },
    ];

    const handleApplyCustom = () => {
        const start = tempStart ? new Date(tempStart) : undefined;
        const end = tempEnd ? new Date(tempEnd) : undefined;
        onSelect({ key: 'custom', startDate: start, endDate: end });
        onClose();
    };

    if (!isVisible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            />
            <View style={[styles.modalBottom, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filtrer par date</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {!isCustom ? (
                    <>
                        {presets.map((p) => (
                            <TouchableOpacity
                                key={p.key}
                                style={[
                                    styles.presetItem,
                                    activeFilter.key === p.key && { backgroundColor: theme.colors.primary + '10' }
                                ]}
                                onPress={() => {
                                    onSelect({ key: p.key });
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.presetLabel,
                                    { color: theme.colors.text },
                                    activeFilter.key === p.key && { color: theme.colors.primary, fontWeight: 'bold' }
                                ]}>
                                    {p.label}
                                </Text>
                                {activeFilter.key === p.key && (
                                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.customToggle}
                            onPress={() => setIsCustom(true)}
                        >
                            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                            <Text style={[styles.customToggleText, { color: theme.colors.primary }]}>Date personnalisée...</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.customContainer}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setIsCustom(false)}
                        >
                            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                            <Text style={[styles.backText, { color: theme.colors.primary }]}>Retour aux raccourcis</Text>
                        </TouchableOpacity>

                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Du (AAAA-MM-JJ)</Text>
                        <TextInput
                            style={[styles.dateInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                            value={tempStart}
                            onChangeText={setTempStart}
                            placeholder="Ex: 2024-03-01"
                            placeholderTextColor={theme.colors.textTertiary}
                        />

                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>Au (AAAA-MM-JJ)</Text>
                        <TextInput
                            style={[styles.dateInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                            value={tempEnd}
                            onChangeText={setTempEnd}
                            placeholder="Ex: 2024-03-31"
                            placeholderTextColor={theme.colors.textTertiary}
                        />

                        <TouchableOpacity
                            style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleApplyCustom}
                        >
                            <Text style={styles.applyButtonText}>Appliquer le filtre</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
        paddingVertical: 12,
    },
    filtersContainer: {
        maxHeight: 50,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
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
    selectionCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 6,
    },
    selectionCountBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    selectionCountText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    countdownOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    countdownText: {
        fontSize: 16,
        fontWeight: '600',
    },
    undoButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    undoButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    filterBar: {
        paddingVertical: 12,
    },
    filterIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
    },
    modalBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    presetItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    presetLabel: {
        fontSize: 16,
    },
    customToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 8,
        marginTop: 8,
    },
    customToggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
    customContainer: {
        marginTop: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    dateInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    applyButton: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
