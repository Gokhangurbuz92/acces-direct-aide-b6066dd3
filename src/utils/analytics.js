
/**
 * Unified Analytics Utility for Business Events
 */
export const trackBusinessEvent = (eventName, properties = {}) => {
    // Basic console tracking for Dev/Preview
    // In production, this would connect to plausible, matomo, or google analytics
    if (import.meta.env.DEV || import.meta.env.VITE_PUBLIC_ENABLE_LOGGING === 'true') {
        console.groupCollapsed(`[Analytics] ${eventName}`);
        console.log('Properties:', properties);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }

    // Future integration point
    // window.plausible?.(eventName, { props: properties });
};
