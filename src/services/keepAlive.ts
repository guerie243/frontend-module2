import { api, module1Api } from './api';

const MIN_MINUTES = 1;
const MAX_MINUTES = 14;

const getRandomDelay = () => {
    const minMs = MIN_MINUTES * 60 * 1000;
    const maxMs = MAX_MINUTES * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
};

const generateSyncPhrase = () => {
    return `sync_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
};

/**
 * Coordinated Synchronization Cycle
 * 
 * 1. Generates a unique phrase
 * 2. POST the phrase to both Module 1 and Module 2 backends
 * 3. Waits for a random interval (1-14 min)
 * 4. Verifies the phrase exists via GET on both backends
 * 5. DELETE the phrase from both backends
 */
export const runSyncCycle = async () => {
    const phrase = generateSyncPhrase();
    const delay = getRandomDelay();
    
    console.log(`[KeepAlive] New Sync Cycle started with phrase: ${phrase}`);
    console.log(`[KeepAlive] Step 1: Posting phrase to both backends...`);

    try {
        // Step 1: POST to both backends
        await Promise.all([
            module1Api.post('/sync/phrase', { phrase }).catch(e => console.log('[KeepAlive] B1 POST error:', e.message)),
            api.post('/sync/phrase', { phrase }).catch(e => console.log('[KeepAlive] B2 POST error:', e.message))
        ]);

        console.log(`[KeepAlive] Step 2: Waiting ${Math.round(delay / 60000)} minutes...`);
        
        // Wait for the random interval
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`[KeepAlive] Step 3: Verifying phrase and cleaning up...`);

        // Step 3: Verify (GET) and cleanup (DELETE)
        await Promise.all([
            // Backend 1
            (async () => {
                try {
                    const res = await module1Api.get('/sync/phrase');
                    console.log(`[KeepAlive] B1 Verification: ${res.data.phrase === phrase ? 'SUCCESS' : 'MISMATCH'}`);
                } catch (e) { console.log('[KeepAlive] B1 GET error:', e.message); }
                await module1Api.delete('/sync/phrase').catch(() => {});
            })(),
            // Backend 2
            (async () => {
                try {
                    const res = await api.get('/sync/phrase');
                    console.log(`[KeepAlive] B2 Verification: ${res.data.phrase === phrase ? 'SUCCESS' : 'MISMATCH'}`);
                } catch (e) { console.log('[KeepAlive] B2 GET error:', e.message); }
                await api.delete('/sync/phrase').catch(() => {});
            })()
        ]);

        console.log(`[KeepAlive] Sync Cycle completed successfully.`);
    } catch (error: any) {
        console.error('[KeepAlive] Critical error in sync cycle:', error.message);
    } finally {
        // Restart the cycle
        runSyncCycle();
    }
};

export const startKeepAliveServices = () => {
    console.log('[KeepAlive] Starting synchronized keep-alive service');
    runSyncCycle();
};
