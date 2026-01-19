/**
 * Order Info Screen
 * 
 * Shopping cart and client information screen
 * First step of order creation process
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { CartItem, OrderProduct } from '../../types';

export const OrderInfoScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showError } = useAlertService();

    // Cart items passed from ProductsCatalogScreen
    const { cart = [], vitrineId } = route.params || {};

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [notes, setNotes] = useState('');

    // Calculate total price
    const totalPrice = cart.reduce((sum: number, item: CartItem) => {
        return sum + (item.product.price * item.quantity);
    }, 0);

    const handleContinue = () => {
        // Validation
        if (!clientName.trim()) {
            showError('Veuillez entrer votre nom');
            return;
        }

        if (!clientPhone.trim()) {
            showError('Veuillez entrer votre numéro de téléphone');
            return;
        }

        if (cart.length === 0) {
            showError('Votre panier est vide');
            return;
        }

        console.log('Order info validated:', {
            clientName,
            clientPhone,
            totalPrice,
            itemCount: cart.length,
        });

        // Prepare order products
        const orderProducts: OrderProduct[] = cart.map((item: CartItem) => ({
            productId: item.product.id || item.product._id || '',
            productName: item.product.name,
            productImage: item.product.images?.[0],
            quantity: item.quantity,
            price: item.product.price,
        }));

        // Navigate to delivery location screen
        navigation.navigate('DeliveryLocation', {
            orderData: {
                products: orderProducts,
                clientName,
                clientPhone,
                totalPrice,
                notes,
                vitrineId,
            },
        });
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Informations de commande
            </Text>

            {/* Cart Summary */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Résumé du panier
                </Text>
                {cart.map((item: CartItem, index: number) => (
                    <View key={index} style={styles.cartItem}>
                        <Text style={[styles.cartItemName, { color: theme.colors.text }]}>
                            {item.product.name} x {item.quantity}
                        </Text>
                        <Text style={[styles.cartItemPrice, { color: theme.colors.textSecondary }]}>
                            {(item.product.price * item.quantity).toFixed(2)} DA
                        </Text>
                    </View>
                ))}
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                    <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                        {totalPrice.toFixed(2)} DA
                    </Text>
                </View>
            </View>

            {/* Client Information */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Vos informations
                </Text>

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Nom complet"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={clientName}
                    onChangeText={setClientName}
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Numéro de téléphone"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={clientPhone}
                    onChangeText={setClientPhone}
                    keyboardType="phone-pad"
                />

                <TextInput
                    style={[styles.textArea, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Notes (optionnel)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleContinue}
            >
                <Text style={styles.buttonText}>Continuer vers la livraison</Text>
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
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cartItemName: {
        flex: 1,
        fontSize: 14,
    },
    cartItemPrice: {
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
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        textAlignVertical: 'top',
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
