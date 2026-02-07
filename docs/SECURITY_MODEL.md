# Modèle de Sécurité

## 1. Authentification

- **Admin** : Basée sur un secret partagé ou token (stocké en cookie `access_token` ou header `Authorization`). Géré par `api/_utils/auth.js`.
- **Pro** : Basée sur JWT (JSON Web Token).
  - Login : `/api/pro/auth/login` retourne un JWT.
  - Usage : Header `Authorization: Bearer <token>`.
  - Expiration : Configurée dans `api/_utils/crypto.js`.
- **Public** : Accès anonyme pour la consultation (Aides, Démarches).

## 2. Contrôle d'Accès (RBAC)

- **Guards** : Les routes sensibles sont protégées par des "Guards".
  - Frontend : `AdminGuard` redirige vers `/admin/login` si non authentifié.
  - Backend : Middleware `requireAdmin` ou `requirePro` vérifie le token avant d'exécuter le handler.

## 3. Protection des Données

- **Secrets** : Les clés (DATABASE_URL, ADA_ENCRYPTION_KEY, JWT_SECRET) sont injectées via variables d'environnement.
- **Encryption** : Les données sensibles (tokens d'invitation, certains champs persos) peuvent être chiffrées au repos via `ADA_ENCRYPTION_KEY`.
- **Sanitization** : Les entrées utilisateurs doivent être validées (Zod ou manuel) pour éviter les injections.

## 4. Rate Limiting

- Implémenté via `@upstash/ratelimit` et Redis (Vercel KV).
- Limite les abus sur les endpoints publics (ex: login, envoi de messages).
- Configuration dans `api/_utils/rateLimit.js`.
