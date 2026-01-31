/**
 * Avatar Component
 * 
 * User/vitrine avatar with placeholder support
 * Adapted from Module 1
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface AvatarProps {
    source?: string | { uri: string };
    size?: number;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 40, style }) => {
    const { theme } = useTheme();
    const avatarSize = { width: size, height: size, borderRadius: size / 2 };

    // Determine if we have a valid source
    const imageSource = typeof source === 'string'
        ? { uri: source }
        : source;

    const hasValidSource = imageSource && imageSource.uri;

    return (
        <View style={[styles.container, avatarSize, style]}>
            {hasValidSource ? (
                <Image
                    source={imageSource}
                    style={[styles.image, avatarSize]}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <View
                    style={[
                        styles.placeholder,
                        avatarSize,
                        { backgroundColor: theme.colors.surfaceLight }
                    ]}
                >
                    <Ionicons
                        name="person-outline"
                        size={size * 0.5}
                        color={theme.colors.textSecondary}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
