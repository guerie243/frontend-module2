import { useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { activityTracker } from '../services/activityTracker';

export const useActivityTracking = () => {
    const route = useRoute();
    const startTime = useRef(Date.now());

    useEffect(() => {
        const screenName = route.name;
        activityTracker.trackScreen(screenName);

        // Tracker l'entrée sur l'écran (optionnel, déjà géré par trackScreen si décommenté)
        // activityTracker.track('SCREEN_VIEW', { screenName });

        return () => {
            const timeSpent = Date.now() - startTime.current;
            // On peut tracker le temps passé si nécessaire
            // activityTracker.track('SCREEN_EXIT', { screenName, timeSpentMs: timeSpent });
        };
    }, [route.name]);
};
