/**
 * Vitrine Edit Screen
 * 
 * Edit vitrine information (calls Module 1 API)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAlertService } from '../../utils/alertService';
import { useVitrineDetail } from '../../hooks/useVitrines';
import { vitrineService } from '../../services/vitrineService';

export const VitrineEditScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { showSuccess, showError } = useAlertService();

    const { slug } = route.params || {};
    const { data: vitrine, isLoading } = useVitrineDetail(slug);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (vitrine) {
            setName(vitrine.name || '');
            setDescription(vitrine.description || '');
            setPhone(vitrine.contact?.phone || '');
            setEmail(vitrine.contact?.email || '');
            setAddress(vitrine.address || '');
        }
    }, [vitrine]);

    const handleUpdateVitrine = async () => {
        if (!name.trim()) {
            showError('Veuillez entrer le nom de la vitrine');
            return;
        }

        setIsUpdating(true);
        console.log('Updating vitrine:', name);

        try {
            const updateData = {
                name: name.trim(),
                description: description.trim() || undefined,
                address: address.trim() || undefined,
                contact: {
                    phone: phone.trim() || undefined,
                    email: email.trim() || undefined,
                },
            };

            await vitrineService.updateVitrine(slug, updateData);
            showSuccess('Vitrine mise à jour');
            console.log('Vitrine updated successfully');
            navigation.goBack();
        } catch (error: any) {
            console.error('Vitrine update failed:', error.message);
            showError(error.message || 'Échec de la mise à jour');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!vitrine) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Vitrine introuvable
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
                Modifier la vitrine
            </Text>

            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Nom de la vitrine *
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Nom de la vitrine"
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
                    placeholder="Description de votre activité"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Téléphone
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Numéro de téléphone"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Email
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Adresse
                </Text>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Adresse"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={address}
                    onChangeText={setAddress}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateVitrine}
                disabled={isUpdating}
            >
                {isUpdating ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.buttonText}>Enregistrer les modifications</Text>
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
});
