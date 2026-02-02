/**
 * Product Management Screen
 * 
 * List of owner's products with management actions
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { useProductsByVitrine } from '../../hooks/useProducts';
import { useMyVitrines, useVitrineDetail } from '../../hooks/useVitrines';
import { Product } from '../../types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getSafeUri } from '../../utils/imageUtils';

export const ProductManagementScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    // Get user's vitrine
    const { data: myVitrines = [] } = useMyVitrines();
    const vitrineId = myVitrines?.[0]?.vitrineId || myVitrines?.[0]?.id || myVitrines?.[0]?._id || '';

    // Get products for this vitrine
    const { data: productsData, isLoading } = useProductsByVitrine(vitrineId, !!vitrineId);

    // Get full vitrine details for the header
    const { data: vitrine } = useVitrineDetail(vitrineId, !!vitrineId);

    const myProducts = useMemo(() => {
        return productsData?.pages.flatMap(page => {
            if (!page) return [];
            if (Array.isArray(page)) return page;
            return (page as any).data || [];
        }) || [];
    }, [productsData]);

    const handleCreateProduct = () => {
        console.log('Navigating to CreateProduct');
        navigation.navigate('CreateProduct');
    };

    const handleEditProduct = (product: Product) => {
        console.log('Navigating to EditProduct for:', product.name);
        navigation.navigate('EditProduct', { productId: product.id || product._id });
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleEditProduct(item)}
        >
            <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceLight }]}>
                {item.images && item.images.length > 0 ? (
                    <Image
                        source={{ uri: getSafeUri(item.images[0]) }}
                        style={styles.image}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <Text style={styles.imagePlaceholderText}>📦</Text>
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                    {item.price.toFixed(2)} {item.currency || 'USD'}
                </Text>
                {item.stock !== undefined && (
                    <Text style={[styles.stock, { color: theme.colors.textSecondary }]}>
                        Stock: {item.stock}
                    </Text>
                )}
            </View>

            <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleEditProduct(item)}
            >
                <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Gestion des produits"
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
            />
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Mes produits ({myProducts.length})
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleCreateProduct}
                    >
                        <Text style={styles.createButtonText}>+ Nouveau</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={myProducts}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id || item._id || item.slug}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Aucun produit. Créez votre premier produit !
                            </Text>
                        </View>
                    }
                />
            </View>
        </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    createButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    productCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholderText: {
        fontSize: 24,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    stock: {
        fontSize: 12,
        marginTop: 2,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 18,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
});
