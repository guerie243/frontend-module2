/**
 * Order Card Component
 * 
 * Display order summary with status badge
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Order } from '../types';
import { getOrderStatus } from '../constants/orderStatus';
import { getOrderUrl } from '../utils/sharingUtils';
import { ShareMenuModal } from './ShareMenuModal';
import { useState } from 'react';

interface OrderCardProps {
    order: Order;
    onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
    const { theme } = useTheme();
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const statusInfo = getOrderStatus(order.status);

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Header with Status Badge */}
            <View style={styles.header}>
                <View style={styles.orderInfo}>
                    <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                        Commande #{order.orderId?.slice(-8) || 'N/A'}
                    </Text>
                    <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : ''}
                    </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        setIsShareModalVisible(true);
                    }}
                    style={styles.shareButton}
                >
                    <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Client Info */}
            <View style={styles.clientInfo}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.clientName, { color: theme.colors.text }]}>
                    {order.clientName}
                </Text>
            </View>

            <View style={styles.clientInfo}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.address, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {order.deliveryAddress}
                </Text>
            </View>

            {/* Products Count and Total */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.productsCount, { color: theme.colors.textSecondary }]}>
                    {order.products.length} produit{order.products.length > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.total, { color: theme.colors.primary }]}>
                    {order.totalPrice.toFixed(2)} {order.products[0]?.currency || 'USD'}
                </Text>
            </View>

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getOrderUrl(order.id || order._id || order.orderId)}
                title="Suivi de commande"
                message={`Lien de suivi pour la commande #${(order.id || order._id || order.orderId)?.slice(-6)} sur Andy Business.`}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
    },
    shareButton: {
        padding: 4,
        marginLeft: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    clientName: {
        fontSize: 14,
        fontWeight: '500',
    },
    address: {
        fontSize: 13,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    productsCount: {
        fontSize: 13,
    },
    total: {
        fontSize: 18,
        fontWeight: '700',
    },
});
