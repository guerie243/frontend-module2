/**
 * Alert Service Utility
 * 
 * Centralized alert/toast service using AlertProvider and ToastProvider
 * Adapted from Module 1
 */

import { useAlert } from '../components/AlertProvider';
import { useToast } from '../components/ToastNotification';

export const useAlertService = () => {
    const { showAlert } = useAlert();
    const { showToast } = useToast();

    const showSuccess = (message: string, title: string = 'Succès') => {
        showToast(message, 'success');
        console.log(`✅ ${title}: ${message}`);
    };

    const showError = (message: string, title: string = 'Erreur') => {
        showToast(message, 'error');
        console.error(`❌ ${title}: ${message}`);
    };

    const showInfo = (message: string, title: string = 'Information') => {
        showToast(message, 'info');
        console.log(`ℹ️ ${title}: ${message}`);
    };

    const showWarning = (message: string, title: string = 'Attention') => {
        showToast(message, 'warning');
        console.warn(`⚠️ ${title}: ${message}`);
    };

    const showConfirm = (
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
        title: string = 'Confirmation'
    ) => {
        showAlert(
            title,
            message,
            'confirm',
            [
                {
                    text: 'Annuler',
                    onPress: onCancel,
                    style: 'cancel'
                },
                {
                    text: 'Confirmer',
                    onPress: onConfirm,
                    style: 'default'
                }
            ]
        );
    };

    const showAlertDialog = (
        message: string,
        title: string = 'Information',
        type: 'success' | 'error' | 'warning' | 'info' = 'info'
    ) => {
        showAlert(title, message, type);
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showConfirm,
        showAlertDialog,
        showToast, // Expose toast directly for custom durations
    };
};
