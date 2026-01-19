/**
 * Delivery Location Screen
 * 
 * Delivery address and location selection screen
 * Final step before order creation
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useCreateOrder } from '../../hooks/useCommandes';

export const DeliveryLocationScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showError, showSuccess } = useAlertService();
    const createOrderMutation = useCreateOrder();

    const { orderData } = route.params || {};

    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState({ latitude: 0, longitude: 0 });

    const handleSubmitOrder = async () => {
        // Validation
        if (!deliveryAddress.trim()) {
            showError('Veuillez entrer l\'adresse de livraison');
            return;
        }

        console.log('Submitting order:', {
            ...orderData,
            deliveryAddress,
            deliveryLocation,
        });

        try {
            const order = await createOrderMutation.mutateAsync({
                ...orderData,
                deliveryAddress,
                deliveryLocation: deliveryLocation.latitude !== 0 ? deliveryLocation : undefined,
                status: 'pending',
            });

            console.log('Order created successfully:', order.id);
            showSuccess('Commande créée avec succès !');

            // Navigate back to catalog or show order confirmation
            navigation.navigate('MainTabs', { screen: 'ProductsTab' });
        } catch (error: any) {
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
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Adresse de livraison
            </Text>

            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Où souhaitez-vous être livré ?
                </Text>

                <TextInput
                    style={[styles.textArea, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Adresse complète de livraison"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity
                    style={[styles.locationButton, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
                    }]}
                    onPress={handleSelectLocation}
                >
                    <Text style={[styles.locationButtonText, { color: theme.colors.primary }]}>
                        📍 Sélectionner sur la carte (optionnel)
                    </Text>
                </TouchableOpacity>

                {deliveryLocation.latitude !== 0 && (
                    <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                        Coordonnées: {deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)}
                    </Text>
                )}
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
                        {orderData?.totalPrice?.toFixed(2)} DA
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
        </ScrollView>
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
    locationText: {
        fontSize: 12,
        marginTop: 8,
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
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
