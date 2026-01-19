/**
 * Order Vitrine Detail Screen
 * 
 * For vitrine owner to view and manage order details
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useOrderDetail, useUpdateOrderStatus } from '../../hooks/useCommandes';
import { Order } from '../../types';

export const OrderVitrineDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { orderId } = route.params || {};
    const { data: order, isLoading, refetch } = useOrderDetail(orderId);
    const updateStatusMutation = useUpdateOrderStatus();

    const handleUpdateStatus = (newStatus: Order['status']) => {
        showConfirm(
            `Voulez-vous vraiment passer cette commande en "${newStatus}" ?`,
            async () => {
                try {
                    await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
                    showSuccess('Statut mis à jour');
                    refetch();
                } catch (error: any) {
                    showError(error.message || 'Échec de la mise à jour');
                }
            }
        );
    };

    const handleCallClient = () => {
        if (order) {
            navigation.navigate('OrderCall', {
                clientName: order.clientName,
                clientPhone: order.clientPhone,
                orderId: order.id || order._id,
            });
        }
    };

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

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Commande #{order.id?.slice(-6) || order._id?.slice(-6)}
                </Text>
                <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : ''}
                </Text>
            </View>

            {/* Client Information */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Informations client
                </Text>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nom</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.clientName}</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Téléphone</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.clientPhone}</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Adresse de livraison</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.deliveryAddress}</Text>

                <TouchableOpacity
                    style={[styles.callButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleCallClient}
                >
                    <Text style={styles.callButtonText}>📞 Appeler le client</Text>
                </TouchableOpacity>
            </View>

            {/* Products */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Produits commandés
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

            {/* Status Management */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Gestion du statut
                </Text>
                <Text style={[styles.currentStatus, { color: theme.colors.textSecondary }]}>
                    Statut actuel: <Text style={{ color: theme.colors.primary }}>{order.status}</Text>
                </Text>

                <View style={styles.statusButtons}>
                    {order.status === 'pending' && (
                        <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#007AFF' }]}
                            onPress={() => handleUpdateStatus('confirmed')}
                        >
                            <Text style={styles.statusButtonText}>Confirmer</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'confirmed' && (
                        <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#5856D6' }]}
                            onPress={() => handleUpdateStatus('preparing')}
                        >
                            <Text style={styles.statusButtonText}>En préparation</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'preparing' && (
                        <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#34C759' }]}
                            onPress={() => handleUpdateStatus('delivering')}
                        >
                            <Text style={styles.statusButtonText}>En livraison</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'delivering' && (
                        <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#8E8E93' }]}
                            onPress={() => handleUpdateStatus('completed')}
                        >
                            <Text style={styles.statusButtonText}>Marquer livrée</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#FF3B30' }]}
                        onPress={() => handleUpdateStatus('cancelled')}
                    >
                        <Text style={styles.statusButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
    },
    callButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    callButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
    currentStatus: {
        fontSize: 14,
        marginBottom: 16,
    },
    statusButtons: {
        gap: 8,
    },
    statusButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
