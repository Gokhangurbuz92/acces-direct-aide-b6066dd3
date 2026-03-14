/**
 * Auto-generated Zod schemas from Drizzle tables.
 *
 * Usage:
 *   import { insertAideSchema, adminBulkActionSchema } from '../../src/db/drizzle-schemas.js';
 *   const parsed = adminBulkActionSchema.parse(req.body);
 */

import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from './schema.js';

// ─── Core Entity Schemas ─────────────────────────────────────────────────────

/** @type {import('zod').ZodSchema} Insert schema for Aide */
export const insertAideSchema = createInsertSchema(schema.Aide);
export const selectAideSchema = createSelectSchema(schema.Aide);

/** @type {import('zod').ZodSchema} Insert schema for Actualite */
export const insertActualiteSchema = createInsertSchema(schema.Actualite);
export const selectActualiteSchema = createSelectSchema(schema.Actualite);

/** @type {import('zod').ZodSchema} Insert schema for Structure */
export const insertStructureSchema = createInsertSchema(schema.Structure);
export const selectStructureSchema = createSelectSchema(schema.Structure);

/** @type {import('zod').ZodSchema} Insert schema for Demarche */
export const insertDemarcheSchema = createInsertSchema(schema.Demarche);
export const selectDemarcheSchema = createSelectSchema(schema.Demarche);

// ─── Admin Schemas ───────────────────────────────────────────────────────────

export const insertReviewQueueItemSchema = createInsertSchema(schema.ReviewQueueItem);
export const insertAuditLogSchema = createInsertSchema(schema.AuditLog);

// ─── Pro/Booking Schemas ─────────────────────────────────────────────────────

export const insertProAppointmentSchema = createInsertSchema(schema.ProAppointment);
export const insertProRdvServiceSchema = createInsertSchema(schema.ProRdvService);
export const insertProAvailabilityRuleSchema = createInsertSchema(schema.ProAvailabilityRule);
export const insertProTimeOffSchema = createInsertSchema(schema.ProTimeOff);
export const insertContentReportSchema = createInsertSchema(schema.ContentReport);

// ─── Update schemas (partial, all fields optional) ───────────────────────────

export const updateActualiteSchema = createUpdateSchema(schema.Actualite);
export const updateAideSchema = createUpdateSchema(schema.Aide);
export const updateStructureSchema = createUpdateSchema(schema.Structure);
export const updateDemarcheSchema = createUpdateSchema(schema.Demarche);

// ─── Handler-Specific Schemas ────────────────────────────────────────────────

/** admin/actions.js — bulk publish/reject/retry */
export const adminBulkActionSchema = z.object({
  action: z.enum(['PUBLISH', 'REJECT', 'RETRY_FALC']),
  ids: z.array(z.string().min(1)).min(1).max(200),
});

/** admin/validate-publication.js — validate before publishing */
export const validatePublicationSchema = z.object({
  entityType: z.enum(['aide', 'demarche', 'structure', 'actualite']),
  entityId: z.string().min(1),
});

/** admin/review-queue.js — PATCH status update */
export const reviewQueuePatchSchema = z.object({
  status: z.enum(['resolved', 'dismissed', 'ignored', 'resolved_by_ai']),
});

/** admin/review-queue.js — bulk PATCH */
export const reviewQueueBulkPatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(['resolved', 'dismissed', 'ignored', 'resolved_by_ai']),
});
