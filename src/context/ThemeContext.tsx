/**
 * Theme Context
 * 
 * Manages application theming
 * Pattern from Module 1 ThemeContext
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Theme {
    colors: {
        primary: string;
        primaryDark: string;
        secondary: string;
        background: string;
        surface: string;
        surfaceLight: string;
        text: string;
        textSecondary: string;
        textTertiary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
        white: string;
        black: string;
    };
    borderRadius: {
        xs: number;
        s: number;
        m: number;
        l: number;
        xl: number;
    };
    spacing: {
        xs: number;
        s: number;
        m: number;
        l: number;
        xl: number;
    };
}

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
}

const lightTheme: Theme = {
    colors: {
        primary: '#007AFF',
        primaryDark: '#0051D5',
        secondary: '#FF9500',
        background: '#F2F2F7',
        surface: '#FFFFFF',
        surfaceLight: '#F8F8F8',
        text: '#000000',
        textSecondary: '#6C6C70',
        textTertiary: '#AEAEB2',
        border: '#E5E5EA',
        error: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
        white: '#FFFFFF',
        black: '#000000',
    },
    borderRadius: {
        xs: 4,
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
};

const darkTheme: Theme = {
    colors: {
        primary: '#0A84FF',
        primaryDark: '#005FCB',
        secondary: '#FF9F0A',
        background: '#000000',
        surface: '#1C1C1E',
        surfaceLight: '#2C2C2E',
        text: '#FFFFFF',
        textSecondary: '#AEAEB2',
        textTertiary: '#6C6C70',
        border: '#38383A',
        error: '#FF453A',
        success: '#32D74B',
        warning: '#FF9F0A',
        white: '#FFFFFF',
        black: '#000000',
    },
    borderRadius: {
        xs: 4,
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        console.log('Theme toggled to:', !isDark ? 'dark' : 'light');
    };

    const value: ThemeContextType = {
        theme: isDark ? darkTheme : lightTheme,
        isDark,
        toggleTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
