/**
 * Create Product Screen
 * 
 * Form for creating new products with image upload
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useCreateProduct } from '../../hooks/useProducts';
import { useMyVitrines } from '../../hooks/useVitrines';
import ImagePictureUploader from '../../components/ImagePictureUploader';

interface ImageItem {
    uri: string;
    id: string;
}

export const CreateProductScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { showSuccess, showError } = useAlertService();
    const createProductMutation = useCreateProduct();

    // Get user's vitrine
    const { data: myVitrines = [] } = useMyVitrines();
    const vitrineId = myVitrines?.[0]?.id || myVitrines?.[0]?._id || '';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');
    const [locations, setLocations] = useState('');
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

        if (!vitrineId) {
            showError('Vitrine non trouvée');
            return;
        }

        console.log('Creating product:', name);

        try {
            const productData = {
                name: name.trim(),
                description: description.trim() || undefined,
                price: parseFloat(price),
                category: category.trim() || 'Général',
                stock: stock ? parseInt(stock) : undefined,
                vitrineId,
                locations: locations ? locations.split(',').map((l: string) => l.trim()) : undefined,
                images: images.map((img: ImageItem) => img.uri),
            };

            await createProductMutation.mutateAsync(productData);
            showSuccess('Produit créé avec succès');
            console.log('Product created successfully');
            navigation.goBack();
        } catch (error: any) {
            console.error('Product creation failed:', error.message);
            showError(error.message || 'Échec de la création du produit');
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Nouveau produit
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
                    placeholder="Ex: T-shirt rouge"
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
                    placeholder="Ex: Vêtements"
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
                    placeholder="Ex: Alger, Oran, Constantine"
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
                onPress={handleCreateProduct}
                disabled={createProductMutation.isPending}
            >
                {createProductMutation.isPending ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>Créer le produit</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});
