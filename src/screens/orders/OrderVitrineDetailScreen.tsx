/**
 * Order Vitrine Detail Screen
 * 
 * For vitrine owner to view and manage order details
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useOrderDetail, useUpdateOrderStatus } from '../../hooks/useCommandes';
import { Order } from '../../types';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MapWebView } from '../../components/MapWebView';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { useState } from 'react';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';

export const OrderVitrineDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { orderId } = route.params || {};
    const { data: order, isLoading, refetch } = useOrderDetail(orderId);

    // Fetch vitrine details
    const { data: vitrine } = useVitrineDetail(order?.vitrineId || '', !!order?.vitrineId);

    const updateStatusMutation = useUpdateOrderStatus();
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

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

    const handleOpenItinerary = () => {
        if (!order) return;
        const coords = order.gpsCoords || order.deliveryLocation;
        if (!coords || !coords.latitude || !coords.longitude) {
            showError('Coordonnées GPS manquantes pour cette commande');
            return;
        }

        const { latitude, longitude } = coords;

        const url = Platform.select({
            ios: `http://maps.apple.com/?daddr=${latitude},${longitude}`,
            android: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
            web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        Linking.openURL(url);
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
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title={`Commande #${order.id?.slice(-6) || order._id?.slice(-6)}`}
                onShare={() => setIsShareModalVisible(true)}
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('ProductsCatalog', { slug: vitrine.slug })}
            />
            <ScrollView style={styles.container}>
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
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
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                        {order.city}, {order.commune}{'\n'}
                        {order.deliveryAddress}
                    </Text>

                    {(order.gpsCoords || order.deliveryLocation) && (
                        <View style={styles.mapContainer}>
                            <MapWebView
                                height={250}
                                lat={Number(order.gpsCoords?.latitude || order.deliveryLocation?.latitude)}
                                lon={Number(order.gpsCoords?.longitude || order.deliveryLocation?.longitude)}
                                zoom={15}
                                label={order.clientName}
                            />
                        </View>
                    )}

                    {(order.gpsCoords || order.deliveryLocation) && (
                        <TouchableOpacity
                            style={[styles.itineraryButton, {
                                backgroundColor: theme.colors.primary + '15',
                                borderColor: theme.colors.primary
                            }]}
                            onPress={handleOpenItinerary}
                        >
                            <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
                            <Text style={[styles.itineraryButtonText, { color: theme.colors.primary }]}>
                                Voir l'itinéraire
                            </Text>
                        </TouchableOpacity>
                    )}

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
                                {(product.price * product.quantity).toFixed(2)} {product.currency || 'USD'}
                            </Text>
                        </View>
                    ))}
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                            {order.totalPrice.toFixed(2)} {order.products[0]?.currency || 'USD'}
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

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getOrderUrl(order.id || order._id)}
                title="Suivi de commande"
                message={`Lien de suivi pour la commande #${order.id?.slice(-6) || order._id?.slice(-6)} sur Andy Business.`}
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
    itineraryButton: {
        height: 50,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        gap: 8,
    },
    itineraryButtonText: {
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
    mapContainer: {
        height: 180,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 12,
        backgroundColor: '#f0f0f0',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
});
