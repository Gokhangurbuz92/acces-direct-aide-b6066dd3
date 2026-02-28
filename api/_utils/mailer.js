import { env } from './env.js';

/**
 * @typedef {{
 *  filename: string,
 *  contentType: string,
 *  content: string
 * }} MailAttachment
 */

/** @typedef {{ to: string, subject: string, text: string, html?: string, category?: string, attachments?: MailAttachment[] }} MailPayload */

/** @type {Array<{ to: string, subject: string, text: string, html?: string, sentAt: string, category: string, attachments?: MailAttachment[] }>} */
const testOutbox = [];
const warnedProviders = new Set();

/**
 * @returns {string}
 */
function getProvider() {
  return String(env.mailer.provider || 'noop').trim().toLowerCase() || 'noop';
}

/**
 * @param {string} provider
 */
function warnProviderOnce(provider) {
  if (warnedProviders.has(provider)) return;
  warnedProviders.add(provider);
  console.warn(`[mailer] Provider "${provider}" is not configured for runtime delivery; using safe no-op.`);
}

/**
 * @param {MailPayload} payload
 * @returns {Promise<{ accepted: boolean, delivered: boolean, provider: string }>}
 */
export async function sendMail(payload) {
  const provider = getProvider();
  const from = String(env.mailer.from || '').trim();
  const category = String(payload.category || 'transactional').trim() || 'transactional';

  if (!payload || typeof payload !== 'object') {
    return { accepted: false, delivered: false, provider };
  }
  if (!payload.to || !payload.subject || !payload.text) {
    return { accepted: false, delivered: false, provider };
  }

  if (!from) {
    warnProviderOnce('missing_from');
  }

  if (provider === 'test') {
    const attachments = Array.isArray(payload.attachments)
      ? payload.attachments.map((attachment) => ({
        filename: String(attachment?.filename || '').trim() || 'attachment.txt',
        contentType: String(attachment?.contentType || '').trim() || 'application/octet-stream',
        content: String(attachment?.content || ''),
      }))
      : [];

    testOutbox.push({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      category,
      attachments,
      sentAt: new Date().toISOString(),
    });
    return { accepted: true, delivered: true, provider };
  }

  if (provider === 'noop') {
    warnProviderOnce('noop');
    return { accepted: true, delivered: false, provider };
  }

  // ── Mailjet v3.1 Send API ──
  if (provider === 'mailjet') {
    const apiKey = String(env.mailer.apiKey || '').trim();
    if (!apiKey || !apiKey.includes(':')) {
      warnProviderOnce('mailjet_missing_key');
      console.error('[mailer] MAILER_API_KEY must be in "publicKey:secretKey" format for Mailjet.');
      return { accepted: true, delivered: false, provider };
    }
    if (!from) {
      warnProviderOnce('mailjet_missing_from');
      return { accepted: true, delivered: false, provider };
    }

    try {
      const credentials = Buffer.from(apiKey).toString('base64');
      const mjPayload = {
        Messages: [{
          From: { Email: from, Name: 'AccesDirectAide' },
          To: [{ Email: payload.to }],
          Subject: payload.subject,
          TextPart: payload.text,
          ...(payload.html ? { HTMLPart: payload.html } : {}),
          CustomID: category,
        }],
      };

      const mjResponse = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(mjPayload),
      });

      if (!mjResponse.ok) {
        const errBody = await mjResponse.text().catch(() => '');
        console.error(`[mailer] Mailjet API error (${mjResponse.status}): ${errBody}`);
        return { accepted: true, delivered: false, provider };
      }

      const mjResult = await mjResponse.json();
      const firstMessage = mjResult?.Messages?.[0];
      const status = firstMessage?.Status;
      console.info(`[mailer] Mailjet sent to=${payload.to} status=${status} id=${firstMessage?.To?.[0]?.MessageID || 'n/a'}`);
      return { accepted: true, delivered: status === 'success', provider };
    } catch (err) {
      console.error('[mailer] Mailjet fetch error:', err.message);
      return { accepted: true, delivered: false, provider };
    }
  }

  // ── Resend REST API ──
  if (provider === 'resend') {
    const apiKey = String(env.mailer.apiKey || '').trim();
    if (!apiKey || !from) {
      warnProviderOnce(provider);
      return { accepted: true, delivered: false, provider };
    }
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          ...(payload.html ? { html: payload.html } : {}),
        }),
      });
      if (!resendResponse.ok) {
        const errBody = await resendResponse.text().catch(() => '');
        console.error(`[mailer] Resend error (${resendResponse.status}): ${errBody}`);
        return { accepted: true, delivered: false, provider };
      }
      console.info(`[mailer] Resend sent to=${payload.to}`);
      return { accepted: true, delivered: true, provider };
    } catch (err) {
      console.error('[mailer] Resend fetch error:', err.message);
      return { accepted: true, delivered: false, provider };
    }
  }

  if (['smtp', 'postmark', 'sendgrid', 'brevo'].includes(provider)) {
    // Provider wiring is intentionally deferred to deployment config.
    warnProviderOnce(provider);
    return { accepted: true, delivered: false, provider };
  }

  warnProviderOnce(provider);
  return { accepted: true, delivered: false, provider };
}

/**
 * Test-only accessor.
 */
export function __getTestOutbox() {
  return testOutbox.slice();
}

/**
 * Test-only reset.
 */
export function __clearTestOutbox() {
  testOutbox.length = 0;
}
