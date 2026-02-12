#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { config as dotenvConfig } from 'dotenv';

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

dotenvConfig({ path: path.join(rootDir, '.env.local'), override: false, quiet: true });
dotenvConfig({ path: path.join(rootDir, '.env'), override: false, quiet: true });

const lines = [];
const issues = [];
const warnings = [];

function addLine(text = '') {
  lines.push(text);
}

function maskUrlPassword(raw) {
  try {
    const parsed = new URL(raw);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function isLikelyPlaceholderToken(value, expected) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  const byExpected =
    expected === 'user'
      ? ['user', 'username']
      : expected === 'password'
        ? ['password', 'pass']
        : ['host'];

  if (normalized.includes('...')) return true;
  if (/^<.+>$/.test(normalized)) return true;
  if (normalized.startsWith('your-') || normalized.startsWith('your_')) return true;
  if (normalized.includes('placeholder') || normalized.includes('replace-me')) return true;

  return byExpected.includes(normalized);
}

function inferSslMode(parsedUrl) {
  const explicit = parsedUrl.searchParams.get('sslmode');
  if (explicit) return explicit;

  const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  return isLocalhost ? 'disable' : 'require';
}

function parseDbUrl(varName, rawValue) {
  if (!rawValue) {
    issues.push(`${varName} is missing.`);
    return null;
  }

  if (rawValue.includes('...')) {
    issues.push(`${varName} contains "..." placeholder segments.`);
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch (error) {
    issues.push(`${varName} is not a valid URL (${error.message}).`);
    addLine(`- ${varName}: invalid URL`);
    return null;
  }

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    issues.push(`${varName} must use postgresql:// (current protocol: ${parsed.protocol}).`);
  }

  const username = decodeURIComponent(parsed.username || '');
  const password = decodeURIComponent(parsed.password || '');
  const host = parsed.hostname || '';
  const port = parsed.port || '5432';
  const dbname = parsed.pathname.replace(/^\//, '');
  const sslmode = parsed.searchParams.get('sslmode') || '(not set)';
  const hasUser = Boolean(username);

  if (!hasUser) {
    issues.push(`${varName} has no database user in URL.`);
  }
  if (isLikelyPlaceholderToken(username, 'user')) {
    issues.push(`${varName} has a placeholder user ("${username}").`);
  }
  if (isLikelyPlaceholderToken(password, 'password')) {
    issues.push(`${varName} has a placeholder password.`);
  }
  if (isLikelyPlaceholderToken(host, 'host')) {
    issues.push(`${varName} has a placeholder host ("${host}").`);
  }
  if (!dbname) {
    issues.push(`${varName} has no dbname in URL path.`);
  }
  if (rawValue.includes('?...sslmode=') || rawValue.includes('&...sslmode=')) {
    issues.push(`${varName} has invalid sslmode query key ("...sslmode"). Use "sslmode=require".`);
  }

  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  if (!isLocalhost && !parsed.searchParams.get('sslmode')) {
    warnings.push(`${varName} has no sslmode; for managed Postgres set sslmode=require.`);
  }

  addLine(`- ${varName}`);
  addLine(`  source: ${maskUrlPassword(rawValue)}`);
  addLine(`  parsed: hasUser=${hasUser} host=${host || '(empty)'} port=${port} dbname=${dbname || '(empty)'} sslmode=${sslmode}`);

  const psqlSslMode = inferSslMode(parsed);
  const safeUser = username || '<missing-user>';
  addLine(`  psql : psql "host=${host || '<missing-host>'} port=${port} dbname=${dbname || '<missing-db>'} user=${safeUser} sslmode=${psqlSslMode}" -c "select current_user, current_database();"`);

  return { varName, host, port: Number(port) };
}

function checkRequiredEnv(schemaContent) {
  const usesDirectUrl = /env\(\s*["']DIRECT_URL["']\s*\)/.test(schemaContent);

  const requiredEnv = [
    { name: 'DATABASE_URL', required: true },
    { name: 'POSTGRES_URL_NON_POOLING', required: true },
    { name: 'DIRECT_URL', required: usesDirectUrl },
    { name: 'ADA_ENCRYPTION_KEY', required: true },
    { name: 'GEMINI_API_KEY', required: true },
  ];

  addLine('Required variables');
  for (const item of requiredEnv) {
    const value = process.env[item.name];
    const hasValue = Boolean(value && value.trim() !== '');
    const status = hasValue ? 'present' : item.required ? 'missing' : 'optional-missing';

    addLine(`- ${item.name}: ${status}`);

    if (item.required && !hasValue) {
      issues.push(`${item.name} is required but missing.`);
    }

    if (hasValue && (value.includes('...') || value.includes('<') || value.toLowerCase().includes('your-'))) {
      issues.push(`${item.name} looks like a placeholder value.`);
    }
  }

  if (!process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    warnings.push('GEMINI_API_KEY is missing but GOOGLE_API_KEY is present. Add GEMINI_API_KEY for local consistency.');
  }
}

function uniqueEndpoints(parsedUrls) {
  const map = new Map();
  for (const endpoint of parsedUrls) {
    if (!endpoint) continue;
    const key = `${endpoint.host}:${endpoint.port}`;
    if (!map.has(key)) {
      map.set(key, endpoint);
    }
  }
  return [...map.values()];
}

function checkTcp(endpoint) {
  return new Promise((resolve) => {
    if (!endpoint.host || isLikelyPlaceholderToken(endpoint.host, 'host')) {
      resolve({
        ok: false,
        skipped: true,
        reason: `skipped for placeholder host in ${endpoint.varName}`,
      });
      return;
    }

    const socket = net.createConnection({
      host: endpoint.host,
      port: endpoint.port,
      timeout: 2000,
    });

    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.on('connect', () => finish({ ok: true }));
    socket.on('timeout', () => finish({ ok: false, error: 'timeout' }));
    socket.on('error', (error) => finish({ ok: false, error: error.code || error.message }));
  });
}

async function main() {
  const schemaContent = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';

  addLine('AccesDirectAide local environment doctor');
  addLine('');
  checkRequiredEnv(schemaContent);

  addLine('');
  addLine('Database URL diagnostics');
  const urlVarNames = ['DATABASE_URL', 'POSTGRES_URL_NON_POOLING', 'DIRECT_URL'];
  const parsed = urlVarNames
    .filter((name) => process.env[name])
    .map((name) => parseDbUrl(name, process.env[name]));

  if (!parsed.length) {
    issues.push('No database URL found. Define DATABASE_URL and POSTGRES_URL_NON_POOLING.');
    addLine('- No database URL available to parse.');
  }

  addLine('');
  addLine('TCP connectivity');
  const endpoints = uniqueEndpoints(parsed.filter(Boolean));
  if (!endpoints.length) {
    addLine('- skipped: no valid endpoints');
  } else {
    for (const endpoint of endpoints) {
      const result = await checkTcp(endpoint);
      const label = `${endpoint.host}:${endpoint.port}`;
      if (result.ok) {
        addLine(`- ${label}: reachable`);
      } else if (result.skipped) {
        addLine(`- ${label}: ${result.reason}`);
      } else {
        addLine(`- ${label}: not reachable (${result.error})`);
        issues.push(`TCP connectivity failed for ${label}: ${result.error}.`);
      }
    }
  }

  addLine('');
  if (warnings.length) {
    addLine('Warnings');
    for (const warning of warnings) {
      addLine(`- ${warning}`);
    }
    addLine('');
  }

  if (issues.length) {
    addLine('RESULT: KO');
    addLine('Actionable reasons');
    for (const issue of issues) {
      addLine(`- ${issue}`);
    }
    addLine('- Run: vercel env pull .env.local');
    addLine('- Re-run: npm run doctor');
    console.log(lines.join('\n'));
    process.exit(1);
  }

  addLine('RESULT: OK');
  addLine('Your local environment is ready for migrate/seed.');
  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error(`doctor-env failed: ${error.message}`);
  process.exit(1);
});
