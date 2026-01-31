/**
 * Custom Input Component
 * 
 * Styled text input with validation and error display
 * Adapted from Module 1
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    containerStyle?: StyleProp<ViewStyle>;
    RightComponent?: React.ReactNode;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    label,
    error,
    icon,
    containerStyle,
    style,
    RightComponent,
    secureTextEntry,
    ...textInputProps
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.colors.background,
                        borderColor: error ? theme.colors.error : theme.colors.border,
                        borderRadius: theme.borderRadius.s,
                    },
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={theme.colors.textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        { color: theme.colors.text },
                        icon && styles.inputWithIcon,
                        style,
                    ]}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={secureTextEntry ? 'none' : textInputProps.autoCapitalize}
                    autoCorrect={secureTextEntry ? false : textInputProps.autoCorrect}
                    {...textInputProps}
                />
                {RightComponent}
            </View>
            {error && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    error: {
        fontSize: 12,
        marginTop: 4,
    },
});
