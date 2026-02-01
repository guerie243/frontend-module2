/**
 * LinkingHandler
 * 
 * Manages deep links manually to ensure correct navigation regardless of auth state.
 * Pattern copied from Module 1.
 */

import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export const LinkingHandler = () => {
    const navigation = useNavigation<any>();

    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { url } = event;
            console.log('[LinkingHandler] URL reçue:', url);

            const parsed = Linking.parse(url);
            const path = parsed.path;
            const queryParams = parsed.queryParams;

            console.log('[LinkingHandler] Parsed Path:', path, 'QueryParams:', queryParams);

            if (!path) {
                console.log('[LinkingHandler] Aucun path détecté.');
                return;
            }

            // Normalize path (remove leading slash and handle full URL if parse failed on web)
            let cleanPath = path;
            if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

            // Handle cases where Vercel might pass the full path in a weird way
            console.log('[LinkingHandler] cleanPath final:', cleanPath);

            if (cleanPath.includes('vitrine/')) {
                const parts = cleanPath.split('vitrine/');
                const slug = parts[parts.length - 1];
                if (slug) {
                    console.log('[LinkingHandler] Navigation forcée vers VitrineDetail:', slug);
                    navigation.navigate('VitrineDetail', { slug });
                }
            } else if (cleanPath.includes('product/')) {
                const parts = cleanPath.split('product/');
                const slug = parts[parts.length - 1];
                if (slug) {
                    console.log('[LinkingHandler] Navigation forcée vers ProductDetail:', slug);
                    navigation.navigate('ProductDetail', { slug });
                }
            } else if (cleanPath.includes('order/')) {
                const parts = cleanPath.split('order/');
                const orderId = parts[parts.length - 1];
                if (orderId) {
                    console.log('[LinkingHandler] Navigation forcée vers OrderClientDetail:', orderId);
                    navigation.navigate('OrderClientDetail', { orderId });
                }
            }
        };

        // Extraction initiale avec délai pour s'assurer que le navigator est prêt sur Web
        const checkInitialUrl = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
                console.log('[LinkingHandler] Initial URL détectée:', url);
                handleDeepLink({ url });
            } else {
                // Fallback for Web if getInitialURL is null (standard window location)
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    console.log('[LinkingHandler] Fallback Web window.location.href:', window.location.href);
                    handleDeepLink({ url: window.location.href });
                }
            }
        };

        checkInitialUrl();

        // Listen for new links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => {
            subscription.remove();
        };
    }, [navigation]);

    return null;
};
