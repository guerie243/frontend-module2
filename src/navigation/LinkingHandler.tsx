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
            const parsed = Linking.parse(url);
            const path = parsed.path;

            console.log('[LinkingHandler] URL reçue:', url, 'Path:', path);

            if (!path) return;

            // Normalize path (ensure no leading slash)
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;

            if (cleanPath.startsWith('vitrine/')) {
                const slug = cleanPath.split('/')[1];
                if (slug) {
                    console.log('[LinkingHandler] Navigation vers VitrineDetail:', slug);
                    navigation.navigate('VitrineDetail', { slug });
                }
            } else if (cleanPath.startsWith('product/')) {
                const slug = cleanPath.split('/')[1];
                if (slug) {
                    console.log('[LinkingHandler] Navigation vers ProductDetail:', slug);
                    navigation.navigate('ProductDetail', { slug });
                }
            } else if (cleanPath.startsWith('order/')) {
                const orderId = cleanPath.split('/')[1];
                if (orderId) {
                    console.log('[LinkingHandler] Navigation vers OrderClientDetail:', orderId);
                    navigation.navigate('OrderClientDetail', { orderId });
                }
            }
        };

        // Initial extraction
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        // Listen for new links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => {
            subscription.remove();
        };
    }, [navigation]);

    return null;
};
