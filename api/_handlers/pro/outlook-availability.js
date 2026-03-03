import logger from '../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';
import { env } from '../../_utils/env.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';

/**
 * Outlook Availability Handler
 *
 * Queries Microsoft Graph API for free/busy slots.
 * Policy: ZERO STORAGE of calendar details — only availability status.
 * Tokens are persisted in ProOutlookToken (encrypted at rest via AES-256-GCM).
 *
 * GET /api/pro/outlook-availability?start=...&end=...
 */

const TOKEN_KEY = env.outlook.tokenEncryptionKey || '';

// ── AES-256-GCM helpers (same as outlook.js) ──
function decryptToken(data) {
    if (!TOKEN_KEY || TOKEN_KEY.length < 32) return data; // dev fallback
    if (!data.includes(':')) return data; // plaintext fallback
    const [ivHex, tagHex, encHex] = data.split(':');
    const key = Buffer.from(TOKEN_KEY.slice(0, 32), 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'), { authTagLength: 16 });
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
}

function encryptToken(text) {
    if (!TOKEN_KEY || TOKEN_KEY.length < 32) return text; // dev fallback
    const key = Buffer.from(TOKEN_KEY.slice(0, 32), 'utf8');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Attempts to refresh an expired Outlook access_token using the stored refresh_token.
 *
 * @param {Record<string, any>} storedToken - ProOutlookToken record
 * @param {string} userId - ProUser ID
 * @returns {Promise<string|null>} fresh access_token (plaintext) or null if refresh failed
 */
async function refreshOutlookToken(storedToken, userId) {
    const clientId = env.outlook.clientId;
    const clientSecret = env.outlook.clientSecret;

    let refreshToken;
    try {
        refreshToken = decryptToken(storedToken.refreshToken);
    } catch {
        return null;
    }

    if (!clientId || !clientSecret || !refreshToken) {
        return null;
    }

    try {
        const response = await fetch(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            }
        );

        const tokens = await response.json();
        if (!tokens.access_token) {
            logger.error('[Outlook Availability] Token refresh failed:', tokens.error || 'unknown');
            return null;
        }

        const newExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

        // Persist refreshed tokens back to ProOutlookToken (encrypted)
        await prisma.proOutlookToken.update({
            where: { userId },
            data: {
                accessToken: encryptToken(tokens.access_token),
                refreshToken: encryptToken(tokens.refresh_token || refreshToken),
                expiresAt: newExpiresAt,
            },
        });

        logger.info('[Outlook Availability] Token refreshed for user:', userId);
        return tokens.access_token;
    } catch (err) {
        logger.error('[Outlook Availability] Token refresh error:', err.message);
        return null;
    }
}

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end) {
        return res.status(400).json({ error: 'Paramètres start et end requis' });
    }

    try {
        // Read tokens from ProOutlookToken (encrypted at rest)
        const storedToken = await prisma.proOutlookToken.findUnique({
            where: { userId: proCtx.userId },
        });

        if (!storedToken) {
            return res.status(404).json({
                error: 'Outlook non synchronisé',
                message: 'Connectez votre compte Outlook via le tableau de bord pour activer la synchronisation.',
            });
        }

        // Decrypt and check expiry
        let currentToken;
        try {
            currentToken = decryptToken(storedToken.accessToken);
        } catch {
            return res.status(401).json({
                error: 'Token Outlook corrompu',
                message: 'Veuillez re-synchroniser votre compte Outlook.',
            });
        }

        if (storedToken.expiresAt <= new Date()) {
            logger.info('[Outlook Availability] Token expiré, tentative de refresh...');
            const refreshed = await refreshOutlookToken(storedToken, proCtx.userId);
            if (!refreshed) {
                return res.status(401).json({
                    error: 'Session Outlook expirée',
                    message: 'Veuillez re-synchroniser votre compte Outlook.',
                });
            }
            currentToken = refreshed;
        }

        // Query Microsoft Graph for free/busy
        const graphResponse = await fetch(
            'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schedules: [req.user.email],
                    startTime: { dateTime: start, timeZone: 'Europe/Paris' },
                    endTime: { dateTime: end, timeZone: 'Europe/Paris' },
                    availabilityViewInterval: 30, // 30-minute slots
                }),
            }
        );

        if (!graphResponse.ok) {
            const errorData = await graphResponse.json().catch(() => ({}));
            logger.error('[Outlook Availability] Graph API error:', errorData);

            // Token rejected at runtime (maybe revoked externally)
            if (graphResponse.status === 401) {
                const refreshed = await refreshOutlookToken(storedToken, proCtx.userId);
                if (!refreshed) {
                    return res.status(401).json({
                        error: 'Token Outlook expiré',
                        message: 'Veuillez re-synchroniser votre compte Outlook.',
                    });
                }
                // Retry once with refreshed token
                const retryResponse = await fetch(
                    'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${refreshed}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            schedules: [req.user.email],
                            startTime: { dateTime: start, timeZone: 'Europe/Paris' },
                            endTime: { dateTime: end, timeZone: 'Europe/Paris' },
                            availabilityViewInterval: 30,
                        }),
                    }
                );
                if (!retryResponse.ok) {
                    return res.status(502).json({
                        error: 'Impossible de lire l\'agenda Outlook.',
                    });
                }
                const retryData = await retryResponse.json();
                const retrySchedule = retryData.value?.[0]?.availabilityView || '';
                return res.status(200).json({
                    ok: true,
                    slots: parseAvailabilityView(retrySchedule),
                    interval: 30,
                    start,
                    end,
                    tokenRefreshed: true,
                });
            }

            return res.status(502).json({
                error: 'Impossible de lire l\'agenda Outlook.',
            });
        }

        const data = await graphResponse.json();
        const schedule = data.value?.[0]?.availabilityView || '';

        return res.status(200).json({
            ok: true,
            slots: parseAvailabilityView(schedule),
            interval: 30,
            start,
            end,
        });
    } catch (error) {
        logger.error('[Outlook Availability] Erreur:', error.message);
        return res.status(500).json({ error: 'Erreur serveur interne' });
    }
}

/**
 * Translate Microsoft availability string to ADA format.
 * '0' = Available, '1' = Tentative, '2' = Busy, '3' = OOF
 *
 * @param {string} view
 * @returns {Array<{index: number, isAvailable: boolean, status: string}>}
 */
function parseAvailabilityView(view) {
    return view.split('').map((status, index) => ({
        index,
        isAvailable: status === '0',
        status: status === '0' ? 'libre' : status === '1' ? 'provisoire' : 'occupé',
    }));
}

export default requireProAuth(handler);
