import { z } from 'zod';

/**
 * 💎 SCHÉMAS DE VALIDATION CRITIQUES
 *
 * Centralized Zod schemas for all security-sensitive handlers.
 * Used with the validate() wrapper from api/_utils/validate.js.
 *
 * Convention: schema names match their handler file paths.
 */

// ─── Auth (Citizen) ───────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
    mode: z.string().optional(),
});

export const signupSchema = z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
    phone: z.string().optional(),
    next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Format email invalide'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requis'),
    password: z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
});

export const resendVerificationSchema = z.object({
    email: z.string().email('Format email invalide'),
});

// ─── Auth (Pro) ───────────────────────────────────────

export const proLoginSchema = z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

export const proRegisterSchema = z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(8, 'Mot de passe trop court'),
    structureName: z.string().min(1, 'Nom de structure requis'),
});

export const proRegisterInviteSchema = z.object({
    token: z.string().min(1, 'Token d\'invitation requis'),
    password: z.string().min(8, 'Mot de passe trop court'),
});

export const proForgotPasswordSchema = z.object({
    email: z.string().email('Format email invalide'),
});

export const proResetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requis'),
    password: z.string().min(8, 'Mot de passe trop court'),
});

export const proMfaVerifySchema = z.object({
    mfa_token: z.string().min(1, 'Token MFA requis'),
    code: z.string().length(6, 'Code MFA doit contenir 6 chiffres'),
});

// ─── Assistant ────────────────────────────────────────

export const feedbackSchema = z.object({
    logId: z.string().min(1, 'logId requis'),
    rating: z.union([z.literal(1), z.literal(-1)], {
        errorMap: () => ({ message: 'rating doit être 1 ou -1' }),
    }),
    comment: z.string().max(1000).optional(),
});

export const recommendationsSchema = z.object({
    need: z.string().min(1, 'Besoin requis').max(500),
    territory: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
    types: z.array(z.string()).optional(),
});

// ─── Pro Operations ───────────────────────────────────

export const cancelAppointmentSchema = z.object({
    id: z.string().min(1, 'ID du rendez-vous requis'),
});

export const startVisioSchema = z.object({
    appointmentId: z.string().min(1, 'appointmentId requis'),
});

export const proInviteSchema = z.object({
    email: z.string().email('Format email invalide'),
    role: z.string().min(1, 'Rôle requis'),
});

export const proConsentSchema = z.object({
    shareId: z.string().min(1, 'shareId requis'),
    signatureData: z.string().min(1, 'Signature requise'),
});

export const proMfaSetupVerifySchema = z.object({
    code: z.string().length(6, 'Code TOTP doit contenir 6 chiffres'),
});

export const proResendInviteSchema = z.object({
    invitationId: z.string().min(1, 'ID d\'invitation requis'),
});

// ─── Public-facing ────────────────────────────────────

export const publicConsentSchema = z.object({
    type: z.string().min(1, 'Type de consentement requis'),
    version: z.string().min(1, 'Version requise'),
    metadata: z.record(z.unknown()).optional(),
});

export const suggestStructureSchema = z.object({
    structureName: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    type: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    message: z.string().max(2000).optional(),
    consent: z.boolean(),
    honeypot: z.string().max(0).optional(),
});

export const reportSchema = z.object({
    contentType: z.string().min(1),
    contentId: z.string().min(1),
    reason: z.string().min(1).max(500),
    message: z.string().max(2000).optional(),
    pageUrl: z.string().optional(),
    reporterEmail: z.string().email().optional().or(z.literal('')),
});

export const smsNotifySchema = z.object({
    appointmentId: z.string().min(1),
    phoneNumber: z.string().min(1),
    action: z.enum(['subscribe', 'unsubscribe']).default('subscribe'),
});

// ─── Admin ────────────────────────────────────────────

export const adminMfaVerifySchema = z.object({
    code: z.string().length(6, 'Code MFA doit contenir 6 chiffres'),
});

export const updateAidSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['published', 'draft', 'archived']).optional(),
    data: z.record(z.unknown()).optional(),
});

export const adminPartnershipSchema = z.object({
    id: z.string().min(1),
    status: z.string().min(1),
});

export const adminVersionSchema = z.object({
    versionId: z.string().min(1),
});

// ─── CRUD (categories, guides, tools) ─────────────────

export const crudUpdateSchema = z.object({
    id: z.string().min(1),
}).passthrough(); // Allow additional fields for generic CRUD

// ─── Pro Extended Operations ──────────────────────────

export const proDossierUpdateSchema = z.object({
    status: z.string().optional(),
    internalNote: z.string().max(2000).optional(),
});

export const proUploadSecureSchema = z.object({
    shareId: z.string().min(1, 'shareId requis'),
    originalName: z.string().min(1, 'Nom de fichier requis'),
    mimeType: z.string().min(1, 'Type MIME requis'),
});

export const proInteropSiaoSchema = z.object({
    shareId: z.string().min(1, 'shareId requis'),
});

export const proNotificationsActionSchema = z.object({
    ids: z.array(z.string().min(1)),
    action: z.string().min(1),
});

export const proStructureUpdateSchema = z.object({
    summary_falc: z.string().optional(),
    is_pro_enabled: z.boolean().optional(),
});

export const proSystemMaintenanceSchema = z.object({
    action: z.string().min(1, 'Action requise'),
});

export const proTeamActionSchema = z.object({
    targetUserId: z.string().min(1),
    role: z.string().min(1),
});

// ─── Public Extended ──────────────────────────────────

export const publicAppointmentCancelSchema = z.object({
    id: z.string().optional(),
    token: z.string().optional(),
});

export const publicDossierRevokeSchema = z.object({
    shareId: z.string().min(1, 'shareId requis'),
});

export const publicMessageSchema = z.object({
    content: z.string().min(1).max(5000),
});

// ─── Utility ──────────────────────────────────────────

export const secureMessageSchema = z.object({
    shareId: z.string().min(1),
    senderId: z.string().min(1),
    receiverId: z.string().min(1),
    encryptedContent: z.string().min(1),
});

export const shareCreateSchema = z.object({
    situation: z.record(z.unknown()).optional(),
    results: z.record(z.unknown()).optional(),
});

export const ttsSchema = z.object({
    text: z.string().min(1).max(5000),
    voice: z.string().optional(),
});

export const proDossierSynthesisSchema = z.object({
    shareId: z.string().min(1, 'shareId requis'),
});
