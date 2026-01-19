/**
 * Product Detail Screen
 * 
 * Single product view with details and add to cart
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useProductDetail, useDeleteProduct } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { CartItem } from '../../types';

export const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { slug } = route.params || {};
    const { data: product, isLoading } = useProductDetail(slug);
    const deleteProductMutation = useDeleteProduct();

    const [quantity, setQuantity] = useState(1);

    const isOwner = isAuthenticated && product && (
        user?.id === product.vitrineId ||
        user?._id === product.vitrineId
    );

    const handleAddToCart = () => {
        if (product) {
            const cartItem: CartItem = { product, quantity };
            console.log('Adding to cart:', product.name, 'x', quantity);
            navigation.navigate('OrderInfo', {
                cart: [cartItem],
                vitrineId: product.vitrineId
            });
        }
    };

    const handleEdit = () => {
        console.log('Navigating to EditProduct');
        navigation.navigate('EditProduct', { productId: product?.id || product?._id });
    };

    const handleDelete = () => {
        showConfirm(
            'Voulez-vous vraiment supprimer ce produit ?',
            async () => {
                try {
                    await deleteProductMutation.mutateAsync(product?.id || product?._id || '');
                    showSuccess('Produit supprimé');
                    navigation.goBack();
                } catch (error: any) {
                    showError(error.message || 'Échec de la suppression');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Produit introuvable
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Product Image */}
            <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceLight }]}>
                <Text style={styles.imagePlaceholder}>📦</Text>
            </View>

            {/* Product Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.productName, { color: theme.colors.text }]}>
                    {product.name}
                </Text>
                <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                    {product.price.toFixed(2)} DA
                </Text>

                {product.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                            {product.category}
                        </Text>
                    </View>
                )}

                {product.description && (
                    <View style={styles.descriptionContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Description
                        </Text>
                        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                            {product.description}
                        </Text>
                    </View>
                )}

                {product.stock !== undefined && (
                    <Text style={[styles.stock, { color: theme.colors.textSecondary }]}>
                        Stock: {product.stock} disponible(s)
                    </Text>
                )}
            </View>

            {/* Owner Actions */}
            {isOwner && (
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={handleEdit}
                    >
                        <Text style={styles.buttonText}>Modifier le produit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.error }]}
                        onPress={handleDelete}
                        disabled={deleteProductMutation.isPending}
                    >
                        {deleteProductMutation.isPending ? (
                            <ActivityIndicator color={theme.colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Supprimer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Add to Cart - For non-owners */}
            {!isOwner && (
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: theme.colors.background }]}
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            <Text style={[styles.quantityButtonText, { color: theme.colors.text }]}>-</Text>
                        </TouchableOpacity>
                        <Text style={[styles.quantityText, { color: theme.colors.text }]}>{quantity}</Text>
                        <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: theme.colors.background }]}
                            onPress={() => setQuantity(quantity + 1)}
                        >
                            <Text style={[styles.quantityButtonText, { color: theme.colors.text }]}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={handleAddToCart}
                    >
                        <Text style={styles.buttonText}>
                            Ajouter au panier • {(product.price * quantity).toFixed(2)} DA
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
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
    imageContainer: {
        width: '100%',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholder: {
        fontSize: 80,
    },
    section: {
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    descriptionContainer: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    stock: {
        fontSize: 14,
        marginTop: 12,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 24,
    },
    button: {
        height: 50,
        borderRadius: 12,
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
