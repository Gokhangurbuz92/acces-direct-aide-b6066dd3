# Déploiement

## Production (Vercel)

Le déploiement est **automatique** via Vercel à chaque push sur `main`.

### Procédure standard
1. Créer une PR vers `main`
2. Vérifier que le CI est vert (lint, tests, build)
3. Vérifier le déploiement preview Vercel
4. Merger la PR
5. Vercel déploie automatiquement (~2 min)
6. Vérifier `GET /api/health` → `{"ok": true}`
7. Vérifier `GET /api/monitor/core` → DB + KV OK

### Rollback
1. Vercel Dashboard → Deployments
2. Cliquer sur le déploiement précédent
3. "Promote to Production"
4. Vérifier `/api/health`

### Preview
Chaque PR crée un déploiement preview automatique.

## Variables d'environnement

Voir `.env.example` pour la liste complète.

Modifier sur **Vercel → Settings → Environment Variables**.

Variables critiques :
- `DATABASE_URL` — PostgreSQL (Neon)
- `JWT_SECRET` — Signature tokens
- `GEMINI_API_KEY` — API Google AI
- `CRON_SECRET` — Authentification crons
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Rate limiting (Upstash)

## CI/CD Pipeline

```
Push → GitHub Actions CI
├── Lint (eslint)
├── Typecheck (tsc)
├── Unit Tests (vitest)
├── Coverage Report (v8)
├── Build (vite)
├── Secrets Scan (gitleaks)
└── Semgrep (SAST)
```

## Infrastructure

| Service | Provider | URL |
|---------|----------|-----|
| Frontend + API | Vercel | accesdirectaide.fr |
| Base de données | Neon (PostgreSQL) | neon.tech |
| Rate limiting | Upstash (Redis KV) | upstash.com |
| Monitoring | Sentry | sentry.io |
| CI/CD | GitHub Actions | github.com |
| Email | Resend | resend.com |
| IA | Google Gemini | ai.google.dev |
