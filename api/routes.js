// Central Routing Definition — Static imports for Vercel bundler tracing
// Each handler uses inline import() with string literals so @vercel/nft
// can statically analyze and include them in the serverless bundle.
// Used by both api/index.js (Vercel) and dev-server.js (Local)

/**
 * @typedef {Object} Route
 * @property {string} path
 * @property {'exact' | 'prefix'} match
 * @property {Function} handler - Lazy loader: () => import('./handler.js')
 */

/** @type {Route[]} */
export const routes = [
    // --- Special / Root ---
    { path: 'download', match: 'exact', handler: () => import('./_handlers/download.js') },
    { path: 'health', match: 'exact', handler: () => import('./_handlers/health.js') },
    { path: 'health/deep', match: 'exact', handler: () => import('./_handlers/health-deep.js') },
    { path: 'monitor/cron/actualites', match: 'exact', handler: () => import('./_handlers/monitor/cron-actualites.js') },
    { path: 'monitor/core', match: 'exact', handler: () => import('./_handlers/monitor/core.js') },
    { path: 'monitor/data-quality', match: 'exact', handler: () => import('./_handlers/monitor/data-quality.js') },
    { path: 'monitor/ingestion-freshness', match: 'exact', handler: () => import('./_handlers/monitor/ingestion-freshness.js') },
    { path: 'monitor/pro-rdv', match: 'exact', handler: () => import('./_handlers/monitor/pro-rdv.js') },
    { path: 'healthz', match: 'exact', handler: () => import('./_handlers/health.js') },
    { path: 'robots.txt', match: 'exact', handler: () => import('./_handlers/robots.js') },
    { path: 'robots', match: 'exact', handler: () => import('./_handlers/robots.js') },
    { path: 'sitemap.xml', match: 'exact', handler: () => import('./_handlers/sitemap.js') },
    { path: 'sitemap', match: 'exact', handler: () => import('./_handlers/sitemap.js') },
    { path: 'login-pro-guard', match: 'exact', handler: () => import('./_handlers/login-pro-guard.js') },
    { path: 'taxonomy', match: 'exact', handler: () => import('./_handlers/taxonomy.js') },
    { path: 'pdf', match: 'prefix', handler: () => import('./_handlers/pdf.js') },
    { path: 'contact', match: 'exact', handler: () => import('./_handlers/contact.js') },

    // --- Auth (Admin) ---
    { path: 'auth/login', match: 'exact', handler: () => import('./_handlers/auth/login.js') },
    { path: 'auth/signup', match: 'exact', handler: () => import('./_handlers/auth/signup.js') },
    { path: 'auth/logout', match: 'exact', handler: () => import('./_handlers/auth/logout.js') },
    { path: 'auth/me', match: 'exact', handler: () => import('./_handlers/auth/me.js') },
    { path: 'auth/verify-email', match: 'exact', handler: () => import('./_handlers/auth/verify-email.js') },
    { path: 'auth/resend-verification', match: 'exact', handler: () => import('./_handlers/auth/resend-verification.js') },
    { path: 'auth/forgot-password', match: 'exact', handler: () => import('./_handlers/auth/forgot-password.js') },
    { path: 'auth/reset-password', match: 'exact', handler: () => import('./_handlers/auth/reset-password.js') },

    // --- Pro Module ---
    { path: 'pro/auth/login', match: 'exact', handler: () => import('./_handlers/pro/auth/login.js') },
    { path: 'pro/auth/mfa-verify', match: 'exact', handler: () => import('./_handlers/pro/auth/mfa-verify.js') },
    { path: 'pro/auth/register', match: 'exact', handler: () => import('./_handlers/pro/auth/register.js') },
    { path: 'pro/auth/forgot-password', match: 'exact', handler: () => import('./_handlers/pro/auth/forgot-password.js') },
    { path: 'pro/auth/reset-password', match: 'exact', handler: () => import('./_handlers/pro/auth/reset-password.js') },
    { path: 'pro/auth/register-invite', match: 'exact', handler: () => import('./_handlers/pro/auth/register-invite.js') },
    { path: 'pro/auth/refresh', match: 'exact', handler: () => import('./_handlers/pro/auth/refresh.js') },
    { path: 'pro/me', match: 'exact', handler: () => import('./_handlers/pro/me.js') },
    { path: 'pro/mfa-setup', match: 'exact', handler: () => import('./_handlers/pro/mfa-setup.js') },
    { path: 'pro/slots', match: 'exact', handler: () => import('./_handlers/pro/slots.js') },
    { path: 'pro/availability', match: 'exact', handler: () => import('./_handlers/pro/availability.js') },
    { path: 'pro/timeoff', match: 'exact', handler: () => import('./_handlers/pro/timeoff.js') },
    { path: 'pro/rdv/settings', match: 'exact', handler: () => import('./_handlers/pro/rdv-settings.js') },
    { path: 'pro/outlook/availability', match: 'exact', handler: () => import('./_handlers/pro/outlook-availability.js') },
    { path: 'pro/team', match: 'exact', handler: () => import('./_handlers/pro/team.js') },
    { path: 'pro/invite', match: 'exact', handler: () => import('./_handlers/pro/invite.js') },
    { path: 'pro/resend-invite', match: 'exact', handler: () => import('./_handlers/pro/resend-invite.js') },
    { path: 'pro/dossier', match: 'exact', handler: () => import('./_handlers/pro/dossier.js') },
    { path: 'pro/notifications/unread-count', match: 'exact', handler: () => import('./_handlers/pro/notifications/unread-count.js') },
    { path: 'pro/notifications', match: 'exact', handler: () => import('./_handlers/pro/notifications.js') },
    { path: 'pro/audit/list', match: 'exact', handler: () => import('./_handlers/pro/audit/list.js') },
    { path: 'pro/audit', match: 'exact', handler: () => import('./_handlers/pro/audit.js') },
    { path: 'pro/reports', match: 'exact', handler: () => import('./_handlers/pro/reports.js') },
    { path: 'pro/dossier/upload-secure', match: 'exact', handler: () => import('./_handlers/pro/dossier/upload-secure.js') },
    { path: 'pro/dossier/export', match: 'exact', handler: () => import('./_handlers/pro/dossier/export.js') },
    { path: 'pro/dossier/views', match: 'exact', handler: () => import('./_handlers/pro/dossier/views.js') },
    { path: 'pro/consent', match: 'exact', handler: () => import('./_handlers/pro/consent.js') },
    { path: 'pro/dossier-synthesis', match: 'exact', handler: () => import('./_handlers/pro/dossier-synthesis.js') },
    { path: 'pro/attestation-data', match: 'exact', handler: () => import('./_handlers/pro/attestation-data.js') },
    { path: 'pro/interop-siao', match: 'exact', handler: () => import('./_handlers/pro/interop-siao.js') },
    { path: 'pro/system-maintenance', match: 'exact', handler: () => import('./_handlers/pro/system-maintenance.js') },
    { path: 'pro/agent-discovery', match: 'exact', handler: () => import('./_handlers/pro/agent-discovery.js') },
    { path: 'pro/agent-scheduler', match: 'exact', handler: () => import('./_handlers/pro/agent-scheduler.js') },
    { path: 'pro/health-check', match: 'exact', handler: () => import('./_handlers/pro/health-check.js') },
    { path: 'pro/outlook', match: 'exact', handler: () => import('./_handlers/pro/outlook.js') },
    { path: 'pro/appointments', match: 'exact', handler: () => import('./_handlers/pro/appointments.js') },
    { path: 'pro/services', match: 'exact', handler: () => import('./_handlers/pro/services.js') },
    { path: 'pro/messages/conversations', match: 'exact', handler: () => import('./_handlers/pro/messages/conversations.js') },
    { path: 'tts', match: 'exact', handler: () => import('./_handlers/tts.js') },

    // --- Public Content ---
    { path: 'public/dossier-revoke', match: 'exact', handler: () => import('./_handlers/public/dossier-revoke.js') },
    { path: 'public/passport', match: 'exact', handler: () => import('./_handlers/public/passport.js') },
    { path: 'public/sms-notify', match: 'exact', handler: () => import('./_handlers/public/sms-notify.js') },
    { path: 'public/falc/summarize', match: 'exact', handler: () => import('./_handlers/public/falc/summarize.js') },
    { path: 'public/assistant/orient', match: 'exact', handler: () => import('./_handlers/public/assistant/orient.js') },
    { path: 'public/suggest-structure', match: 'exact', handler: () => import('./_handlers/public/suggest-structure.js') },

    // --- Core Data ---
    { path: 'aides', match: 'prefix', handler: () => import('./_handlers/aides.js') },
    { path: 'aids', match: 'prefix', handler: () => import('./_handlers/aides.js') },
    { path: 'drees', match: 'prefix', handler: () => import('./_handlers/drees.js') },
    { path: 'search', match: 'exact', handler: () => import('./_handlers/search.js') },
    { path: 'structures', match: 'prefix', handler: () => import('./_handlers/structures.js') },
    { path: 'demarches', match: 'prefix', handler: () => import('./_handlers/demarches.js') },
    { path: 'actualites', match: 'prefix', handler: () => import('./_handlers/actualites.js') },
    { path: 'guides', match: 'prefix', handler: () => import('./_handlers/guides.js') },
    { path: 'tools', match: 'prefix', handler: () => import('./_handlers/tools.js') },
    { path: 'dispositifs', match: 'prefix', handler: () => import('./_handlers/dispositifs/index.js') },
    { path: 'ressources', match: 'prefix', handler: () => import('./_handlers/ressources.js') },
    { path: 'reports', match: 'prefix', handler: () => import('./_handlers/reports.js') },
    { path: 'feedback', match: 'exact', handler: () => import('./_handlers/feedback.js') },
    { path: 'rdv', match: 'prefix', handler: () => import('./_handlers/rdv.js') },

    // --- Assistant (AI) ---
    { path: 'assistant/chat', match: 'exact', handler: () => import('./_handlers/assistant/chat.js') },
    { path: 'assistant/recommendations', match: 'exact', handler: () => import('./_handlers/assistant/recommendations.js') },

    // --- Diagnostic (OpenFisca) ---
    { path: 'diagnostic', match: 'prefix', handler: () => import('./_handlers/diagnostic.js') },

    // --- Cron ---
    { path: 'cron/pipeline', match: 'exact', handler: () => import('./_handlers/cron/pipeline.js') },
    { path: 'cron/actualites', match: 'exact', handler: () => import('./_handlers/cron/actualites.js') },
    { path: 'cron/review-queue/scan', match: 'exact', handler: () => import('./_handlers/cron/review-queue-scan.js') },
    { path: 'cron/hive-scan', match: 'exact', handler: () => import('./_handlers/cron/hive-scan.js') },
    { path: 'cron/ingest-structures', match: 'exact', handler: () => import('./_handlers/cron/ingest-structures.js') },
    { path: 'cron/ingest-aids', match: 'exact', handler: () => import('./_handlers/cron/ingest-aids.js') },
    { path: 'cron/link-check', match: 'exact', handler: () => import('./_handlers/cron/link-check.js') },
    { path: 'cron/rdv-reminder', match: 'exact', handler: () => import('./_handlers/cron/rdv-reminder.js') },
    { path: 'cron/ingest-demarches', match: 'exact', handler: () => import('./_handlers/cron/ingest-demarches.js') },
    { path: 'cron/ingest-annuaire', match: 'exact', handler: () => import('./_handlers/cron/ingest-annuaire.js') },
    { path: 'cron/backup-db', match: 'exact', handler: () => import('./_handlers/cron/backup-db.js') },

    // --- Admin ---
    { path: 'admin/inbox', match: 'exact', handler: () => import('./_handlers/admin/inbox.js') },
    { path: 'admin/actions', match: 'exact', handler: () => import('./_handlers/admin/actions.js') },
    { path: 'admin/runs', match: 'exact', handler: () => import('./_handlers/admin/runs.js') },
    { path: 'admin/cron-runs', match: 'prefix', handler: () => import('./_handlers/admin/cron-runs.js') },
    { path: 'admin/partnerships', match: 'exact', handler: () => import('./_handlers/admin/partnerships.js') },
    { path: 'admin/link-checks', match: 'exact', handler: () => import('./_handlers/admin/link-checks.js') },
    { path: 'admin/validate-publication', match: 'exact', handler: () => import('./_handlers/admin/validate-publication.js') },
    { path: 'admin/review-queue', match: 'prefix', handler: () => import('./_handlers/admin/review-queue.js') },
    { path: 'admin/stats', match: 'exact', handler: () => import('./_handlers/admin/stats.js') },
    { path: 'admin/national-stats', match: 'exact', handler: () => import('./_handlers/admin/national-stats.js') },
    { path: 'admin/features', match: 'exact', handler: () => import('./_handlers/admin/features.js') },
    { path: 'admin/rag-health', match: 'exact', handler: () => import('./_handlers/admin/rag-health.js') },
    { path: 'admin/conversations', match: 'exact', handler: () => import('./_handlers/admin/conversations.js') },
    { path: 'admin/analytics', match: 'exact', handler: () => import('./_handlers/admin/analytics.js') },
    { path: 'admin/hive-repair', match: 'exact', handler: () => import('./_handlers/admin/hive-repair.js') },
    { path: 'admin/bulk-repair', match: 'exact', handler: () => import('./_handlers/admin/bulk-repair.js') },
    { path: 'admin/mfa-setup', match: 'exact', handler: () => import('./_handlers/admin/mfa-setup.js') },
    { path: 'admin/mfa-verify', match: 'exact', handler: () => import('./_handlers/admin/mfa-verify.js') },

    // --- Share ---
    { path: 'share/create', match: 'exact', handler: () => import('./_handlers/share/create.js') },
    { path: 'share/get', match: 'exact', handler: () => import('./_handlers/share/get.js') },

    // --- Assistant ---
    { path: 'assistant/feedback', match: 'exact', handler: () => import('./_handlers/assistant/feedback.js') },

    // --- Phase 2: E2EE Messaging & Outlook ---
    { path: 'secure-messages', match: 'exact', handler: () => import('./_handlers/secure-messages.js') },
    { path: 'auth/callback/outlook', match: 'exact', handler: () => import('./_handlers/auth/outlook-callback.js') },

    // --- Documentation ---
    { path: 'docs/openapi.json', match: 'exact', handler: () => import('./_handlers/openapi.js') },
];
