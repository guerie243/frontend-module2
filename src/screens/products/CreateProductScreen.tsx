/**
 * Create Product Screen
 * 
 * Form for creating new products with image upload
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getSafeUri } from '../../utils/imageUtils';
import { useCreateProduct } from '../../hooks/useProducts';
import { useMyVitrines } from '../../hooks/useVitrines';
import { useAuth } from '../../hooks/useAuth';
import ImagePictureUploader from '../../components/ImagePictureUploader';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { AnimatedSelect } from '../../components/AnimatedSelect';
import { GuestPrompt } from '../../components/GuestPrompt';
import { LoadingComponent } from '../../components/LoadingComponent';
import { activityTracker } from '../../services/activityTracker';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';
import { CURRENCY_OPTIONS } from '../../constants/currencies';
import { DRC_CITIES, LOCATION_OPTIONS } from '../../constants/locations';

interface ImageItem {
    uri: string;
    id: string;
}

export const CreateProductScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError } = useAlertService();
    const { isGuest, isAuthenticated, isLoading } = useAuth();
    const createProductMutation = useCreateProduct();

    // Get specific vitrine from params if coming from a specific vitrine management
    const requestedVitrineId = route.params?.vitrineId;

    // Get user's vitrines
    const { data: myVitrines = [], isLoading: isVitrinesLoading, refetch: refetchVitrines } = useMyVitrines({
        enabled: isAuthenticated
    });

    // Determine active vitrine
    const activeVitrine = requestedVitrineId
        ? (myVitrines.find(v => v.id === requestedVitrineId || v._id === requestedVitrineId || v.vitrineId === requestedVitrineId) || myVitrines[0])
        : myVitrines[0];

    const vitrineId = activeVitrine?.vitrineId || activeVitrine?.id || activeVitrine?._id || '';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [category, setCategory] = useState('');
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    // Removed commune
    const [isDeliveryPaid, setIsDeliveryPaid] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState('');
    const [images, setImages] = useState<ImageItem[]>([]);

    const handleCreateProduct = async () => {
        // Validation
        if (!name.trim()) {
            showError('Veuillez entrer le nom du produit');
            return;
        }

        if (!price || parseFloat(price) <= 0) {
            showError('Veuillez entrer un prix valide');
            return;
        }

        if (!category) {
            showError('Veuillez sélectionner une catégorie');
            return;
        }

        if (!vitrineId) {
            showError('Vitrine non trouvée. Veuillez créer une vitrine d\'abord.');
            return;
        }

        if (images.length === 0) {
            showError('Veuillez ajouter au moins une image');
            return;
        }

        if (selectedCities.length === 0) {
            showError('Veuillez sélectionner au moins une ville');
            return;
        }

        console.log('Creating product:', name, 'for vitrine:', vitrineId);

        console.log('[CreateProductScreen] Submitting product creation');
        console.log('[CreateProductScreen] Images count:', images.length);
        images.forEach((img, index) => console.log(`[CreateProductScreen] Image ${index}:`, img));

        try {
            const productData = {
                vitrineId,
                name: name.trim(), // Kept trim from original, as it's good practice
                description: description.trim() || undefined, // Kept trim from original
                price: parseFloat(price) || 0,
                // On n'envoie que les URIs pour que toFormData les traite
                images: images.map(img => img.uri),
                category: category || '', // Used 'category' as 'categorySlug' was not defined
                currency,
                locations: selectedCities.length > 0 ? selectedCities : undefined,
                deliveryFee: (isDeliveryPaid && deliveryFee) ? parseFloat(deliveryFee) : undefined, // Kept from original
            };

            console.log('[CreateProductScreen] Calling createProductMutation with data:', JSON.stringify(productData, null, 2));

            await createProductMutation.mutateAsync(productData);
            showSuccess('Produit créé avec succès');
            console.log('Product created successfully');

            // Reset form
            setName('');
            setDescription('');
            setPrice('');
            setImages([]);

            // TRACKING
            activityTracker.track('PRODUCT_CREATE', {
                vitrineId,
                productName: productData.name,
                category: productData.category
            });

            navigation.goBack();
        } catch (error: any) {
            console.error('Product creation failed:', error.message);
            showError(error.message || 'Échec de la création du produit');
        }
    };

    // Redirection si non authentifié
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log('[CreateProductScreen] Not authenticated, redirecting to Login');
            navigation.navigate('Login');
        }
    }, [isLoading, isAuthenticated, navigation]);

    // 2. Show loading while fetching vitrines
    if (isVitrinesLoading) {
        return <LoadingComponent message="Chargement de vos informations..." />;
    }

    // 3. Show message if no vitrines found
    if (isAuthenticated && myVitrines.length === 0) {
        return (
            <ScreenWrapper>
                <View style={[styles.centerContainer, { padding: 20 }]}>
                    <Text style={[styles.title, { color: theme.colors.text, marginBottom: 12 }]}>
                        Vous n'avez pas encore de vitrine
                    </Text>
                    <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 24 }}>
                        Une vitrine est nécessaire pour pouvoir ajouter des produits.
                    </Text>
                    <CustomButton
                        title="Créer ma Vitrine"
                        onPress={() => navigation.navigate('CreateVitrine')}
                    />
                    <TouchableOpacity
                        onPress={() => refetchVitrines()}
                        style={{ marginTop: 20 }}
                    >
                        <Text style={{ color: theme.colors.primary }}>Actualiser</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader
                title="Ajouter un produit"
                vitrineName={activeVitrine?.name}
                vitrineLogo={getSafeUri(activeVitrine?.logo || activeVitrine?.avatar)}
                onVitrinePress={() => activeVitrine?.slug && navigation.navigate('VitrineDetail', { slug: activeVitrine.slug })}
            />
            <ScreenWrapper scrollable contentContainerStyle={styles.contentContainer}>
                <View style={styles.container}>



                    <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m }]}>
                        <CustomInput
                            label="Nom du produit *"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: T-shirt rouge"
                        />

                        <CustomInput
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Description détaillée du produit"
                            multiline
                            numberOfLines={4}
                            style={{ minHeight: 100, textAlignVertical: 'top' }}
                        />

                        <AnimatedSelect
                            label="Catégorie *"
                            value={category}
                            onChange={setCategory}
                            options={PRODUCT_CATEGORIES.filter(c => c.id !== '').map(c => ({ label: c.label, value: c.id }))}
                            placeholder="Sélectionner une catégorie"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 2, marginRight: 8 }}>
                                <CustomInput
                                    label="Prix *"
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AnimatedSelect
                                    label="Devise"
                                    value={currency}
                                    onChange={setCurrency}
                                    options={CURRENCY_OPTIONS.map(c => ({ label: c.label, value: c.value }))}
                                />
                            </View>
                        </View>

                        <AnimatedSelect
                            label="Villes de disponibilité *"
                            value={selectedCities}
                            onChange={setSelectedCities}
                            options={DRC_CITIES.map(l => ({ label: l.label, value: l.value }))}
                            placeholder="Sélectionner une ou plusieurs villes"
                            multiple={true}
                        />

                        {/* Commune selection removed as per request */}

                        <View style={styles.toggleContainer}>
                            <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>
                                La livraison est payante ?
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsDeliveryPaid(!isDeliveryPaid)}
                                style={[
                                    styles.toggle,
                                    {
                                        backgroundColor: isDeliveryPaid ? theme.colors.primary : theme.colors.background,
                                        borderColor: isDeliveryPaid ? theme.colors.primary : theme.colors.border
                                    }
                                ]}
                            >
                                <View style={[
                                    styles.toggleCircle,
                                    {
                                        backgroundColor: '#FFFFFF',
                                        transform: [{ translateX: isDeliveryPaid ? 20 : 0 }]
                                    }
                                ]} />
                            </TouchableOpacity>
                        </View>

                        {isDeliveryPaid && (
                            <CustomInput
                                label="Frais de livraison"
                                value={deliveryFee}
                                onChangeText={setDeliveryFee}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                icon="car-outline"
                            />
                        )}

                        <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
                            Images du produit (Max 5) *
                        </Text>
                        <ImagePictureUploader images={images} setImages={setImages} />
                    </View>

                    <View style={styles.footer}>
                        <CustomButton
                            title="Créer le produit"
                            onPress={handleCreateProduct}
                            isLoading={createProductMutation.isPending}
                            style={{ marginBottom: 0 }}
                        />
                    </View>
                </View>
            </ScreenWrapper>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    section: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 12,
        marginBottom: 6,
    },
    imageLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 20,
        marginBottom: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        marginBottom: 8,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 5,
        borderWidth: 1,
    },
    toggleCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    footer: {
        marginTop: 32,
        marginBottom: 40,
    },
});
