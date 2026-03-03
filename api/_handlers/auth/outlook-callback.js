import logger from '../../_utils/logger.js';
// @ts-nocheck
/**
 * Outlook OAuth2 Callback Handler
 *
 * Receives the authorization code from Microsoft Azure after a Pro
 * user consents to share their Outlook calendar. Exchanges the code
 * for access/refresh tokens and persists them into
 * Structure.settings_json (consistent with outlook-availability.js).
 *
 * Required env vars:
 *   OUTLOOK_CLIENT_ID
 *   OUTLOOK_CLIENT_SECRET
 *   OUTLOOK_REDIRECT_URI
 */

import prisma from '../../_utils/prisma.js';
import { env } from '../../_utils/env.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains structureId for token storage

    if (!code) {
        return res.status(400).json({ error: "Code d'autorisation manquant" });
    }

    const clientId = env.outlook.clientId;
    const clientSecret = env.outlook.clientSecret;
    const redirectUri = env.outlook.redirectUri;

    if (!clientId || !clientSecret || !redirectUri) {
        logger.error('[Outlook Auth] Variables d\'environnement manquantes');
        return res.status(500).json({
            error: 'Configuration Outlook incomplète. Vérifiez OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET et OUTLOOK_REDIRECT_URI.',
        });
    }

    try {
        // 1. Exchange authorization code for tokens
        const tokenResponse = await fetch(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            }
        );

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            logger.error('[Outlook Auth] Token error:', tokens.error_description);
            return res.status(400).json({
                error: 'Erreur Microsoft : ' + (tokens.error_description || tokens.error),
            });
        }

        // 2. Persist tokens into Structure.settings_json
        //    `state` contains the structureId (set when initiating the OAuth flow)
        const structureId = state;
        if (!structureId) {
            logger.error('[Outlook Auth] Missing structureId in state parameter');
            return res.status(400).json({ error: 'Identifiant de structure manquant.' });
        }

        const structure = await prisma.structure.findUnique({
            where: { id: structureId },
            select: { id: true, settings_json: true },
        });

        if (!structure) {
            return res.status(404).json({ error: 'Structure introuvable.' });
        }

        // Merge Outlook tokens into existing settings (don't overwrite other fields)
        const existingSettings = (structure.settings_json && typeof structure.settings_json === 'object')
            ? structure.settings_json
            : {};

        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

        await prisma.structure.update({
            where: { id: structureId },
            data: {
                settings_json: {
                    ...existingSettings,
                    outlookToken: tokens.access_token,
                    outlookRefreshToken: tokens.refresh_token || null,
                    outlookTokenExpiresAt: expiresAt,
                    outlookScopes: tokens.scope || '',
                    outlookConnectedAt: new Date().toISOString(),
                },
            },
        });

        // 3. Audit log
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'OUTLOOK_CONNECTED',
                    entity: 'Structure',
                    entity_id: structureId,
                    details: {
                        scopes: tokens.scope,
                        expiresAt,
                    },
                },
            });
        } catch (auditErr) {
            logger.error('[Outlook Auth] Audit log failed:', auditErr.message);
        }

        logger.info('[Outlook Auth] Tokens persistés pour structure:', structureId);

        // 4. Redirect to pro dashboard with success indicator
        const dashboardUrl = '/pro/dashboard?outlook=connected';
        res.setHeader('Location', dashboardUrl);
        return res.status(302).end();
    } catch (error) {
        logger.error('[Outlook Auth] Erreur critique:', error.message);
        return res.status(500).json({
            error: 'Erreur lors de la synchronisation Outlook.',
        });
    }
}

