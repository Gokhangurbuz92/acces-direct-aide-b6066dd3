import { db } from '../../../src/db/index.js';
import { ProAvailabilityRule } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { requireProStructureContext } from '../../_utils/auth.js';
import { normalizeAvailabilityRules, rulesToSlotsJson, slotsJsonToRules } from '../../_utils/pro-rdv.js';
import { withProRdvHandler } from '../../_utils/with-pro-rdv-handler.js';

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
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const timezone = String(body.timezone || 'Europe/Paris');

    /** @type {Array<{weekday:number,startTime:string,endTime:string,timezone:string,isActive:boolean}>} */
    let normalizedRules = [];
    if (Array.isArray(body.rules)) {
      normalizedRules = normalizeAvailabilityRules(
        body.rules.map((rule /** @type {any} */) => ({
          weekday: toInt(/** @type {any} */ (rule)?.weekday),
          startTime: String(/** @type {any} */ (rule)?.startTime || ''),
          endTime: String(/** @type {any} */ (rule)?.endTime || ''),
          timezone: String(/** @type {any} */ (rule)?.timezone || timezone),
          isActive: Boolean(/** @type {any} */ (rule)?.isActive ?? true),
        })),
      );
    } else if (body.slots_json && typeof body.slots_json === 'object') {
      normalizedRules = slotsJsonToRules(/** @type {Record<string, unknown>} */ (body.slots_json), timezone);
    } else {
      return res.status(400).json({ error: 'rules or slots_json is required' });
    }

    await db.transaction(async (tx) => {
      await tx.delete(ProAvailabilityRule).where(eq(ProAvailabilityRule.structureId, proCtx.structureId));

      if (normalizedRules.length > 0) {
        await tx.insert(ProAvailabilityRule).values(
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
    });

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
