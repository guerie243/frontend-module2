/**
 * Authentication Context
 * 
 * Manages authentication state and user session
 * Pattern from Module 1 AuthContext
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { storage } from '../utils/storage';
import { userService } from '../services/userService';
import { User } from '../types';
import { activityTracker } from '../services/activityTracker';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (data: { profileName: string; email?: string; phoneNumber?: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = user !== null;
    const isGuest = user === null;

    /**
     * Load user from storage on mount
     */
    useEffect(() => {
        loadUser();
    }, []);

    /**
     * Listen for auth events
     */
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const sessionExpiredListener = DeviceEventEmitter.addListener(
            'auth:session_expired',
            handleSessionExpired
        );

        const loginRequiredListener = DeviceEventEmitter.addListener(
            'auth:login_required',
            handleLoginRequired
        );

        return () => {
            sessionExpiredListener.remove();
            loginRequiredListener.remove();
        };
    }, []);

    const loadUser = async () => {
        try {
            const token = await storage.getItem('userToken');
            const userData = await storage.getItem('userData');

            if (token && userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                console.log('User loaded from storage:', parsedUser.email);
            } else {
                console.log('No user found in storage - guest mode');
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (identifier: string, password: string) => {
        try {
            console.log('[AuthContext] Attempting login for:', identifier);
            const response = await userService.login(identifier, password);
            console.log('[AuthContext] API Response received:', JSON.stringify(response, null, 2));

            if (!response.user) {
                console.error('[AuthContext] CRITICAL: User object is missing in response!');
                throw new Error('Données utilisateur manquantes');
            }

            await storage.setItem('userToken', response.token);
            await storage.setItem('userData', JSON.stringify(response.user));

            console.log('[AuthContext] Setting user state...');
            setUser(response.user);
            console.log('[AuthContext] User state set. Authenticated should be true.');

            // TRACKING
            activityTracker.track('LOGIN_SUCCESS', { userId: response.user.id || response.user._id });
        } catch (error: any) {
            console.error('[AuthContext] Login error:', error);
            throw new Error(error.response?.data?.message || 'Échec de la connexion');
        }
    };

    const register = async (data: { profileName: string; email?: string; phoneNumber?: string; password: string }) => {
        try {
            console.log('Attempting registration for:', data.email || data.phoneNumber);
            const response = await userService.register(data);

            await storage.setItem('userToken', response.token);
            await storage.setItem('userData', JSON.stringify(response.user));

            setUser(response.user);
            console.log('Registration successful:', response.user.email || response.user.phoneNumber);

            // TRACKING
            activityTracker.track('REGISTER_SUCCESS', { userId: response.user.id || response.user._id });
        } catch (error: any) {
            console.error('Registration error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Échec de l\'inscription');
        }
    };

    const logout = async () => {
        try {
            console.log('Logging out user');
            // TRACKING BEFORE CLEARING DATA
            activityTracker.track('LOGOUT', { userId: user?.id || user?._id });

            await storage.deleteItem('userToken');
            await storage.deleteItem('userData');
            setUser(null);
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = async (data: Partial<User>) => {
        try {
            console.log('Updating user profile');
            const updatedUser = await userService.updateProfile(data);

            await storage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);
            console.log('Profile updated successfully');
        } catch (error: any) {
            console.error('Update profile error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Échec de la mise à jour du profil');
        }
    };

    const handleSessionExpired = () => {
        console.log('Session expired event received');
        logout();
    };

    const handleLoginRequired = () => {
        console.log('Login required event received');
    };

    const refreshUser = async () => {
        try {
            console.log('Refreshing user profile from server');
            const updatedUser = await userService.getProfile();
            await storage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);
            console.log('Profile refreshed successfully');
        } catch (error: any) {
            console.error('Refresh profile error:', error.response?.data || error.message);
            // Si l'erreur est une authentification, déconnecter l'utilisateur
            if (error.response?.status === 401) {
                await logout();
            }
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isGuest,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
