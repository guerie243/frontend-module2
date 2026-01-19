/**
 * Order Client Detail Screen
 * 
 * For client to view their order status and details
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useOrderDetail } from '../../hooks/useCommandes';

export const OrderClientDetailScreen = () => {
    const route = useRoute<any>();
    const { theme } = useTheme();

    const { orderId } = route.params || {};
    const { data: order, isLoading } = useOrderDetail(orderId);

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Commande introuvable
                </Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: any = {
            pending: '#FF9500',
            confirmed: '#007AFF',
            preparing: '#5856D6',
            delivering: '#34C759',
            completed: '#8E8E93',
            cancelled: '#FF3B30',
        };
        return colors[status] || theme.colors.textSecondary;
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            pending: 'En attente de confirmation',
            confirmed: 'Confirmée',
            preparing: 'En préparation',
            delivering: 'En cours de livraison',
            completed: 'Livrée',
            cancelled: 'Annulée',
        };
        return labels[status] || status;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Commande #{order.id?.slice(-6) || order._id?.slice(-6)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                    </Text>
                </View>
            </View>

            {/* Products */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Vos produits
                </Text>
                {order.products.map((product, index) => (
                    <View key={index} style={styles.productRow}>
                        <Text style={[styles.productName, { color: theme.colors.text }]}>
                            {product.productName} x {product.quantity}
                        </Text>
                        <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>
                            {(product.price * product.quantity).toFixed(2)} DA
                        </Text>
                    </View>
                ))}
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                    <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                        {order.totalPrice.toFixed(2)} DA
                    </Text>
                </View>
            </View>

            {/* Delivery Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Informations de livraison
                </Text>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Adresse</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.deliveryAddress}</Text>

                {order.notes && (
                    <>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
                        <Text style={[styles.value, { color: theme.colors.text }]}>{order.notes}</Text>
                    </>
                )}
            </View>

            {/* Contact Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Vos coordonnées
                </Text>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nom</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.clientName}</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Téléphone</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.clientPhone}</Text>
            </View>
        </ScrollView>
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
    emptyText: {
        fontSize: 16,
    },
    section: {
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productName: {
        flex: 1,
        fontSize: 14,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
    },
});
