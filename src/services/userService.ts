/**
 * User Service
 * 
 * API service for user authentication and profile operations
 * Communicates with Module 1 backend
 * Pattern from Module 1 userService
 */

import { module1Api } from './api';
import { User } from '../types';
import { toFormData, hasFiles } from '../utils/formDataHelper';

export const userService = {
    /**
     * Login user
     */
    login: async (identifier: string, password: string) => {
        const response = await module1Api.post<{ success: boolean; token: string; user: User }>(
            '/users/login',
            { identifier, password }
        );
        return response.data;
    },

    /**
     * Register new user
     */
    register: async (data: { profileName: string; email?: string; phoneNumber?: string; password: string }) => {
        const response = await module1Api.post<{ success: boolean; token: string; user: User }>(
            '/users',
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
        const payload = hasFiles(data) ? await toFormData(data) : data;

        const response = await module1Api.patch<{ success: boolean; user: User }>(
            '/users', // Backend uses Router.patch('/', ...) mounted on /api/users
            payload
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

    /**
     * Delete user account
     */
    deleteAccount: async (password: string) => {
        const response = await module1Api.delete<{ success: boolean; message: string }>(
            '/users/',
            { data: { password } }
        );
        return response.data;
    },
};
