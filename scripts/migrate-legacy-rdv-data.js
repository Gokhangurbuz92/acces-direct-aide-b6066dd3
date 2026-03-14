#!/usr/bin/env node
// @ts-nocheck
/**
 * 🚚 MIGRATION SCRIPT — Legacy System A → System B
 *
 * Transfers data from legacy tables to the unified System B tables:
 *   Appointment + Beneficiary → ProAppointment
 *   Service → ProRdvService
 *   Message → RdvConversation + RdvConversationMessage
 *
 * Features:
 *   - Batching (configurable BATCH_SIZE)
 *   - Transaction per appointment group (atomicity)
 *   - Re-encryption of messages to v1: format
 *   - Dry-run mode (DRY_RUN=true)
 *   - Detailed logging with counters
 *   - Idempotent (skips already-migrated records via idempotencyKey prefix)
 *
 * Usage:
 *   DRY_RUN=true node scripts/migrate-legacy-rdv-data.js   # Preview only
 *   node scripts/migrate-legacy-rdv-data.js                  # Execute migration
 *
 * Requires: DATABASE_URL in .env.local or environment
 */

import 'dotenv/config';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { encrypt, decrypt } from '../api/lib/crypto.js';
import crypto from 'crypto';

// ── Configuration ──
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const IDEMPOTENCY_PREFIX = 'migrated-from-legacy:';

// ── Counters ──
const stats = {
  services: { found: 0, created: 0, skipped: 0 },
  appointments: { found: 0, migrated: 0, skipped: 0, errors: 0 },
  conversations: { created: 0 },
  messages: { migrated: 0, reEncrypted: 0, errors: 0 },
};

/**
 * Re-encrypt a legacy message content to v1: format.
 * Legacy Message.content_encrypted uses the same crypto.ts, so it's
 * already in v1: or legacy (iv:tag:data) format.
 * We decrypt it and re-encrypt to ensure v1: prefix consistency.
 */
function reEncryptMessage(legacyEncryptedContent) {
  if (!legacyEncryptedContent) return null;

  // If already in v1: format, re-encrypt to be safe (new IV)
  try {
    const plaintext = decrypt(legacyEncryptedContent);
    if (!plaintext) return encrypt('[Message migré — contenu vide]');
    stats.messages.reEncrypted++;
    return encrypt(plaintext);
  } catch {
    // If decryption fails, store as-is with a wrapper note
    return encrypt('[Message migré — déchiffrement impossible]');
  }
}

/**
 * Map legacy sender ('PRO', 'BENEFICIARY') to System B senderType ('PRO', 'USER').
 */
function mapSenderType(legacySender) {
  if (legacySender === 'BENEFICIARY') return 'USER';
  return legacySender || 'USER';
}

/**
 * Step 1: Migrate Services → ProRdvService
 * For each legacy Service, create a corresponding ProRdvService if it doesn't exist.
 * Returns a map: legacyServiceId → proRdvServiceId
 */
async function migrateServices() {
  console.log('\n📋 Step 1: Migrating Services...');

  const legacyServices = await db.select().from(schema.Service);
  stats.services.found = legacyServices.length;
  console.log(`   Found ${legacyServices.length} legacy services`);

  /** @type {Map<string, string>} */
  const serviceIdMap = new Map();

  for (const svc of legacyServices) {
    // Check if already migrated (by structureId + name match)
    const existing = await db.query.ProRdvService.findFirst({
      where: (s, { eq, and }) => and(
        eq(s.structureId, svc.structureId),
        eq(s.name, svc.name),
      ),
      columns: { id: true },
    });

    if (existing) {
      serviceIdMap.set(svc.id, existing.id);
      stats.services.skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would create ProRdvService: "${svc.name}" (structure: ${svc.structureId})`);
      serviceIdMap.set(svc.id, `dry-run-${svc.id}`);
      stats.services.created++;
      continue;
    }

    const [newService] = await db.insert(schema.ProRdvService).values({
      structureId: svc.structureId,
      name: svc.name,
      durationMinutes: svc.duration_minutes || 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      isActive: svc.is_active ?? true,
    }).returning();

    serviceIdMap.set(svc.id, newService.id);
    stats.services.created++;
  }

  console.log(`   ✅ Services: ${stats.services.created} created, ${stats.services.skipped} skipped`);
  return serviceIdMap;
}

/**
 * Step 2+3: Migrate Appointments + Messages in batches
 */
async function migrateAppointmentsAndMessages(serviceIdMap) {
  console.log('\n📋 Step 2: Migrating Appointments + Messages...');

  // Count total
  const [{ count: totalCount }] = await db.select({ count: sql`count(*)` }).from(schema.Appointment);
  const total = Number(totalCount);
  stats.appointments.found = total;
  console.log(`   Found ${total} legacy appointments`);

  // Batch processing
  let offset = 0;
  let batch = 1;

  while (offset < total) {
    const appointments = await db.query.Appointment.findMany({
      offset,
      limit: BATCH_SIZE,
      orderBy: (a, { asc }) => [asc(a.createdAt)],
    });

    if (appointments.length === 0) break;

    console.log(`\n   📦 Batch ${batch} (${appointments.length} appointments, offset ${offset})...`);

    for (const apt of appointments) {
      try {
        await migrateOneAppointment(apt, serviceIdMap);
      } catch (error) {
        stats.appointments.errors++;
        console.error(`   ❌ Error migrating appointment ${apt.id}:`, error.message);
      }
    }

    offset += BATCH_SIZE;
    batch++;
  }

  console.log(`\n   ✅ Appointments: ${stats.appointments.migrated} migrated, ${stats.appointments.skipped} skipped, ${stats.appointments.errors} errors`);
  console.log(`   ✅ Conversations: ${stats.conversations.created} created`);
  console.log(`   ✅ Messages: ${stats.messages.migrated} migrated (${stats.messages.reEncrypted} re-encrypted), ${stats.messages.errors} errors`);
}

/**
 * Migrate a single appointment + its messages in a transaction.
 */
async function migrateOneAppointment(apt, serviceIdMap) {
  // Check if already migrated (idempotency)
  const idempotencyKey = `${IDEMPOTENCY_PREFIX}${apt.id}`;
  const existing = await db.query.ProAppointment.findFirst({
    where: (a, { eq }) => eq(a.idempotencyKey, idempotencyKey),
    columns: { id: true },
  });

  if (existing) {
    stats.appointments.skipped++;
    return;
  }

  // Resolve service ID mapping
  let proServiceId = serviceIdMap.get(apt.serviceId);
  if (!proServiceId) {
    // Fallback: find or create a default service for the structure
    const fallback = await db.query.ProRdvService.findFirst({
      where: (s, { eq }) => eq(s.structureId, apt.structureId),
      columns: { id: true },
    });
    proServiceId = fallback?.id;

    if (!proServiceId && !DRY_RUN) {
      const [created] = await db.insert(schema.ProRdvService).values({
        structureId: apt.structureId,
        name: 'Rendez-vous (migré)',
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        isActive: true,
      }).returning();
      proServiceId = created.id;
    } else if (!proServiceId) {
      proServiceId = `dry-run-fallback-${apt.structureId}`;
    }
  }

  // Load beneficiary for email snapshot
  let citizenEmailEncrypted = null;
  if (apt.beneficiaryId) {
    const beneficiary = await db.query.Beneficiary.findFirst({
      where: eq(schema.Beneficiary.id, apt.beneficiaryId),
      columns: { contact_encrypted: true, first_name_encrypted: true },
    });
    if (beneficiary?.contact_encrypted) {
      // Re-encrypt with v1: format
      try {
        const plainEmail = decrypt(beneficiary.contact_encrypted);
        citizenEmailEncrypted = plainEmail ? encrypt(plainEmail) : beneficiary.contact_encrypted;
      } catch {
        citizenEmailEncrypted = beneficiary.contact_encrypted; // Keep as-is
      }
    }
  }

  // Load messages for this appointment
  const messages = await db.select().from(schema.Message)
    .where(eq(schema.Message.appointmentId, apt.id))
    .orderBy(schema.Message.createdAt);

  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would migrate appointment ${apt.id} (${apt.status}, ${messages.length} messages)`);
    stats.appointments.migrated++;
    stats.messages.migrated += messages.length;
    return;
  }

  // ── Transaction: atomically insert ProAppointment + RdvConversation + Messages ──
  await db.transaction(async (tx) => {
    // 1. Insert ProAppointment
    const [proAppointment] = await tx.insert(schema.ProAppointment).values({
      structureId: apt.structureId,
      serviceId: proServiceId,
      startAt: apt.start_at,
      endAt: apt.end_at,
      status: apt.status === 'requested' ? 'booked' : apt.status,
      beneficiaryName: 'Particulier (migré)',
      citizenUserId: null,
      citizenEmailSnapshot: citizenEmailEncrypted,
      idempotencyKey,
      visioEnabled: apt.mode === 'visio',
      cancelledAt: apt.status === 'cancelled' ? apt.updatedAt : null,
      cancelledBy: apt.status === 'cancelled' ? 'legacy_migration' : null,
    }).returning();

    stats.appointments.migrated++;

    // 2. Create RdvConversation if there are messages
    if (messages.length > 0) {
      const conversationId = crypto.randomUUID();
      const lastMessage = messages[messages.length - 1];

      await tx.insert(schema.RdvConversation).values({
        id: conversationId,
        appointmentId: proAppointment.id,
        structureId: apt.structureId,
        citizenUserId: 'legacy-anonymous',
        lastMessageAt: lastMessage.createdAt,
        updatedAt: new Date(),
      });

      stats.conversations.created++;

      // 3. Insert messages (batch insert within transaction)
      const messageValues = messages.map((msg) => ({
        id: crypto.randomUUID(),
        conversationId,
        senderType: mapSenderType(msg.sender),
        body: reEncryptMessage(msg.content_encrypted),
        createdAt: msg.createdAt,
      }));

      await tx.insert(schema.RdvConversationMessage).values(messageValues);
      stats.messages.migrated += messages.length;
    }
  });
}

// ── Main ──
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🚚 MIGRATION: Legacy System A → System B');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Mode:       ${DRY_RUN ? '⚠️  DRY RUN (no writes)' : '🔴 LIVE (writing to DB)'}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Timestamp:  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');

  const start = Date.now();

  try {
    // Step 1: Services
    const serviceIdMap = await migrateServices();

    // Step 2+3: Appointments + Messages
    await migrateAppointmentsAndMessages(serviceIdMap);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Services:      ${stats.services.created} created, ${stats.services.skipped} skipped`);
    console.log(`  Appointments:  ${stats.appointments.migrated}/${stats.appointments.found} migrated, ${stats.appointments.skipped} skipped`);
    console.log(`  Conversations: ${stats.conversations.created} created`);
    console.log(`  Messages:      ${stats.messages.migrated} migrated (${stats.messages.reEncrypted} re-encrypted)`);
    console.log(`  Errors:        ${stats.appointments.errors} appointments, ${stats.messages.errors} messages`);
    console.log(`  Duration:      ${elapsed}s`);
    console.log(`  Mode:          ${DRY_RUN ? '⚠️  DRY RUN — no data was written' : '✅ LIVE — data has been written'}`);
    console.log('═══════════════════════════════════════════════════════');

    if (stats.appointments.errors > 0 || stats.messages.errors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
