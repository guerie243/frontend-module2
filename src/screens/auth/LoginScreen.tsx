/**
 * Login Screen
 * 
 * User authentication screen with login logic
 * Pattern from Module 1 LoginScreen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAlertService } from '../../utils/alertService';
import { useTheme } from '../../context/ThemeContext';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { login } = useAuth();
    const { showError, showSuccess } = useAlertService();
    const { theme } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        // Validation
        if (!email || !password) {
            showError('Veuillez remplir tous les champs');
            return;
        }

        if (!email.includes('@')) {
            showError('Email invalide');
            return;
        }

        setIsLoading(true);
        console.log('Login attempt:', email);

        try {
            await login(email, password);
            showSuccess('Connexion réussie');
            console.log('Login successful, navigating to MainTabs');
            // Navigation handled by RootNavigator
        } catch (error: any) {
            console.error('Login failed:', error.message);
            showError(error.message || 'Échec de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToRegister = () => {
        console.log('Navigating to Register');
        navigation.navigate('Register');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.formContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Connexion</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Connectez-vous pour gérer vos commandes
                </Text>

                <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                    }]}
                    placeholder="Email"
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
                    placeholder="Mot de passe"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Se connecter</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={handleNavigateToRegister}
                    disabled={isLoading}
                >
                    <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                        Pas encore de compte ? S'inscrire
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
