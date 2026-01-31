/**
 * Root Provider
 * 
 * Wraps all context providers and TanStack Query client
 * Pattern from Module 1
 */

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AlertProvider } from '../components/AlertProvider';
import { ToastProvider } from '../components/ToastNotification';
import { AlertModal } from '../components/AlertModal';
import { NotificationHandler } from '../components/NotificationHandler';

// Create QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
        },
    },
});

export const RootProvider = ({ children }: { children: ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AlertProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <NotificationHandler />
                            <AlertModal />
                            {children}
                        </AuthProvider>
                    </ToastProvider>
                </AlertProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
