import logger from '../_utils/logger.js';
import pg from 'pg';

// Connection: uses DATABASE_URL (localhost in dev, Neon in prod on Vercel)
const rawUrl = process.env.DATABASE_URL || '';
const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

// Strip Prisma-specific ?schema=public param — pg.Pool doesn't support it
const cleanUrl = rawUrl.replace(/[?&]schema=\w+/g, '');

const pool = new pg.Pool({
  connectionString: cleanUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

/**
 * POST /api/search-pro
 *
 * Citizen-facing search endpoint: find structures and professionals
 * matching a citizen's need, territory, audience and modality.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const needs = Array.isArray(body.needs) ? body.needs.filter(Boolean) : [];
    const audiences = Array.isArray(body.audiences) ? body.audiences.filter(Boolean) : [];
    const modalities = Array.isArray(body.modalities) ? body.modalities.filter(Boolean) : [];
    const territory = (body.territory || '').trim();
    const q = (body.q || '').trim();
    const page = Math.max(1, parseInt(body.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(body.limit, 10) || 12));
    const offset = (page - 1) * limit;

    // ── 1. Fetch taxonomy data for facets ───────────────────
    const [needsResult, audiencesResult, modalitiesResult] = await Promise.all([
      pool.query('SELECT id, slug, label, description, icon, color, keywords FROM "NeedCategory" WHERE "isActive" = true ORDER BY "sortOrder" ASC'),
      pool.query('SELECT id, slug, label FROM "AudienceCategory" WHERE "isActive" = true ORDER BY "sortOrder" ASC'),
      pool.query('SELECT id, slug, label, icon FROM "ModalityType" WHERE "isActive" = true ORDER BY "sortOrder" ASC'),
    ]);

    const allNeeds = needsResult.rows;
    const allAudiences = audiencesResult.rows;
    const allModalities = modalitiesResult.rows;

    // ── 2. Build maps ───────────────────────────────────────
    const needMap = Object.fromEntries(allNeeds.map(n => [n.slug, n.id]));

    // ── 3. Find matching structure IDs via junction tables ───
    let structureIdFilter = null;

    if (needs.length > 0) {
      const needIds = needs.map(s => needMap[s]).filter(Boolean);
      if (needIds.length > 0) {
        const result = await pool.query(
          'SELECT DISTINCT "structureId" FROM "StructureNeed" WHERE "needCategoryId" = ANY($1)',
          [needIds]
        );
        structureIdFilter = result.rows.map(r => r.structureId);
      }
    }

    if (audiences.length > 0) {
      const audienceMap = Object.fromEntries(allAudiences.map(a => [a.slug, a.id]));
      const audienceIds = audiences.map(s => audienceMap[s]).filter(Boolean);
      if (audienceIds.length > 0) {
        const result = await pool.query(
          'SELECT DISTINCT "structureId" FROM "StructureAudience" WHERE "audienceCategoryId" = ANY($1)',
          [audienceIds]
        );
        const ids = result.rows.map(r => r.structureId);
        structureIdFilter = structureIdFilter
          ? structureIdFilter.filter(id => ids.includes(id))
          : ids;
      }
    }

    if (modalities.length > 0) {
      const modalityMap = Object.fromEntries(allModalities.map(m => [m.slug, m.id]));
      const modalityIds = modalities.map(s => modalityMap[s]).filter(Boolean);
      if (modalityIds.length > 0) {
        const result = await pool.query(
          'SELECT DISTINCT "structureId" FROM "StructureModality" WHERE "modalityTypeId" = ANY($1)',
          [modalityIds]
        );
        const ids = result.rows.map(r => r.structureId);
        structureIdFilter = structureIdFilter
          ? structureIdFilter.filter(id => ids.includes(id))
          : ids;
      }
    }

    // If filters active but no matches → return empty
    if (structureIdFilter !== null && structureIdFilter.length === 0) {
      return res.status(200).json({
        structures: [],
        pagination: { total: 0, page, limit, totalPages: 0, hasNext: false },
        facets: { needs: allNeeds, audiences: allAudiences, modalities: allModalities },
      });
    }

    // ── 4. Build WHERE conditions ───────────────────────────
    const whereParts = [];
    const params = [];
    let paramIdx = 1;

    if (structureIdFilter) {
      whereParts.push(`s.id = ANY($${paramIdx})`);
      params.push(structureIdFilter);
      paramIdx++;
    }

    if (territory) {
      if (/^\d{2,3}$/.test(territory)) {
        whereParts.push(`s.departement = $${paramIdx}`);
        params.push(territory);
        paramIdx++;
      } else {
        whereParts.push(`s.ville ILIKE $${paramIdx}`);
        params.push(`%${territory}%`);
        paramIdx++;
      }
    }

    if (q && q.length >= 2) {
      whereParts.push(`(s.nom ILIKE $${paramIdx} OR s.description_courte ILIKE $${paramIdx})`);
      params.push(`%${q}%`);
      paramIdx++;
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // ── 5. Count ────────────────────────────────────────────
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "Structure" s ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    // ── 6. Fetch structures ─────────────────────────────────
    const structuresResult = await pool.query(
      `SELECT s.id, s.slug, s.nom, s.description_courte, s.type_structure,
              s.adresse, s.code_postal, s.ville, s.departement,
              s.telephone, s.email, s.site_web, s.horaires, s.services,
              s."accessibilite_pmr", s."is_pro_enabled",
              s.latitude, s.longitude, s."quality_score", s."summary_falc"
       FROM "Structure" s
       ${whereClause}
       ORDER BY s."quality_score" DESC NULLS LAST, s."updatedAt" DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );
    const structures = structuresResult.rows;

    if (structures.length === 0) {
      return res.status(200).json({
        structures: [],
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: false },
        facets: { needs: allNeeds, audiences: allAudiences, modalities: allModalities },
      });
    }

    // ── 7. Enrich with taxonomy + pro profiles ──────────────
    const sIds = structures.map(s => s.id);

    const [structureNeeds, structureAudiences, structureModalities, proProfilesResult] = await Promise.all([
      pool.query(
        `SELECT sn."structureId", nc.slug, nc.label, nc.icon, nc.color
         FROM "StructureNeed" sn JOIN "NeedCategory" nc ON nc.id = sn."needCategoryId"
         WHERE sn."structureId" = ANY($1)`, [sIds]
      ),
      pool.query(
        `SELECT sa."structureId", ac.slug, ac.label
         FROM "StructureAudience" sa JOIN "AudienceCategory" ac ON ac.id = sa."audienceCategoryId"
         WHERE sa."structureId" = ANY($1)`, [sIds]
      ),
      pool.query(
        `SELECT sm."structureId", mt.slug, mt.label, mt.icon
         FROM "StructureModality" sm JOIN "ModalityType" mt ON mt.id = sm."modalityTypeId"
         WHERE sm."structureId" = ANY($1)`, [sIds]
      ),
      pool.query(
        `SELECT pp.id, pp."displayName", pp."jobTitle", pp."descriptionPublic",
                pp."photoUrl", pp."acceptsNewClients", pp."contactMode",
                pu."structureId"
         FROM "ProProfile" pp JOIN "ProUser" pu ON pu.id = pp."proUserId"
         WHERE pu."structureId" = ANY($1) AND pp."isPubliclyVisible" = true AND pu.status = 'active'`,
        [sIds]
      ),
    ]);

    // Group by structure
    const needsByStructure = groupBy(structureNeeds.rows, 'structureId');
    const audiencesByStructure = groupBy(structureAudiences.rows, 'structureId');
    const modalitiesByStructure = groupBy(structureModalities.rows, 'structureId');
    const prosByStructure = groupBy(proProfilesResult.rows, 'structureId');

    // ── 8. Format response ──────────────────────────────────
    const results = structures.map(s => ({
      id: s.id,
      slug: s.slug,
      nom: s.nom,
      description_courte: s.description_courte,
      type_structure: s.type_structure,
      adresse: s.adresse,
      code_postal: s.code_postal,
      ville: s.ville,
      departement: s.departement,
      telephone: s.telephone,
      email: s.email,
      site_web: s.site_web,
      horaires: s.horaires,
      accessibilite_pmr: s.accessibilite_pmr,
      latitude: s.latitude,
      longitude: s.longitude,
      quality_score: s.quality_score,
      summary_falc: s.summary_falc,
      needs: (needsByStructure[s.id] || []).map(n => ({
        slug: n.slug, label: n.label, icon: n.icon, color: n.color,
      })),
      audiences: (audiencesByStructure[s.id] || []).map(a => ({
        slug: a.slug, label: a.label,
      })),
      modalities: (modalitiesByStructure[s.id] || []).map(m => ({
        slug: m.slug, label: m.label, icon: m.icon,
      })),
      rdv: { isPublished: s.is_pro_enabled || false, bookingMode: 'IN_PERSON' },
      professionals: (prosByStructure[s.id] || []).map(p => ({
        id: p.id,
        displayName: p.displayName,
        jobTitle: p.jobTitle,
        descriptionPublic: p.descriptionPublic,
        photoUrl: p.photoUrl,
        acceptsNewClients: p.acceptsNewClients,
        contactMode: p.contactMode,
      })),
    }));

    return res.status(200).json({
      structures: results,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
      facets: {
        needs: allNeeds.map(n => ({ slug: n.slug, label: n.label, icon: n.icon, color: n.color })),
        audiences: allAudiences.map(a => ({ slug: a.slug, label: a.label })),
        modalities: allModalities.map(m => ({ slug: m.slug, label: m.label, icon: m.icon })),
      },
    });
  } catch (error) {
    logger.error('search-pro handler error:', { message: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

function groupBy(arr, key) {
  const result = {};
  for (const item of arr) {
    const k = item[key];
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}
