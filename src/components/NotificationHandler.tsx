import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { PermissionService } from '../utils/permissionService';
import { userService } from '../services/userService';

/**
 * Composant invisible pour gérer automatiquement les tokens de notification
 */
export const NotificationHandler = () => {
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            handleInitialCheck();
        }
    }, [isAuthenticated, user?.email]);

    const handleInitialCheck = async () => {
        try {
            const hasPermission = await PermissionService.getPermissionStatus('notifications');

            if (hasPermission) {
                await syncToken();
            } else {
                // Attendre 1 seconde avant de demander la permission (Expérience utilisateur)
                console.log('[NotificationHandler] Attente de 1s avant demande de permission...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log('[NotificationHandler] Demande de permission automatique...');
                const granted = await PermissionService.requestNotificationsPermission();
                if (granted) {
                    await syncToken();
                }
            }
        } catch (error) {
            console.error('[NotificationHandler] Erreur check initial:', error);
        }
    };

    const syncToken = async () => {
        try {
            console.log('[NotificationHandler] Récupération et envoi du token...');
            const token = await PermissionService.getNotificationToken();
            if (token) {
                await userService.updateTokens(
                    Platform.OS !== 'web' ? token : undefined,
                    Platform.OS === 'web' ? token : undefined
                );
                console.log('[NotificationHandler] Token synchronisé.');
            }
        } catch (error) {
            console.error('[NotificationHandler] Erreur synchronisation:', error);
        }
    };

    return null; // Composant seulement logique
};
