/**
 * Vitrine Detail Screen
 * 
 * Display vitrine information from Module 1
 * Show products from Module 2
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useVitrineDetail, useMyVitrines } from '../../hooks/useVitrines';
import { useProductsByVitrine } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { Product } from '../../types';

export const VitrineDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user, isAuthenticated } = useAuth();

    const { slug } = route.params || {};

    // Get vitrine data from Module 1
    const { data: vitrine, isLoading: vitrineLoading } = useVitrineDetail(slug, !!slug);
    const { data: myVitrines, isLoading: myVitrinesLoading } = useMyVitrines({ enabled: !slug });

    const displayedVitrine = slug ? vitrine : myVitrines?.[0];
    const vitrineId = displayedVitrine?.vitrineId || displayedVitrine?.id || displayedVitrine?._id || '';

    // Get products from Module 2
    const { data: productsData, isLoading: productsLoading } = useProductsByVitrine(vitrineId, !!vitrineId);
    const products: Product[] = productsData?.pages.flatMap(page => {
        if (!page) return [];
        if (Array.isArray(page)) return page;
        return (page as any).data || [];
    }) || [];

    const isOwner = isAuthenticated && user && displayedVitrine && (
        user.id === displayedVitrine.ownerId ||
        user._id === displayedVitrine.ownerId
    );

    if (vitrineLoading || myVitrinesLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!displayedVitrine) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    {!isAuthenticated ? 'Connectez-vous pour voir votre vitrine' : 'Vitrine introuvable'}
                </Text>
                {!isAuthenticated && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.buttonText}>Se connecter</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Vitrine Header */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {displayedVitrine.name}
                </Text>
                {displayedVitrine.description && (
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        {displayedVitrine.description}
                    </Text>
                )}
                {displayedVitrine.contact?.phone && (
                    <Text style={[styles.contact, { color: theme.colors.textSecondary }]}>
                        📞 {displayedVitrine.contact.phone}
                    </Text>
                )}
            </View>

            {/* Owner Actions */}
            {isOwner && (
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('VitrineManagement')}
                    >
                        <Text style={styles.buttonText}>Gérer la vitrine</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Products List */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Produits ({products.length})
                </Text>

                {productsLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : products.length > 0 ? (
                    products.map((product, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.productRow}
                            onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
                        >
                            <Text style={[styles.productName, { color: theme.colors.text }]}>
                                {product.name}
                            </Text>
                            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                                {product.price.toFixed(2)} {product.currency || 'USD'}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        Aucun produit
                    </Text>
                )}
            </View>
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
        padding: 20,
    },
    section: {
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 12,
    },
    contact: {
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    productName: {
        flex: 1,
        fontSize: 16,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
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
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
