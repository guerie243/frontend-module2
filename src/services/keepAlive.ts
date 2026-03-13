/**
 * Keep Alive Service
 * 
 * Pings the backends at random intervals between 1 and 14 minutes
 * to prevent them from falling asleep.
 */

import { api, module1Api } from './api';

const MIN_MINUTES = 1;
const MAX_MINUTES = 14;

const getRandomDelay = () => {
    // Random between 1 and 14 minutes in milliseconds
    const minMs = MIN_MINUTES * 60 * 1000;
    const maxMs = MAX_MINUTES * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
};

export const keepBackend1Alive = () => {
    const delay = getRandomDelay();
    console.log(`[KeepAlive] Scheduled Backend 1 ping in ${Math.round(delay / 60000)} minutes`);
    
    setTimeout(async () => {
        try {
            // We use a simple GET request to the root API endpoint
            await api.get('/');
            console.log('[KeepAlive] Pinged Backend 1 successfully');
        } catch (error: any) {
            // Ignore errors (even 404/401 won't matter, we just need to hit the server)
            console.log('[KeepAlive] Pinged Backend 1 (with expected error):', error?.message);
        } finally {
            // Call recursively to schedule the next ping
            keepBackend1Alive();
        }
    }, delay);
};

export const keepBackend2Alive = () => {
    const delay = getRandomDelay();
    console.log(`[KeepAlive] Scheduled Backend 2 ping in ${Math.round(delay / 60000)} minutes`);
    
    setTimeout(async () => {
        try {
            // Ping second backend
            await module1Api.get('/');
            console.log('[KeepAlive] Pinged Backend 2 successfully');
        } catch (error: any) {
            console.log('[KeepAlive] Pinged Backend 2 (with expected error):', error?.message);
        } finally {
            // Call recursively to schedule the next ping
            keepBackend2Alive();
        }
    }, delay);
};

export const startKeepAliveServices = () => {
    console.log('[KeepAlive] Starting keep-alive services for both backends');
    keepBackend1Alive();
    keepBackend2Alive();
};
