#!/usr/bin/env node
/**
 * Migration Script: Transform legacy Structure data to Organization/Establishment
 *
 * Strategy:
 * - Detect "network" organizations (e.g., type_structure = france_travail)
 * - Create 1 Organization per network
 * - Create Establishments for individual sites
 * - Preserve all data + source URLs
 *
 * Usage: node scripts/migrate-structures-to-annuaire.js [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function normalizeOrgName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(association|groupe|réseau|fédération)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateOrgKey(structure) {
  // Priority 1: SIRET (if available, extract SIREN)
  if (structure.siret && structure.siret.length >= 9) {
    const siren = structure.siret.substring(0, 9);
    return `siren:${siren}`;
  }

  // Priority 2: domain + canonical name
  const canonical = normalizeOrgName(structure.nom);
  const domain = structure.type_structure || 'unknown';
  return `domain:${domain}:${canonical}`;
}

function generateSiteKey(structure) {
  // Priority 1: SIRET
  if (structure.siret) {
    return `siret:${structure.siret}`;
  }

  // Priority 2: source_id + hash(address)
  if (structure.source_id && structure.adresse) {
    const addressHash = crypto
      .createHash('md5')
      .update(`${structure.adresse}${structure.ville}${structure.code_postal}`.toLowerCase())
      .digest('hex')
      .substring(0, 8);
    return `source:${structure.source_id}:${addressHash}`;
  }

  // Priority 3: fallback hash
  const hash = crypto
    .createHash('md5')
    .update(`${structure.nom}${structure.adresse || ''}${structure.ville || ''}`.toLowerCase())
    .digest('hex')
    .substring(0, 12);
  return `hash:${hash}`;
}

function isNetworkOrganization(structure) {
  // Detect if this is a network/parent organization vs individual site
  const networkTypes = [
    'france_travail',
    'caf',
    'mdph',
    'cpam',
    // Add more network types if needed
  ];
  return networkTypes.includes(structure.type_structure);
}

function mapStructureToOrganization(structure) {
  const orgKey = generateOrgKey(structure);
  const slug = slugify(structure.nom) + '-' + orgKey.substring(0, 8).replace(/:/g, '-');

  return {
    slug,
    orgKey,
    name: structure.nom,
    acronyms: [],
    category: mapTypeToCategory(structure.type_structure),
    domains: structure.categories_aidees || [],
    publics: structure.publics_accueillis || [],
    description: structure.description_courte || null,
    website_url: structure.site_web || null,
    contact_email: structure.email || null,
    contact_phone: structure.telephone || null,
    address_city: structure.ville || null,
    address_postal_code: structure.code_postal || null,
    territory_level: determineTerritoryLevel(structure),
    territory_codes: [structure.departement].filter(Boolean),
    source_url: structure.source_url_exact || structure.source_url || 'https://unknown',
    fetched_at: structure.last_sync || new Date(),
    status: structure.statut === 'actif' ? 'publie' : 'brouillon',
  };
}

function mapStructureToEstablishment(structure, organizationId) {
  const siteKey = generateSiteKey(structure);
  const slug = slugify(structure.nom) + '-' + siteKey.substring(0, 8).replace(/:/g, '-');

  return {
    slug,
    organizationId,
    siteKey,
    name: structure.nom,
    type: mapTypeToEstablishmentType(structure.type_structure),
    services: structure.services || [],
    address_line1: structure.adresse || null,
    city: structure.ville || null,
    postal_code: structure.code_postal || null,
    department_code: structure.departement || null,
    region: mapDepartmentToRegion(structure.departement),
    geo_lat: structure.latitude || null,
    geo_lng: structure.longitude || null,
    phone: structure.telephone || null,
    email: structure.email || null,
    opening_hours: structure.horaires ? { raw: structure.horaires } : null,
    accessibility: structure.accessibilite_pmr ? ['pmr'] : [],
    appointment_url: null, // To be filled by connectors later
    source_url: structure.source_url_exact || structure.source_url || 'https://unknown',
    fetched_at: structure.last_sync || new Date(),
    status: structure.statut === 'actif' ? 'publie' : 'brouillon',
  };
}

function mapTypeToCategory(type) {
  const mapping = {
    association: 'association',
    service_public: 'institution',
    etablissement_sante: 'institution',
    mairie: 'collectivite',
    caf: 'institution',
    mdph: 'institution',
    france_travail: 'institution',
    cpam: 'institution',
  };
  return mapping[type] || 'autre';
}

function mapTypeToEstablishmentType(type) {
  const mapping = {
    france_travail: 'agence_ft',
    caf: 'antenne_caf',
    mdph: 'antenne_mdph',
    cpam: 'antenne_cpam',
    mairie: 'mairie',
  };
  return mapping[type] || 'autre';
}

function determineTerritoryLevel(structure) {
  // Simple heuristic: if has departement, it's departmental or local
  if (structure.departement) return 'departmental';
  return 'local';
}

function mapDepartmentToRegion(dept) {
  const mapping = {
    '67': 'Grand Est',
    '68': 'Grand Est',
  };
  return mapping[dept] || null;
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

async function migrate() {
  console.log('🚀 Starting migration: Structure → Organization/Establishment');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will write to DB)'}`);

  const stats = {
    totalStructures: 0,
    organizationsCreated: 0,
    establishmentsCreated: 0,
    errors: [],
  };

  try {
    // 1. Fetch all active structures
    const structures = await prisma.structure.findMany({
      where: {
        statut: 'actif',
      },
      orderBy: { nom: 'asc' },
    });

    stats.totalStructures = structures.length;
    console.log(`📊 Found ${structures.length} active structures to migrate`);

    // 2. Group structures by organization (using orgKey)
    const orgMap = new Map();

    for (const structure of structures) {
      const orgKey = generateOrgKey(structure);

      if (!orgMap.has(orgKey)) {
        orgMap.set(orgKey, {
          org: null,
          structures: [],
        });
      }

      orgMap.get(orgKey).structures.push(structure);
    }

    console.log(`📦 Grouped into ${orgMap.size} unique organizations`);

    // 3. For each organization group, create Organization + Establishments
    for (const [orgKey, group] of orgMap.entries()) {
      try {
        // Pick the first structure as representative for org data
        const representative = group.structures[0];

        // Check if organization already exists
        let organization = await prisma.organization.findUnique({
          where: { orgKey },
        });

        if (!organization) {
          const orgData = mapStructureToOrganization(representative);

          if (isDryRun) {
            console.log(`[DRY RUN] Would create Organization: ${orgData.name} (${orgKey})`);
          } else {
            organization = await prisma.organization.create({ data: orgData });
            stats.organizationsCreated++;
            console.log(`✅ Created Organization: ${organization.name} (${organization.orgKey})`);
          }
        } else {
          console.log(`⏭️  Organization already exists: ${organization.name} (${orgKey})`);
        }

        // Create Establishments for each structure in this group
        for (const structure of group.structures) {
          const siteKey = generateSiteKey(structure);

          // Check if establishment already exists
          const existingEstablishment = await prisma.establishment.findUnique({
            where: { siteKey },
          });

          if (existingEstablishment) {
            console.log(`⏭️  Establishment already exists: ${existingEstablishment.name} (${siteKey})`);
            continue;
          }

          const establishmentData = mapStructureToEstablishment(
            structure,
            organization?.id || 'temp-id-dry-run'
          );

          if (isDryRun) {
            console.log(
              `[DRY RUN] Would create Establishment: ${establishmentData.name} → ${organization?.name || 'N/A'}`
            );
          } else {
            const establishment = await prisma.establishment.create({ data: establishmentData });
            stats.establishmentsCreated++;
            console.log(`  ➕ Created Establishment: ${establishment.name} (${establishment.siteKey})`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing org ${orgKey}:`, err.message);
        stats.errors.push(`${orgKey}: ${err.message}`);
      }
    }

    // 4. Summary
    console.log('\n📈 Migration Summary:');
    console.log(`   Total Structures processed: ${stats.totalStructures}`);
    console.log(`   Organizations created: ${stats.organizationsCreated}`);
    console.log(`   Establishments created: ${stats.establishmentsCreated}`);
    console.log(`   Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      stats.errors.forEach((e) => console.log(`   - ${e}`));
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN completed. No changes made to database.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
  } catch (err) {
    console.error('💥 Fatal error during migration:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
