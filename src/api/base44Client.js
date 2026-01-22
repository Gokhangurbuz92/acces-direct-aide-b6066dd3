// src/api/base44Client.js
// Compat layer for legacy imports: '@/api/base44Client'
// Single source of truth is src/api/client.js

import defaultClient, {
    apiClient as namedApiClient,
    adminClient as namedAdminClient,
    publicClient as namedPublicClient,
    client as namedClient,
    api as namedApi,
} from './client';

// Re-export the identifiers that the codebase expects:
const actualClient = namedApiClient || defaultClient;

export const apiClient = actualClient;
export const adminClient = namedAdminClient || actualClient;
export const publicClient = namedPublicClient || actualClient;
export const client = namedClient || actualClient;
export const api = namedApi || actualClient;

export default actualClient;
