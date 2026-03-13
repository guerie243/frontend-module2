/**
 * My Purchases Screen (Acheteur)
 * 
 * Display all orders passed by the user (stored locally in AsyncStorage)
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView, TextInput, Platform } from 'react-native';
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
import { getOrderStatus } from '../../constants/orderStatus';

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
    const [dateFilter, setDateFilter] = useState<{
        key: 'today' | '7d' | '30d' | 'all' | 'custom';
        startDate?: Date;
        endDate?: Date;
    }>({ key: 'all' });
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [selectedOrderForShare, setSelectedOrderForShare] = useState<Order | null>(null);

    const datePresets: { key: 'today' | '7d' | '30d' | 'all'; label: string }[] = [
        { key: 'all', label: 'Tout' },
        { key: 'today', label: "Aujourd'hui" },
        { key: '7d', label: '7 jours' },
        { key: '30d', label: '30 jours' },
    ];

    // 1. Get orders filtered by DATE first
    const dateFilteredOrders = useMemo(() => {
        if (dateFilter.key === 'all') return guestOrders;

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
            return guestOrders;
        }

        return guestOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }, [guestOrders, dateFilter]);

    // 2. Filter by STATUS
    const filteredOrders = useMemo(() => {
        let result = dateFilteredOrders || [];
        if (statusFilter !== 'all') {
            result = dateFilteredOrders.filter(order => order.status === statusFilter);
        }

        // Sort by newest first
        return [...result].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [dateFilteredOrders, statusFilter]);

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


    const pendingCount = useMemo(() => dateFilteredOrders.filter(o => o.status === 'pending').length, [dateFilteredOrders]);

    const statusFilters: { status: Order['status'] | 'all'; label: string }[] = [
        { status: 'all', label: 'Toutes' },
        { status: 'pending', label: 'En attente' },
        { status: 'confirmed', label: 'Confirmée' },
        { status: 'cancelled', label: 'Annulée' },
    ];

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

    if (guestOrdersLoading && guestOrders.length === 0) {
        return <LoadingComponent message="Chargement de vos achats..." />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Mes Achats"
                showBack={true}
            />

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
