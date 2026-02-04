/**
 * Product Detail Screen
 * 
 * Single product view with details and add to cart
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, Dimensions, Platform, Animated } from 'react-native';
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
import { getSafeUri } from '../../utils/imageUtils';
import { useMemo, useRef } from 'react';
import { ProductCarousel } from '../../components/ProductCarousel';
import { ShareMenuModal } from '../../components/ShareMenuModal';

const CAROUSEL_HEIGHT = 350;

export const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { slug } = route.params || {};
    const { data: product, isLoading } = useProductDetail(slug);
    const { data: vitrine } = useVitrineDetail(product?.vitrineId || '', !!product?.vitrineId);
    const deleteProductMutation = useDeleteProduct();

    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

    // Height fixe pour le ProductCarousel dans ce contexte (pas d'animation complexe de parallaxe pour l'instant sauf si demandé)
    const carouselHeight = useRef(new Animated.Value(CAROUSEL_HEIGHT)).current;
    const [quantity, setQuantity] = useState(1);
    const [showCartControls, setShowCartControls] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentUserId = user?.userId || user?.id || user?._id;
    const isOwner = isAuthenticated && !!user && !!vitrine && (
        String(currentUserId) === String(vitrine.ownerId) ||
        String(currentUserId) === String(vitrine.owner)
    );

    const normalizedLocations = useMemo(() => {
        if (!product?.locations) return [];
        return Array.isArray(product.locations) ? product.locations : [product.locations];
    }, [product?.locations]);

    const normalizedImages = useMemo(() => {
        if (!product?.images) return [];
        return Array.isArray(product.images) ? product.images : [product.images as unknown as string];
    }, [product?.images]);

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

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Product Image Gallery using ProductCarousel */}
                    <View style={styles.galleryContainer}>
                        <ProductCarousel
                            height={carouselHeight}
                            images={normalizedImages}
                        // onImagePress={handleImagePress} // Add handleImagePress if we want preview
                        />
                    </View>

                    {/* Product Info */}
                    <View style={[
                        styles.infoContainer,
                        {
                            backgroundColor: theme.colors.surface,
                            borderRadius: 20,
                            marginTop: 16,
                            paddingTop: 24,
                        }
                    ]}>
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

                        {normalizedLocations.length > 0 && (
                            <View style={styles.locationsContainer}>

                                <View style={styles.locationBadges}>
                                    {normalizedLocations.map((loc, idx) => (
                                        <View key={idx} style={[styles.locationBadge, { backgroundColor: theme.colors.background }]}>
                                            <Ionicons name="location-sharp" size={14} color={theme.colors.primary} />
                                            <Text style={[styles.locationText, { color: theme.colors.text }]}>{loc}</Text>
                                        </View>
                                    ))}
                                </View>
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



                        {product.stock !== undefined && (
                            <Text style={[styles.stock, { color: theme.colors.textTertiary }]}>
                                Stock: {product.stock} disponible(s)
                            </Text>
                        )}
                    </View>
                </ScrollView>

                {/* Floating Action Bar */}
                <View style={styles.floatingFooter}>
                    {/* Owner Actions */}
                    {isOwner && (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={handleEdit}
                        >
                            <Ionicons name="settings-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Gérer mon produit</Text>
                        </TouchableOpacity>
                    )}

                    {/* Visitor Actions */}
                    {!isOwner && (
                        <View>
                            {!showCartControls ? (
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => setShowCartControls(true)}
                                >
                                    <Text style={styles.buttonText}>Commander</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.cartControlsContainer, { backgroundColor: theme.colors.surface }]}>
                                    <View style={styles.quantitySection}>
                                        <Text style={[styles.quantityLabel, { color: theme.colors.text }]}>Quantité</Text>
                                        <View style={styles.quantitySelector}>
                                            <TouchableOpacity
                                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                                style={[styles.quantityBtn, { borderColor: theme.colors.border }]}
                                            >
                                                <Ionicons name="remove" size={20} color={theme.colors.text} />
                                            </TouchableOpacity>
                                            <Text style={[styles.quantityText, { color: theme.colors.text }]}>{quantity}</Text>
                                            <TouchableOpacity
                                                onPress={() => setQuantity(quantity + 1)}
                                                style={[styles.quantityBtn, { borderColor: theme.colors.border }]}
                                            >
                                                <Ionicons name="add" size={20} color={theme.colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
                                        onPress={handleAddToCart}
                                    >
                                        <Text style={styles.buttonText}>
                                            Ajouter au panier • {(product.price * quantity).toFixed(2)} {product.currency || 'USD'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

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

const createStyles = (theme: any) => StyleSheet.create({
    floatingFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: 'transparent',
    },

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
    galleryContainer: {
        marginTop: 10,
        marginBottom: 0,
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
    infoContainer: {
        padding: 16,
        marginHorizontal: 16,
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
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        flexDirection: 'row', // Added for icon
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
    ownerNote: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    leftNavButton: {
        left: 10,
    },
    rightNavButton: {
        right: 10,
    },
    cartControlsContainer: {
        padding: 16,
        borderRadius: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    quantityLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDots: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});
