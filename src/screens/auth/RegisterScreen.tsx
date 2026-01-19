/**
 * Register Screen
 * 
 * User registration screen with signup logic
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { useTheme } from '../../context/ThemeContext';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register } = useAuth();
    const { showError, showSuccess } = useAlertService();
    const { theme } = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (!email.includes('@')) {
            showError('Email invalide');
            return;
        }

        if (password.length < 6) {
            showError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (password !== confirmPassword) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        console.log('Registration attempt:', email);

        try {
            await register({ name, email, password, phone: phone || undefined });
            showSuccess('Inscription réussie');
            console.log('Registration successful, navigating to MainTabs');
            // Navigation handled by RootNavigator
        } catch (error: any) {
            console.error('Registration failed:', error.message);
            showError(error.message || 'Échec de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToLogin = () => {
        console.log('Navigating back to Login');
        navigation.goBack();
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <View style={styles.formContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Inscription</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Créez votre compte
                </Text>

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Nom complet *"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Email *"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Téléphone (optionnel)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Mot de passe *"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                />

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Confirmer le mot de passe *"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!isLoading}
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>S'inscrire</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={handleNavigateToLogin}
                    disabled={isLoading}
                >
                    <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                        Déjà un compte ? Se connecter
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 32,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
