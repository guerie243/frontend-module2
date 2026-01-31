/**
 * State Message Component
 * 
 * Display for empty and error states
 * Adapted from Module 1
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface StateMessageProps {
    type: 'empty' | 'error';
    title: string;
    message?: string;
    actionLabel?: string;
    onActionPress?: () => void;
}

export const StateMessage: React.FC<StateMessageProps> = ({
    type,
    title,
    message,
    actionLabel,
    onActionPress,
}) => {
    const { theme } = useTheme();

    const iconName = type === 'empty' ? 'file-tray-outline' : 'alert-circle-outline';
    const iconColor = type === 'empty' ? theme.colors.textSecondary : theme.colors.error;

    return (
        <View style={styles.container}>
            <Ionicons name={iconName} size={64} color={iconColor} />
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {message && (
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {message}
                </Text>
            )}
            {actionLabel && onActionPress && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m }]}
                    onPress={onActionPress}
                >
                    <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                        {actionLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    button: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
