/**
 * Environment Configuration
 * 
 * Centralized configuration for API URLs and application settings.
 * Uses EXPO_PUBLIC_ prefixed environment variables for Expo compatibility.
 */

export const ENV = {
    // Module 2 Backend API (Products & Orders)
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://backend-app-3fyc.onrender.com/module2',

    // Module 1 Backend API (Auth, Vitrines, Annonces)
    MODULE1_API_URL: process.env.EXPO_PUBLIC_MODULE1_API_URL || 'https://backend-app-3fyc.onrender.com/api',

    // Base URL for sharing and deep linking (local IP for Expo Go)
    SHARE_BASE_URL: process.env.EXPO_PUBLIC_SHARE_BASE_URL || 'http://localhost:8081',
};

