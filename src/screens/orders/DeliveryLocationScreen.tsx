import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { useCreateOrder } from '../../hooks/useCommandes';
import { useAuth } from '../../hooks/useAuth';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { DRC_CITIES } from '../../constants/locations';
import { AnimatedSelect } from '../../components/AnimatedSelect';
import { Ionicons } from '@expo/vector-icons';
import { MapWebView } from '../../components/MapWebView';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { getOrderUrl } from '../../utils/sharingUtils';
import { Platform } from 'react-native';
import { ProductOrderItem } from '../../components/ProductOrderItem';

export const DeliveryLocationScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { isAuthenticated, isGuest } = useAuth();
    const { showError, showSuccess } = useAlertService();
    const createOrderMutation = useCreateOrder();

    const { orderData } = route.params || {};
    const { data: vitrine } = useVitrineDetail(orderData?.vitrineId, !!orderData?.vitrineId);

    // Get available cities based on products in the cart
    const availableCities = React.useMemo(() => {
        if (!orderData?.products || orderData.products.length === 0) {
            return DRC_CITIES;
        }

        // Get common cities across all products
        // If a product doesn't have locations specified, it's considered available everywhere (legacy/default)
        let commonCities: string[] | null = null;

        orderData.products.forEach((p: any) => {
            const productLocations = p.locations
                ? (Array.isArray(p.locations) ? p.locations : [p.locations])
                : [];

            if (productLocations.length > 0) {
                if (commonCities === null) {
                    commonCities = [...productLocations];
                } else {
                    commonCities = commonCities.filter(c => productLocations.includes(c));
                }
            }
        });

        // If no product has restrictions, show all cities
        if (commonCities === null) {
            return DRC_CITIES;
        }

        // Intersection of all product locations
        return DRC_CITIES.filter(city => commonCities?.includes(city.value));
    }, [orderData]);

    const totalDeliveryFee = React.useMemo(() => {
        if (!orderData?.products) return 0;
        return orderData.products.reduce((sum: number, p: any) => sum + (p.deliveryFee || 0), 0);
    }, [orderData?.products]);

    const grandTotal = (orderData?.totalPrice || 0) + totalDeliveryFee;

    const [city, setCity] = useState('');
    const [commune, setCommune] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState({ latitude: 0, longitude: 0 });
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const locationSubscription = React.useRef<Location.LocationSubscription | null>(null);

    const canSubmit = deliveryLocation.latitude !== 0;

    useEffect(() => {
        // Automatically set city if only one is available
        if (availableCities.length === 1 && !city) {
            setCity(availableCities[0].value);
        }
    }, [availableCities, city]);

    useEffect(() => {
        // Automatically request permission and get location on mount
        handleGetCurrentLocation();

        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
            }
        };
    }, []);

    const handleGetCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showError('Permission de localisation refusée. Elle est nécessaire pour la livraison.');
                setIsFetchingLocation(false);
                return;
            }

            // Si une souscription existe déjà, on la nettoie
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }

            // Surveillance en temps réel pour obtenir la position
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                (location) => {
                    const { latitude, longitude, accuracy } = location.coords;
                    console.log(`[GPS-Update] Accuracy: ${accuracy}m`);
                    setDeliveryLocation({ latitude, longitude });
                    setLocationAccuracy(accuracy);

                    if (accuracy) {
                        setIsFetchingLocation(false);
                    }
                }
            );

        } catch (error) {
            console.error('Error starting location watch:', error);
            showError('Impossible de démarrer la localisation');
            setIsFetchingLocation(false);
        }
    };

    const handleSubmitOrder = async () => {
        // Validation
        if (!city) {
            showError('Veuillez sélectionner votre ville');
            return;
        }
        if (!commune) {
            showError('Veuillez sélectionner votre commune');
            return;
        }
        if (!deliveryAddress.trim()) {
            showError('Veuillez entrer votre adresse de livraison');
            return;
        }
        if (deliveryLocation.latitude === 0 || !canSubmit) {
            showError('Votre position n\'est pas encore détectée ou manque de précision. Veuillez patienter.');
            return;
        }

        try {
            const order = await createOrderMutation.mutateAsync({
                ...orderData,
                city,
                commune,
                deliveryAddress,
                gpsCoords: deliveryLocation.latitude !== 0 ? deliveryLocation : undefined,
                status: 'pending',
                deliveryFee: totalDeliveryFee,
                totalPrice: grandTotal,
            });

            if (order && (order.orderId || order._id)) {
                // Utiliser l'orderId public (ex: ORD-XXXXXX)
                const publicOrderId = order.orderId || order._id;
                console.log('Order created successfully:', publicOrderId);

                // Préparer le message WhatsApp
                const whatsappNumber = vitrine?.contact?.phone;
                if (whatsappNumber) {
                    const cleanNumber = whatsappNumber.replace(/\D/g, '');

                    let message = `*Nouvelle Commande*\n\n`;
                    message += `*Client:* ${orderData.clientName}\n\n`;

                    message += `*Articles:*\n`;
                    orderData.products.forEach((p: any) => {
                        message += `- ${p.productName} x ${p.quantity} (${(p.price * p.quantity).toFixed(2)} ${p.currency || 'USD'})\n`;
                    });

                    message += `\n*Sous-total:* ${orderData.totalPrice.toFixed(2)} ${orderData.products?.[0]?.currency || 'USD'}\n`;
                    if (totalDeliveryFee > 0) {
                        message += `*Frais de livraison:* ${totalDeliveryFee.toFixed(2)} ${orderData.products?.[0]?.currency || 'USD'}\n`;
                    } else {
                        message += `*Livraison:* Gratuite\n`;
                    }
                    message += `*Total:* ${grandTotal.toFixed(2)} ${orderData.products?.[0]?.currency || 'USD'}\n\n`;

                    message += `*Livraison:*\n`;
                    message += `- Ville: ${city}\n`;
                    message += `- Commune: ${commune}\n`;
                    message += `- Adresse: ${deliveryAddress}\n`;

                    if (orderData.notes) {
                        message += `\n*Notes:* ${orderData.notes}\n`;
                    }

                    message += `\n*Lien de suivi de votre commande:* ${getOrderUrl(publicOrderId)}`;

                    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

                    try {
                        // On tente l'ouverture directe via le protocole whatsapp:// (comportement comme sur l'accueil)
                        await Linking.openURL(whatsappUrl).catch(async () => {
                            // Fallback web si le protocole n'est pas supporté (ex: pas de WhatsApp Desktop sur Web)
                            const webUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
                            await Linking.openURL(webUrl);
                        });
                    } catch (err) {
                        console.error('Erreur ouverture WhatsApp:', err);
                    }
                }
            }

            showSuccess('Commande créée avec succès !');

            // Stockage local de la commande pour l'historique visiteur/invité
            try {
                const publicOrderId = order.orderId || order._id;
                const savedOrdersJson = await AsyncStorage.getItem('GUEST_ORDERS');
                const savedOrders = savedOrdersJson ? JSON.parse(savedOrdersJson) : [];

                if (publicOrderId && !savedOrders.includes(publicOrderId)) {
                    const newOrders = [publicOrderId, ...savedOrders];
                    await AsyncStorage.setItem('GUEST_ORDERS', JSON.stringify(newOrders));
                    console.log('Order ID saved locally:', publicOrderId);
                }
            } catch (e) {
                console.error('Failed to save order locally:', e);
            }

            // Redirection vers le détail de la commande pour le client
            const orderIdForNav = order.orderId || order._id;

            setTimeout(() => {
                navigation.navigate('OrderClientDetail', { orderId: orderIdForNav });
            }, 1000);
        } catch (error: any) {
            console.error('Order creation failed:', error.message);
            showError(error.message || 'Échec de la création de la commande');
        }
    };


    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('MainTabs');
        }
    };

    const handleSelectLocation = () => {
        // In a real app, this would open a map picker
        console.log('Opening map picker (not implemented)');
        showError('Map picker not implemented yet');
        // For now, just set a dummy location
        setDeliveryLocation({ latitude: 36.7538, longitude: 3.0588 }); // Algiers coordinates
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Adresse de livraison"
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
                onBackPress={handleBack}
            />
            <ScreenWrapper>
                <View style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[
                            styles.contentContainer,
                            { paddingBottom: 100 }
                        ]}
                    >
                        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Détails de localisation
                            </Text>

                            <AnimatedSelect
                                label="Ville *"
                                value={city || (availableCities.length === 1 ? availableCities[0].value : '')}
                                onChange={(val) => {
                                    setCity(val);
                                    setCommune('');
                                }}
                                options={availableCities.map(l => ({ label: l.label, value: l.value }))}
                                placeholder="Sélectionner une ville"
                            />

                            {(city !== '' || availableCities.length === 1) && (
                                <AnimatedSelect
                                    label="Commune *"
                                    value={commune}
                                    onChange={setCommune}
                                    options={DRC_CITIES.find(c => c.value === (city || (availableCities.length === 1 ? availableCities[0].value : '')))?.communes.map(com => ({ label: com.label, value: com.value })) || []}
                                    placeholder="Sélectionner une commune"
                                />
                            )}

                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                    marginTop: 10
                                }]}
                                placeholder="Adresse complète (Rue, bât, n° porte...) *"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={deliveryAddress}
                                onChangeText={setDeliveryAddress}
                                multiline
                                numberOfLines={4}
                            />

                            <View style={styles.gpsSection}>
                                <Text style={[styles.gpsLabel, { color: theme.colors.textSecondary }]}>
                                    Votre position GPS *
                                </Text>
                                {isFetchingLocation ? (
                                    <View style={styles.mapLoading}>
                                        <ActivityIndicator color={theme.colors.primary} />
                                        <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>Localisation en cours...</Text>
                                    </View>
                                ) : deliveryLocation.latitude !== 0 ? (
                                    <View style={styles.mapContainer}>
                                        <MapWebView
                                            height={200}
                                            lat={deliveryLocation.latitude}
                                            lon={deliveryLocation.longitude}
                                            zoom={15}
                                        />
                                        <TouchableOpacity
                                            style={[styles.refreshGps, { backgroundColor: theme.colors.primary }]}
                                            onPress={handleGetCurrentLocation}
                                        >
                                            <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.locationButton, {
                                            backgroundColor: theme.colors.background,
                                            borderColor: theme.colors.border
                                        }]}
                                        onPress={handleGetCurrentLocation}
                                    >
                                        <Text style={[styles.locationButtonText, { color: theme.colors.primary }]}>
                                            📍 Activer la localisation GPS
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {deliveryLocation.latitude !== 0 && (
                                    <View style={styles.locationDetailContainer}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                                                Lat: {deliveryLocation.latitude.toFixed(6)}, Lon: {deliveryLocation.longitude.toFixed(6)}
                                            </Text>
                                            {locationAccuracy && (
                                                <Text style={[styles.accuracyText, {
                                                    color: locationAccuracy <= 50 ? '#34C759' : '#FF9500'
                                                }]}>
                                                    Précision: {locationAccuracy.toFixed(1)}m
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Order Summary */}
                        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Récapitulatif
                            </Text>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                                    Client:
                                </Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                    {orderData?.clientName}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                                    Téléphone:
                                </Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                    {orderData?.clientPhone}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                                    Articles:
                                </Text>
                            </View>
                            {orderData?.products?.map((product: any, index: number) => (
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
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.summaryRow}>
                                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total:</Text>
                                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                                    {orderData?.totalPrice?.toFixed(2)} {orderData?.products?.[0]?.currency || 'USD'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.floatingFooter}>
                        <TouchableOpacity
                            style={[styles.button, {
                                backgroundColor: canSubmit ? theme.colors.primary : '#E0E0E0',
                                opacity: canSubmit ? 1 : 0.8,
                            }]}
                            onPress={handleSubmitOrder}
                            disabled={createOrderMutation.isPending || !canSubmit}
                            activeOpacity={0.8}
                        >
                            {createOrderMutation.isPending ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : !canSubmit ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 10 }} />
                                    <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Récupération position...</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Confirmer la commande</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenWrapper>
        </View>
    );
};


const styles = StyleSheet.create({
    floatingFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    gpsSection: {
        marginTop: 20,
    },
    gpsLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 10,
    },
    mapLoading: {
        height: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        height: 180,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    refreshGps: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    locationButton: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    locationDetailContainer: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    accuracyText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
