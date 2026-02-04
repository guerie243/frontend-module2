/**
 * Edit Product Screen
 * 
 * Form for updating existing products
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getSafeUri } from '../../utils/imageUtils';
import { useProductDetail, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import { useMyVitrines } from '../../hooks/useVitrines';
import ImagePictureUploader from '../../components/ImagePictureUploader';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { AnimatedSelect } from '../../components/AnimatedSelect';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';
import { CURRENCY_OPTIONS } from '../../constants/currencies';
import { LOCATION_OPTIONS } from '../../constants/locations';

interface ImageItem {
    uri: string;
    id: string;
}

export const EditProductScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError, showConfirm } = useAlertService();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();

    // Get user's vitrine to display name
    const { data: myVitrines = [] } = useMyVitrines();

    const { productId } = route.params || {};
    const { data: product, isLoading } = useProductDetail(productId);

    // Find the vitrine associated with this product
    const activeVitrine = myVitrines.find(v => v.id === product?.vitrineId || v._id === product?.vitrineId || v.vitrineId === product?.vitrineId);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('DZD');
    const [category, setCategory] = useState('');
    const [locations, setLocations] = useState<string[]>([]);
    const [isDeliveryPaid, setIsDeliveryPaid] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState('');
    const [images, setImages] = useState<ImageItem[]>([]);

    // Prefill form when product loads
    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price?.toString() || '');
            setCurrency(product.currency || 'DZD');
            setCategory(product.category || '');
            if (product.locations) {
                setLocations(Array.isArray(product.locations) ? product.locations : [product.locations]);
            } else {
                setLocations([]);
            }
            const hasDeliveryFee = !!product.deliveryFee && product.deliveryFee > 0;
            setIsDeliveryPaid(hasDeliveryFee);
            setDeliveryFee(product.deliveryFee?.toString() || '');
            if (product.images) {
                setImages(product.images.map((url: string) => ({
                    uri: url,
                    id: Math.random().toString(36).substring(2, 9)
                })));
            }
        }
    }, [product]);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleUpdateProduct = async () => {
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

        console.log('Updating product:', name);

        try {
            const productData = {
                name: name.trim(),
                description: description.trim() || undefined,
                price: parseFloat(price),
                currency,
                category,
                locations: locations.length > 0 ? locations : undefined,
                deliveryFee: (isDeliveryPaid && deliveryFee) ? parseFloat(deliveryFee) : undefined,
                images: images.map((img: ImageItem) => img.uri),
            };

            await updateProductMutation.mutateAsync({ id: productId, data: productData });
            showSuccess('Produit mis à jour');
            console.log('Product updated successfully');
            navigation.goBack();
        } catch (error: any) {
            console.error('Product update failed:', error.message);
            showError(error.message || 'Échec de la mise à jour');
        }
    };

    const handleDeleteProduct = () => {
        showConfirm(
            'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
            () => {
                setIsDeleting(true);
                // 3 seconds delay as requested
                setTimeout(async () => {
                    try {
                        await deleteProductMutation.mutateAsync(productId);
                        showSuccess('Produit supprimé');
                        navigation.goBack();
                    } catch (error: any) {
                        setIsDeleting(false);
                        showError(error.message || 'Échec de la suppression');
                    }
                }, 3000);
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
                title="Modifier le produit"
                vitrineName={activeVitrine?.name}
                vitrineLogo={getSafeUri(activeVitrine?.logo || activeVitrine?.avatar)}
                onVitrinePress={() => activeVitrine?.slug && navigation.navigate('VitrineDetail', { slug: activeVitrine.slug })}
            />
            <ScreenWrapper scrollable contentContainerStyle={styles.contentContainer}>
                <View style={styles.container}>

                    {activeVitrine && (
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            Vitrine : {activeVitrine.name}
                        </Text>
                    )}

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
                            label="Lieu de disponibilité"
                            value={locations[0] || ''}
                            onChange={(val) => setLocations([val])}
                            options={LOCATION_OPTIONS.map(l => ({ label: l.label, value: l.value }))}
                            placeholder="Sélectionner une ville"
                        />

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
                            Images du produit (Max 5)
                        </Text>
                        <ImagePictureUploader images={images} setImages={setImages} />
                    </View>

                    <View style={styles.footer}>
                        <CustomButton
                            title="Enregistrer les modifications"
                            onPress={handleUpdateProduct}
                            isLoading={updateProductMutation.isPending}
                            style={{ marginBottom: 24 }}
                        />

                        <TouchableOpacity
                            onPress={handleDeleteProduct}
                            disabled={deleteProductMutation.isPending || isDeleting}
                            style={styles.deleteLink}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={theme.colors.error} />
                            ) : (
                                <Text style={[styles.deleteLinkText, { color: theme.colors.error }]}>
                                    Supprimer mon produit
                                </Text>
                            )}
                        </TouchableOpacity>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    contentContainer: {
        padding: 16,
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
        alignItems: 'center',
    },
    deleteLink: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    deleteLinkText: {
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'none',
    },
});
