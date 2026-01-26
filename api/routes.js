// Central Routing Definition
// Used by both api/index.js (Vercel) and dev-server.js (Local)

// --- Special / Root ---
import upload from './_handlers/upload.js';
import download from './_handlers/download.js';
import health from './_handlers/health.js';
import robots from './_handlers/robots.js';
import sitemap from './_handlers/sitemap.js';
import loginProGuard from './_handlers/login-pro-guard.js';
import taxonomy from './_handlers/taxonomy.js';

// --- Auth (Admin) ---
import authLogin from './_handlers/auth/login.js';
import authMe from './_handlers/auth/me.js';

// --- Pro Module ---
import proAuthLogin from './_handlers/pro/auth/login.js';
import proAuthRegister from './_handlers/pro/auth/register.js';
import proAuthForgotPassword from './_handlers/pro/auth/forgot-password.js';
import proAuthResetPassword from './_handlers/pro/auth/reset-password.js';
import proMe from './_handlers/pro/me.js';
import proMessages from './_handlers/pro/messages.js';
import proAppointmentsList from './_handlers/pro/appointments/list.js';
import proAppointmentsCancel from './_handlers/pro/appointments/cancel.js';
import proAvailability from './_handlers/pro/availability.js';

// --- Public Content ---
import publicMessages from './_handlers/public/messages.js';
import publicSuggestStructure from './_handlers/public/suggest-structure.js';
import publicStats from './_handlers/public/stats.js';
import publicAvailability from './_handlers/public/availability.js';
import publicAppointmentsCreate from './_handlers/public/appointments/create.js';
import publicAppointmentsCancel from './_handlers/public/appointments/cancel.js';

// --- Core Data ---
import aides from './_handlers/aides.js';
import structures from './_handlers/structures.js';
import demarches from './_handlers/demarches.js';
import actualites from './_handlers/actualites.js';
import guides from './_handlers/guides.js';
import tools from './_handlers/tools.js';
import dispositifs from './_handlers/dispositifs/index.js';

// --- Cron ---
import cronPipeline from './_handlers/cron/pipeline.js';
import cronIngestStructures from './_handlers/cron/ingest-structures.js';
import cronPurge from './_handlers/cron/purge.js';

// --- Admin ---
import adminPrivacyExport from './_handlers/admin/privacy/export.js';
import adminPrivacyDelete from './_handlers/admin/privacy/delete.js';
import adminInbox from './_handlers/admin/inbox.js';
import adminActions from './_handlers/admin/actions.js';
import adminRuns from './_handlers/admin/runs.js';
import adminPartnerships from './_handlers/admin/partnerships.js';

export const routes = [
    // --- Special / Root ---
    { path: 'upload', match: 'exact', handler: upload },
    { path: 'download', match: 'exact', handler: download },
    { path: 'health', match: 'exact', handler: health },
    { path: 'healthz', match: 'exact', handler: health },
    { path: 'robots.txt', match: 'exact', handler: robots },
    { path: 'robots', match: 'exact', handler: robots },
    { path: 'sitemap.xml', match: 'exact', handler: sitemap },
    { path: 'sitemap', match: 'exact', handler: sitemap },
    { path: 'login-pro-guard', match: 'exact', handler: loginProGuard },
    { path: 'taxonomy', match: 'exact', handler: taxonomy },

    // --- Auth (Admin) ---
    { path: 'auth/login', match: 'exact', handler: authLogin },
    { path: 'auth/me', match: 'exact', handler: authMe },

    // --- Pro Module ---
    { path: 'pro/auth/login', match: 'exact', handler: proAuthLogin },
    { path: 'pro/auth/register', match: 'exact', handler: proAuthRegister },
    { path: 'pro/auth/forgot-password', match: 'exact', handler: proAuthForgotPassword },
    { path: 'pro/auth/reset-password', match: 'exact', handler: proAuthResetPassword },
    { path: 'pro/me', match: 'exact', handler: proMe },
    { path: 'pro/messages', match: 'exact', handler: proMessages },
    { path: 'pro/appointments', match: 'exact', handler: proAppointmentsList },
    { path: 'pro/appointments/cancel', match: 'exact', handler: proAppointmentsCancel },
    { path: 'pro/availability', match: 'exact', handler: proAvailability },

    // --- Public Content ---
    { path: 'public/messages', match: 'exact', handler: publicMessages },
    { path: 'public/suggest-structure', match: 'exact', handler: publicSuggestStructure },
    { path: 'public/stats', match: 'exact', handler: publicStats },
    { path: 'public/availability', match: 'exact', handler: publicAvailability },
    { path: 'appointments', match: 'exact', handler: publicAppointmentsCreate },
    { path: 'appointments/cancel', match: 'exact', handler: publicAppointmentsCancel },

    // --- Core Data ---
    { path: 'aides', match: 'prefix', handler: aides },
    { path: 'structures', match: 'prefix', handler: structures },
    { path: 'demarches', match: 'prefix', handler: demarches },
    { path: 'actualites', match: 'prefix', handler: actualites },
    { path: 'guides', match: 'prefix', handler: guides },
    { path: 'tools', match: 'prefix', handler: tools },
    { path: 'dispositifs', match: 'prefix', handler: dispositifs },

    // --- Cron ---
    { path: 'cron/pipeline', match: 'exact', handler: cronPipeline },
    { path: 'cron/ingest-structures', match: 'exact', handler: cronIngestStructures },
    { path: 'cron/purge', match: 'exact', handler: cronPurge },

    // --- Admin ---
    { path: 'admin/privacy/export', match: 'exact', handler: adminPrivacyExport },
    { path: 'admin/privacy/delete', match: 'exact', handler: adminPrivacyDelete },
    { path: 'admin/inbox', match: 'exact', handler: adminInbox },
    { path: 'admin/actions', match: 'exact', handler: adminActions },
    { path: 'admin/runs', match: 'exact', handler: adminRuns },
    { path: 'admin/partnerships', match: 'exact', handler: adminPartnerships },
];
