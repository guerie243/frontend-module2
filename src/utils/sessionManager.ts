import { storage } from './storage';

// Fonction simple pour générer un ID unique
const parsedUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

class SessionManager {
    private sessionId: string | null = null;

    async getSessionId(): Promise<string> {
        if (this.sessionId) return this.sessionId;

        const stored = await storage.getItem('sessionId');
        if (stored) {
            this.sessionId = stored;
            return stored;
        }

        const newSession = `sess_${Date.now()}_${parsedUuid()}`;
        await storage.setItem('sessionId', newSession);
        this.sessionId = newSession;
        return newSession;
    }

    async renewSession() {
        await storage.deleteItem('sessionId');
        this.sessionId = null;
        return this.getSessionId();
    }
}

export const sessionManager = new SessionManager();
