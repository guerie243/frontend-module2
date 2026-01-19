/**
 * User Service
 * 
 * API service for user authentication and profile operations
 * Communicates with Module 1 backend
 * Pattern from Module 1 userService
 */

import { module1Api } from './api';
import { User } from '../types';

export const userService = {
    /**
     * Login user
     */
    login: async (email: string, password: string) => {
        const response = await module1Api.post<{ success: boolean; token: string; user: User }>(
            '/auth/login',
            { email, password }
        );
        return response.data;
    },

    /**
     * Register new user
     */
    register: async (data: { name: string; email: string; password: string; phone?: string }) => {
        const response = await module1Api.post<{ success: boolean; token: string; user: User }>(
            '/auth/register',
            data
        );
        return response.data;
    },

    /**
     * Get current user profile
     */
    getProfile: async () => {
        const response = await module1Api.get<{ success: boolean; user: User }>('/users/profile');
        return response.data.user;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: Partial<User>) => {
        const response = await module1Api.patch<{ success: boolean; user: User }>(
            '/users/profile',
            data
        );
        return response.data.user;
    },

    /**
     * Update notification tokens
     */
    updateTokens: async (firebaseToken?: string, webPushToken?: string) => {
        const response = await module1Api.patch<{ success: boolean; user: User }>(
            '/users/tokens',
            { firebaseToken, webPushToken }
        );
        return response.data.user;
    },
};
