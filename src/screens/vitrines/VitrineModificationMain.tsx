import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMyVitrines } from '../../hooks/useVitrines';
import { Vitrine } from '../../types';

export const VitrineModificationMain = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();

    const {
        data: myVitrines,
        isLoading,
        refetch
    } = useMyVitrines();

    const [vitrine, setVitrine] = useState<Vitrine | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Extract refresh parameter from navigation
    const { refreshed } = route.params || {};

    // Use useFocusEffect to ALWAYS reload when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            const loadVitrine = async () => {
                try {
                    if (refreshed) {
                        console.log("🔄 [VitrineModification] Refreshing after edit - refreshed:", refreshed);
                    } else {
                        console.log("📥 [VitrineModification] Initial load");
                    }

                    await refetch();
                } catch (err: any) {
                    console.error("❌ [VitrineModification] Loading error:", err);
                    setError(err.message || "Loading error");
                }
            };

            loadVitrine();
        }, [refreshed])
    );

    // Update displayed vitrine when vitrines change in the hook
    useEffect(() => {
        if (!isLoading) {
            if (myVitrines && myVitrines.length > 0) {
                setVitrine(myVitrines[0]);
                setError(null);
                console.log("✅ [VitrineModification] Vitrine updated from hook:", {
                    name: myVitrines[0].name,
                    slug: myVitrines[0].slug,
                });
            } else if (myVitrines && myVitrines.length === 0) {
                setVitrine(null);
                setError("No vitrine found");
            }
        }
    }, [myVitrines, isLoading]);

    const renderFieldItem = (label: string, value: string, field: string, options: any = {}) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('EditVitrineField', {
                field,
                label,
                currentValue: value,
                slug: vitrine?.slug,
                ...options
            })}
        >
            <View style={styles.itemContent}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.value, { color: value ? theme.colors.text : theme.colors.textTertiary }]} numberOfLines={1}>
                    {value || 'Non renseigné'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Chargement...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!isLoading && (error || !vitrine)) {
        return (
            <ScreenWrapper>
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.text }]}>
                        {error || 'Aucune vitrine trouvée'}
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!vitrine) {
        return null;
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gestion de la Vitrine</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Informations Générales */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Informations Générales</Text>

                    {renderFieldItem('Nom', vitrine.name, 'name')}
                    {renderFieldItem("Nom d'utilisateur", vitrine.slug || '', 'slug')}
                    {renderFieldItem('Catégorie', vitrine.category || vitrine.type || '', 'category')}
                    {renderFieldItem('Bio', vitrine.description || '', 'description', { multiline: true })}
                </View>

                {/* Localisation */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Localisation</Text>

                    {renderFieldItem('Ville', vitrine.city || '', 'city')}
                    {renderFieldItem('Adresse', vitrine.address || '', 'address', { multiline: true })}
                </View>

                {/* Contact */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Contact</Text>

                    {renderFieldItem('Téléphone', vitrine.contact?.phone || '', 'phone', { keyboardType: 'phone-pad' })}
                    {renderFieldItem('Email', vitrine.contact?.email || '', 'email', { keyboardType: 'email-address' })}
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    itemContent: {
        flex: 1,
        marginRight: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default VitrineModificationMain;
