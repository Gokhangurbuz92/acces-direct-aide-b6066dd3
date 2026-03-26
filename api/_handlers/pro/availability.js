import { db } from '../../../src/db/index.js';
import { ProAvailabilityRule } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { requireProStructureContext } from '../../_utils/auth.js';
import { normalizeAvailabilityRules, rulesToSlotsJson, slotsJsonToRules } from '../../_utils/pro-rdv.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';
import { availabilityPayloadSchema } from '../../../src/db/drizzle-schemas.js';

/**
 * @param {unknown} value
 * @returns {number}
 */
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
async function handler(req, res) {
  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  if (req.method === 'GET') {
    const rules = await db.query.ProAvailabilityRule.findMany({
      where: eq(ProAvailabilityRule.structureId, proCtx.structureId),
      orderBy: (pr, { asc }) => [asc(pr.weekday), asc(pr.startTime)],
    });

    return res.status(200).json({
      rules: rules.map((rule /** @type {any} */) => ({
        id: rule.id,
        weekday: rule.weekday,
        startTime: rule.startTime,
        endTime: rule.endTime,
        timezone: rule.timezone,
        isActive: rule.isActive,
      })),
      slots_json: rulesToSlotsJson(rules),
      timezone: rules[0]?.timezone || 'Europe/Paris',
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const parsed = availabilityPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input';
      return res.status(400).json({ error: firstError });
    }
    const data = parsed.data;
    const timezone = data.timezone || 'Europe/Paris';

    /** @type {Array<{weekday:number,startTime:string,endTime:string,timezone:string,isActive:boolean}>} */
    let normalizedRules = [];
    if (Array.isArray(data.rules) && data.rules.length > 0) {
      normalizedRules = normalizeAvailabilityRules(
        data.rules.map((rule) => ({
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
          timezone: rule.timezone || timezone,
          isActive: rule.isActive !== false,
        })),
      );
    } else if (data.slots_json && typeof data.slots_json === 'object') {
      normalizedRules = slotsJsonToRules(/** @type {Record<string, unknown>} */ (data.slots_json), timezone);
    }

    // Sequential operations (no transaction needed — neon-http driver doesn't support them)
    await db.delete(ProAvailabilityRule).where(eq(ProAvailabilityRule.structureId, proCtx.structureId));

    if (normalizedRules.length > 0) {
      await db.insert(ProAvailabilityRule).values(
          normalizedRules.map((rule) => ({
            structureId: proCtx.structureId,
            weekday: rule.weekday,
            startTime: rule.startTime,
            endTime: rule.endTime,
            timezone: rule.timezone || timezone,
            isActive: rule.isActive !== false,
          }))
      );
    }

    return res.status(200).json({
      ok: true,
      rules: normalizedRules,
      slots_json: rulesToSlotsJson(normalizedRules),
      timezone,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withProRdvHandler('pro.availability', handler);
