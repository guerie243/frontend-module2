/**
 * Product Detail Screen
 * 
 * Single product view with details and add to cart
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useProductDetail, useDeleteProduct } from '../../hooks/useProducts';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { CartItem } from '../../types';
import { getProductUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { getSafeUri } from '../../utils/imageUtils';

export const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { slug } = route.params || {};
    const { data: product, isLoading } = useProductDetail(slug);
    const { data: vitrine } = useVitrineDetail(product?.vitrineId || '', !!product?.vitrineId);
    const deleteProductMutation = useDeleteProduct();

    const [quantity, setQuantity] = useState(1);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title={product.name}
                vitrineName={vitrine?.name}
                vitrineLogo={getSafeUri(vitrine?.logo || vitrine?.avatar)}
                onVitrinePress={() => vitrine?.slug && navigation.navigate('VitrineDetail', { slug: vitrine.slug })}
                onShare={() => setIsShareModalVisible(true)}
            />

            <ScrollView style={styles.container}>
                {/* Product Image Gallery */}
                <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceLight }]}>
                    {product.images && product.images.length > 0 ? (
                        <FlatList
                            data={product.images}
                            keyExtractor={(item, index) => `${item}-${index}`}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <Image
                                    source={{ uri: getSafeUri(item) }}
                                    style={styles.image}
                                    contentFit="cover"
                                    transition={200}
                                />
                            )}
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="image-outline" size={80} color={theme.colors.textTertiary} />
                            <Text style={[styles.imagePlaceholderText, { color: theme.colors.textTertiary }]}>
                                Pas d'image
                            </Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.productName, { color: theme.colors.text }]}>
                        {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                        {product.price.toFixed(2)} {product.currency || 'USD'}
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
                            <Text
                                style={[styles.description, { color: theme.colors.textSecondary }]}
                                numberOfLines={isDescriptionExpanded ? undefined : 5}
                            >
                                {product.description}
                            </Text>
                            {product.description.length > 200 && ( // Threshold for toggle
                                <TouchableOpacity
                                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    style={styles.expandLink}
                                >
                                    <Text style={styles.expandLinkText}>
                                        {isDescriptionExpanded ? 'Voir moins' : 'Voir plus'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {product.locations && product.locations.length > 0 && (
                        <View style={styles.locationsContainer}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Lieux de disponibilité
                            </Text>
                            <View style={styles.locationBadges}>
                                {product.locations.map((loc, idx) => (
                                    <View key={idx} style={[styles.locationBadge, { backgroundColor: theme.colors.background }]}>
                                        <Ionicons name="location-sharp" size={14} color={theme.colors.primary} />
                                        <Text style={[styles.locationText, { color: theme.colors.text }]}>{loc}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {product.stock !== undefined && (
                        <Text style={[styles.stock, { color: theme.colors.textTertiary }]}>
                            Stock: {product.stock} disponible(s)
                        </Text>
                    )}
                </View>

                {/* Owner Actions */}
                {isOwner && (
                    <View style={styles.ownerActionsContainer}>
                        <View style={styles.ownerActionsHeader}>
                            <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
                            <Text style={[styles.ownerActionsTitle, { color: theme.colors.text }]}>Gestion du produit</Text>
                        </View>

                        <View style={styles.ownerButtonsRow}>
                            <TouchableOpacity
                                style={[styles.ownerButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleEdit}
                            >
                                <Ionicons name="create-outline" size={20} color="#FFF" />
                                <Text style={styles.ownerButtonText}>Modifier</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.ownerButton, { backgroundColor: theme.colors.error }]}
                                onPress={handleDelete}
                                disabled={deleteProductMutation.isPending}
                            >
                                {deleteProductMutation.isPending ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={20} color="#FFF" />
                                        <Text style={styles.ownerButtonText}>Supprimer</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.ownerNote}>Les clients ne voient pas ces options.</Text>
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
                                Ajouter au panier • {(product.price * quantity).toFixed(2)} {product.currency || 'USD'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getProductUrl(product.slug)}
                title={`Partager ${product.name}`}
                message={`Découvrez ${product.name} sur Andy Business !`}
            />
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
    emptyText: {
        fontSize: 16,
    },
    imageContainer: {
        width: '100%',
        height: 350,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: Dimensions.get('window').width,
        height: 350,
    },
    floatingShareButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
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
    expandLink: {
        marginTop: 4,
        paddingVertical: 4,
    },
    expandLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    locationsContainer: {
        marginTop: 16,
    },
    locationBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
    },
    ownerActionsContainer: {
        padding: 16,
        margin: 16,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    ownerActionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    ownerActionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    ownerButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    ownerButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ownerButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    ownerNote: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
