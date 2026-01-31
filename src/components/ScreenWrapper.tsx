/**
 * Screen Wrapper Component
 * 
 * Wrapper for screens with SafeArea and KeyboardAvoidingView
 * Adapted from Module 1
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScreenWrapperProps {
    children: React.ReactNode;
    scrollable?: boolean;
    isLoading?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    keyboardVerticalOffset?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    scrollable = false,
    isLoading = false,
    contentContainerStyle,
    keyboardVerticalOffset = Platform.OS === 'ios' ? 90 : 20, // Reduced Android offset
}) => {
    const { theme } = useTheme();

    const content = (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : scrollable ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        contentContainerStyle
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.content, contentContainerStyle]}>{children}</View>
            )}
        </KeyboardAvoidingView>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
            {content}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
