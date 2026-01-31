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

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    onAddToCart?: (product: Product) => void;
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
    const imageUri = product.images && product.images.length > 0 ? product.images[0] : undefined;

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
                    <Text style={[styles.price, { color: theme.colors.primary }]}>
                        {product.price.toFixed(2)} {product.currency || 'USD'}
                    </Text>

                    {/* Add to Cart Button */}
                    {showActions && onAddToCart && (
                        <TouchableOpacity
                            style={[styles.cartButton, { backgroundColor: theme.colors.primary }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                onAddToCart(product);
                            }}
                        >
                            <Text style={[styles.cartButtonText, { color: theme.colors.white }]}>
                                {cartQuantity > 0 ? `+${cartQuantity}` : '+'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
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
    cartButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
