/**
 * Edit Product Screen
 * 
 * Form for updating existing products
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useProductDetail, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import ImagePictureUploader from '../../components/ImagePictureUploader';

interface ImageItem {
    uri: string;
    id: string;
}

export const EditProductScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError, showConfirm } = useAlertService();

    const { productId } = route.params || {};
    const { data: product, isLoading } = useProductDetail(productId);
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');
    const [locations, setLocations] = useState('');
    const [images, setImages] = useState<ImageItem[]>([]);

    // Prefill form when product loads
    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price?.toString() || '');
            setCategory(product.category || '');
            setStock(product.stock?.toString() || '');
            setLocations(product.locations?.join(', ') || '');
            if (product.images) {
                setImages(product.images.map((url: string) => ({
                    uri: url,
                    id: Math.random().toString(36).substring(2, 9)
                })));
            }
        }
    }, [product]);

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

        console.log('Updating product:', name);

        try {
            const productData = {
                name: name.trim(),
                description: description.trim() || undefined,
                price: parseFloat(price),
                category: category.trim() || undefined,
                stock: stock ? parseInt(stock) : undefined,
                locations: locations ? locations.split(',').map((l: string) => l.trim()) : undefined,
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
            async () => {
                try {
                    await deleteProductMutation.mutateAsync(productId);
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
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Modifier le produit
            </Text>

            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Nom du produit *
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Nom du produit"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Description
                </Text>
                <TextInput
                    style={[styles.textArea, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Description du produit"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Prix (DA) *
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Catégorie
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Catégorie"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={category}
                    onChangeText={setCategory}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Stock disponible
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Emplacements (séparés par des virgules)
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Ex: Alger, Oran"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={locations}
                    onChangeText={setLocations}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Images du produit (Max 5)
                </Text>
                <ImagePictureUploader images={images} setImages={setImages} />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateProduct}
                disabled={updateProductMutation.isPending || deleteProductMutation.isPending}
            >
                {updateProductMutation.isPending ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>Enregistrer les modifications</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.deleteButton, { borderColor: theme.colors.error }]}
                onPress={handleDeleteProduct}
                disabled={updateProductMutation.isPending || deleteProductMutation.isPending}
            >
                {deleteProductMutation.isPending ? (
                    <ActivityIndicator color={theme.colors.error} />
                ) : (
                    <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
                        Supprimer le produit
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
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
        marginBottom: 20,
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
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 1,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
