/**
 * Category Pill Component
 * 
 * Selectable category pill with icon
 * Adapted from Module 1
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Category {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface CategoryPillProps {
    category: Category;
    isSelected: boolean;
    onPress: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onPress }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.pill,
                {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.borderRadius.xl,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons
                name={category.icon}
                size={16}
                color={isSelected ? theme.colors.white : theme.colors.textSecondary}
                style={styles.icon}
            />
            <Text
                style={[
                    styles.label,
                    { color: isSelected ? theme.colors.white : theme.colors.text }
                ]}
            >
                {category.label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
    },
    icon: {
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
});
