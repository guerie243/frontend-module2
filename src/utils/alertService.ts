/**
 * Alert Service Utility
 * 
 * Centralized alert/toast service for user feedback
 * Pattern from Module 1
 */

import { Alert, Platform } from 'react-native';

export const useAlertService = () => {
    const showSuccess = (message: string, title: string = 'Succès') => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message, [{ text: 'OK' }]);
        }
        console.log(`✅ ${title}: ${message}`);
    };

    const showError = (message: string, title: string = 'Erreur') => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message, [{ text: 'OK' }]);
        }
        console.error(`❌ ${title}: ${message}`);
    };

    const showInfo = (message: string, title: string = 'Information') => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message, [{ text: 'OK' }]);
        }
        console.log(`ℹ️ ${title}: ${message}`);
    };

    const showConfirm = (
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
        title: string = 'Confirmation'
    ) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}: ${message}`)) {
                onConfirm();
            } else if (onCancel) {
                onCancel();
            }
        } else {
            Alert.alert(
                title,
                message,
                [
                    {
                        text: 'Annuler',
                        onPress: onCancel,
                        style: 'cancel'
                    },
                    {
                        text: 'Confirmer',
                        onPress: onConfirm
                    }
                ]
            );
        }
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showConfirm
    };
};
