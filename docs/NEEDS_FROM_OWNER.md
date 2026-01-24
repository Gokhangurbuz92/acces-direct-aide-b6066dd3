# Needs From Owner

Pour garantir le fonctionnement en production et en pré-production (Preview Vercel), les variables d'environnement suivantes doivent être définies dans le projet Vercel :

## 🚨 Critiques (Bloquants)
*   **`DATABASE_URL`**: URL de connexion PostgreSQL (Neon).
    *   *Usage:* Prisma Client (`api/index.js`, handlers).
*   **`ENCRYPTION_KEY`**: Chaîne hexadécimale de 32 octets (64 caractères).
    *   *Usage:* Chiffrement des messages et données sensibles (`api/lib/crypto.js`).
    *   *Commande pour générer:* `openssl rand -hex 32`
*   **`JWT_SECRET`**: Secret pour la signature des tokens d'authentification Pro.
    *   *Usage:* `api/lib/pro-auth.js`.
*   **`CRON_SECRET`**: Token de sécurité pour les tâches planifiées (ingest, purge).
    *   *Usage:* `api/_handlers/cron/*.js`.

## Observabilité & Services
*   **`SENTRY_DSN`**: URL d'ingestion Sentry.
*   **`SENTRY_AUTH_TOKEN`**: Token pour uploader les sourcemaps (Build time).
*   **`VERCEL_KV_REST_API_URL`** & **`VERCEL_KV_REST_API_TOKEN`**: Pour le Rate Limiting en production.

## Configuration
*   **`VITE_DEV_LOGIN_ENABLED`**: `true` ou `false` (Pour activer/désactiver le login local si nécessaire).
