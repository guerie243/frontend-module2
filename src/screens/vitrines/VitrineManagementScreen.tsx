/**
 * Vitrine Management Screen
 * 
 * Central management hub for vitrine owner
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useMyVitrines } from '../../hooks/useVitrines';

export const VitrineManagementScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { data: myVitrines = [] } = useMyVitrines();
    const vitrine = myVitrines?.[0];

    const handleManageProducts = () => {
        console.log('Navigating to ProductManagement');
        navigation.navigate('ProductManagement');
    };

    const handleManageOrders = () => {
        console.log('Navigating to OrdersTab');
        navigation.navigate('MainTabs', { screen: 'OrdersTab' });
    };

    const handleEditVitrine = () => {
        console.log('Navigating to VitrineEdit');
        navigation.navigate('VitrineEdit', { slug: vitrine?.slug });
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Gestion de la vitrine
            </Text>

            {vitrine && (
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.vitrineName, { color: theme.colors.text }]}>
                        {vitrine.name}
                    </Text>
                    {vitrine.description && (
                        <Text style={[styles.vitrineDescription, { color: theme.colors.textSecondary }]}>
                            {vitrine.description}
                        </Text>
                    )}
                </View>
            )}

            {/* Management Options */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Actions rapides
                </Text>

                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.colors.border }]}
                    onPress={handleManageProducts}
                >
                    <Text style={styles.actionIcon}>📦</Text>
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                            Gérer les produits
                        </Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                            Créer, modifier ou supprimer des produits
                        </Text>
                    </View>
                    <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.colors.border }]}
                    onPress={handleManageOrders}
                >
                    <Text style={styles.actionIcon}>📋</Text>
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                            Gérer les commandes
                        </Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                            Voir et traiter les commandes
                        </Text>
                    </View>
                    <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.colors.border }]}
                    onPress={handleEditVitrine}
                >
                    <Text style={styles.actionIcon}>✏️</Text>
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                            Modifier la vitrine
                        </Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                            Changer le nom, la description, etc.
                        </Text>
                    </View>
                    <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 16,
    },
    section: {
        padding: 16,
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
    },
    vitrineName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    vitrineDescription: {
        fontSize: 16,
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    actionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
    },
    actionArrow: {
        fontSize: 24,
        marginLeft: 8,
    },
});
