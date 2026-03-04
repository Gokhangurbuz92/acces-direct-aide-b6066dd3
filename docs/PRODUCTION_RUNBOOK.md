# 📕 Guide de Production — AccesDirectAide (ADA)

**Statut :** 100% Production-Ready (Phase 3 Complete)
**Version :** v3.0 — Intelligence Souveraine
**Date :** Mars 2026

---

## 🚀 Déploiement (Vercel)

| Étape | Commande | Description |
|---|---|---|
| 1. Build | `npm run build` | Vérifie types, casing, et prérendu SSG |
| 2. Deploy | Push sur `main` | Déploiement automatique Vercel (serverless edge) |
| 3. Migration | `npx prisma migrate deploy` | Synchronise le schéma Neon PostgreSQL |

### Checklist Pré-Déploiement

- [ ] `npm test` → tous les tests au vert
- [ ] `npm run build` → exit 0 (pas de TypeScript/casing errors)
- [ ] Les variables d'environnement sont configurées sur Vercel
- [ ] La migration Prisma est prête

---

## 🔐 Variables d'Environnement Critiques

| Variable | Usage | Secret |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL (pooling) | ✅ |
| `POSTGRES_URL_NON_POOLING` | Neon PostgreSQL (migrations) | ✅ |
| `OUTLOOK_TOKEN_ENCRYPTION_KEY` | AES-256-GCM (32 bytes hex) | ✅ |
| `ADMIN_MFA_SECRET` | TOTP Seed (admin MFA) | ✅ |
| `GEMINI_API_KEY` | Gemini 2.5 Flash (Boussole Sociale) | ✅ |
| `TWILIO_ACCOUNT_SID` | SMS notifications | ✅ |
| `TWILIO_AUTH_TOKEN` | SMS authentication | ✅ |
| `SENTRY_DSN` | Error monitoring | ✅ |
| `STORAGE_ENDPOINT` | Object storage (pièces jointes) | ✅ |
| `STORAGE_BUCKET` | Nom du bucket | ✅ |

---

## 📈 Observabilité

### Sentry
- Toutes les erreurs `logger.error` sont capturées automatiquement
- Tags: route, requestId, handler

### Prisma Studio
```bash
npx prisma studio
```
Pour l'audit manuel des `ConversationLog`, `ProAppointment`, `AuditLog`.

### Vercel Logs
- Monitorer le rate limiting (HTTP 429)
- Vérifier les temps de réponse des fonctions serverless

---

## 🚑 Recouvrement (DRP)

| Scénario | Solution |
|---|---|
| **Data Corruption** | Neon Point-in-Time Recovery (PITR) |
| **Lost Admin MFA** | `node scripts/admin/reset-mfa.js` via SSH sécurisé |
| **Gemini API Down** | Fallback structuré automatique dans `orient.js` |
| **Rate Limit Storm** | Ajuster `RATE_LIMIT_*` dans les variables d'environnement |
| **FTS Index Missing** | `npx prisma migrate deploy` recrée les indexes GIN |

---

## 🧪 Tests

```bash
# Tests unitaires complets
npx vitest run tests/unit/

# Tests d'intégration (nécessite PostgreSQL local)
npx vitest run tests/integration/

# Vérification de conformité
grep -r "console\." api/ --include="*.js" | grep -v node_modules
```

---

## 🏗️ Architecture

```
AccesDirectAide/
├── api/                    # Backend serverless (Vercel Functions)
│   ├── _handlers/          # Route handlers (153+)
│   │   ├── admin/          # MFA, stats nationales
│   │   ├── pro/            # Espace professionnel (auth RBAC)
│   │   └── public/         # Chatbot, orientation, recherche
│   ├── _utils/             # Logger, Prisma, auth, rate limit
│   └── lib/                # Gemini, pro-auth, E2EE
├── src/                    # Frontend React + Vite
│   ├── components/         # Composants réutilisables
│   │   ├── pro/            # ProPageSkeletons, ProBreadcrumb
│   │   └── chat/           # ChatAssistant (Boussole Sociale)
│   └── pages/              # Pages par domaine
│       ├── pro/            # Espace Pro (11 pages)
│       └── admin/          # Backoffice admin
├── prisma/                 # Schéma + Migrations
│   ├── schema.prisma       # 30+ modèles
│   └── migrations/         # Historique complet
└── tests/                  # 320+ tests (Vitest)
    ├── unit/               # Tests unitaires
    └── integration/        # Tests E2E
```

---

**CE PROJET EST DÉSORMAIS SOUVERAIN, SÉCURISÉ ET PRÊT POUR LE SERVICE NATIONAL. 🇫🇷**
