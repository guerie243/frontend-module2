import { api } from './api';
import { getDeviceInfo } from '../utils/deviceInfo';
import { sessionManager } from '../utils/sessionManager';
import { storage } from '../utils/storage';

interface ActivityEvent {
    eventType: string;
    userId: string | null;
    screenName: string;
    deviceInfo: any;
    metadata: Record<string, any>;
    timestamp: string;
    sessionId: string;
}

class ActivityTracker {
    private currentScreen: string = 'Unknown';
    private isEnabled: boolean = true;

    constructor() {
        this.checkEnabled();
    }

    private async checkEnabled() {
        const enabled = await storage.getItem('trackingEnabled');
        if (enabled === 'false') {
            this.isEnabled = false;
        }
    }

    public async track(eventType: string, metadata: Record<string, any> = {}) {
        if (!this.isEnabled) return;

        try {
            const sessionId = await sessionManager.getSessionId();
            const userData = await storage.getItem('userData');
            const user = userData ? JSON.parse(userData) : null;

            const event: ActivityEvent = {
                eventType,
                userId: user ? user._id : null,
                screenName: this.currentScreen,
                deviceInfo: getDeviceInfo(),
                metadata,
                timestamp: new Date().toISOString(),
                sessionId
            };

            await this.sendEvent(event);
        } catch (error) {
            console.error('[ActivityTracker] Error tracking event:', error);
        }
    }

    public trackScreen(screenName: string) {
        this.currentScreen = screenName;
        // Optionnel : Tracker la vue d'écran comme un événement
        // this.track('SCREEN_VIEW', { screenName });
    }

    private async sendEvent(event: ActivityEvent) {
        try {
            console.log(`[ActivityTracker] 📡 Tracking: ${event.eventType}`, event.metadata);
            await api.post('/activities', event);
        } catch (error) {
            console.log('[ActivityTracker] Failed to send event, queuing for retry (TODO)');
            // TODO: Implémenter une queue persistante pour le mode offline
        }
    }
}

export const activityTracker = new ActivityTracker();
