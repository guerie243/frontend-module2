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
import { Image } from 'expo-image';
import { MapWebView } from '../../components/MapWebView';
import { Ionicons } from '@expo/vector-icons';
import { getOrderUrl } from '../../utils/sharingUtils';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { useState } from 'react';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { useNavigation } from '@react-navigation/native';

export const OrderClientDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    const { orderId } = route.params || {};
    const { data: order, isLoading } = useOrderDetail(orderId);

    // Fetch vitrine details if order is available
    const { data: vitrine } = useVitrineDetail(order?.vitrineId || '', !!order?.vitrineId);

    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

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
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title={`Commande #${order.id?.slice(-6) || order._id?.slice(-6)}`}
                onShare={() => setIsShareModalVisible(true)}
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
            />
            <ScrollView style={styles.container}>
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
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
                                {(product.price * product.quantity).toFixed(2)} {product.currency || 'USD'}
                            </Text>
                        </View>
                    ))}
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                            {order.totalPrice.toFixed(2)} {order.products?.[0]?.currency || 'USD'}
                        </Text>
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Informations de livraison
                    </Text>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Adresse</Text>
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

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getOrderUrl(order.id || order._id)}
                title="Suivi de commande"
                message={`Suivez l'état de votre commande #${order.id?.slice(-6) || order._id?.slice(-6)} sur Andy Business.`}
            />
        </View >
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
        borderRadius: 16,
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
