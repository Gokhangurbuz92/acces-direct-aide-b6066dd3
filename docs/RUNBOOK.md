# 🚀 Runbook : Mise en Production Souveraine — Accès Direct Aide

> **Version** : 2.0 — Phases 1–4 complétées  
> **Cible** : Serveur souverain (Scaleway, OVH, On-Premise) ou Vercel (actuel)

---

## 1. Prérequis Serveur

| Ressource | Minimum | Recommandé |
|---|---|---|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 Go | 8 Go (embeddings + RAG) |
| Stockage | 20 Go SSD | 50 Go SSD |
| Outils | Docker Engine 24+ | + Docker Compose V2 |

## 2. Architecture de Déploiement

```
┌─────────────────────────────────────────────────────┐
│                   Reverse Proxy                      │
│              (Nginx / Traefik + SSL)                 │
│                   :443 → :3000                       │
├──────────┬──────────────┬───────────────────────────┤
│  ada-api │  ada-postgres │  ada-redis               │
│  :3000   │  :5432        │  :6379                    │
│  Node 20 │  PG16+pgvector│  Redis 7                  │
└──────────┴──────────────┴───────────────────────────┘
```

## 3. Configuration de l'Environnement

Créez `.env.production` à la racine :

```bash
# Base de données souveraine
DATABASE_URL=postgresql://user:pass@ada-postgres:5432/acces_direct_aide
POSTGRES_URL_NON_POOLING=${DATABASE_URL}

# IA (Gemini)
GEMINI_API_KEY=votre-clé-production

# Cache (Upstash REST ou laisser vide pour in-memory)
KV_REST_API_URL=https://votre-instance.upstash.io
KV_REST_API_TOKEN=votre-token

# Chiffrement
ADA_ENCRYPTION_KEY=clé-32-caractères-aes

# Feature Flags
ENABLE_AI_AGENT=true
ENABLE_RAG=true
ENABLE_OPENFISCA=true
ENABLE_CACHE=true
MAINTENANCE_MODE=false
ENABLE_AUDIT_LOG=true
```

## 4. Déploiement Étape par Étape

### A. Initialisation de la Base de Données

```bash
# Lancer PostgreSQL + Redis
docker compose up -d postgres redis

# Attendre que PG soit ready
docker compose exec postgres pg_isready -U postgres

# Activer pgvector
docker compose exec postgres psql -U postgres -d acces_direct_aide \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Appliquer les migrations Prisma
npx prisma migrate deploy
npx prisma generate
```

### B. Build et Lancement de l'API

```bash
# Build de l'image de production (Dockerfile à la racine du monorepo)
docker build -t ada-api .

# Lancement
docker run -d \
  --name ada-api \
  --env-file .env.production \
  --network ada-network \
  -p 3000:3000 \
  ada-api
```

### C. Vérification Santé

```bash
# Health check basique
curl http://localhost:3000/api/health

# Health check approfondi (DB + storage + services)
curl http://localhost:3000/api/health/deep

# Logs (format JSON structuré, compatible Pino)
docker logs -f ada-api | jq .
```

## 5. Monitoring & KPIs

| Indicateur | Cible | Comment mesurer |
|---|---|---|
| Latence RAG | < 200ms | Logs `[ai-engine] rag search` |
| Cache Hit Rate | > 70% | Logs `[Cache] Hit` / `[Cache] Miss` |
| Uptime API | 99.9% | Docker HEALTHCHECK + monitoring |
| Semgrep 0-day | 0 bloquant | CI auto `.github/workflows/semgrep.yml` |
| Audit Logs | Actifs | Logs niveau `AUDIT` (RGPD) |

## 6. Plan de Rollback

```bash
# 1. Activer la maintenance (Feature Flag)
# → MAINTENANCE_MODE=true dans .env.production, puis restart

# 2. Revenir à l'image précédente
docker tag ada-api ada-api:broken
docker tag ada-api:previous ada-api:latest

# 3. Relancer
docker stop ada-api && docker rm ada-api
docker run -d --name ada-api --env-file .env.production -p 3000:3000 ada-api

# 4. Vérifier
curl http://localhost:3000/api/health
```

## 7. Packages npm Disponibles

| Package | Usage |
|---|---|
| `@ada/db` | `import { prisma } from '@ada/db'` |
| `@ada/shared` | Constants, validators Zod, cache, feature flags, logger |
| `@ada/ai-engine` | GeminiChat, RagService, AgentOrchestrator |
| `@ada/legal-tools` | OpenFiscaClient, buildTestCase, RIGHTS_CATALOG |

## 8. Commandes Utiles

```bash
npm run docker:up      # Démarre PG + Redis
npm run docker:down    # Arrête les services
npm run docker:admin   # pgAdmin sur :5050
npm run lint           # ESLint
npm run build          # Vite build
npm run dev            # Dev local
```
