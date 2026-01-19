/**
 * Products Catalog Screen
 * 
 * Main product browsing screen with cart functionality
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import { Product, CartItem } from '../../types';
import { useMyVitrines } from '../../hooks/useVitrines';

export const ProductsCatalogScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Get products
    const {
        data: productsData,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
        refetch
    } = useProducts(category, search);

    // Get user's vitrine
    const { data: myVitr = [] } = useMyVitrines();
    const vitrineId = myVitrines?.[0]?.id || myVitrines?.[0]?._id || '';

    const products = useMemo(() => {
        return productsData?.pages.flatMap(page => page.data || []) || [];
    }, [productsData]);

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleProductPress = (product: Product) => {
        console.log('Opening product detail:', product.slug);
        navigation.navigate('ProductDetail', { slug: product.slug });
    };

    const handleAddToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item =>
                (item.product.id || item.product._id) === (product.id || product._id)
            );

            if (existingItem) {
                return prevCart.map(item =>
                    (item.product.id || item.product._id) === (product.id || product._id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { product, quantity: 1 }];
            }
        });
        console.log('Added to cart:', product.name);
    };

    const handleViewCart = () => {
        if (cart.length === 0) return;
        console.log('Navigating to OrderInfo with cart:', cart.length, 'items');
        navigation.navigate('OrderInfo', { cart, vitrineId });
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const inCart = cart.find(cartItem =>
            (cartItem.product.id || cartItem.product._id) === (item.id || item._id)
        );

        return (
            <TouchableOpacity
                style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleProductPress(item)}
            >
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceLight }]}>
                    <Text style={[styles.imagePlaceholderText, { color: theme.colors.textTertiary }]}>
                        📦
                    </Text>
                </View>

                <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                        {item.price.toFixed(2)} DA
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleAddToCart(item)}
                >
                    <Text style={styles.addButtonText}>
                        {inCart ? `+${inCart.quantity}` : '+'}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                    }]}
                    placeholder="Rechercher des produits..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Category Filter - Simplified */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        { backgroundColor: category === '' ? theme.colors.primary : theme.colors.surface }
                    ]}
                    onPress={() => setCategory('')}
                >
                    <Text style={[
                        styles.filterChipText,
                        { color: category === '' ? theme.colors.white : theme.colors.text }
                    ]}>
                        Tous
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Products List */}
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id || item._id || item.slug}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContainer}
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Chargement des produits...
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Aucun produit disponible
                            </Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
                    ) : null
                }
            />

            {/* Cart Button */}
            {cart.length > 0 && (
                <TouchableOpacity
                    style={[styles.cartButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleViewCart}
                >
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                    </View>
                    <Text style={styles.cartButtonText}>
                        Voir le panier • {cartTotal.toFixed(2)} DA
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    productCard: {
        width: '48%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 48,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    addButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    cartButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cartBadge: {
        position: 'absolute',
        left: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cartButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
