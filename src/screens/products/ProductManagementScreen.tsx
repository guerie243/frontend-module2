/**
 * Product Management Screen
 * 
 * List of owner's products with management actions
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useProductsByVitrine, useProductDetail } from '../../hooks/useProducts';
import { useMyVitrines, useVitrineDetail } from '../../hooks/useVitrines';
import { Product } from '../../types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getSafeUri } from '../../utils/imageUtils';

export const ProductManagementScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { productId } = route.params || {};

    // Get user's vitrine
    const { data: myVitrines = [] } = useMyVitrines();
    const vitrineId = myVitrines?.[0]?.vitrineId || myVitrines?.[0]?.id || myVitrines?.[0]?._id || '';

    // If we have a productId, we manage that specific product
    const { data: product, isLoading: isLoadingProduct } = useProductDetail(productId, !!productId);

    // Get products for this vitrine (for the list view)
    const { data: productsData, isLoading: isLoadingList } = useProductsByVitrine(vitrineId, !productId && !!vitrineId);

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

    const handleEditProduct = (prod: Product) => {
        navigation.navigate('ProductManagement', { productId: prod.id || prod._id });
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
            </View>

            <View style={[styles.editCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </View>
        </TouchableOpacity>
    );

    const renderFieldItem = (label: string, value: string, field: string, options: any = {}) => (
        <TouchableOpacity
            style={[styles.fieldItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
                navigation.navigate('EditProduct', {
                    field,
                    label,
                    currentValue: value,
                    productId: product.id || product._id,
                    ...options
                });
            }}
        >
            <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: value ? theme.colors.text : theme.colors.textTertiary }]} numberOfLines={1}>
                    {value || 'Non renseigné'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    if (isLoadingList || (productId && isLoadingProduct)) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    // --- REPURPOSED VIEW: SINGLE PRODUCT MANAGEMENT (CHAMP PAR CHAMP) ---
    if (productId && product) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScreenHeader
                    title={`Gestion: ${product.name}`}
                    vitrineName={vitrine?.name}
                    vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        {renderFieldItem('Nom du produit', product.name, 'name')}
                        {renderFieldItem('Catégorie', product.category, 'category')}
                        {renderFieldItem('Prix', `${product.price}`, 'price', { keyboardType: 'decimal-pad' })}
                        {renderFieldItem('Devise', product.currency || 'USD', 'currency')}
                        {renderFieldItem('Lieux', Array.isArray(product.locations) ? product.locations.join(', ') : product.locations, 'locations')}
                        {renderFieldItem('Description', product.description || '', 'description', { multiline: true })}
                        {renderFieldItem('Images', `${product.images?.length || 0} image(s)`, 'images', { isImageManagement: true })}
                    </View>

                    <TouchableOpacity
                        style={styles.deleteLinkContainer}
                        onPress={() => navigation.navigate('EditProduct', {
                            field: 'delete',
                            label: 'Suppression',
                            currentValue: '',
                            productId: product.id || product._id
                        })}
                    >
                        <Text style={[styles.deleteText, { color: theme.colors.error }]}>Supprimer mon produit</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // --- ORIGINAL VIEW: PRODUCT LIST ---
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
    editCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    fieldContent: {
        flex: 1,
        marginRight: 16,
    },
    fieldLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    deleteLinkContainer: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: 'center',
        padding: 16,
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
});
