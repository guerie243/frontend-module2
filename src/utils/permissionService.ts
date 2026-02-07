import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type PermissionType = 'location' | 'camera' | 'photos' | 'notifications';

export const PermissionService = {
    /**
     * Demande la permission pour la localisation (GPS)
     */
    async requestLocationPermission(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[PermissionService] Erreur localisation:', error);
            return false;
        }
    },

    /**
     * Demande la permission pour la caméra
     */
    async requestCameraPermission(): Promise<boolean> {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[PermissionService] Erreur caméra:', error);
            return false;
        }
    },

    /**
     * Demande la permission pour la bibliothèque de photos
     */
    async requestMediaLibraryPermission(): Promise<boolean> {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[PermissionService] Erreur galerie:', error);
            return false;
        }
    },

    /**
     * Demande la permission pour les notifications
     */
    async requestNotificationsPermission(): Promise<boolean> {
        if (Platform.OS === 'web') {
            try {
                const permission = await window.Notification.requestPermission();
                return permission === 'granted';
            } catch (e) {
                return false;
            }
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.error('[PermissionService] Erreur notifications:', error);
            return false;
        }
    },

    /**
     * Récupère le token de notification (Expo Push Token ou Web Push Subscription)
     */
    async getNotificationToken(): Promise<string | object | null> {
        try {
            if (Platform.OS === 'web') {
                // Web Push API
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    try {
                        const registration = await navigator.serviceWorker.ready;

                        // Clé publique VAPID depuis .env
                        const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

                        if (!vapidPublicKey) {
                            console.error('[PermissionService] Clé VAPID publique manquante dans .env');
                            return null;
                        }

                        // Convertir la clé base64url en Uint8Array
                        const urlBase64ToUint8Array = (base64String: string) => {
                            const padding = '='.repeat((4 - base64String.length % 4) % 4);
                            const base64 = (base64String + padding)
                                .replace(/\-/g, '+')
                                .replace(/_/g, '/');
                            const rawData = window.atob(base64);
                            const outputArray = new Uint8Array(rawData.length);
                            for (let i = 0; i < rawData.length; ++i) {
                                outputArray[i] = rawData.charCodeAt(i);
                            }
                            return outputArray;
                        };

                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                        });

                        console.log('[PermissionService] Web Push subscription créée:', subscription);
                        return subscription.toJSON(); // Retourne {endpoint, keys: {p256dh, auth}}
                    } catch (error) {
                        console.error('[PermissionService] Erreur Web Push:', error);
                        return null;
                    }
                }
                console.warn('[PermissionService] Web Push non supporté sur ce navigateur');
                return null;
            }

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            return token.data;
        } catch (error) {
            console.error('[PermissionService] Erreur récupération token:', error);
            if (Platform.OS !== 'web') {
                try {
                    const deviceToken = await Notifications.getDevicePushTokenAsync();
                    return deviceToken.data as string;
                } catch (innerError) {
                    return null;
                }
            }
            return null;
        }
    },

    /**
     * Vérifie le statut actuel d'une permission
     */
    async getPermissionStatus(type: PermissionType): Promise<boolean> {
        try {
            switch (type) {
                case 'location':
                    const loc = await Location.getForegroundPermissionsAsync();
                    return loc.status === 'granted';
                case 'camera':
                    const cam = await ImagePicker.getCameraPermissionsAsync();
                    return cam.status === 'granted';
                case 'photos':
                    const photo = await ImagePicker.getMediaLibraryPermissionsAsync();
                    return photo.status === 'granted';
                case 'notifications':
                    const notif = await Notifications.getPermissionsAsync();
                    return notif.status === 'granted';
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }
};
