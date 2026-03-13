/**
 * Product Card Component
 * 
 * Enhanced product card with expo-image, category badge, and actions
 * Inspired by Module 1 AnnonceCard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../types';
import { getSafeUri } from '../utils/imageUtils';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    onAddToCart?: (product: Product, quantity: number) => void;
    showActions?: boolean;
    cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    onAddToCart,
    showActions = false,
    cartQuantity = 0,
}) => {
    const { theme } = useTheme();

    // Get first image or use placeholder
    const rawImageUri = product.images && product.images.length > 0 ? product.images[0] : undefined;
    const imageUri = getSafeUri(rawImageUri);

    const [quantity, setQuantity] = React.useState(0);

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
                    </View>
                </View>

                {showActions && onAddToCart && (
                    <View style={styles.actionsWrapper}>
                        <View style={[styles.quantitySelector, { borderColor: theme.colors.border }]}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setQuantity(Math.max(0, quantity - 1));
                                }}
                                style={styles.quantityBtn}
                            >
                                <Ionicons name="remove" size={16} color={theme.colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.quantityText, { color: theme.colors.text }]}>{quantity}</Text>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setQuantity(quantity + 1);
                                }}
                                style={styles.quantityBtn}
                            >
                                <Ionicons name="add" size={16} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            disabled={quantity === 0}
                            style={[
                                styles.cartButton,
                                { backgroundColor: quantity > 0 ? theme.colors.primary : theme.colors.textTertiary }
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (quantity > 0) {
                                    onAddToCart(product, quantity);
                                    setQuantity(0);
                                }
                            }}
                        >
                            <Ionicons name="cart-outline" size={18} color={theme.colors.white} />
                        </TouchableOpacity>
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
        gap: 4,
        marginTop: 2,
    },
    deliveryText: {
        fontSize: 11,
        fontWeight: '500',
    },
    actionsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 8,
    },
    quantitySelector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        height: 36,
        paddingHorizontal: 4,
    },
    quantityBtn: {
        padding: 4,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cartButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
