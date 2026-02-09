import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Modal, FlatList } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useOrderDetail, useUpdateOrderStatus } from '../../hooks/useCommandes';
import { Order } from '../../types';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { MapWebView } from '../../components/MapWebView';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { useState, useEffect } from 'react';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { openGpsItinerary } from '../../utils/mapUtils';
import { ProductOrderItem } from '../../components/ProductOrderItem';
import { REJECTION_REASONS } from '../../constants/rejectionReasons';
import { getOrderStatus } from '../../constants/orderStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { activityTracker } from '../../services/activityTracker';

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
    const [isRejectionModalVisible, setIsRejectionModalVisible] = useState(false);
    const [isClientFromStorage, setIsClientFromStorage] = useState(false);
    const { user } = useAuth();

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

    const isClient = isClientFromStorage || user?.phoneNumber === order?.clientPhone || user?.phone === order?.clientPhone;

    // Robust owner check (handle string or object ID)
    const vitrineOwnerId = typeof vitrine?.ownerId === 'object' ? (vitrine?.ownerId as any)?._id : vitrine?.ownerId;
    const currentUserId = user?.id || user?._id || user?.userId;
    const isOwner = !!user && !!vitrineOwnerId && (
        currentUserId === vitrineOwnerId ||
        String(currentUserId) === String(vitrineOwnerId)
    );

    // Third party only if data is loaded and user is neither client nor owner
    const isThirdParty = !!user && !!vitrine && !isClient && !isOwner;

    const getWhatsAppMessage = (status: Order['status'], reason?: string) => {
        const productsList = order?.products.map(p => `${p.quantity}x ${p.productName}`).join(', ');
        const orderUrl = getOrderUrl(orderId);

        if (status === 'preparing') {
            return `Bonjour ${order?.clientName}, votre commande de ${productsList} a été acceptée et est maintenant en préparation. Suivez-la ici : ${orderUrl}`;
        } else if (status === 'completed') {
            return `Bonjour ${order?.clientName}, votre commande de ${productsList} a été livrée. Merci de votre confiance ! Détails : ${orderUrl}`;
        } else if (status === 'cancelled') {
            return `Bonjour ${order?.clientName}, nous sommes désolés mais votre commande n'a pas pu être acceptée en raison de : ${reason || 'non spécifié'}. Détails : ${orderUrl}`;
        }
        return `Bonjour ${order?.clientName}, le statut de votre commande de ${productsList} a été mis à jour : ${getOrderStatus(status).label}. Suivez-la ici : ${orderUrl}`;
    };

    const handleWhatsAppRedirect = (target: 'seller' | 'client') => {
        const phone = target === 'seller' ? vitrine?.contact?.phone : order?.clientPhone;
        if (!phone) return;

        const productsList = order?.products.map(p => `${p.quantity}x ${p.productName}`).join(', ');
        const orderUrl = getOrderUrl(orderId);

        let message = '';
        if (isOwner) {
            // Owner is the seller
            message = `Bonjour ${order?.clientName}, je suis le vendeur, je vous contacte à propos de votre commande de ${productsList}. Détails : ${orderUrl}`;
        } else if (isClient) {
            // User is the client
            message = `Bonjour ${vitrine?.name}, je vous contacte à propos de ma commande de ${productsList}. Détails : ${orderUrl}`;
        } else {
            // Third party
            const name = target === 'seller' ? vitrine?.name : order?.clientName;
            message = `Bonjour ${name}, je vous contacte à propos de la commande de ${productsList}. Détails : ${orderUrl}`;
        }

        // TRACKING
        activityTracker.track(target === 'seller' ? 'CONTACT_SELLER' : 'CONTACT_CLIENT', {
            orderId,
            vitrineId: order?.vitrineId,
            method: 'whatsapp'
        });

        const sanitizedPhone = phone.replace(/\s/g, '');
        const url = `whatsapp://send?phone=${sanitizedPhone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            const webUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
            Linking.openURL(webUrl);
        });
    };

    const handleUpdateStatus = (newStatus: Order['status'], reason?: string) => {
        let confirmMsg = '';
        if (newStatus === 'preparing') {
            confirmMsg = 'Voulez-vous vraiment accepter cette commande et la passer en préparation ?';
        } else if (newStatus === 'completed') {
            confirmMsg = 'Voulez-vous vraiment marquer cette commande comme livrée ?';
        } else if (newStatus === 'cancelled') {
            confirmMsg = `Voulez-vous vraiment refuser cette commande pour " ${reason} " ?`;
        } else {
            confirmMsg = `Voulez-vous vraiment passer cette commande au statut "${getOrderStatus(newStatus).label}" ?`;
        }

        showConfirm(
            confirmMsg,
            async () => {
                try {
                    await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });

                    // TRACKING
                    activityTracker.track('ORDER_UPDATE_STATUS', {
                        orderId,
                        newStatus,
                        vitrineId: order?.vitrineId
                    });

                    showSuccess('Statut mis à jour');

                    // Redirect to WhatsApp after successful status update
                    if (newStatus === 'preparing' || newStatus === 'completed' || newStatus === 'cancelled') {
                        const message = getWhatsAppMessage(newStatus, reason);

                        if (order?.clientPhone) {
                            const phone = order.clientPhone.replace(/\s/g, '');
                            const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                            Linking.openURL(url).catch(() => {
                                const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                                Linking.openURL(webUrl);
                            });
                        }
                    }

                    refetch();
                } catch (error: any) {
                    showError(error.message || 'Échec de la mise à jour');
                }
            }
        );
    };

    const handleRejectClick = () => {
        setIsRejectionModalVisible(true);
    };

    const onSelectRejectionReason = (reason: string) => {
        setIsRejectionModalVisible(false);
        handleUpdateStatus('cancelled', reason);
    };

    const handleOpenItinerary = () => {
        if (!order) return;
        const coords = order.gpsCoords || order.deliveryLocation;
        if (!coords || !coords.latitude || !coords.longitude) {
            showError('Coordonnées GPS manquantes pour cette commande');
            return;
        }

        const { latitude, longitude } = coords;
        openGpsItinerary(latitude, longitude, order.clientName);
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
                onShare={() => {
                    activityTracker.track('SHARE_ORDER', { orderId: order.id || order._id });
                    setIsShareModalVisible(true);
                }}
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
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
                                    backgroundColor: theme.colors.primary, // Solid color
                                    marginTop: 12
                                }]}
                                onPress={handleOpenItinerary}
                            >
                                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                                <Text style={[styles.itineraryButtonText, { color: '#FFFFFF' }]}>
                                    Itinéraire
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}


                    <View style={[styles.contactButtonsContainer, { marginTop: 16 }]}>
                        {/* Contact Client (Primordial pour le vendeur/gestionnaire) */}
                        {order?.clientPhone && (
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

                {/* Products */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Produits commandés
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
                            deliveryFee={product.deliveryFee}
                        />
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 0 }]}>Frais de livraison</Text>
                        <Text style={[styles.value, { color: theme.colors.text }]}>
                            {order.deliveryFee && order.deliveryFee > 0
                                ? `${order.deliveryFee.toFixed(2)} ${order.products[0]?.currency || 'USD'}`
                                : 'Gratuit'}
                        </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                            {order.totalPrice.toFixed(2)} {order.products[0]?.currency || 'USD'}
                        </Text>
                    </View>
                </View>

                {/* Status Management */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface, marginBottom: isOwner && (order.status === 'pending' || order.status === 'preparing') ? 100 : 16 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>
                        Statut de la commande
                    </Text>

                    <View style={[styles.statusBadge, { backgroundColor: getOrderStatus(order.status).color + '20' }]}>
                        <Text style={[styles.statusText, { color: getOrderStatus(order.status).color }]}>
                            {getOrderStatus(order.status).label}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Footer for Management Buttons */}
            {isOwner && (order.status === 'pending' || order.status === 'preparing') && (
                <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                    <View style={styles.sideBySideButtons}>
                        {order.status === 'pending' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.statusButton, { backgroundColor: theme.colors.primary, flex: 1 }]}
                                    onPress={() => handleUpdateStatus('preparing')}
                                >
                                    <Text style={styles.statusButtonText}>Accepter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusButton, { backgroundColor: '#FF3B30', flex: 1 }]}
                                    onPress={handleRejectClick}
                                >
                                    <Text style={styles.statusButtonText}>Refuser</Text>
                                </TouchableOpacity>
                            </>
                        ) : order.status === 'preparing' ? (
                            <TouchableOpacity
                                style={[styles.statusButton, { backgroundColor: theme.colors.primary, flex: 1 }]}
                                onPress={() => handleUpdateStatus('completed')}
                            >
                                <Ionicons name="checkmark-done-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.statusButtonText}>Marquer comme livrée</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            )}

            {/* Rejection Reasons Modal */}
            <Modal
                visible={isRejectionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsRejectionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Motif du refus</Text>
                        <FlatList
                            data={REJECTION_REASONS}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.reasonItem, { borderBottomColor: theme.colors.border }]}
                                    onPress={() => onSelectRejectionReason(item.label)}
                                >
                                    <Text style={[styles.reasonText, { color: theme.colors.text }]}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={[styles.cancelButton, { marginTop: 16 }]}
                            onPress={() => setIsRejectionModalVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: '#FF3B30' }]}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getOrderUrl(order.id || order._id)}
                title="Suivi de commande"
                message={`Lien de suivi pour la commande #${order.id?.slice(-6) || order._id?.slice(-6)} sur Andy Business.`}
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
    whatsappButton: {
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
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
    callButton: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    callButtonText: {
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
        marginTop: 16,
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
    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusButtons: {
        gap: 8,
    },
    sideBySideButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    reasonItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    reasonText: {
        fontSize: 16,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    contactButtonsContainer: {
        gap: 12,
    },
});
