/**
 * Cart Screen
 * 
 * Displays list of items in cart with management options
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { ProductOrderItem } from '../../components/ProductOrderItem';

const { width } = Dimensions.get('window');

export const CartScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { cart, updateQuantity, removeFromCart, totalPrice, itemCount, vitrineId } = useCart();

    const handleContinue = () => {
        navigation.navigate('OrderInfo', {
            cart: cart,
            vitrineId: vitrineId
        });
    };

    if (cart.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScreenHeader title="Mon Panier" />
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={theme.colors.textTertiary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Votre panier est vide</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Parcourez les produits et ajoutez-les à votre panier pour commander.
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Retour aux produits</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader title="Mon Panier" />
            <ScreenWrapper>
                <View style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 }]}
                    >
                        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Articles ({itemCount})
                            </Text>
                            {cart.map((item, index) => (
                                <View key={index} style={styles.itemWrapper}>
                                    <ProductOrderItem
                                        name={item.product.name}
                                        image={item.product.images?.[0]}
                                        quantity={item.quantity}
                                        price={item.product.price}
                                        currency={item.product.currency}
                                        slug={item.product.slug}
                                    />
                                    <View style={styles.managementRow}>
                                        <View style={[styles.quantitySelector, { borderColor: theme.colors.border }]}>
                                            <TouchableOpacity
                                                onPress={() => updateQuantity(item.product.id || item.product._id || '', item.quantity - 1)}
                                                style={styles.quantityBtn}
                                            >
                                                <Ionicons name="remove" size={18} color={theme.colors.text} />
                                            </TouchableOpacity>
                                            <Text style={[styles.quantityText, { color: theme.colors.text }]}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                onPress={() => updateQuantity(item.product.id || item.product._id || '', item.quantity + 1)}
                                                style={styles.quantityBtn}
                                            >
                                                <Ionicons name="add" size={18} color={theme.colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeFromCart(item.product.id || item.product._id || '')}
                                            style={[styles.removeBtn, { backgroundColor: theme.colors.error + '15' }]}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                            <Text style={[styles.removeText, { color: theme.colors.error }]}>Supprimer</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {index < cart.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                                    )}
                                </View>
                            ))}
                        </View>

                        <View style={[styles.summarySection, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Sous-total</Text>
                                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                    {totalPrice.toFixed(2)} {cart[0]?.product?.currency || 'USD'}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.colors.border, marginVertical: 12 }]} />
                            <View style={styles.summaryRow}>
                                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                                    {totalPrice.toFixed(2)} {cart[0]?.product?.currency || 'USD'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.floatingFooter}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={handleContinue}
                        >
                            <Text style={styles.buttonText}>Commander</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenWrapper>
        </View>
    );
};

const styles = StyleSheet.create({
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
        fontWeight: '700',
        marginBottom: 16,
    },
    itemWrapper: {
        marginBottom: 16,
    },
    managementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        height: 36,
        paddingHorizontal: 8,
    },
    quantityBtn: {
        padding: 4,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 12,
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    removeText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        marginTop: 16,
    },
    summarySection: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 15,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    floatingFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: 'transparent',
    },
    button: {
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
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
        fontSize: 18,
        fontWeight: '700',
    },
});
