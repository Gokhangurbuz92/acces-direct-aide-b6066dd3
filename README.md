# Accès Direct Aide

> Plateforme d'accès aux aides sociales en France — Recherche d'aides, annuaire de structures, chatbot IA, espace professionnel.

**Production** : [https://www.accesdirectaide.fr](https://www.accesdirectaide.fr)

---

## 🎯 Description

**Accès Direct Aide** simplifie et centralise l'accès à l'information sociale en France. La plateforme propose :

- **Recherche d'aides** : 900+ aides sociales avec simplification FALC par IA
- **Annuaire** : structures d'accompagnement (CAF, CPAM, CCAS, associations…)
- **Chatbot IA** : assistant conversationnel (Gemini) avec RAG et recherche hybride
- **Espace Pro** : gestion de rendez-vous, dossiers, équipes, notifications
- **Admin** : dashboard opérationnel, synchronisation des sources, métriques IA

## 🚀 Quick Start

```bash
git clone <repo-url>
cd acces-direct-aide-b6066dd3
cp .env.example .env.local
npm install
npm run dev
```

L'application est disponible sur **[http://localhost:5173](http://localhost:5173)**.

## 📋 Prérequis

- **Node.js** 20+
- **PostgreSQL** (Neon en production, Docker en local)
- **Upstash Redis** (KV) — rate limiting et cache
- **Gemini API key** — pour les fonctionnalités IA (optionnel en dev, mock mode disponible)

## 🏗️ Architecture

Voir [docs/architecture.md](docs/architecture.md) pour le détail complet.

| Couche | Technologie |
|--------|------------|
| Frontend | React 18, Vite, TailwindCSS, Radix UI |
| Backend | Node.js 20, Vercel Serverless Functions |
| Base de données | Neon PostgreSQL + pgvector, Drizzle ORM |
| Cache | Upstash Redis (KV) |
| IA | Google Gemini 2.0 Flash |
| Monitoring | Sentry |
| CI/CD | GitHub Actions → Vercel |
| Tests | Vitest (unit/integ), Playwright (E2E) |

## 🧪 Tests

```bash
npm test              # Unit + integration (Vitest)
npm run test:e2e      # E2E (Playwright)
npm run test:coverage # Coverage report (V8)
npm run test:load     # Load testing (k6)
```

## 📊 Monitoring

| Endpoint | Description | Auth |
|----------|-------------|------|
| `/api/health` | Health check basique | Public |
| `/api/monitor/core` | DB + KV status | Public |
| `/api/monitor/cron/actualites` | Fraîcheur crons | Public |
| `/api/admin/ai-metrics` | Métriques IA (tokens, coûts) | Admin |
| `/api/admin/dashboard` | Dashboard opérationnel | Admin |
| `/api/admin/logs` | Logs centralisés | Admin |

## 🔐 Sécurité

- **Auth** : JWT (admin/pro), cookie sécurisé (citoyen), MFA admin
- **CSRF** : double-submit cookie + origin validation
- **Rate limiting** : Upstash KV + memory fallback
- **Circuit breaker** : opossum (Gemini API)
- **Headers** : CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Sensitive data** : NIR/IBAN/CB bloqués dans le chat IA
- **Feature flag** : `ENABLE_AI_AGENT` pour les agents de veille

## 📁 Structure du projet

```
src/                  # Frontend React
├── components/       # Composants réutilisables (Radix UI)
├── pages/            # Pages (lazy-loaded, 81 pages)
├── db/               # Schema DB (Drizzle ORM)
└── lib/              # Utilitaires, hooks, API client
api/                  # Backend Vercel Serverless
├── _handlers/        # Route handlers (170+ routes)
│   ├── assistant/    # Chat IA, recommandations
│   ├── auth/         # Auth citoyen
│   ├── pro/          # Espace professionnel (30+ handlers)
│   ├── admin/        # Admin dashboard
│   └── cron/         # Cron jobs (11 crons)
├── _utils/           # Auth, CSRF, rate limiting, logger
├── lib/              # Gemini, circuit breaker, hybrid search
└── routes.js         # Route registry
tests/                # Tests
├── unit/             # Tests unitaires (50 fichiers)
├── integration/      # Tests d'intégration (45 fichiers)
e2e/                  # Tests E2E Playwright (48 specs)
docs/                 # Documentation technique
scripts/              # Scripts utilitaires (seed, backup, ingestion)
```

## 🔗 Liens utiles

- **Production** : [accesdirectaide.fr](https://www.accesdirectaide.fr)
- **Health check** : [/api/health](https://www.accesdirectaide.fr/api/health)
- **Docs architecture** : [docs/architecture.md](docs/architecture.md)
- **Guide contribution** : [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Variables d'env** : [.env.example](.env.example)
