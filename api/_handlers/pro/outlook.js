import logger from '../../_utils/logger.js';
// @ts-nocheck
import { requireProAuth } from '../../_utils/auth.js';
import { db } from '../../../src/db/index.js';
import { ProOutlookToken } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

import { env } from '../../_utils/env.js';
const OUTLOOK_CLIENT_ID = env.outlook.clientId || '';
const OUTLOOK_CLIENT_SECRET = env.outlook.clientSecret || '';
const OUTLOOK_REDIRECT_URI = env.outlook.redirectUri || '';
const OUTLOOK_ENABLED = env.outlook.enabled;
const TOKEN_KEY = env.outlook.tokenEncryptionKey || '';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const SCOPES = 'openid profile email Calendars.ReadWrite offline_access';

// ── AES-256-GCM helpers ──
function encrypt(text) {
    if (!TOKEN_KEY || TOKEN_KEY.length < 32) return { content: text }; // dev fallback: plaintext
    const key = Buffer.from(TOKEN_KEY.slice(0, 32), 'utf8');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { content: `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}` };
}

function decrypt(data) {
    if (!TOKEN_KEY || TOKEN_KEY.length < 32) return data; // dev fallback
    if (!data.includes(':')) return data; // plaintext fallback
    const [ivHex, tagHex, encHex] = data.split(':');
    const key = Buffer.from(TOKEN_KEY.slice(0, 32), 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'), { authTagLength: 16 });
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
}

/**
 * Outlook OAuth Integration
 *
 * GET  /api/pro/outlook?action=authorize   → Redirect to Microsoft OAuth
 * GET  /api/pro/outlook?action=callback&code=xxx → Exchange code for token
 * GET  /api/pro/outlook?action=status      → Check connection status
 * POST /api/pro/outlook?action=disconnect  → Disconnect Outlook
 */
async function handler(req, res) {
    if (!OUTLOOK_ENABLED) {
        return res.status(200).json({
            ok: false,
            status: 'not_configured',
            message: 'Outlook n\'est pas encore activé.',
        });
    }

    if (!OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET || !OUTLOOK_REDIRECT_URI) {
        logger.warn('[Outlook] Missing env vars');
        return res.status(200).json({
            ok: false,
            status: 'missing_config',
            message: 'Configuration Outlook incomplète.',
        });
    }

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const action = url.searchParams.get('action') || '';
    const userId = req.proUser?.id;

    try {
        // ── Authorize: Redirect to Microsoft login ──
        if (action === 'authorize' && req.method === 'GET') {
            const state = Buffer.from(JSON.stringify({
                userId,
                ts: Date.now(),
            })).toString('base64url');

            const authUrl = new URL(`${MICROSOFT_AUTH_URL}/authorize`);
            authUrl.searchParams.set('client_id', OUTLOOK_CLIENT_ID);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('redirect_uri', OUTLOOK_REDIRECT_URI);
            authUrl.searchParams.set('scope', SCOPES);
            authUrl.searchParams.set('state', state);
            authUrl.searchParams.set('response_mode', 'query');

            return res.writeHead(302, { Location: authUrl.toString() }).end();
        }

        // ── Callback: Exchange code for tokens ──
        if (action === 'callback' && req.method === 'GET') {
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');

            if (error) {
                logger.warn({ error }, '[Outlook] OAuth error');
                return res.status(200).json({
                    ok: false,
                    status: 'oauth_error',
                    error,
                });
            }

            if (!code) {
                return res.status(400).json({ error: 'Code requis.' });
            }

            const tokenResponse = await fetch(`${MICROSOFT_AUTH_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: OUTLOOK_CLIENT_ID,
                    client_secret: OUTLOOK_CLIENT_SECRET,
                    code,
                    redirect_uri: OUTLOOK_REDIRECT_URI,
                    grant_type: 'authorization_code',
                    scope: SCOPES,
                }),
            });

            if (!tokenResponse.ok) {
                const errBody = await tokenResponse.text().catch(() => '');
                logger.error({ status: tokenResponse.status, body: errBody }, '[Outlook] Token exchange failed');
                return res.status(200).json({
                    ok: false,
                    status: 'token_error',
                });
            }

            const tokens = await tokenResponse.json();

            // Persist tokens (encrypted at rest)
            const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
            
            const existingToken = await db.query.ProOutlookToken.findFirst({
                where: eq(ProOutlookToken.userId, userId)
            });

            if (existingToken) {
                await db.update(ProOutlookToken).set({
                    accessTokenEnc: encrypt(tokens.access_token).content,
                    refreshTokenEnc: encrypt(tokens.refresh_token || '').content,
                    expiresAt,
                    scope: tokens.scope || null,
                }).where(eq(ProOutlookToken.userId, userId));
            } else {
                await db.insert(ProOutlookToken).values({
                    userId,
                    accessTokenEnc: encrypt(tokens.access_token).content,
                    refreshTokenEnc: encrypt(tokens.refresh_token || '').content,
                    expiresAt,
                    scope: tokens.scope || null,
                });
            }

            logger.info({ userId }, '[Outlook] OAuth connected — tokens persisted');

            return res.status(200).json({
                ok: true,
                status: 'connected',
                expiresIn: tokens.expires_in,
                scope: tokens.scope,
            });
        }

        // ── Status: Check if connected ──
        if (action === 'status' && req.method === 'GET') {
            const stored = await db.query.ProOutlookToken.findFirst({
                where: eq(ProOutlookToken.userId, userId),
                columns: { expiresAt: true, scope: true, updatedAt: true },
            });

            if (!stored) {
                return res.status(200).json({
                    ok: true,
                    status: 'not_connected',
                    outlookEnabled: OUTLOOK_ENABLED,
                });
            }

            const isExpired = stored.expiresAt < new Date();
            return res.status(200).json({
                ok: true,
                status: isExpired ? 'token_expired' : 'connected',
                expiresAt: stored.expiresAt.toISOString(),
                scope: stored.scope,
                connectedSince: stored.updatedAt.toISOString(),
                outlookEnabled: OUTLOOK_ENABLED,
            });
        }

        // ── Disconnect ──
        if (action === 'disconnect' && req.method === 'POST') {
            await db.delete(ProOutlookToken).where(eq(ProOutlookToken.userId, userId));
            logger.info({ userId }, '[Outlook] Disconnected — tokens removed');
            return res.status(200).json({ ok: true, status: 'disconnected' });
        }

        return res.status(400).json({ error: 'Action invalide. Attendu: authorize, callback, status, disconnect.' });
    } catch (error) {
        logger.error({ err: error }, '[Outlook] Erreur');
        return res.status(500).json({ error: 'Erreur Outlook.' });
    }
}

export default requireProAuth(handler);
