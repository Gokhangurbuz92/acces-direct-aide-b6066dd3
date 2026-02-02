/**
 * Démarches Connectors Index
 * Export all available connectors
 */

import { ServicePublicConnector } from './service-public.js';
import { ANTSConnector } from './ants.js';
import { AmeliConnector } from './ameli.js';

export const ALL_CONNECTORS = [
  new ServicePublicConnector(),
  new ANTSConnector(),
  new AmeliConnector()
];

export function getConnectorByName(name) {
  return ALL_CONNECTORS.find(c => c.name === name);
}

export function getAllConnectorNames() {
  return ALL_CONNECTORS.map(c => c.name);
}
