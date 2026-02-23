/**
 * Order Info Screen
 * 
 * Shopping cart and client information screen
 * First step of order creation process
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { CartItem, OrderProduct } from '../../types';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { getSafeUri } from '../../utils/imageUtils';
import { ProductOrderItem } from '../../components/ProductOrderItem';

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

    const { data: vitrine } = useVitrineDetail(vitrineId, !!vitrineId);

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

        // Phone validation (exactly 9 digits after +243)
        const phoneRegex = /^\d{9}$/;
        if (!clientPhone.trim()) {
            showError('Veuillez entrer votre numéro de téléphone');
            return;
        }

        if (!phoneRegex.test(clientPhone)) {
            showError('Le numéro doit contenir exactement 9 chiffres après le préfixe');
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
            productSlug: item.product.slug,
            productImage: item.product.images?.[0],
            quantity: item.quantity,
            price: item.product.price,
            currency: item.product.currency || 'USD',
            locations: item.product.locations,
            deliveryFee: item.product.deliveryFee,
        }));

        // Navigate to delivery location screen
        navigation.navigate('DeliveryLocation', {
            orderData: {
                products: orderProducts,
                clientName,
                clientPhone: `+243${clientPhone}`,
                totalPrice,
                notes,
                vitrineId,
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Informations de commande"
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
            />
            <ScreenWrapper>
                <View style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
                    >
                        {/* Cart Summary */}
                        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Résumé du panier
                            </Text>
                            {cart.map((item: CartItem, index: number) => (
                                <ProductOrderItem
                                    key={index}
                                    name={item.product.name}
                                    image={item.product.images?.[0]}
                                    quantity={item.quantity}
                                    price={item.product.price}
                                    currency={item.product.currency}
                                    slug={item.product.slug}
                                    deliveryFee={item.product.deliveryFee}
                                />
                            ))}
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                                <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                                    {totalPrice.toFixed(2)} {cart[0]?.product?.currency || 'USD'}
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

                            <View style={[styles.phoneInputContainer, {
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border
                            }]}>
                                <Text style={[styles.phonePrefix, { color: theme.colors.text }]}>+243</Text>
                                <View style={[styles.phoneSeparator, { backgroundColor: theme.colors.border }]} />
                                <TextInput
                                    style={[styles.phoneInput, { color: theme.colors.text }]}
                                    placeholder="WhatsApp"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={clientPhone}
                                    onChangeText={setClientPhone}
                                    keyboardType="phone-pad"
                                    maxLength={9}
                                />
                            </View>

                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                    minHeight: 120
                                }]}
                                placeholder="Notes (optionnel)"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={8}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.floatingFooter}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 0 }]}
                            onPress={handleContinue}
                        >
                            <Text style={styles.buttonText}>Continuer vers la livraison</Text>
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
    contentContainer: {
        padding: 16,
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
    phoneInputContainer: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    phonePrefix: {
        fontSize: 16,
        fontWeight: '600',
    },
    phoneSeparator: {
        width: 1,
        height: '60%',
        marginHorizontal: 12,
    },
    phoneInput: {
        flex: 1,
        height: '100%',
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
