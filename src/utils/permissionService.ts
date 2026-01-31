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
     * Récupère le token de notification (Expo Push Token)
     */
    async getNotificationToken(): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return null;
            }

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            return token.data;
        } catch (error) {
            console.error('[PermissionService] Erreur récupération token:', error);
            try {
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                return deviceToken.data as string;
            } catch (innerError) {
                return null;
            }
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
