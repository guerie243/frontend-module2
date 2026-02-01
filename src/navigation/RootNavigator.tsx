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

const prefix = Linking.createURL('/');

export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    console.log('[RootNavigator] Render. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

    const linking = {
        prefixes: [prefix, 'andybusiness://'],
        config: {
            screens: {
                Auth: {
                    screens: {
                        Login: 'login',
                        Register: 'register',
                        // Guest Routes
                        VitrineGuest: 'vitrine/:slug',
                        ProductDetail: 'product/:slug',
                        OrderClientDetail: 'order/:orderId',
                    },
                },
                MainTabs: {
                    screens: {
                        HomeTab: 'home', // Changed from vitrine/:slug? to avoid conflict. Owner sees their own vitrine via HomeTab logic
                        AddProductTab: 'add-product',
                        OrdersTab: 'orders',
                    },
                },
                ProductDetail: 'product-owner/:slug', // Alias for owner view if needed, though they usually navigate internally
                OrderClientDetail: 'order/:orderId',
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
            {isAuthenticated ? (
                <AppStack key="authenticated" />
            ) : (
                <AuthStack key="unauthenticated" />
            )}
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
