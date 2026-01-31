#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.resolve(__dirname, '../sources/manifest.json');
const schemaPath = path.resolve(__dirname, '../sources/manifest-schema.json');

console.log('[Validator] Validating sources manifest...');

// Load manifest
let manifest;
try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
    console.log(`✓ Manifest loaded: ${manifest.sources.length} sources`);
} catch (e) {
    console.error(`✗ Failed to load manifest: ${e.message}`);
    process.exit(1);
}

// Load schema
let schema;
try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);
    console.log('✓ Schema loaded');
} catch (e) {
    console.error(`✗ Failed to load schema: ${e.message}`);
    process.exit(1);
}

// Validation checks
const errors = [];
const warnings = [];

// Check required fields
if (!manifest.version) {
    errors.push('Missing required field: version');
}

if (!Array.isArray(manifest.sources)) {
    errors.push('sources must be an array');
    process.exit(1);
}

// Validate each source
const seenIds = new Set();
const seenUrls = new Set();

manifest.sources.forEach((source, index) => {
    const prefix = `Source #${index + 1} (${source.id || 'unknown'})`;

    // Required fields
    if (!source.id) {
        errors.push(`${prefix}: Missing required field 'id'`);
    } else {
        // Check ID format
        if (!/^[a-z0-9-]+$/.test(source.id)) {
            errors.push(`${prefix}: ID must be kebab-case (lowercase, numbers, hyphens only)`);
        }
        
        // Check for duplicate IDs
        if (seenIds.has(source.id)) {
            errors.push(`${prefix}: Duplicate ID '${source.id}'`);
        }
        seenIds.add(source.id);
    }

    if (!source.label) {
        errors.push(`${prefix}: Missing required field 'label'`);
    }

    if (!source.scope) {
        errors.push(`${prefix}: Missing required field 'scope'`);
    } else if (!['national', '67', '68'].includes(source.scope)) {
        errors.push(`${prefix}: Invalid scope '${source.scope}' (must be: national, 67, 68)`);
    }

    if (!source.type) {
        errors.push(`${prefix}: Missing required field 'type'`);
    } else if (!['aide', 'demarche', 'structure', 'dispositif'].includes(source.type)) {
        errors.push(`${prefix}: Invalid type '${source.type}'`);
    }

    if (!source.url_exact) {
        errors.push(`${prefix}: Missing required field 'url_exact'`);
    } else {
        // Check URL is not just a homepage
        try {
            const url = new URL(source.url_exact);
            if (url.pathname === '/' || url.pathname === '') {
                warnings.push(`${prefix}: url_exact appears to be a homepage (${source.url_exact}). Should be a specific page/endpoint.`);
            }
        } catch (e) {
            errors.push(`${prefix}: Invalid URL '${source.url_exact}': ${e.message}`);
        }

        // Check for duplicate URLs
        if (seenUrls.has(source.url_exact)) {
            errors.push(`${prefix}: Duplicate url_exact '${source.url_exact}'`);
        }
        seenUrls.add(source.url_exact);
    }

    // Optional but recommended fields
    if (!source.strategy) {
        warnings.push(`${prefix}: Missing recommended field 'strategy'`);
    } else if (!['api', 'scrape', 'rss', 'manual'].includes(source.strategy)) {
        warnings.push(`${prefix}: Unknown strategy '${source.strategy}'`);
    }

    if (!source.license) {
        warnings.push(`${prefix}: Missing recommended field 'license'`);
    }

    if (!source.trust_level) {
        warnings.push(`${prefix}: Missing recommended field 'trust_level'`);
    } else if (!['OFFICIAL', 'VERIFIED', 'COMMUNITY'].includes(source.trust_level)) {
        warnings.push(`${prefix}: Unknown trust_level '${source.trust_level}'`);
    }

    if (source.enabled === undefined) {
        warnings.push(`${prefix}: Missing 'enabled' flag (defaulting to false)`);
    }
});

// Report results
console.log('\\n--- Validation Results ---');

if (errors.length > 0) {
    console.error(`\\n✗ ${errors.length} ERROR(S):`);
    errors.forEach(err => console.error(`  - ${err}`));
}

if (warnings.length > 0) {
    console.warn(`\\n⚠ ${warnings.length} WARNING(S):`);
    warnings.forEach(warn => console.warn(`  - ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('\\n✓ Manifest is valid!');
}

// Summary
const enabledCount = manifest.sources.filter(s => s.enabled).length;
const disabledCount = manifest.sources.length - enabledCount;

console.log(`\\n--- Summary ---`);
console.log(`Total sources: ${manifest.sources.length}`);
console.log(`Enabled: ${enabledCount}`);
console.log(`Disabled: ${disabledCount}`);

// Group by scope
const byScope = manifest.sources.reduce((acc, s) => {
    acc[s.scope] = (acc[s.scope] || 0) + 1;
    return acc;
}, {});
console.log(`By scope: ${JSON.stringify(byScope)}`);

// Group by type
const byType = manifest.sources.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
}, {});
console.log(`By type: ${JSON.stringify(byType)}`);

// Exit with error if validation failed
if (errors.length > 0) {
    console.error('\\n✗ Validation FAILED');
    process.exit(1);
}

console.log('\\n✓ Validation PASSED');
process.exit(0);
