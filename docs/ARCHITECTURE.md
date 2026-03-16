# 🏗️ Architecture — Accès Direct Aide

> Documentation technique pour la maintenance, l'audit et le scaling.

## 1. Vue d'ensemble (C4 — Context)

```
┌──────────────┐     HTTPS/REST      ┌──────────────────┐
│   Citoyen    │ ──────────────────── │   Vercel Edge    │
│   (Browser)  │                     │   + Functions    │
└──────────────┘                     └────────┬─────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                  ┌──────▼──────┐   ┌────────▼────────┐  ┌───────▼───────┐
                  │  Neon PG    │   │  Upstash Redis  │  │  S3 Storage   │
                  │  + pgvector │   │  (KV + Rate)    │  │  (Documents)  │
                  └─────────────┘   └─────────────────┘  └───────────────┘
```

## 2. Flux de requête (Pipeline)

```
Request
  │
  ├─ 1. Vercel Edge Middleware (canonical domain, noindex)
  │
  ├─ 2. api/index.js (Main Handler)
  │     ├─ CORS validation (SEC-01)
  │     ├─ OWASP headers (SEC-02)
  │     ├─ CSRF origin check (SEC-03)
  │     ├─ CSRF double-submit cookie (SEC-04)
  │     ├─ Rate limiting (admin routes)
  │     ├─ Cache policy (whitelist)
  │     ├─ Route matching (lazy imports)
  │     └─ Zod input validation (SEC-05)
  │
  ├─ 3. Handler execution
  │     └─ Sentry scope (tags, context)
  │
  └─ 4. Response
        ├─ Cache-Control on error (no-store)
        └─ x-request-id tracing
```

## 3. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | React 18 + Vite | SPA avec SSG partiel |
| Routing | React Router v6 | Lazy-loaded routes |
| State | TanStack Query | Cache + synchronisation |
| Animations | Framer Motion | Transitions de page |
| UI | Radix UI + Tailwind | Design system |
| Backend | Vercel Functions (Node 20) | API serverless |
| Validation | Zod | 141 schémas strict |
| DB | Neon Postgres + Drizzle ORM | SQL type-safe |
| Vector | pgvector | RAG / recherche sémantique |
| Cache | Upstash Redis | Rate limiting, KV |
| Storage | S3-compatible | Documents, attestations |
| Monitoring | Sentry | Errors + performance |
| Analytics | Vercel Analytics | Web vitals |
| CI/CD | GitHub Actions → Vercel | Preview + Production |

## 4. Sécurité

| Mesure | Implémentation |
|---|---|
| CSP | `sha256` hash (pas d'`unsafe-inline` sur scripts) |
| CSRF | Double-submit cookie + origin validation |
| CORS | Whitelist dynamique |
| Auth | JWT + token revocation (blacklist DB) |
| Input | Zod validation sur 141/141 handlers |
| PII | Scrubbing Sentry (NIR, IBAN) |
| Chiffrement | AES-256-GCM (vault) |
| RBAC | 4 rôles (super_admin, editor, moderator, viewer) |

## 5. Pipeline d'ingestion (Cron)

```
cron/pipeline ──► Verrou distribué (Redis)
                    │
                    ├─ Sync DREES (aides nationales)
                    ├─ Sync Aides Territoires
                    ├─ Sync Service-Public.fr
                    ├─ Génération FALC (IA)
                    ├─ Scoring qualité
                    └─ Webhook alerting
```

6 crons synchronisés, monitoring via `trackPipeline()`.

## 6. Infrastructure locale

```bash
# One-click bootstrap
docker compose up -d       # PG + Redis + pgAdmin
npm run dev:all             # Setup DB + Seed + Frontend + API
```

| Service | Port | Image |
|---|---|---|
| PostgreSQL | 5432 | `pgvector/pgvector:pg16` |
| Redis | 6379 | `redis:7-alpine` |
| pgAdmin | 5050 | `dpage/pgadmin4` |
| OpenFisca | 2000 | Custom build |

## 7. Structure du projet

```
├── api/                    # Vercel serverless functions
│   ├── _handlers/          # Route handlers (lazy-loaded)
│   ├── _utils/             # Shared utilities (csrf, auth, sentry, etc.)
│   ├── index.js            # Main request pipeline
│   └── routes.js           # Route registry (166 entries)
├── src/
│   ├── components/         # UI components (Radix + custom)
│   ├── pages/              # Route pages (lazy-loaded)
│   │   ├── admin/          # Admin interface (RBAC-gated)
│   │   └── pro/            # Pro interface (JWT-gated)
│   ├── lib/                # Utilities (rbac, seo, hooks)
│   ├── db/                 # Drizzle schema + migrations
│   └── api/                # Frontend API clients
├── docs/                   # OpenAPI spec
├── scripts/                # Seed, prerender, sitemap
└── infrastructure/         # Docker, OpenFisca
```
