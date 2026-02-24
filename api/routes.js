// Central Routing Definition
// Used by both api/index.js (Vercel) and dev-server.js (Local)

// --- Special / Root ---
import upload from './_handlers/upload.js';
import download from './_handlers/download.js';
import health from './_handlers/health.js';
import healthDeep from './_handlers/health-deep.js';
import monitorCronActualites from './_handlers/monitor/cron-actualites.js';
import monitorCore from './_handlers/monitor/core.js';
import monitorDataQuality from './_handlers/monitor/data-quality.js';
import monitorIngestionFreshness from './_handlers/monitor/ingestion-freshness.js';
import monitorProRdv from './_handlers/monitor/pro-rdv.js';
import robots from './_handlers/robots.js';
import sitemap from './_handlers/sitemap.js';
import loginProGuard from './_handlers/login-pro-guard.js';
import taxonomy from './_handlers/taxonomy.js';
import pdf from './_handlers/pdf.js';

// --- Auth (Admin) ---
import authLogin from './_handlers/auth/login.js';
import authMe from './_handlers/auth/me.js';
import authSignup from './_handlers/auth/signup.js';
import authLogout from './_handlers/auth/logout.js';
import authVerifyEmail from './_handlers/auth/verify-email.js';
import authResendVerification from './_handlers/auth/resend-verification.js';
import authForgotPassword from './_handlers/auth/forgot-password.js';
import authResetPassword from './_handlers/auth/reset-password.js';

// --- Pro Module ---
import proAuthLogin from './_handlers/pro/auth/login.js';
import proAuthRegister from './_handlers/pro/auth/register.js';
import proAuthForgotPassword from './_handlers/pro/auth/forgot-password.js';
import proAuthResetPassword from './_handlers/pro/auth/reset-password.js';
import proMe from './_handlers/pro/me.js';
import proMessages from './_handlers/pro/messages.js';
import proMessagesConversations from './_handlers/pro/messages-conversations.js';
import proServices from './_handlers/pro/services.js';
import proAppointmentsIndex from './_handlers/pro/appointments/index.js';
import proAppointmentsCancel from './_handlers/pro/appointments/cancel.js';
import proAvailability from './_handlers/pro/availability.js';
import proSlots from './_handlers/pro/slots.js';
import proTimeOff from './_handlers/pro/timeoff.js';
import proRdvSettings from './_handlers/pro/rdv-settings.js';

// --- Public Content ---
import publicMessages from './_handlers/public/messages.js';
import publicSuggestStructure from './_handlers/public/suggest-structure.js';
import publicStats from './_handlers/public/stats.js';
import publicAvailability from './_handlers/public/availability.js';
import publicAppointmentsCreate from './_handlers/public/appointments/create.js';
import publicAppointmentsCancel from './_handlers/public/appointments/cancel.js';
import rdvMessages from './_handlers/messages.js';

// --- Core Data ---
import aides from './_handlers/aides.js';
import drees from './_handlers/drees.js';
import search from './_handlers/search.js';
import structures from './_handlers/structures.js';
import demarches from './_handlers/demarches.js';
import actualites from './_handlers/actualites.js';
import guides from './_handlers/guides.js';
import tools from './_handlers/tools.js';
import dispositifs from './_handlers/dispositifs/index.js';
import ressources from './_handlers/ressources.js';
import reports from './_handlers/reports.js';
import feedback from './_handlers/feedback.js';
import rdv from './_handlers/rdv.js';

// --- Diagnostic (OpenFisca) ---
import diagnostic from './_handlers/diagnostic.js';

// --- Assistant (AI) ---
import assistantChat from './_handlers/assistant/chat.js';
import assistantRecommendations from './_handlers/assistant/recommendations.js';

// --- Cron ---
import cronPipeline from './_handlers/cron/pipeline.js';
import cronActualites from './_handlers/cron/actualites.js';
import cronReviewQueueScan from './_handlers/cron/review-queue-scan.js';
import cronIngestStructures from './_handlers/cron/ingest-structures.js';
import cronIngestAids from './_handlers/cron/ingest-aids.js';
import cronPurge from './_handlers/cron/purge.js';
import cronLinkCheck from './_handlers/cron/link-check.js';

// --- Admin ---
import adminPrivacyExport from './_handlers/admin/privacy/export.js';
import adminPrivacyDelete from './_handlers/admin/privacy/delete.js';
import adminInbox from './_handlers/admin/inbox.js';
import adminActions from './_handlers/admin/actions.js';
import adminRuns from './_handlers/admin/runs.js';
import adminCronRuns from './_handlers/admin/cron-runs.js';
import adminPartnerships from './_handlers/admin/partnerships.js';
import adminLinkChecks from './_handlers/admin/link-checks.js';
import adminValidatePublication from './_handlers/admin/validate-publication.js';
import adminReviewQueue from './_handlers/admin/review-queue.js';

export const routes = [
    // --- Special / Root ---
    { path: 'upload', match: 'exact', handler: upload },
    { path: 'download', match: 'exact', handler: download },
    { path: 'health', match: 'exact', handler: health },
    { path: 'health/deep', match: 'exact', handler: healthDeep },
    { path: 'monitor/cron/actualites', match: 'exact', handler: monitorCronActualites },
    { path: 'monitor/core', match: 'exact', handler: monitorCore },
    { path: 'monitor/data-quality', match: 'exact', handler: monitorDataQuality },
    { path: 'monitor/ingestion-freshness', match: 'exact', handler: monitorIngestionFreshness },
    { path: 'monitor/pro-rdv', match: 'exact', handler: monitorProRdv },
    { path: 'healthz', match: 'exact', handler: health },
    { path: 'robots.txt', match: 'exact', handler: robots },
    { path: 'robots', match: 'exact', handler: robots },
    { path: 'sitemap.xml', match: 'exact', handler: sitemap },
    { path: 'sitemap', match: 'exact', handler: sitemap },
    { path: 'login-pro-guard', match: 'exact', handler: loginProGuard },
    { path: 'taxonomy', match: 'exact', handler: taxonomy },
    { path: 'pdf', match: 'prefix', handler: pdf },

    // --- Auth (Admin) ---
    { path: 'auth/login', match: 'exact', handler: authLogin },
    { path: 'auth/signup', match: 'exact', handler: authSignup },
    { path: 'auth/logout', match: 'exact', handler: authLogout },
    { path: 'auth/me', match: 'exact', handler: authMe },
    { path: 'auth/verify-email', match: 'exact', handler: authVerifyEmail },
    { path: 'auth/resend-verification', match: 'exact', handler: authResendVerification },
    { path: 'auth/forgot-password', match: 'exact', handler: authForgotPassword },
    { path: 'auth/reset-password', match: 'exact', handler: authResetPassword },

    // --- Pro Module ---
    { path: 'pro/auth/login', match: 'exact', handler: proAuthLogin },
    { path: 'pro/auth/register', match: 'exact', handler: proAuthRegister },
    { path: 'pro/auth/forgot-password', match: 'exact', handler: proAuthForgotPassword },
    { path: 'pro/auth/reset-password', match: 'exact', handler: proAuthResetPassword },
    { path: 'pro/me', match: 'exact', handler: proMe },
    { path: 'pro/services', match: 'exact', handler: proServices },
    { path: 'pro/slots', match: 'exact', handler: proSlots },
    { path: 'pro/messages', match: 'exact', handler: proMessages },
    { path: 'pro/messages/conversations', match: 'prefix', handler: proMessagesConversations },
    { path: 'pro/appointments', match: 'exact', handler: proAppointmentsIndex },
    { path: 'pro/appointments/cancel', match: 'exact', handler: proAppointmentsCancel },
    { path: 'pro/availability', match: 'exact', handler: proAvailability },
    { path: 'pro/timeoff', match: 'exact', handler: proTimeOff },
    { path: 'pro/rdv/settings', match: 'exact', handler: proRdvSettings },

    // --- Public Content ---
    { path: 'public/messages', match: 'exact', handler: publicMessages },
    { path: 'messages', match: 'prefix', handler: rdvMessages },
    { path: 'public/suggest-structure', match: 'exact', handler: publicSuggestStructure },
    { path: 'public/stats', match: 'exact', handler: publicStats },
    { path: 'public/availability', match: 'exact', handler: publicAvailability },
    { path: 'appointments', match: 'exact', handler: publicAppointmentsCreate },
    { path: 'appointments/cancel', match: 'exact', handler: publicAppointmentsCancel },

    // --- Core Data ---
    { path: 'aides', match: 'prefix', handler: aides },
    { path: 'aids', match: 'prefix', handler: aides },
    { path: 'drees', match: 'prefix', handler: drees },
    { path: 'search', match: 'exact', handler: search },
    { path: 'structures', match: 'prefix', handler: structures },
    { path: 'demarches', match: 'prefix', handler: demarches },
    { path: 'actualites', match: 'prefix', handler: actualites },
    { path: 'guides', match: 'prefix', handler: guides },
    { path: 'tools', match: 'prefix', handler: tools },
    { path: 'dispositifs', match: 'prefix', handler: dispositifs },
    { path: 'ressources', match: 'prefix', handler: ressources },
    { path: 'reports', match: 'prefix', handler: reports },
    { path: 'feedback', match: 'exact', handler: feedback },
    { path: 'rdv', match: 'prefix', handler: rdv },

    // --- Assistant (AI) ---
    { path: 'assistant/chat', match: 'exact', handler: assistantChat },
    { path: 'assistant/recommendations', match: 'exact', handler: assistantRecommendations },

    // --- Diagnostic (OpenFisca) ---
    { path: 'diagnostic', match: 'prefix', handler: diagnostic },

    // --- Cron ---
    { path: 'cron/pipeline', match: 'exact', handler: cronPipeline },
    { path: 'cron/actualites', match: 'exact', handler: cronActualites },
    { path: 'cron/review-queue/scan', match: 'exact', handler: cronReviewQueueScan },
    { path: 'cron/ingest-structures', match: 'exact', handler: cronIngestStructures },
    { path: 'cron/ingest-aids', match: 'exact', handler: cronIngestAids },
    { path: 'cron/purge', match: 'exact', handler: cronPurge },
    { path: 'cron/link-check', match: 'exact', handler: cronLinkCheck },

    // --- Admin ---
    { path: 'admin/privacy/export', match: 'exact', handler: adminPrivacyExport },
    { path: 'admin/privacy/delete', match: 'exact', handler: adminPrivacyDelete },
    { path: 'admin/inbox', match: 'exact', handler: adminInbox },
    { path: 'admin/actions', match: 'exact', handler: adminActions },
    { path: 'admin/runs', match: 'exact', handler: adminRuns },
    { path: 'admin/cron-runs', match: 'prefix', handler: adminCronRuns },
    { path: 'admin/partnerships', match: 'exact', handler: adminPartnerships },
    { path: 'admin/link-checks', match: 'exact', handler: adminLinkChecks },
    { path: 'admin/validate-publication', match: 'exact', handler: adminValidatePublication },
    { path: 'admin/review-queue', match: 'prefix', handler: adminReviewQueue },
];
