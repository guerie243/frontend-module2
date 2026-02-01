/**
 * Root Navigator
 * 
 * Main navigation entry point with authentication flow
 * Pattern from Module 1 RootNavigator
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import * as Linking from 'expo-linking';
import { LinkingHandler } from './LinkingHandler';
import { Platform } from 'react-native';

const prefix = Linking.createURL('/');

export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    console.log('[RootNavigator] Render. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

    const linking = {
        prefixes: [
            prefix,
            'andybusiness://',
            'https://frontend-module2.vercel.app',
            ...(Platform.OS === 'web' && typeof window !== 'undefined' ? [window.location.origin] : [])
        ],
        config: {
            screens: {
                // Common screens (Root level in both stacks)
                Login: 'login',
                Register: 'register',
                VitrineDetail: 'vitrine/:slug',
                ProductDetail: 'product/:slug',
                OrderClientDetail: 'order/:orderId',

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
