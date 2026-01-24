// Central Routing Definition
// Used by both api/index.js (Vercel) and dev-server.js (Local)

export const routes = [
    // --- Special / Root ---
    { path: 'upload', match: 'exact', handler: './_handlers/upload.js' },
    { path: 'download', match: 'exact', handler: './_handlers/download.js' },
    { path: 'health', match: 'exact', handler: './_handlers/health.js' },
    { path: 'healthz', match: 'exact', handler: './_handlers/health.js' },
    { path: 'robots.txt', match: 'exact', handler: './_handlers/robots.js' },
    { path: 'robots', match: 'exact', handler: './_handlers/robots.js' },
    { path: 'sitemap.xml', match: 'exact', handler: './_handlers/sitemap.js' },
    { path: 'sitemap', match: 'exact', handler: './_handlers/sitemap.js' },
    { path: 'login-pro-guard', match: 'exact', handler: './_handlers/login-pro-guard.js' },
    { path: 'taxonomy', match: 'exact', handler: './_handlers/taxonomy.js' },

    // --- Auth (Admin) ---
    { path: 'auth/login', match: 'exact', handler: './_handlers/auth/login.js' },
    { path: 'auth/me', match: 'exact', handler: './_handlers/auth/me.js' },

    // --- Pro Module ---
    { path: 'pro/auth/login', match: 'exact', handler: './_handlers/pro/auth/login.js' },
    { path: 'pro/auth/register', match: 'exact', handler: './_handlers/pro/auth/register.js' },
    { path: 'pro/auth/forgot-password', match: 'exact', handler: './_handlers/pro/auth/forgot-password.js' },
    { path: 'pro/auth/reset-password', match: 'exact', handler: './_handlers/pro/auth/reset-password.js' },
    { path: 'pro/me', match: 'exact', handler: './_handlers/pro/me.js' },
    { path: 'pro/messages', match: 'exact', handler: './_handlers/pro/messages.js' },
    { path: 'pro/appointments', match: 'exact', handler: './_handlers/pro/appointments/list.js' },
    { path: 'pro/appointments/cancel', match: 'exact', handler: './_handlers/pro/appointments/cancel.js' },
    { path: 'pro/availability', match: 'exact', handler: './_handlers/pro/availability.js' },

    // --- Public Content ---
    { path: 'public/messages', match: 'exact', handler: './_handlers/public/messages.js' },
    { path: 'public/suggest-structure', match: 'exact', handler: './_handlers/public/suggest-structure.js' },
    { path: 'public/stats', match: 'exact', handler: './_handlers/public/stats.js' },
    { path: 'public/availability', match: 'exact', handler: './_handlers/public/availability.js' },
    { path: 'appointments', match: 'exact', handler: './_handlers/public/appointments/create.js' },
    { path: 'appointments/cancel', match: 'exact', handler: './_handlers/public/appointments/cancel.js' },

    // --- Core Data ---
    { path: 'aides', match: 'prefix', handler: './_handlers/aides.js' },
    { path: 'structures', match: 'prefix', handler: './_handlers/structures.js' },
    { path: 'demarches', match: 'prefix', handler: './_handlers/demarches.js' },
    { path: 'actualites', match: 'prefix', handler: './_handlers/actualites.js' },
    { path: 'guides', match: 'prefix', handler: './_handlers/guides.js' },
    { path: 'tools', match: 'prefix', handler: './_handlers/tools.js' },
    { path: 'dispositifs', match: 'prefix', handler: './_handlers/dispositifs/index.js' },

    // --- Cron ---
    { path: 'cron/pipeline', match: 'exact', handler: './_handlers/cron/pipeline.js' },
    { path: 'cron/ingest-structures', match: 'exact', handler: './_handlers/cron/ingest-structures.js' },
    { path: 'cron/purge', match: 'exact', handler: './_handlers/cron/purge.js' },

    // --- Admin ---
    { path: 'admin/privacy/export', match: 'exact', handler: './_handlers/admin/privacy/export.js' },
    { path: 'admin/privacy/delete', match: 'exact', handler: './_handlers/admin/privacy/delete.js' },
    { path: 'admin/inbox', match: 'exact', handler: './_handlers/admin/inbox.js' },
    { path: 'admin/actions', match: 'exact', handler: './_handlers/admin/actions.js' },
    { path: 'admin/runs', match: 'exact', handler: './_handlers/admin/runs.js' },
    { path: 'admin/partnerships', match: 'exact', handler: './_handlers/admin/partnerships.js' },
];
