/**
 * Loading Component
 * 
 * Centralized loading indicator with optional message
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingComponentProps {
    message?: string;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({ message = 'Chargement...' }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            {message && (
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {message}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    message: {
        marginTop: 16,
        fontSize: 14,
    },
});
