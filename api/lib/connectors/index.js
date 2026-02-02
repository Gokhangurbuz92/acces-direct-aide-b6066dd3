/**
 * Connector Registry
 * Central registry for all source connectors
 */

import { RegionGrandEstConnector } from './region-grand-est.js';
import { AgefiphConnector } from './agefiph.js';

export const connectors = {
    'region-grand-est': RegionGrandEstConnector,
    'agefiph': AgefiphConnector
};

export function getConnector(name) {
    const ConnectorClass = connectors[name];
    if (!ConnectorClass) {
        throw new Error(`Unknown connector: ${name}`);
    }
    return new ConnectorClass();
}

export function getAllConnectors() {
    return Object.keys(connectors).map(name => getConnector(name));
}
