/**
 * API Configuration with Axios
 * 
 * Architecture Pattern from Module 1
 * 
 * Features:
 * - Dual API support (Module 1 & Module 2 backends)
 * - JWT token auto-attachment
 * - 401 error handling with session management
 * - Multipart/form-data support
 */

import axios from 'axios';
import { DeviceEventEmitter, Platform } from 'react-native';
import { storage } from '../utils/storage';
import { ENV } from '../config/config';

/**
 * Module 2 API Instance (Products & Orders)
 */
export const api = axios.create({
    baseURL: ENV.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 50000,
});

/**
 * Module 1 API Instance (Auth, Vitrines, Annonces)
 */
export const module1Api = axios.create({
    baseURL: ENV.MODULE1_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 50000,
});

/**
 * Request Interceptor - Auto-attach JWT Token
 */
const requestInterceptor = async (config: any) => {
    try {
        const token = await storage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error retrieving token:', error);
    }
    return config;
};

/**
 * Response Interceptor - Handle 401 Errors
 */
const responseInterceptor = async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
            const token = await storage.getItem('userToken');

            if (token) {
                // Token expired - authenticated user
                console.log('Token expired - returning to guest mode');
                await storage.deleteItem('userToken');
                await storage.deleteItem('userData');

                // Emit session expired event
                if (Platform.OS !== 'web') {
                    DeviceEventEmitter.emit('auth:session_expired');
                }
            } else {
                // Guest user attempting protected action
                console.log('Protected action attempted in guest mode');
                if (Platform.OS !== 'web') {
                    DeviceEventEmitter.emit('auth:login_required');
                }
            }
        } catch (e) {
            console.error('Error handling 401:', e);
        }
    }

    return Promise.reject(error);
};

// Apply interceptors to both API instances
api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
api.interceptors.response.use((response) => response, responseInterceptor);

module1Api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
module1Api.interceptors.response.use((response) => response, responseInterceptor);

export default api;
