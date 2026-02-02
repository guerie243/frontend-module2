import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
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
import { ALGERIA_CITIES } from '../../constants/locations';
import { AnimatedSelect } from '../../components/AnimatedSelect';
import { Ionicons } from '@expo/vector-icons';
import { MapWebView } from '../../components/MapWebView';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { getOrderUrl } from '../../utils/sharingUtils';
import { Platform } from 'react-native';

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
            return ALGERIA_CITIES;
        }

        // Get common cities across all products
        // If a product doesn't have locations specified, it's considered available everywhere (legacy/default)
        let commonCities: string[] | null = null;

        orderData.products.forEach((p: any) => {
            if (p.locations && p.locations.length > 0) {
                if (commonCities === null) {
                    commonCities = [...p.locations];
                } else {
                    commonCities = commonCities.filter(c => p.locations.includes(c));
                }
            }
        });

        // If no product has restrictions, show all cities
        if (commonCities === null) {
            return ALGERIA_CITIES;
        }

        // Intersection of all product locations
        return ALGERIA_CITIES.filter(city => commonCities?.includes(city.value));
    }, [orderData]);

    const [city, setCity] = useState('');
    const [commune, setCommune] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState({ latitude: 0, longitude: 0 });
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    useEffect(() => {
        // Automatically set city if only one is available
        if (availableCities.length === 1 && !city) {
            setCity(availableCities[0].value);
        }
    }, [availableCities, city]);

    useEffect(() => {
        // Automatically request permission and get location on mount
        handleGetCurrentLocation();
    }, []);

    const handleGetCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showError('Permission de localisation refusée');
                setIsFetchingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            const { latitude, longitude, accuracy } = location.coords;
            console.log(`[GPS] Captured location: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);
            setDeliveryLocation({ latitude, longitude });
            setLocationAccuracy(accuracy);


        } catch (error) {
            console.error('Error getting location:', error);
            showError('Impossible de récupérer votre position');
        } finally {
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
            showError('Veuillez entrer l\'adresse de livraison');
            return;
        }

        // Pré-ouvrir la fenêtre sur le Web pour éviter le blocage de popup
        const webWindow = Platform.OS === 'web' ? window.open('', '_blank') : null;

        try {
            const order = await createOrderMutation.mutateAsync({
                ...orderData,
                city,
                commune,
                deliveryAddress,
                gpsCoords: deliveryLocation.latitude !== 0 ? deliveryLocation : undefined,
                status: 'pending',
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
                    message += `*Client:* ${orderData.clientName}\n`;
                    message += `*Téléphone:* ${orderData.clientPhone}\n\n`;

                    message += `*Articles:*\n`;
                    orderData.products.forEach((p: any) => {
                        message += `- ${p.productName} x ${p.quantity} (${(p.price * p.quantity).toFixed(2)} ${p.currency || 'USD'})\n`;
                    });

                    message += `\n*Total:* ${orderData.totalPrice.toFixed(2)} ${orderData.products?.[0]?.currency || 'USD'}\n\n`;

                    message += `*Livraison:*\n`;
                    message += `- Ville: ${city}\n`;
                    message += `- Commune: ${commune}\n`;
                    message += `- Adresse: ${deliveryAddress}\n`;

                    if (orderData.notes) {
                        message += `\n*Notes:* ${orderData.notes}\n`;
                    }

                    message += `\n*Lien de suivi de votre commande:* ${getOrderUrl(publicOrderId)}`;

                    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

                    if (webWindow) {
                        webWindow.location.href = whatsappUrl;
                    } else {
                        await Linking.openURL(whatsappUrl).catch(async () => {
                            // Fallback si Linking échoue sur mobile
                            const fallbackUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
                            await Linking.openURL(fallbackUrl).catch(() => { });
                        });
                    }
                } else if (webWindow) {
                    webWindow.close();
                }
            } else if (webWindow) {
                webWindow.close();
            }

            showSuccess('Commande créée avec succès !');

            // Redirection vers le détail de la commande pour le client
            const orderIdForNav = order.orderId || order._id;

            setTimeout(() => {
                navigation.navigate('OrderClientDetail', { orderId: orderIdForNav });
            }, 1000);
        } catch (error: any) {
            if (webWindow) webWindow.close();
            console.error('Order creation failed:', error.message);
            showError(error.message || 'Échec de la création de la commande');
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
            />
            <ScreenWrapper scrollable contentContainerStyle={styles.contentContainer}>

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
                            options={ALGERIA_CITIES.find(c => c.value === (city || (availableCities.length === 1 ? availableCities[0].value : '')))?.communes.map(com => ({ label: com.label, value: com.value })) || []}
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
                        placeholder="Adresse complète (Rue, bât, n° porte...)"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        multiline
                        numberOfLines={4}
                    />

                    <View style={styles.gpsSection}>
                        <Text style={[styles.gpsLabel, { color: theme.colors.textSecondary }]}>
                            Votre position GPS
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
                                <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                                    Lat: {deliveryLocation.latitude.toFixed(6)}, Lon: {deliveryLocation.longitude.toFixed(6)}
                                </Text>
                                {locationAccuracy && (
                                    <Text style={[styles.accuracyText, {
                                        color: locationAccuracy < 20 ? '#34C759' : '#FF9500'
                                    }]}>
                                        Précision: {locationAccuracy.toFixed(1)}m {locationAccuracy < 20 ? '(Excellente)' : '(Moyenne)'}
                                    </Text>
                                )}
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
                        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                            Articles:
                        </Text>
                        <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                            {orderData?.products?.length} produit(s)
                        </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total:</Text>
                        <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                            {orderData?.totalPrice?.toFixed(2)} {orderData?.products?.[0]?.currency || 'USD'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSubmitOrder}
                    disabled={createOrderMutation.isPending}
                >
                    {createOrderMutation.isPending ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Confirmer la commande</Text>
                    )}
                </TouchableOpacity>
            </ScreenWrapper>
        </View>
    );
};

const styles = StyleSheet.create({
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
        borderRadius: 12,
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
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
