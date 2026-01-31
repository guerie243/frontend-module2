/**
 * Environment Configuration
 * 
 * Centralized configuration for API URLs and application settings.
 * Uses EXPO_PUBLIC_ prefixed environment variables for Expo compatibility.
 */

export const ENV = {
    // Module 2 Backend API (Products & Orders)
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',

    // Module 1 Backend API (Auth, Vitrines, Annonces)
    MODULE1_API_URL: process.env.EXPO_PUBLIC_MODULE1_API_URL || 'http://localhost:3000/api',

    // Base URL for sharing and deep linking (local IP for Expo Go)
    SHARE_BASE_URL: process.env.EXPO_PUBLIC_SHARE_BASE_URL || 'http://localhost:8081',
};
