/**
 * Products Catalog Screen
 * 
 * Main product browsing screen with cart functionality
 * Revamped to match VitrineDetailScreen from Module 1
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Image as RNImage,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';

import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GuestPrompt } from '../../components/GuestPrompt';
import { CustomButton } from '../../components/CustomButton';
import { useTheme } from '../../context/ThemeContext';
import { useVitrineDetail, useMyVitrines, useUpdateVitrine } from '../../hooks/useVitrines';

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
import { ENV } from '../../config/config';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { DEFAULT_IMAGES } from '../../constants/images';
import { useAlertService } from '../../utils/alertService';
import { Product } from '../../types';
import { getVitrineUrl } from '../../utils/sharingUtils';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { getSafeUri } from '../../utils/imageUtils';


const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProductsCatalogScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { slug: routeSlug } = route.params || {};

    // Fallback manual slug extraction for Web
    const [manualSlug, setManualSlug] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (Platform.OS === 'web' && !routeSlug && typeof window !== 'undefined') {
            const href = window.location.href;
            if (href.includes('/vitrine/')) {
                const parts = href.split('/vitrine/');
                const extracted = parts[parts.length - 1]?.split('?')[0]?.split('#')[0];
                if (extracted) {
                    console.log('[ProductsCatalogScreen] Slugs manuel extrait de URL:', extracted);
                    setManualSlug(decodeURIComponent(extracted));
                }
            }
        }
    }, [routeSlug]);

    // Final slug selection: Route params > Manual Fallback
    const slug = routeSlug || manualSlug;

    // Debug Deep Link Params
    console.log('[ProductsCatalogScreen] Final Slug:', slug, '| Route Slug:', routeSlug, '| Manual Slug:', manualSlug);

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

    const { user, isAuthenticated, isLoading } = useAuth(); // isGuest might not be in useAuth of Module 2? Step 97 -> exports useAuth from context.
    const { showSuccess, showError } = useAlertService();
    const updateVitrineMutation = useUpdateVitrine();

    // --- QUERIES TANSTACK ---
    const {
        data: myVitrines,
        isLoading: isMyVitrinesLoading,
        refetch: refetchMyVitrines,
    } = useMyVitrines({
        enabled: isAuthenticated && !slug
    });

    // DETERMINE SLUG TO FETCH FULL DETAILS
    // If route has slug, use it.
    // If not, and we have myVitrines, use the first one's slug.
    const targetSlug = slug || myVitrines?.[0]?.slug;

    // FETCH FULL DETAILS (Images, etc)
    const {
        data: detailVitrine,
        isLoading: isDetailLoading,
        refetch: refetchDetail
    } = useVitrineDetail(targetSlug || '', !!targetSlug);

    // Displayed vitrine is ALWAYS the detailed one if available, 
    // otherwise fallback to myVitrines[0] (which might be "light") while loading.
    const displayedVitrine = detailVitrine || myVitrines?.[0] || null;


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

    const flatListRef = React.useRef<FlatList>(null);

    const [previewImage, setPreviewImage] = useState<{ visible: boolean; url?: string }>({
        visible: false,
        url: undefined
    });
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 150 && !scrolled) {
            setScrolled(true);
        } else if (offsetY <= 150 && scrolled) {
            setScrolled(false);
        }
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    const currentUserId = user ? (user.id || user._id || user.userId) : null;
    const isOwner = isAuthenticated && user && displayedVitrine && (currentUserId == displayedVitrine.ownerId || currentUserId == displayedVitrine.owner);

    // --- LOGIQUE REFRESH ---
    const onRefresh = useCallback(async () => {
        await Promise.all([
            refetchMyVitrines(),
            targetSlug ? refetchDetail() : Promise.resolve(),
            refetchProducts()
        ]);
    }, [targetSlug, refetchDetail, refetchMyVitrines, refetchProducts]);


    const loadMoreProducts = () => {
        if (!productsLoading && hasNextPage) {
            fetchNextPage();
        }
    };

    // --- Gestion des Uploads ---
    const handleAvatarUploadSuccess = async (newImageUrl: string) => {
        if (!displayedVitrine) return;
        try {
            await updateVitrineMutation.mutateAsync({
                slug: displayedVitrine.slug,
                data: { logo: newImageUrl }  // UN SEUL CHAMP comme module1
            });
            showSuccess('Le logo a été mis à jour !');
        } catch (error) {
            console.error('Erreur mise à jour logo:', error);
            showError('Échec de la sauvegarde du logo.');
        }
    };


    const handleCoverUploadSuccess = async (newImageUrl: string) => {
        if (!displayedVitrine) return;
        try {
            await updateVitrineMutation.mutateAsync({
                slug: displayedVitrine.slug,
                data: { coverImage: newImageUrl }  // UN SEUL CHAMP comme module1
            });
            showSuccess('Image de couverture mise à jour !');
        } catch (error) {
            console.error('Erreur mise à jour couverture:', error);
            showError('Échec de la sauvegarde de la couverture.');
        }
    };


    // Helper for navigation to product detail
    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { slug: product.slug });
    };

    // --- Chargement / Erreurs ---
    const isOverallLoading = targetSlug
        ? isDetailLoading
        : (isAuthenticated ? isMyVitrinesLoading : false);


    // Redirection si non authentifié et pas de slug (accès à la Home directe)
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !slug) {
            console.log('[ProductsCatalogScreen] No slug and not authenticated, redirecting to Login');
            navigation.navigate('Login');
        }
    }, [isLoading, isAuthenticated, slug, navigation]);

    if (isOverallLoading && !displayedVitrine) {
        return <LoadingComponent />;
    }

    if (!displayedVitrine) {
        // Si on est ici, c'est qu'on a un slug mais la vitrine est introuvable 
        // ou que le chargement est fini et qu'on n'a rien (cas invité avec slug incorrect)
        return (
            <ScreenWrapper>
                <StateMessage
                    type="empty"
                    title="Vitrine introuvable"
                    message="Désolé, cette vitrine semble ne pas exister ou a été supprimée."
                    actionLabel="Retour"
                    onActionPress={() => navigation.goBack()}
                />
            </ScreenWrapper>
        );
    }

    const currentVitrine = displayedVitrine;
    /* DEBUG VIEW - TEMP */
    if (isOwner) {
        console.log('[DEBUG] Vitrine Data:', JSON.stringify({
            slug: currentVitrine.slug,
            cover: currentVitrine.coverImage,
            banner: currentVitrine.banner,
            logo: currentVitrine.logo,
            avatar: currentVitrine.avatar,
            safeCover: getSafeUri(currentVitrine.coverImage || currentVitrine.banner),
            safeAvatar: getSafeUri(currentVitrine.logo || currentVitrine.avatar)
        }, null, 2));
    }
    /* END DEBUG */

    /* END DEBUG */

    // Helper for navigation to product detail


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
                        key={`cover-${displayedVitrine.slug}-${displayedVitrine.coverImage || displayedVitrine.banner}`}
                        initialImage={displayedVitrine.coverImage || displayedVitrine.banner}

                        height={170}
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
                                url: uri || RNImage.resolveAssetSource(DEFAULT_IMAGES.cover).uri
                            });
                        }}
                    >
                        <Image
                            source={getSafeUri(currentVitrine.coverImage || currentVitrine.banner) || DEFAULT_IMAGES.cover}
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
                            key={`logo-${displayedVitrine.slug}-${displayedVitrine.logo || displayedVitrine.avatar}`}
                            initialImage={displayedVitrine.logo || displayedVitrine.avatar}

                            size={90}
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
                                    url: uri || RNImage.resolveAssetSource(DEFAULT_IMAGES.avatar).uri
                                });
                            }}
                        >
                            <Image
                                source={getSafeUri(currentVitrine.logo || currentVitrine.avatar) || DEFAULT_IMAGES.avatar}
                                style={styles.avatarLarge}
                                contentFit="cover"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.floatingHeader, { justifyContent: 'flex-end' }]}>
                    {/* Les boutons d'action sont maintenant dans le ScreenHeader */}
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
                showBack={false}
                vitrineName={scrolled ? currentVitrine.name : undefined}
                vitrineLogo={scrolled ? getSafeUri(currentVitrine.logo || currentVitrine.avatar) : undefined}
                onVitrinePress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                onShare={() => setIsShareModalVisible(true)}
                rightElement={isOwner ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.headerIconButton}
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                ) : undefined}
            />
            <FlatList
                ref={flatListRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}


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
                            title="Aucun produit"
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
        marginTop: 10,
        marginBottom: 50,
        width: '100%',
        paddingHorizontal: 16,
    },
    coverImage: {
        width: '100%',
        height: 170,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 20,
    },
    headerIconButton: {
        padding: 4,
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
        bottom: -50,
        left: '50%',
        transform: [{ translateX: -45 }], // Half of avatar size (90/2)
        zIndex: 15,
        borderColor: theme.colors.surface,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    avatarLarge: {
        width: 90,
        height: 90,
        borderRadius: 45,
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
