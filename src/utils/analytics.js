/**
 * Unified Analytics Utility for Business Events
 */
import { frontendEnv } from '@/config/env';

export const trackBusinessEvent = (eventName, properties = {}) => {
    // Basic console tracking for Dev/Preview
    // In production, this would connect to plausible, matomo, or google analytics
    if (frontendEnv.runtime.isDev || frontendEnv.flags.publicEnableLogging) {
        console.groupCollapsed(`[Analytics] ${eventName}`);
        console.log('Properties:', properties);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }

    // Future integration point
    // window.plausible?.(eventName, { props: properties });
};
