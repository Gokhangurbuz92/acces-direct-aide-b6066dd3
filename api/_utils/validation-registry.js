import {
    loginSchema,
    signupSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    proLoginSchema,
    proRegisterSchema,
    proRegisterInviteSchema,
    proForgotPasswordSchema,
    proResetPasswordSchema,
    proMfaVerifySchema,
    feedbackSchema,
    recommendationsSchema,
    cancelAppointmentSchema,
    startVisioSchema,
    proInviteSchema,
    proConsentSchema,
    proMfaSetupVerifySchema,
    proResendInviteSchema,
    publicConsentSchema,
    suggestStructureSchema,
    reportSchema,
    smsNotifySchema,
    adminMfaVerifySchema,
} from './schemas.js';

/**
 * 🛡️ VALIDATION REGISTRY
 *
 * Maps route paths to their Zod schema for automatic input validation.
 * The main handler (api/index.js) checks this registry before executing a route handler.
 * Only POST/PUT/PATCH/DELETE requests are validated (GET requests pass through).
 *
 * Adding a new schema: import it from schemas.js and add the route path here.
 */

/** @type {Record<string, import('zod').ZodTypeAny>} */
export const validationRegistry = {
    // ─── Auth (Citizen) ───────────────────────────
    'auth/login': loginSchema,
    'auth/signup': signupSchema,
    'auth/forgot-password': forgotPasswordSchema,
    'auth/reset-password': resetPasswordSchema,
    'auth/resend-verification': resendVerificationSchema,

    // ─── Auth (Pro) ───────────────────────────────
    'pro/auth/login': proLoginSchema,
    'pro/auth/register': proRegisterSchema,
    'pro/auth/register-invite': proRegisterInviteSchema,
    'pro/auth/forgot-password': proForgotPasswordSchema,
    'pro/auth/reset-password': proResetPasswordSchema,
    'pro/auth/mfa-verify': proMfaVerifySchema,

    // ─── Assistant ────────────────────────────────
    'assistant/feedback': feedbackSchema,
    'assistant/recommendations': recommendationsSchema,

    // ─── Pro Operations ───────────────────────────
    'pro/invite': proInviteSchema,
    'pro/consent': proConsentSchema,
    'pro/resend-invite': proResendInviteSchema,

    // ─── Public ───────────────────────────────────
    'public/suggest-structure': suggestStructureSchema,
    'public/sms-notify': smsNotifySchema,

    // ─── Admin ────────────────────────────────────
    'admin/mfa-verify': adminMfaVerifySchema,
};
