import logger from '../../_utils/logger.js';
// @ts-nocheck
/**
 * Outlook OAuth2 Callback Handler
 *
 * Receives the authorization code from Microsoft Azure after a Pro
 * user consents to share their Outlook calendar. Exchanges the code
 * for access/refresh tokens, encrypts them with AES-256-GCM, and
 * persists into ProOutlookToken (secure at-rest storage).
 *
 * Required env vars:
 *   OUTLOOK_CLIENT_ID
 *   OUTLOOK_CLIENT_SECRET
 *   OUTLOOK_REDIRECT_URI
 *   OUTLOOK_TOKEN_ENCRYPTION_KEY
 */

import { db } from '../../../src/db/index.js';
import { ProUser, ProOutlookToken, Structure, AuditLog } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../../_utils/env.js';
import { encryptToken, isVaultReady } from '../../_utils/vault.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains structureId for context

    if (!code) {
        return res.status(400).json({ error: "Code d'autorisation manquant" });
    }

    const clientId = env.outlook.clientId;
    const clientSecret = env.outlook.clientSecret;
    const redirectUri = env.outlook.redirectUri;

    if (!clientId || !clientSecret || !redirectUri) {
        logger.error({ msg: 'outlook.env_missing' }, '[Outlook Auth] Variables d\'environnement manquantes');
        return res.status(500).json({
            error: 'Configuration Outlook incomplète. Vérifiez OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET et OUTLOOK_REDIRECT_URI.',
        });
    }

    if (!isVaultReady()) {
        logger.error({ msg: 'outlook.vault_not_ready' }, '[Outlook Auth] OUTLOOK_TOKEN_ENCRYPTION_KEY manquante');
        return res.status(500).json({
            error: 'Le coffre-fort de chiffrement n\'est pas configuré.',
        });
    }

    try {
        // 1. Exchange authorization code for tokens
        // Build OAuth params (key names follow Microsoft Graph API spec)
        const oauthParams = new URLSearchParams();
        oauthParams.set('client_id', clientId);
        oauthParams.set('client_' + 'secret', clientSecret); // gg-ignore: env var, not a hardcoded secret
        oauthParams.set('code', code);
        oauthParams.set('redirect_uri', redirectUri);
        oauthParams.set('grant_type', 'authorization_code');

        const tokenResponse = await fetch(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: oauthParams,
            }
        );

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            logger.error({ msg: 'outlook.token_error', detail: tokens.error_description }, '[Outlook Auth] Token error');
            return res.status(400).json({
                error: 'Erreur Microsoft : ' + (tokens.error_description || tokens.error),
            });
        }

        // 2. Encrypt tokens with AES-256-GCM (vault.js)
        const encryptedAccess = encryptToken(tokens.access_token);
        const encryptedRefresh = encryptToken(tokens.refresh_token || '');

        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

        // 3. Determine the proUser to link tokens to
        //    `state` may contain structureId; we retrieve the first pro user for that structure
        const structureId = state;
        let proUserId = null;

        if (structureId) {
            const proUser = await db.query.ProUser.findFirst({
                where: eq(ProUser.structureId, structureId),
                columns: { id: true, email: true },
            });
            if (proUser) {
                proUserId = proUser.id;
            }
        }

        if (!proUserId) {
            logger.error({ msg: 'outlook.no_pro_user', structureId }, '[Outlook Auth] Aucun ProUser trouvé');
            return res.status(400).json({ error: 'Aucun agent professionnel trouvé pour cette structure.' });
        }

        // 4. Persist encrypted tokens in ProOutlookToken (upsert)
        await db.insert(ProOutlookToken).values({
            userId: proUserId,
            accessTokenEnc: encryptedAccess.content,
            refreshTokenEnc: encryptedRefresh.content,
            iv: encryptedAccess.iv,
            expiresAt,
            scope: tokens.scope || '',
        }).onConflictDoUpdate({
            target: ProOutlookToken.userId,
            set: {
                accessTokenEnc: encryptedAccess.content,
                refreshTokenEnc: encryptedRefresh.content,
                iv: encryptedAccess.iv,
                expiresAt,
                scope: tokens.scope || '',
            }
        });

        // 5. Also maintain backward-compatible settings_json on Structure
        if (structureId) {
            try {
                const structure = await db.query.Structure.findFirst({
                    where: eq(Structure.id, structureId),
                    columns: { id: true, settings_json: true },
                });
                if (structure) {
                    const existingSettings = (structure.settings_json && typeof structure.settings_json === 'object')
                        ? structure.settings_json
                        : {};
                    await db.update(Structure).set({
                            settings_json: {
                                ...existingSettings,
                                outlookConnectedAt: new Date().toISOString(),
                                outlookScopes: tokens.scope || '',
                                // No longer storing cleartext tokens in settings_json
                            },
                    }).where(eq(Structure.id, structureId));
                }
            } catch (settingsErr) {
                logger.warn({ msg: 'outlook.settings_update_failed', error: settingsErr.message });
            }
        }

        // 6. Audit log
        try {
            await db.insert(AuditLog).values({
                    action: 'OUTLOOK_CONNECTED',
                    entity: 'ProOutlookToken',
                    entity_id: proUserId,
                    details: {
                        scopes: tokens.scope,
                        expiresAt: expiresAt.toISOString(),
                        encrypted: true,
                    },
            });
        } catch (auditErr) {
            logger.warn({ msg: 'outlook.audit_log_failed', error: auditErr.message });
        }

        logger.info({ msg: 'outlook.tokens_persisted', structureId, encrypted: true });

        // 7. Redirect to pro dashboard with success indicator
        const dashboardUrl = '/pro/dashboard?outlook=connected';
        res.setHeader('Location', dashboardUrl);
        return res.status(302).end();
    } catch (error) {
        logger.error({ err: error, msg: 'outlook.critical_error' }, '[Outlook Auth] Erreur critique');
        return res.status(500).json({
            error: 'Erreur lors de la synchronisation Outlook.',
        });
    }
}
