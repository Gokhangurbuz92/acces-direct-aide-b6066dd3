import { z } from 'zod';

/**
 * 💎 SCHÉMAS DE VALIDATION CRITIQUES
 *
 * Centralized Zod schemas for the most security-sensitive handlers.
 * Used with the validate() wrapper from api/_utils/validate.js.
 *
 * Convention: schema names match their handler file paths.
 */

// ─── Auth ─────────────────────────────────────────────

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

// ─── Assistant ────────────────────────────────────────

export const feedbackSchema = z.object({
    logId: z.string().min(1, 'logId requis'),
    rating: z.union([z.literal(1), z.literal(-1)], {
        errorMap: () => ({ message: 'rating doit être 1 ou -1' }),
    }),
    comment: z.string().max(1000).optional(),
});

// ─── Pro Appointments ─────────────────────────────────

export const cancelAppointmentSchema = z.object({
    id: z.string().min(1, 'ID du rendez-vous requis'),
});

export const startVisioSchema = z.object({
    appointmentId: z.string().min(1, 'appointmentId requis'),
});

// ─── Admin ────────────────────────────────────────────

export const updateAidSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['published', 'draft', 'archived']).optional(),
    data: z.record(z.unknown()).optional(),
});
