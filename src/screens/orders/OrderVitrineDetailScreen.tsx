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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { MapWebView } from '../../components/MapWebView';
import { getOrderUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { useState } from 'react';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { ProductOrderItem } from '../../components/ProductOrderItem';
import { REJECTION_REASONS } from '../../constants/rejectionReasons';
import { getOrderStatus } from '../../constants/orderStatus';
import { Modal, FlatList } from 'react-native';

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

    const getWhatsAppMessage = (status: 'confirmed' | 'cancelled', reason?: string) => {
        const productsList = order?.products.map(p => `${p.quantity}x ${p.productName}`).join(', ');
        const orderUrl = getOrderUrl(orderId);

        if (status === 'confirmed') {
            return `Bonjour ${order?.clientName}, votre commande de ${productsList} a été acceptée. Nous préparons votre livraison. Suivez-la ici : ${orderUrl}`;
        } else {
            return `Bonjour ${order?.clientName}, nous sommes désolés mais votre commande n'a pas pu être acceptée en raison de : ${reason || 'non spécifié'}. Détails : ${orderUrl}`;
        }
    };

    const handleWhatsAppRedirect = (status: 'confirmed' | 'cancelled', reason?: string) => {
        if (!order?.clientPhone) return;
        const message = getWhatsAppMessage(status, reason);
        const phone = order.clientPhone.replace(/\s/g, '');
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            Linking.openURL(webUrl);
        });
    };

    const handleUpdateStatus = (newStatus: Order['status'], reason?: string) => {
        const confirmMsg = newStatus === 'confirmed'
            ? 'Voulez-vous vraiment accepter cette commande ?'
            : `Voulez-vous vraiment refuser cette commande pour " ${reason} " ?`;

        showConfirm(
            confirmMsg,
            async () => {
                try {
                    await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
                    showSuccess('Statut mis à jour');

                    // Redirect to WhatsApp after successful status update
                    if (newStatus === 'confirmed' || newStatus === 'cancelled') {
                        handleWhatsAppRedirect(newStatus as 'confirmed' | 'cancelled', reason);
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

        // URLs pour démarrer la navigation automatiquement en mode conduite
        const url = Platform.select({
            ios: `maps://?daddr=${latitude},${longitude}&dirflg=d&navigate=1`,
            android: `google.navigation:q=${latitude},${longitude}&mode=d`,
            web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`
        }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;

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
                        style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                        onPress={() => handleWhatsAppRedirect('confirmed')} // Default contact message
                    >
                        <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                        <Text style={styles.whatsappButtonText}>Contacter le client</Text>
                    </TouchableOpacity>
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
                        />
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
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 8 }]}>
                        La commande est :
                    </Text>
                    <Text style={[styles.currentStatus, { color: theme.colors.textSecondary }]}>
                        Statut actuel : <Text style={{ color: getOrderStatus(order.status).color, fontWeight: 'bold' }}>{getOrderStatus(order.status).label}</Text>
                    </Text>

                    {order.status === 'pending' && (
                        <View style={styles.sideBySideButtons}>
                            <TouchableOpacity
                                style={[styles.statusButton, { backgroundColor: theme.colors.primary, flex: 1 }]}
                                onPress={() => handleUpdateStatus('confirmed')}
                            >
                                <Text style={styles.statusButtonText}>Accepter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusButton, { backgroundColor: '#FF3B30', flex: 1 }]}
                                onPress={handleRejectClick}
                            >
                                <Text style={styles.statusButtonText}>Refuser</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

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
});
