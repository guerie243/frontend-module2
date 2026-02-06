/**
 * Order Client Detail Screen
 * 
 * For client to view their order status and details
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useOrderDetail } from '../../hooks/useCommandes';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapWebView } from '../../components/MapWebView';
import { getOrderUrl } from '../../utils/sharingUtils';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { useState } from 'react';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ProductOrderItem } from '../../components/ProductOrderItem';
import { getOrderStatus } from '../../constants/orderStatus';

export const OrderClientDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    const { orderId } = route.params || {};
    const { data: order, isLoading, refetch } = useOrderDetail(orderId);
    const { user } = useAuth();

    // Fetch vitrine details if order is available
    const { data: vitrine } = useVitrineDetail(order?.vitrineId || '', !!order?.vitrineId);

    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [isClientFromStorage, setIsClientFromStorage] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const checkIsClient = async () => {
                try {
                    const savedOrdersJson = await AsyncStorage.getItem('GUEST_ORDERS');
                    if (savedOrdersJson) {
                        const ids = JSON.parse(savedOrdersJson);
                        if (Array.isArray(ids) && ids.includes(orderId)) {
                            setIsClientFromStorage(true);
                        }
                    }
                } catch (e) {
                    console.error('Error checking GUEST_ORDERS:', e);
                }
            };
            checkIsClient();
        }, [orderId])
    );

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

    const statusInfo = getOrderStatus(order.status);

    const isClient = isClientFromStorage || user?.phoneNumber === order.clientPhone || user?.phone === order.clientPhone;

    // Robust owner check (handle string or object ID)
    const vitrineOwnerId = typeof vitrine?.ownerId === 'object' ? (vitrine?.ownerId as any)?._id : vitrine?.ownerId;
    const isOwner = !!user && !!vitrineOwnerId && (user.id === vitrineOwnerId || user._id === vitrineOwnerId);

    // Third party only if data is loaded and user is neither client nor owner
    const isThirdParty = !!user && !!vitrine && !isClient && !isOwner;

    const handleWhatsAppRedirect = (target: 'seller' | 'client') => {
        const phone = target === 'seller' ? vitrine?.contact?.phone : order.clientPhone;
        if (!phone) return;

        const orderUrl = getOrderUrl(orderId);
        const productsList = order.products.map(p => `${p.quantity}x ${p.productName}`).join(', ');

        let message = '';
        if (isOwner) {
            // Owner is the seller
            message = `Bonjour ${order.clientName}, je suis le vendeur, je vous contacte à propos de votre commande de ${productsList}. Détails : ${orderUrl}`;
        } else if (isClient) {
            // User is the client
            message = `Bonjour ${vitrine?.name}, je vous contacte à propos de ma commande de ${productsList}. Détails : ${orderUrl}`;
        } else {
            // Third party
            const name = target === 'seller' ? vitrine?.name : order.clientName;
            message = `Bonjour ${name}, je vous contacte à propos de la commande de ${productsList}. Détails : ${orderUrl}`;
        }

        const sanitizedPhone = phone.replace(/\s/g, '');
        const url = `whatsapp://send?phone=${sanitizedPhone}&text=${encodeURIComponent(message)}`;

        Linking.openURL(url).catch(() => {
            const webUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
            Linking.openURL(webUrl);
        });
    };

    const handleOpenItinerary = () => {
        if (!order) return;
        const coords = order.gpsCoords || order.deliveryLocation;
        if (!coords || !coords.latitude || !coords.longitude) return;

        const { latitude, longitude } = coords;
        // URL pour afficher l'itinéraire (le tracé) sans démarrer la navigation guidée
        const url = Platform.select({
            ios: `http://maps.apple.com/?daddr=${latitude},${longitude}`,
            android: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
            web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        Linking.openURL(url);
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
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>
                        La commande est :
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>


                {/* Products */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Vos produits
                    </Text>
                    {order.products.map((product, index) => (
                        <ProductOrderItem
                            key={index}
                            name={product.productName}
                            image={product.productImage}
                            quantity={product.quantity}
                            price={product.price}
                            currency={product.currency}
                            slug={product.productSlug}
                            productId={product.productId}
                        />
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
                        <>
                            <View style={styles.mapContainer}>
                                <MapWebView
                                    height={250}
                                    lat={Number(order.gpsCoords?.latitude || order.deliveryLocation?.latitude)}
                                    lon={Number(order.gpsCoords?.longitude || order.deliveryLocation?.longitude)}
                                    zoom={15}
                                    label={order.clientName}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.itineraryButton, {
                                    backgroundColor: theme.colors.primary + '15',
                                    borderColor: theme.colors.primary,
                                    marginTop: 12
                                }]}
                                onPress={handleOpenItinerary}
                            >
                                <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
                                <Text style={[styles.itineraryButtonText, { color: theme.colors.primary }]}>
                                    Voir l'itinéraire
                                </Text>
                            </TouchableOpacity>
                        </>
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

                    <View style={[styles.contactButtonsContainer, { marginTop: 16 }]}>
                        {/* Client see Seller contact only, Seller see Client contact only, Third Party see both */}

                        {(isClient || isThirdParty) && vitrine?.contact?.phone && (
                            <TouchableOpacity
                                style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                                onPress={() => handleWhatsAppRedirect('seller')}
                            >
                                <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                                <Text style={styles.whatsappButtonText}>Contacter le vendeur</Text>
                            </TouchableOpacity>
                        )}

                        {(isOwner || isThirdParty) && order.clientPhone && (
                            <TouchableOpacity
                                style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                                onPress={() => handleWhatsAppRedirect('client')}
                            >
                                <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                                <Text style={styles.whatsappButtonText}>Contacter le client</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
    contactButtonsContainer: {
        gap: 12,
    },
    whatsappButton: {
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        gap: 10,
    },
    whatsappButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    itineraryButton: {
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        gap: 8,
    },
    itineraryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
