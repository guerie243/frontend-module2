/**
 * Alert Provider
 * 
 * Context for managing alert modals
 * Adapted from Module 1
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
    title: string;
    message: string;
    type: AlertType;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (title: string, message: string, type?: AlertType, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
    currentAlert: AlertConfig | null;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);
    const [alertQueue, setAlertQueue] = useState<AlertConfig[]>([]);

    const showAlert = useCallback((
        title: string,
        message: string,
        type: AlertType = 'info',
        buttons?: AlertButton[]
    ) => {
        const newAlert: AlertConfig = {
            title,
            message,
            type,
            buttons: buttons || [{ text: 'OK', style: 'default' }]
        };

        if (currentAlert) {
            setAlertQueue(prev => [...prev, newAlert]);
        } else {
            setCurrentAlert(newAlert);
        }
    }, [currentAlert]);

    const hideAlert = useCallback(() => {
        setCurrentAlert(null);

        if (alertQueue.length > 0) {
            const [nextAlert, ...remainingAlerts] = alertQueue;
            setAlertQueue(remainingAlerts);
            setTimeout(() => setCurrentAlert(nextAlert), 100);
        }
    }, [alertQueue]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, currentAlert }}>
            {children}
        </AlertContext.Provider>
    );
};
