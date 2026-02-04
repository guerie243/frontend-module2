/**
 * Edit Product Screen
 * 
 * Form for updating existing products
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

    // Params from ProductManagementScreen
    const { productId, field, label, currentValue, multiline, keyboardType, isImageManagement } = route.params || {};

    const { data: product, isLoading } = useProductDetail(productId);

    const [value, setValue] = useState(currentValue || '');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Set images from product if we are in image management mode
    useEffect(() => {
        if (product && isImageManagement) {
            setImages(product.images.map((url: string) => ({
                uri: url,
                id: Math.random().toString(36).substring(2, 9)
            })));
        }
    }, [product, isImageManagement]);

    const handleSave = async () => {
        if (!product) return;

        try {
            let updateData: any = {};

            if (isImageManagement) {
                updateData.images = images.map(img => img.uri);
            } else if (field === 'price') {
                updateData[field] = parseFloat(value);
            } else if (field === 'locations') {
                updateData[field] = value.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else {
                updateData[field] = value;
            }

            await updateProductMutation.mutateAsync({ id: productId, data: updateData });
            showSuccess(`${label} mis à jour`);
            navigation.goBack();
        } catch (error: any) {
            showError(error.message || 'Échec de la mise à jour');
        }
    };

    const handleDeleteProduct = () => {
        showConfirm(
            'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
            () => {
                setIsDeleting(true);
                setTimeout(async () => {
                    try {
                        await deleteProductMutation.mutateAsync(productId);
                        showSuccess('Produit supprimé');
                        navigation.navigate('ProductManagement', { productId: undefined }); // Go back to list
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

    // --- DELETION VIEW ---
    if (field === 'delete') {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScreenHeader title="Suppression" />
                <View style={styles.centerContainer}>
                    <Ionicons name="trash-outline" size={80} color={theme.colors.error} />
                    <Text style={[styles.deleteHeader, { color: theme.colors.text }]}>Zone de danger</Text>
                    <Text style={[styles.deleteSub, { color: theme.colors.textSecondary }]}>
                        La suppression du produit "{product?.name}" est irréversible.
                    </Text>

                    <TouchableOpacity
                        onPress={handleDeleteProduct}
                        disabled={isDeleting}
                        style={[styles.deleteButtonLarge, { backgroundColor: theme.colors.error }]}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.deleteButtonTextLarge}>Confirmer la suppression</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScreenHeader title={`Modifier: ${label}`} />
            <ScreenWrapper scrollable contentContainerStyle={styles.contentContainer}>
                <View style={styles.container}>

                    <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m }]}>
                        {isImageManagement ? (
                            <View>
                                <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
                                    Gérer les images du produit
                                </Text>
                                <ImagePictureUploader images={images} setImages={setImages} />
                            </View>
                        ) : field === 'category' ? (
                            <AnimatedSelect
                                label={label}
                                value={value}
                                onChange={setValue}
                                options={PRODUCT_CATEGORIES.filter(c => c.id !== '').map(c => ({ label: c.label, value: c.id }))}
                                placeholder="Sélectionner une catégorie"
                            />
                        ) : field === 'currency' ? (
                            <AnimatedSelect
                                label={label}
                                value={value}
                                onChange={setValue}
                                options={CURRENCY_OPTIONS.map(c => ({ label: c.label, value: c.value }))}
                            />
                        ) : (
                            <CustomInput
                                label={label}
                                value={value}
                                onChangeText={setValue}
                                placeholder={`Modifier ${label.toLowerCase()}`}
                                multiline={multiline}
                                numberOfLines={multiline ? 4 : 1}
                                keyboardType={keyboardType}
                                style={multiline ? { minHeight: 120, textAlignVertical: 'top' } : {}}
                                autoFocus
                            />
                        )}
                    </View>

                    <View style={styles.footer}>
                        <CustomButton
                            title={`Enregistrer ${label}`}
                            onPress={handleSave}
                            isLoading={updateProductMutation.isPending}
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
    deleteHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 8,
    },
    deleteSub: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 32,
        marginBottom: 32,
    },
    deleteButtonLarge: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonTextLarge: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
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
