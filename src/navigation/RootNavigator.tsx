/**
 * Root Navigator
 * 
 * Main navigation entry point with architecture from Module 1 (Guest-Usable)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AppStack } from './AppStack';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { LinkingHandler } from './LinkingHandler';

const prefix = Linking.createURL('/');

export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    console.log('[RootNavigator] Render. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

    const linking = {
        prefixes: [
            prefix,
            'andybusiness://',
            'https://frontend-module2.vercel.app/',
            'https://frontend-module2.vercel.app',
            ...(Platform.OS === 'web' && typeof window !== 'undefined' ? [window.location.origin, window.location.origin + '/'] : [])
        ],
        config: {
            screens: {
                // Common screens (Root level in AppStack)
                Login: 'login',
                Register: 'register',
                VitrineDetail: {
                    path: 'vitrine/:slug',
                    parse: {
                        slug: (slug: string) => decodeURIComponent(slug),
                    },
                },
                ProductDetail: {
                    path: 'product/:slug',
                    parse: {
                        slug: (slug: string) => decodeURIComponent(slug),
                    },
                },
                OrderClientDetail: 'order/:orderId',
                MyPurchases: 'my-purchases',

                // Nested screens in AppStack
                MainTabs: {
                    path: '',
                    screens: {
                        HomeTab: 'home',
                        AddProductTab: 'add-product',
                        OrdersTab: 'orders',
                    },
                },
            },
        },
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <LinkingHandler />
            <AppStack />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
});
