# Repository Map (Source of Truth)

This document provides a high-level overview of the repository structure, designating ownership and purpose for each section.

## 1. Root & Configuration
**Owner:** DevOps / Lead
**Role:** Project configuration, dependency management, and build settings.

| Path | Purpose | Dependencies | Risk |
|------|---------|--------------|------|
| `package.json` | Project dependencies and scripts | - | High (Build/Run) |
| `vercel.json` | Deployment configuration (rewrites, crons) | - | High (Routing) |
| `vite.config.js` | Frontend build configuration | - | High (Build) |
| `eslint.config.js` | Linting rules (separated Browser/Node) | - | Low |
| `.gitignore` | Git exclusion rules | - | Low |

## 2. Frontend (`src/`)
**Owner:** Frontend
**Role:** React Single Page Application (Vite).

| Path | Purpose | Dependencies | Risk |
|------|---------|--------------|------|
| `src/pages/` | Route components (Lazy loaded) | React Router | High (UX) |
| `src/components/` | Reusable UI components | Tailwind | Medium |
| `src/api/` | API Client (`client.js`) | `api/routes.js` (contract) | High (Data) |
| `src/utils/` | Shared logic (analytics, schema) | - | Low |

## 3. API (`api/`)
**Owner:** Backend
**Role:** Node.js Serverless Functions (Monolithic Router pattern).

| Path | Purpose | Dependencies | Risk |
|------|---------|--------------|------|
| `api/index.js` | Vercel Entrypoint | `api/routes.js` | Critical |
| `api/routes.js` | Route definition (Method -> Handler) | Handlers | Critical |
| `api/_handlers/` | Business logic endpoints | Prisma, Utils | High |
| `api/_utils/` | Shared backend logic (Auth, RateLimit) | Redis/KV | Critical (Security) |
| `api/lib/` | Service adapters (FALC, Storage) | External APIs | Medium |

## 4. Database (`prisma/`)
**Owner:** Backend / DBA
**Role:** Database schema and migrations (Postgres).

| Path | Purpose | Dependencies | Risk |
|------|---------|--------------|------|
| `prisma/schema.prisma` | Data models and relations | Neon DB | Critical (Data Loss) |
| `prisma/migrations/` | SQL migration history | - | High |

## 5. Scripts (`scripts/`)
**Owner:** DevOps
**Role:** Utility scripts for CI, verification, and data population.

| Path | Purpose | Dependencies | Risk |
|------|---------|--------------|------|
| `scripts/ci-healthcheck.js` | CI Smoke tests | - | High (CI Gate) |
| `scripts/generate-repo-map.sh`| Documentation generator | - | Low |

## 6. Documentation (`docs/`)
**Owner:** All
**Role:** Project knowledge base and operational procedures.

| Path | Purpose |
|------|---------|
| `docs/REPO_MAP.md` | This file |
| `docs/REPO_FILES.txt` | Automated file inventory |
| `docs/ROUTES_FRONT.md` | Frontend routing map |
| `docs/ROUTES_API.md` | API endpoint map |

## 7. Tests
**Owner:** QA / Dev
**Role:** Automated verification.

| Path | Purpose | Tool |
|------|---------|------|
| `e2e/` | End-to-end tests | Playwright |
| `tests/` | Unit/Integration tests | Vitest |

## 8. Data
**Owner:** Data
**Role:** Seed data and configuration.

| Path | Purpose |
|------|---------|
| `data/` | CSV/JSON seeds |
| `config/` | App config (e.g. RSS sources) |
