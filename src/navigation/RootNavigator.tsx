/**
 * Root Navigator
 * 
 * Main navigation entry point with architecture from Module 1 (Guest-Usable)
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AppStack } from './AppStack';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { LinkingHandler } from './LinkingHandler';
import { StartupSplash } from '../components/StartupSplash';
import { useTheme } from '../context/ThemeContext';

const prefix = Linking.createURL('/');

// État global hors du composant pour persister malgré les re-mounts
let hasShownSplashSession = false;

export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { theme } = useTheme();

    // Si nous avons déjà montré le splash dans cette session, on ne le remontre plus
    const [isSplashTiming, setIsSplashTiming] = useState(!hasShownSplashSession);

    useEffect(() => {
        const checkDeepLink = async () => {
            if (hasShownSplashSession) {
                setIsSplashTiming(false);
                return;
            }

            // Détection de lien profond pour SAUTER le splash screen
            let initialUrl = null;
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    initialUrl = window.location.pathname;
                }
            } else {
                initialUrl = await Linking.getInitialURL();
            }

            console.log('[RootNavigator] Initial URL detected:', initialUrl);

            // Si on arrive via un lien direct vers un produit, vitrine ou commande -> On SAUTE le splash
            const shouldSkipSplash = initialUrl && (
                initialUrl.includes('/product/') ||
                initialUrl.includes('/vitrine/') ||
                initialUrl.includes('/order/') ||
                initialUrl.includes('product/') ||
                initialUrl.includes('vitrine/') ||
                initialUrl.includes('order/')
            );

            if (shouldSkipSplash) {
                console.log('[RootNavigator] Deep link detected, skipping splash screen');
                setIsSplashTiming(false);
                hasShownSplashSession = true;
                return;
            }

            // Sinon, affichage normal de 3 secondes
            const timer = setTimeout(() => {
                setIsSplashTiming(false);
                hasShownSplashSession = true;
            }, 3000);

            return () => clearTimeout(timer);
        };

        checkDeepLink();
    }, []);

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

    // Affichage de l'écran de démarrage premium au démarrage initial
    if (!hasShownSplashSession && isSplashTiming) {
        return <StartupSplash />;
    }

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
