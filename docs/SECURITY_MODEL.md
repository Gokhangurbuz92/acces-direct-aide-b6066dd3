# Modèle de Sécurité

Ce document décrit les mécanismes de sécurité mis en œuvre sur AccesDirectAide.

## 1. Authentification & RBAC

### Admin
L'accès administrateur est protégé par un **Single Static Token** (`ADMIN_TOKEN`) défini dans les variables d'environnement.
- **Header** : `Authorization: Bearer <ADMIN_TOKEN>`
- **Vérification** : Comparaison en temps constant (`crypto.timingSafeEqual`) pour éviter les attaques temporelles.
- **Rôle** : Accès total (lecture/écriture) sur toutes les routes `/api/admin/*`.

### Pro
L'accès professionnel utilise des sessions basées sur JWT (JSON Web Tokens).
- **Login** : `/api/pro/auth/login` renvoie un token.
- **Header** : `Authorization: Bearer <JWT>`
- **Validation** : Signature vérifiée avec `JWT_SECRET`.
- **Expiration** : Courte (ex: 1h/24h) avec refresh (si implémenté) ou relogin.

### Public
Accès anonyme pour la consultation (GET `/api/aides`, `/api/structures`, etc.).
Certaines actions (POST) sont protégées par Rate Limit.

## 2. Rate Limiting (Protection DoS/Brute-force)

Implémenté via `@upstash/ratelimit` (Redis) avec fallback mémoire (Dev).
Configuration stricte "Fail-Closed" en Production : si Redis est inaccessible, le service refuse les requêtes sensibles.

| Action | Limite | Fenêtre | Cible |
|---|---|---|---|
| `OTP_GEN` | 3 | 60s | Génération code PIN |
| `OTP_VERIFY` | 5 | 60s | Vérification code PIN |
| `LOGIN_PRO` | 5 | 15min | Tentative de connexion |
| `SEARCH_AIDES` | 30 | 60s | Recherche Aides |
| `SEARCH_STRUCTURES` | 30 | 60s | Recherche Structures |
| `SEARCH_RESSOURCES` | 60 | 60s | Recherche Ressources |

## 3. Headers de Sécurité (HTTP)

Configurés dans `vercel.json` pour toutes les routes.
- `Content-Security-Policy` : Strict, `default-src 'self'`, `script-src 'self'` (pas de scripts externes sauf Sentry).
- `Strict-Transport-Security` : HSTS activé (max-age 2 ans).
- `X-Content-Type-Options` : `nosniff`.
- `X-Frame-Options` : `DENY`.
- `Permissions-Policy` : Désactivation cam/mic/geo.

## 4. Données Sensibles & Chiffrement

- **Base de données** : Hébergée sur Neon (Postgres), chiffrée au repos.
- **Transit** : HTTPS obligatoire (forcé par Vercel).
- **Champs sensibles** : Les données PII (Identité, Email) sont stockées en clair mais minimisées (RGPD).
- **Ada Encryption Key** : `ADA_ENCRYPTION_KEY` (32 bytes) utilisée pour chiffrer certains champs sensibles ou tokens d'URL (ex: liens d'annulation RDV).

## 5. Gestion des Secrets

Tous les secrets sont injectés via variables d'environnement Vercel.
- `DATABASE_URL`
- `ADMIN_TOKEN`
- `JWT_SECRET`
- `CRON_SECRET`
- `ADA_ENCRYPTION_KEY`
- `UPSTASH_REDIS_REST_URL` / `_TOKEN`

Aucun secret n'est commité dans le repo (vérifié par `.gitignore` et scanners).
