/**
 * Product Card Component
 *
 * Simplified cart UX: pressing + adds immediately to cart,
 * pressing - removes. Quantity reflects the live cart state.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../types';
import { getSafeUri } from '../utils/imageUtils';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    showActions = false,
}) => {
    const { theme } = useTheme();
    const { addToCart, updateQuantity, removeFromCart, cart } = useCart();

    // Get first image or use placeholder
    const rawImageUri = product.images && product.images.length > 0 ? product.images[0] : undefined;
    const imageUri = getSafeUri(rawImageUri);

    // Live quantity from cart context — persists across renders
    const productId = product.id || product._id || '';
    const cartItem = cart.find((item) => (item.product.id || item.product._id) === productId);
    const quantity = cartItem?.quantity ?? 0;

    const handleIncrement = (e: any) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    const handleDecrement = (e: any) => {
        e.stopPropagation();
        if (quantity <= 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, quantity - 1);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Product Image */}
            <View style={styles.imageContainer}>
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceLight }]}>
                        <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
                    </View>
                )}

                {/* Category Badge */}
                {product.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + 'DD' }]}>
                        <Text style={[styles.categoryText, { color: theme.colors.white }]}>
                            {product.category}
                        </Text>
                    </View>
                )}

                {/* Cart quantity badge overlay */}
                {quantity > 0 && (
                    <View style={[styles.cartBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.cartBadgeText}>{quantity}</Text>
                    </View>
                )}
            </View>

            {/* Product Info */}
            <View style={styles.content}>
                <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
                    {product.name}
                </Text>

                <View style={styles.bottomRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.price, { color: theme.colors.primary }]}>
                            {product.price.toFixed(2)} {product.currency || 'USD'}
                        </Text>
                        <View style={styles.deliveryRow}>
                            <Ionicons
                                name="car-outline"
                                size={12}
                                color={product.deliveryFee ? theme.colors.textSecondary : '#34C759'}
                            />
                            <Text style={[
                                styles.deliveryText,
                                { color: product.deliveryFee ? theme.colors.textSecondary : '#34C759' }
                            ]}>
                                {product.deliveryFee
                                    ? `${product.deliveryFee.toFixed(2)} ${product.currency || 'USD'}`
                                    : 'Gratuit'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Simplified quantity controls — no separate "Add" button */}
                {showActions && (
                    <View style={styles.actionsWrapper}>
                        <View style={[styles.quantitySelector, { borderColor: theme.colors.border }]}>
                            <TouchableOpacity
                                onPress={handleDecrement}
                                style={styles.quantityBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name="remove"
                                    size={16}
                                    color={quantity > 0 ? theme.colors.primary : theme.colors.textTertiary}
                                />
                            </TouchableOpacity>

                            <Text style={[styles.quantityText, {
                                color: quantity > 0 ? theme.colors.primary : theme.colors.textSecondary
                            }]}>
                                {quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={handleIncrement}
                                style={styles.quantityBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="add" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
    },
    imagePlaceholder: {
        width: '100%',
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cartBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    cartBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    content: {
        padding: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 18,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    deliveryText: {
        fontSize: 11,
        fontWeight: '500',
        marginLeft: 4,
    },
    actionsWrapper: {
        marginTop: 10,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        height: 36,
        paddingHorizontal: 4,
    },
    quantityBtn: {
        padding: 6,
    },
    quantityText: {
        fontSize: 15,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
});
