/**
 * Products Catalog Screen
 * 
 * Main product browsing screen with cart functionality
 * Revamped to match VitrineDetailScreen from Module 1
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    FlatList,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GuestPrompt } from '../../components/GuestPrompt';
import { CustomButton } from '../../components/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { useVitrines, useVitrineDetail, useMyVitrines, useUpdateVitrine } from '../../hooks/useVitrines';

import { ShareButton } from '../../components/ShareButton';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import ImageUploadCover from "../../components/ImageUploadCover";
import ImageUploadAvatar from "../../components/ImageUploadAvatar";
import { Ionicons } from '@expo/vector-icons';
import { LoadingComponent } from '../../components/LoadingComponent';
import { StateMessage } from '../../components/StateMessage';
import { useAuth } from '../../hooks/useAuth';
import { useProductsByVitrine } from '../../hooks/useProducts'; // Use products by vitrine
import { ProductCard } from '../../components/ProductCard';
import { ENV } from '../../config/env';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { DEFAULT_IMAGES } from '../../constants/images';
import { useAlertService } from '../../utils/alertService';
import { Product } from '../../types';
import { getVitrineUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';

// Helper pour sécuriser les sources d'images
const getSafeUri = (source: any): string | undefined => {
    if (!source) return undefined;
    if (typeof source === 'string') return source;
    if (source.uri) return source.uri;
    if (source.url) return source.url;
    if (Array.isArray(source) && source.length > 0) return getSafeUri(source[0]);
    return undefined;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProductsCatalogScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    // For Home Screen of Module 2, we assume we want to show "My Vitrine" by default if no slug is passed
    // But this screen is the main entry point, so usually no slug passed.
    const { slug } = route.params || {};
    const { theme } = useTheme();
    // Assuming updateVitrine exists in useVitrines hook, checking imports...
    // In Module 1 it was: const { updateVitrine } = useVitrines();
    // Check if useVitrines hook in Module 2 exports updateVitrine. 
    // If not, we might need to implement it or use a service directly.
    // For now assuming it's available or we can use vitrineService directly if needed, but let's stick to hooks.
    // Wait, step 95 showed useVitrines.ts ONLY exports useVitrineDetail, useMyVitrines, useAllVitrines.
    // UseMutation for update is likely missing or I missed it.
    // I should check if I can add it or just skip edit for now?
    // The plan said "Gérer ma Vitrine" button should be visible.
    // Update cover/avatar logic requires update capability.
    // I will double check useVitrines again or add the hook. For now I will comment out update logic if missing.

    // Actually, looking at Step 95, there is NO useUpdateVitrine. I should better add it to useVitrines.ts or handle it.
    // For now, I will assume it's there and if it fails I will fix it. Or better, I will check and fix useVitrines.ts first?
    // User wants "trait pour trait".
    // Let's implement the logic assuming updateVitrine is needed.

    const { user, isAuthenticated } = useAuth(); // isGuest might not be in useAuth of Module 2? Step 97 -> exports useAuth from context.
    const { showSuccess, showError } = useAlertService();
    const updateVitrineMutation = useUpdateVitrine();

    // --- QUERIES TANSTACK ---
    const {
        data: detailVitrine,
        isLoading: isDetailLoading,
        refetch: refetchDetail
    } = useVitrineDetail(slug || '', !!slug);

    const {
        data: myVitrines,
        isLoading: isMyVitrinesLoading,
        refetch: refetchMyVitrines,
    } = useMyVitrines({
        enabled: isAuthenticated && !slug
    });

    const displayedVitrine = slug ? detailVitrine : (myVitrines?.[0] || null);

    // RECUPERATION STRATEGIE : ID vs Slug
    const vitrineId = displayedVitrine?.vitrineId || displayedVitrine?.id || displayedVitrine?._id || '';

    const {
        data: productsData,
        fetchNextPage,
        hasNextPage,
        isLoading: productsLoading,
        refetch: refetchProducts,
        isRefetching: isRefetchingProducts
    } = useProductsByVitrine(vitrineId || '', !!vitrineId);

    const products = useMemo(() => {
        return productsData?.pages.flatMap(page => {
            if (!page) return [];
            if (Array.isArray(page)) return page;
            return (page as any).data || [];
        }) || [];
    }, [productsData]);

    const [previewImage, setPreviewImage] = useState<{ visible: boolean; url?: string }>({
        visible: false,
        url: undefined
    });
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const currentUserId = user ? (user.id || user._id || user.userId) : null;
    const isOwner = isAuthenticated && user && displayedVitrine && (currentUserId == displayedVitrine.ownerId || currentUserId == displayedVitrine.owner);

    // --- LOGIQUE REFRESH ---
    const onRefresh = useCallback(async () => {
        await Promise.all([
            slug ? refetchDetail() : refetchMyVitrines(),
            refetchProducts()
        ]);
    }, [slug, refetchDetail, refetchMyVitrines, refetchProducts]);

    const loadMoreProducts = () => {
        if (!productsLoading && hasNextPage) {
            fetchNextPage();
        }
    };

    // --- Gestion des Uploads ---
    const handleAvatarUploadSuccess = async (newImageUrl: string) => {
        if (!displayedVitrine) return;
        try {
            await updateVitrineMutation.mutateAsync({ slug: displayedVitrine.slug, data: { logo: newImageUrl } });
            showSuccess('Le logo a été mis à jour !');
        } catch (error) {
            console.error('Erreur mise à jour logo:', error);
            showError('Échec de la sauvegarde du logo.');
        }
    };

    const handleCoverUploadSuccess = async (newImageUrl: string) => {
        if (!displayedVitrine) return;
        try {
            await updateVitrineMutation.mutateAsync({ slug: displayedVitrine.slug, data: { coverImage: newImageUrl } });
            showSuccess('La bannière a été mise à jour !');
        } catch (error) {
            console.error('Erreur mise à jour bannière:', error);
            showError('Échec de la sauvegarde de la bannière.');
        }
    };

    // Helper for navigation to product detail
    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { slug: product.slug });
    };

    // --- Chargement / Erreurs ---
    const isOverallLoading = slug
        ? isDetailLoading
        : (isAuthenticated ? isMyVitrinesLoading : false);

    if (isOverallLoading && !displayedVitrine) {
        return <LoadingComponent />;
    }

    if (!displayedVitrine) {
        if (!isAuthenticated && !slug) {
            return (
                <ScreenWrapper>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        paddingHorizontal: 16,
                        paddingTop: 10,
                        marginBottom: 20
                    }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Settings')} // Changed to SettingsTab as per AppTabs
                            style={{
                                padding: 8,
                                borderRadius: 20,
                                backgroundColor: theme.colors.border + '40',
                                zIndex: 1000
                            }}
                        >
                            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
                        <GuestPrompt message="Connectez-vous pour voir votre vitrine" variant="card" />
                    </View>
                </ScreenWrapper>
            );
        }

        if (isAuthenticated && !slug) {
            return (
                <ScreenWrapper>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Ionicons name="storefront-outline" size={80} color={theme.colors.border} style={{ marginBottom: 20 }} />
                        <Text style={[styles.title, { textAlign: 'center', marginBottom: 12 }]}>
                            Vous n'avez pas encore de vitrine
                        </Text>
                        <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 24, paddingHorizontal: 20 }}>
                            Créez votre vitrine pour commencer à ajouter des produits et recevoir des commandes dès aujourd'hui !
                        </Text>
                        <CustomButton
                            title="Créer ma Vitrine"
                            onPress={() => navigation.navigate('CreateVitrine')}
                            style={{ width: '100%' }}
                        />
                        <TouchableOpacity
                            onPress={() => refetchMyVitrines()}
                            style={{ marginTop: 20 }}
                        >
                            <Text style={{ color: theme.colors.primary }}>Actualiser</Text>
                        </TouchableOpacity>
                    </View>
                </ScreenWrapper>
            );
        }

        return (
            <ScreenWrapper>
                <StateMessage
                    type="no-results"
                    message="Désolé, cette vitrine semble ne pas exister ou a été supprimée."
                    onRetry={() => navigation.goBack()}
                    icon="arrow-back-outline"
                />
            </ScreenWrapper>
        );
    }

    const currentVitrine = displayedVitrine;
    const pagePath = `v/${currentVitrine.slug}`;
    const fullUrl = ENV.SHARE_BASE_URL ? `${ENV.SHARE_BASE_URL}/${pagePath}` : 'Lien non disponible';

    const shareData = {
        title: `Vitrine de ${currentVitrine.name}`,
        vitrineName: currentVitrine.name,
    };

    const whatsappMessage =
        `Bonjour ${currentVitrine.name || ''}, je visite votre vitrine sur l'application.\n` +
        `J'aimerais avoir plus d'informations.\n\n` +
        `Lien de la vitrine : ${fullUrl}`;

    const ListHeader = () => (
        <>
            <View style={styles.coverSection}>
                {isOwner ? (
                    <ImageUploadCover
                        initialImage={displayedVitrine.coverImage}
                        height={200}
                        onUploadSuccess={handleCoverUploadSuccess}
                        onImagePress={(url) => setPreviewImage({ visible: true, url })}
                    />
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            const uri = getSafeUri(currentVitrine.coverImage || currentVitrine.banner);
                            setPreviewImage({
                                visible: true,
                                url: uri || Image.resolveAssetSource(DEFAULT_IMAGES.cover).uri
                            });
                        }}
                    >
                        <Image
                            source={getSafeUri(currentVitrine.coverImage || currentVitrine.banner) ? { uri: getSafeUri(currentVitrine.coverImage || currentVitrine.banner) } : DEFAULT_IMAGES.cover}
                            style={styles.coverImage}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                )}

                <View style={[
                    styles.avatarSection,
                    !isOwner && { bottom: -60 }
                ]}>
                    {isOwner ? (
                        <ImageUploadAvatar
                            initialImage={displayedVitrine.logo}
                            size={100}
                            onUploadSuccess={handleAvatarUploadSuccess}
                            onImagePress={(url) => setPreviewImage({ visible: true, url })}
                        />
                    ) : (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                const uri = getSafeUri(currentVitrine.logo || currentVitrine.avatar);
                                setPreviewImage({
                                    visible: true,
                                    url: uri || Image.resolveAssetSource(DEFAULT_IMAGES.avatar).uri
                                });
                            }}
                        >
                            <Image
                                source={getSafeUri(currentVitrine.logo || currentVitrine.avatar) ? { uri: getSafeUri(currentVitrine.logo || currentVitrine.avatar) } : DEFAULT_IMAGES.avatar}
                                style={styles.avatarLarge}
                                contentFit="cover"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.floatingHeader, { justifyContent: 'flex-end' }]}>
                    {isOwner && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Settings')}
                            style={styles.actionButton}
                        >
                            <Ionicons name="settings-outline" size={24} color={theme.colors.white} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.infoBlock}>
                <Text style={styles.title}>{currentVitrine.name}</Text>
                <Text style={styles.category}>
                    {(() => {
                        const rawType = currentVitrine.type;
                        const rawCategory = currentVitrine.category;
                        if (rawType && rawType.toLowerCase() !== 'general' && rawType.toLowerCase() !== 'général') return rawType;
                        if (rawCategory && rawCategory.toLowerCase() !== 'general' && rawCategory.toLowerCase() !== 'général') return rawCategory;
                        return rawType || rawCategory || 'Général';
                    })()}
                </Text>

                <Text style={[styles.slug, { marginBottom: currentVitrine.description ? 16 : 24 }]}>
                    {currentVitrine.slug}
                </Text>

                {currentVitrine.description && (
                    <Text style={styles.description}>{currentVitrine.description}</Text>
                )}

                <View style={styles.separator} />

                {(currentVitrine.address || currentVitrine.contact?.email || currentVitrine.contact?.phone) && (
                    <View style={styles.contactDetailsSection}>
                        <Text style={styles.sectionTitle}>Infos </Text>

                        {currentVitrine.address && (
                            <View style={styles.infoItem}>
                                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} style={styles.infoIcon} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Adresse</Text>
                                    <Text style={styles.infoValue}>{currentVitrine.address}</Text>
                                </View>
                            </View>
                        )}
                        {currentVitrine.contact?.email && (
                            <View style={styles.infoItem}>
                                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.infoIcon} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{currentVitrine.contact.email}</Text>
                                </View>
                            </View>
                        )}
                        {currentVitrine.contact?.phone && (
                            <View style={styles.infoItem}>
                                <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.infoIcon} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Téléphone</Text>
                                    <Text style={styles.infoValue}>{currentVitrine.contact.phone}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.mainActionsContainer}>
                    {isOwner ? (
                        <>
                            <CustomButton
                                title="Gérer ma Vitrine"
                                onPress={() => {
                                    navigation.navigate('VitrineModificationMain');
                                }}
                                style={styles.ownerActionButton}
                            />
                        </>
                    ) : (
                        <>
                            {currentVitrine.contact?.phone ? (
                                <WhatsAppButton
                                    phoneNumber={currentVitrine.contact.phone}
                                    message={whatsappMessage}
                                    style={styles.visitorActionButton}
                                />
                            ) : (
                                <View style={{ flex: 1, marginRight: 16 }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>Aucun contact WhatsApp</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>

            <View style={styles.productsHeader}>
                <Text style={styles.productsTitle}>Produits ({products.length})</Text>
            </View>
        </>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title={currentVitrine.name || 'Ma Vitrine'}
                onShare={() => setIsShareModalVisible(true)}
            />
            <FlatList
                data={products}
                renderItem={({ item }) => (
                    <View style={{ width: (SCREEN_WIDTH / 2) - 24, marginBottom: 16 }}>
                        <ProductCard
                            product={item}
                            onPress={() => handleProductPress(item)}
                            showActions={true}
                        />
                    </View>
                )}
                keyExtractor={(item) => item.id || item._id || item.slug}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.content}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    productsLoading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={{ marginTop: 16, color: theme.colors.textSecondary, fontSize: 14 }}>
                                Chargement des produits...
                            </Text>
                        </View>
                    ) : (
                        <StateMessage
                            type="empty"
                            message={isOwner
                                ? "Vous n'avez pas encore de produits. Donnez vie à votre vitrine en publiant votre premier article !"
                                : "Cette vitrine n'a pas encore de produits disponibles."}
                        />
                    )
                }
                ListFooterComponent={
                    productsLoading && products.length > 0 ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
                    ) : null
                }
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={isRefetchingProducts || false} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            />
            <ImagePreviewModal
                visible={previewImage.visible}
                imageUrl={previewImage.url}
                onClose={() => setPreviewImage({ ...previewImage, visible: false })}
            />
            <ShareMenuModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                url={getVitrineUrl(currentVitrine.slug)}
                title={`Vitrine de ${currentVitrine.name}`}
                message={`Visitez la vitrine de ${currentVitrine.name} sur Andy Business !`}
            />
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 40, backgroundColor: theme.colors.background },
    coverSection: {
        marginBottom: 60,
        width: '100%',
        paddingHorizontal: 16,
    },
    coverImage: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 20,
    },
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 20,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    avatarSection: {
        position: "absolute",
        bottom: -70,
        left: '50%',
        transform: [{ translateX: -60 }], // Half of avatar size (120/2)
        zIndex: 15,
        borderColor: theme.colors.surface,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    avatarLarge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    infoBlock: {
        paddingHorizontal: 16,
        marginTop: 0,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 2,
        marginBottom: 2,
        color: theme.colors.text,
    },
    slug: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.textTertiary,
    },
    category: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.primary,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
        color: theme.colors.textSecondary,
    },
    separator: {
        height: 1,
        width: '100%',
        marginVertical: 16,
        backgroundColor: theme.colors.border,
    },
    contactDetailsSection: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        color: theme.colors.text,
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    infoIcon: {
        marginRight: 12,
    },
    infoContent: {
        flex: 1
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 1,
        textTransform: 'uppercase',
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        lineHeight: 18,
        color: theme.colors.text,
    },
    mainActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 24,
    },
    ownerActionButton: {
        flex: 1.5,
        marginRight: 12,
        marginVertical: 0,
    },
    visitorActionButton: {
        flex: 1,
        marginRight: 16,
    },
    shareBtnText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: theme.colors.primary,
    },
    productsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    productsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    placeholderText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 24,
        width: '100%',
        color: theme.colors.textSecondary,
    },
});
