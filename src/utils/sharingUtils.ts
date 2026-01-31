/**
 * Sharing Utilities
 * 
 * Handles generation of deep links and opening the native share dialog
 */

import { Share, Platform } from 'react-native';
import { ENV } from '../config/config';
import { copyToClipboard } from './clipboardUtils';

/**
 * Open the native share dialog with a title and message
 */
export const openShareDialog = async (title: string, message: string, url: string) => {
    try {
        const result = await Share.share({
            title,
            message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
            url: Platform.OS === 'ios' ? url : undefined,
        });

        if (result.action === Share.sharedAction) {
            console.log('Content shared successfully');
        } else if (result.action === Share.dismissedAction) {
            console.log('Share dismissed');
        }
    } catch (error: any) {
        console.error('Sharing failed:', error.message);
    }
};

/**
 * URL Generators
 */
export const getProductUrl = (slug: string) => `${ENV.SHARE_BASE_URL}/product/${slug}`;
export const getVitrineUrl = (slug: string) => `${ENV.SHARE_BASE_URL}/vitrine/${slug}`;
export const getOrderUrl = (orderId: string) => `${ENV.SHARE_BASE_URL}/order/${orderId}`;

/**
 * Generate a product share link and open share dialog
 */
export const shareProduct = (product: { name: string; slug: string }) => {
    const url = getProductUrl(product.slug);
    const message = `Découvrez ${product.name} sur Andy Business !`;
    openShareDialog(`Partager ${product.name}`, message, url);
};

/**
 * Generate a vitrine share link and open share dialog
 */
export const shareVitrine = (vitrine: { name: string; slug: string }) => {
    const url = getVitrineUrl(vitrine.slug);
    const message = `Visitez la vitrine de ${vitrine.name} sur Andy Business !`;
    openShareDialog(`Partager la vitrine de ${vitrine.name}`, message, url);
};

/**
 * Generate an order share link and open share dialog
 */
export const shareOrder = (orderId: string) => {
    const url = getOrderUrl(orderId);
    const message = `Suivez l'état de votre commande sur Andy Business.`;
    openShareDialog("Suivi de commande", message, url);
};

export { copyToClipboard };
