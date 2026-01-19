/**
 * Storage Utility
 * 
 * AsyncStorage wrapper for consistent data persistence
 * Pattern from Module 1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    /**
     * Get item from storage
     */
    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting item ${key}:`, error);
            return null;
        }
    },

    /**
     * Set item in storage
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error setting item ${key}:`, error);
        }
    },

    /**
     * Delete item from storage
     */
    async deleteItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`Error deleting item ${key}:`, error);
        }
    },

    /**
     * Clear all storage
     */
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
};
