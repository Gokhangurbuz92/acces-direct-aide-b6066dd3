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

  if (['smtp', 'resend', 'postmark', 'sendgrid', 'brevo'].includes(provider)) {
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
