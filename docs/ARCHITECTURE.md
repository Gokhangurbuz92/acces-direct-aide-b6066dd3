# Architecture — Accès Direct Aide

> Documentation technique pour la maintenance, l'audit et le scaling.

## Vue d'ensemble

```
┌──────────────┐     HTTPS/REST      ┌──────────────────┐
│   Citoyen    │ ──────────────────── │   Vercel Edge    │
│   (Browser)  │                     │   + Functions    │
└──────────────┘                     └────────┬─────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                  ┌──────▼──────┐   ┌────────▼────────┐  ┌───────▼───────┐
                  │  Neon PG    │   │  Upstash Redis  │  │  Google       │
                  │  + pgvector │   │  (KV + Rate)    │  │  Gemini AI    │
                  └─────────────┘   └─────────────────┘  └───────────────┘
```

## Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | React 18 + Vite | SPA |
| Routing | React Router v7 | Lazy-loaded routes |
| State | TanStack Query | Cache + synchronisation |
| Animations | Framer Motion | Transitions de page |
| UI | Radix UI + Tailwind | Design system accessible |
| Backend | Vercel Functions (Node 20) | API serverless |
| Validation | Zod | Schémas de validation stricts |
| DB | Neon PostgreSQL + Drizzle ORM | SQL type-safe |
| Vector | pgvector | RAG / recherche sémantique |
| Cache | Upstash Redis | Rate limiting, KV |
| IA | Google Gemini 2.0 Flash | Chat, FALC, embeddings |
| Monitoring | Sentry | Errors + performance |
| CI/CD | GitHub Actions → Vercel | Preview + Production |

## Flux de requête

```
Request
  │
  ├─ 1. Vercel Edge (redirects, canonical domain, HSTS)
  │
  ├─ 2. api/index.js (Main Handler)
  │     ├─ CORS validation
  │     ├─ Security headers (CSP, X-Frame-Options, etc.)
  │     ├─ CSRF origin check + double-submit cookie
  │     ├─ Rate limiting (Upstash KV)
  │     ├─ Cache policy
  │     ├─ Route matching (170+ routes, lazy imports)
  │     └─ Zod input validation
  │
  ├─ 3. Handler execution
  │     ├─ Auth verification (JWT/cookie/cron secret)
  │     ├─ Business logic
  │     └─ Sentry scope (tags, context)
  │
  └─ 4. Response
        ├─ Cache-Control
        └─ x-request-id tracing
```

## Schema DB

Le schema Drizzle ORM est dans `src/db/schema.ts` (40+ tables) :

| Module | Tables principales |
|--------|-------------------|
| **Core** | Aide, Actualite, Demarche, Structure, Guide |
| **Auth** | AdminUser, CitizenUser, AuthToken, AuditLog |
| **Pro** | ProUser, ProProfile, ProAvailabilityRule, ProTimeOff |
| **RDV** | ProAppointment, ProRdvService, RdvConversation |
| **Messaging** | RdvConversation, ProNotification |
| **Taxonomy** | NeedCategory, AudienceCategory, ModalityType |
| **Ingestion** | IngestJob, SourceSnapshot, EntityVersion, RssSource |
| **IA** | AiMetric, ConversationLog, ReviewQueueItem |
| **RGPD** | ConsentLog, UserConsent |

## Pipeline d'ingestion

```
Vercel Crons (11 configurés)
  │
  ├─ ingest-aids       → Aides Territoires (quotidien 3h)
  ├─ ingest-structures → Annuaire structures (hebdo dim 2h)
  ├─ ingest-demarches  → Service-public.fr (hebdo lun 4h)
  ├─ ingest-annuaire   → Annuaire complet (hebdo lun 1h)
  ├─ actualites        → Flux RSS (toutes les 6h)
  ├─ hive-scan         → Veille IA Gemini (hebdo lun 6h)
  ├─ review-queue/scan → Scan qualité (toutes les 6h)
  ├─ rdv-reminder      → Rappels RDV (quotidien 8h)
  ├─ backup-db         → Backup base (hebdo dim 1h)
  ├─ gdpr-purge        → Purge RGPD (hebdo dim 3h)
  └─ health-alert      → Monitoring (toutes les 5 min)
```

12 connecteurs d'ingestion :
AidesTerritoires, DREES, ServicePublic, FINESS, RNA, GrandEst, Agefiph, MesAidesReno, DémarchesSimplifiées + IngestionPipelineCore.

## Architecture IA

```
User message
  │
  ├─ Prompt sanitizer (HTML, injection, length)
  ├─ Sensitive data check (NIR, IBAN, CB)
  │
  ├─ chatWithRulePack()
  │     ├─ Embedding (Gemini text-embedding-004, 768d)
  │     ├─ Hybrid search (pgvector + lexical, RRF fusion)
  │     ├─ Gemini 2.0 Flash (RAG context)
  │     └─ Circuit breaker (opossum, 50% threshold, 30s timeout)
  │
  ├─ Output safety filter (source officielle check)
  └─ Response + metrics (gemini-metrics.js)
```

**Agents IA** (derrière feature flag `ENABLE_AI_AGENT`) :
- `/api/pro/agent-discovery` — Recherche nouvelles aides (Pro)
- `/api/pro/agent-scheduler` — Orchestration enrichissement (Pro)
- `/api/cron/hive-scan` — Scan automatisé toutes catégories (Cron)

## Sécurité

| Mesure | Implémentation |
|--------|---------------|
| CSP | Content-Security-Policy dans vercel.json |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| CSRF | Double-submit cookie + origin validation |
| Auth | JWT admin/pro, cookie citoyen, MFA admin |
| Rate limiting | Upstash KV (`checkRateLimit`) |
| Input | Zod validation, prompt sanitizer |
| PII | Détection NIR/IBAN/CB, scrubbing Sentry |
| Chiffrement | AES-256-GCM (`api/lib/crypto.ts`) |
| Circuit breaker | opossum pour Gemini API |

## Monitoring

| Endpoint | Description |
|----------|-------------|
| `/api/health` | Health check (uptime, version, env) |
| `/api/health/deep` | Health profond DB+KV (auth requise) |
| `/api/monitor/core` | Statut DB + KV |
| `/api/monitor/cron/actualites` | Fraîcheur des crons |
| `/api/admin/ai-metrics` | Métriques IA (tokens, coûts, latence) |
| `/api/admin/dashboard` | Dashboard opérationnel |
| `/api/admin/logs` | Logs centralisés |

## Structure du projet

```
├── api/                     # Vercel serverless functions
│   ├── _handlers/           # Route handlers (lazy-loaded)
│   │   ├── assistant/       # Chat IA, recommandations, feedback
│   │   ├── auth/            # Auth citoyen (login, signup, MFA)
│   │   ├── pro/             # Espace pro (30+ handlers)
│   │   ├── admin/           # Admin (dashboard, sync, features)
│   │   └── cron/            # Cron jobs (11 crons)
│   ├── _utils/              # Auth, CSRF, rate limiting, logger
│   ├── lib/                 # Gemini, circuit breaker, search
│   │   └── ingestion/       # 12 connecteurs de données
│   ├── index.js             # Main request pipeline
│   └── routes.js            # Route registry (170+ routes)
├── src/
│   ├── components/          # UI components (Radix + custom)
│   ├── pages/               # Route pages (81 pages, lazy-loaded)
│   │   ├── admin/           # Admin interface
│   │   └── pro/             # Pro interface
│   ├── lib/                 # Utilities, hooks
│   └── db/
│       └── schema.ts        # Drizzle schema (40+ tables)
├── tests/
│   ├── unit/                # 50 fichiers test
│   └── integration/         # 45 fichiers test
├── e2e/                     # 48 specs Playwright
├── docs/                    # Documentation
├── scripts/                 # Seed, backup, ingestion, build
└── .github/workflows/       # CI/CD GitHub Actions
```
