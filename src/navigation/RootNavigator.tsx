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
                    },
                },
                MainTabs: {
                    screens: {
                        HomeTab: 'vitrine/:slug',
                        AddProductTab: 'add-product',
                        OrdersTab: 'orders',
                    },
                },
                ProductDetail: 'product/:slug',
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
