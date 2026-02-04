/**
 * CompteModificationMain
 * 
 * Main account management screen with editable fields
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export const CompteModificationMain = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user, isAuthenticated, refreshUser } = useAuth();

    const { refreshed } = route.params || {};
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            const loadProfile = async () => {
                try {
                    if (isAuthenticated && refreshUser) {
                        console.log("📥 [CompteModificationMain] Chargement du profil" + (refreshed ? " (refreshed)" : ""));
                        await refreshUser();
                    }
                } catch (err: any) {
                    console.error("❌ [CompteModificationMain] Erreur de chargement:", err);
                    setError(err.message || "Erreur de chargement");
                }
            };
            loadProfile();
        }, [refreshed, isAuthenticated, refreshUser])
    );

    const renderFieldItem = (label: string, value: string, field: string, options: any = {}) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('EditCompteField', {
                field,
                label,
                currentValue: value,
                ...options
            })}
        >
            <View style={styles.itemContent}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.value, { color: value ? theme.colors.text : theme.colors.textSecondary }]} numberOfLines={1}>
                    {field === 'password' ? '••••••••' : (value || 'Non renseigné')}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    if (!user || !isAuthenticated) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: theme.colors.text }]}>
                        Utilisateur non trouvé ou non connecté.
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gestion du Compte</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Identité */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Identité</Text>
                    {renderFieldItem('Nom complet', user.name || '', 'name')}
                    {renderFieldItem('Nom d\'utilisateur', user.username || '', 'username')}
                    {renderFieldItem('Email', user.email || '', 'email', { keyboardType: 'email-address', editable: false })}
                </View>

                {/* Coordonnées */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Coordonnées</Text>
                    {renderFieldItem('Téléphone', user.phone || '', 'phone', { keyboardType: 'phone-pad' })}
                </View>

                {/* Sécurité */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Sécurité</Text>
                    {renderFieldItem('Mot de passe', '', 'password', { secureTextEntry: true })}
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: { paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { fontSize: 16, textAlign: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    itemContent: { flex: 1, marginRight: 16 },
    label: { fontSize: 14, marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500' },
});
