/**
 * Product Detail Screen
 * 
 * Single product view with details and add to cart
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, Dimensions, Platform, Animated, useWindowDimensions } from 'react-native';
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
import { activityTracker } from '../../services/activityTracker';

const CAROUSEL_HEIGHT = 350;

import { useCart } from '../../context/CartContext';

export const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const MAX_WIDTH = 800;

    const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showConfirm } = useAlertService();
    const { addToCart, updateQuantity, removeFromCart, cart } = useCart();

    const { slug } = route.params || {};
    const { data: product, isLoading } = useProductDetail(slug);
    const { data: vitrine } = useVitrineDetail(product?.vitrineId || '', !!product?.vitrineId);
    const deleteProductMutation = useDeleteProduct();

    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

    // Height fixe pour le ProductCarousel dans ce contexte
    const carouselHeight = useRef(new Animated.Value(CAROUSEL_HEIGHT)).current;
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Quantity is driven by cart context — persists across renders
    const productId = product?.id || product?._id || '';
    const cartItem = cart.find((item) => (item.product.id || item.product._id) === productId);
    const quantity = cartItem?.quantity ?? 0;

    const handleIncrement = () => {
        if (product) addToCart(product, 1);
    };

    const handleDecrement = () => {
        if (!product) return;
        if (quantity <= 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, quantity - 1);
        }
    };


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

    const handleEdit = () => {
        console.log('Navigating to ProductManagement for editing');
        navigation.navigate('ProductManagement', { productId: product?.id || product?._id });
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
                onShare={() => {
                    activityTracker.track('SHARE_PRODUCT', {
                        productId: product.id || product._id,
                        productName: product.name,
                        vitrineId: product.vitrineId
                    });
                    setIsShareModalVisible(true);
                }}
            />

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: 160 }}
                >
                    {/* Product Content with Responsive Layout */}
                    <View style={isDesktop ? styles.rowContent : styles.container}>
                        {/* Product Image Gallery using ProductCarousel */}
                        <View style={[styles.galleryContainer, isDesktop && styles.galleryDesktop]}>
                            <ProductCarousel
                                height={isDesktop ? 450 : carouselHeight}
                                images={normalizedImages}
                            />
                        </View>

                        {/* Product Info */}
                        <View style={[
                            styles.infoContainer,
                            {
                                backgroundColor: theme.colors.surface,
                                borderRadius: 20,
                                marginTop: isDesktop ? 0 : 16,
                                paddingTop: 24,
                            },
                            isDesktop && styles.infoDesktop
                        ]}>
                            <Text style={[styles.productName, { color: theme.colors.text }]}>
                                {product.name}
                            </Text>
                            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                                {product.price.toFixed(2)} {product.currency || 'USD'}
                            </Text>

                            <View style={styles.deliveryContainer}>
                                <Ionicons
                                    name="car-outline"
                                    size={18}
                                    color={product.deliveryFee ? theme.colors.textSecondary : '#34C759'}
                                />
                                <Text style={[
                                    styles.deliveryText,
                                    { color: product.deliveryFee ? theme.colors.textSecondary : '#34C759' }
                                ]}>
                                    {product.deliveryFee
                                        ? `Frais de livraison: ${product.deliveryFee.toFixed(2)} ${product.currency || 'USD'}`
                                        : 'Livraison gratuite'}
                                </Text>
                            </View>

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
                    </View>
                </ScrollView>

                {/* Floating Action Bar */}
                <View style={[styles.floatingFooter, isDesktop && { maxWidth: MAX_WIDTH, alignSelf: 'center' }]}>
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
                        <View style={[styles.compactCartControls, { backgroundColor: theme.colors.surface }]}>
                            <View style={[styles.compactQuantitySelector, { borderColor: theme.colors.border }]}>
                                <TouchableOpacity
                                    onPress={handleDecrement}
                                    style={styles.compactQtyBtn}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={18}
                                        color={quantity > 0 ? theme.colors.primary : theme.colors.textTertiary}
                                    />
                                </TouchableOpacity>
                                <Text style={[styles.compactQtyText, {
                                    color: quantity > 0 ? theme.colors.primary : theme.colors.text
                                }]}>
                                    {quantity}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleIncrement}
                                    style={styles.compactQtyBtn}
                                >
                                    <Ionicons name="add" size={18} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>

                            {quantity > 0 && (
                                <View style={styles.cartSummary}>
                                    <Ionicons name="cart" size={15} color={theme.colors.primary} />
                                    <Text style={[styles.cartSummaryText, { color: theme.colors.primary }]}>
                                        {quantity} × {product.price.toFixed(2)} = {(product.price * quantity).toFixed(2)} {product.currency || 'USD'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View >

            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getProductUrl(product.slug)}
                title={`Partager ${product.name}`}
                message={`Découvrez ${product.name} sur Andy Business !`}
            />
        </View >
    );
};

const createStyles = (theme: any, isDesktop: boolean) => StyleSheet.create({
    rowContent: {
        flexDirection: 'row',
        padding: 16,
        gap: 20,
    },
    galleryDesktop: {
        flex: 1,
        marginTop: 0,
    },
    infoDesktop: {
        flex: 1,
        marginHorizontal: 0,
        height: '100%',
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
    deliveryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    deliveryText: {
        fontSize: 15,
        fontWeight: '500',
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
    compactCartControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        gap: 10,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    compactQuantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 10,
        height: 40,
        paddingHorizontal: 4,
        width: 110,
    },
    compactQtyBtn: {
        padding: 6,
    },
    compactQtyText: {
        fontSize: 15,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
    cartSummary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary + '15',
        height: 40,
        borderRadius: 10,
        gap: 6,
        paddingHorizontal: 8,
    },
    cartSummaryText: {
        fontSize: 14,
        fontWeight: '700',
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
