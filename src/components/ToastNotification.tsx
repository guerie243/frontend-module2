/**
 * Toast Notification Component
 * 
 * Toast notifications with auto-dismiss
 * Adapted from Module 1
 */

import React, { useEffect, useRef, createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);
    const [toastQueue, setToastQueue] = useState<ToastConfig[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const newToast: ToastConfig = { message, type, duration };

        if (currentToast) {
            setToastQueue(prev => [...prev, newToast]);
        } else {
            setCurrentToast(newToast);
        }
    }, [currentToast]);

    const hideToast = useCallback(() => {
        setCurrentToast(null);

        if (toastQueue.length > 0) {
            const [nextToast, ...remainingToasts] = toastQueue;
            setToastQueue(remainingToasts);
            setTimeout(() => setCurrentToast(nextToast), 200);
        }
    }, [toastQueue]);

    useEffect(() => {
        if (currentToast) {
            const timer = setTimeout(() => {
                hideToast();
            }, currentToast.duration || 3000);

            return () => clearTimeout(timer);
        }
    }, [currentToast, hideToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {currentToast && <ToastNotification config={currentToast} onHide={hideToast} />}
        </ToastContext.Provider>
    );
};

interface ToastNotificationProps {
    config: ToastConfig;
    onHide: () => void;
}

const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

const ToastNotification: React.FC<ToastNotificationProps> = ({ config }) => {
    const { theme } = useTheme();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const TOAST_COLORS = {
        success: theme.colors.success,
        error: theme.colors.error,
        info: theme.colors.primary,
        warning: theme.colors.warning,
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.2)),
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        const exitTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }, (config.duration || 3000) - 250);

        return () => clearTimeout(exitTimer);
    }, []);

    const backgroundColor = TOAST_COLORS[config.type];
    const icon = TOAST_ICONS[config.type];

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor,
                    transform: [{ translateY }],
                    opacity,
                    borderRadius: theme.borderRadius.m,
                },
            ]}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.toastMessage, { color: theme.colors.white }]} numberOfLines={2}>
                {config.message}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        left: 20,
        right: 20,
        maxWidth: Platform.OS === 'web' ? 400 : undefined,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    icon: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toastMessage: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },
});
