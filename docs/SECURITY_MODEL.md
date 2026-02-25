# Modèle de Sécurité

## 1. Niveaux d'Accès (RBAC)

Trois niveaux d'authentification sont définis :

1.  **Public (Anonyme)**
    - Routes `GET` sur les contenus (Aides, Démarches, Structures, Actualités).
    - Routes de recherche.
    - Routes de prise de rendez-vous (avec Token éphémère ou captcha implicite).
    - **Risque** : DoS, Scraping.
    - **Protection** : Rate Limiting strict.

2.  **Professionnel (Pro)**
    - Routes `/api/pro/*`.
    - Authentification via **JWT** (JSON Web Token) signé (HS256).
    - Scopes limités à la structure du professionnel (`structureId` dans le token).
    - **Expiration** : Courte (1h à 24h) avec refresh token (optionnel).

3.  **Administrateur (Admin)**
    - Routes `/api/admin/*`, `/api/cron/*` (si appel externe).
    - Authentification via **ADMIN_TOKEN** (Bearer) statique ou **JWT session** admin (HS256, 8h).
    - **Pouvoirs** : Full access (CRUD, suppression, logs, jobs).
    - **Protection** : IP whitelist (optionnel, via Vercel Firewall), HTTPS obligatoire.
    - **Frontend** : Toutes les routes `/admin/**` (sauf `/admin/login`) sont protégées par `<AdminGuard>` → redirect `/admin/login` si non-admin.
    - **Backend** : Tous les handlers `api/_handlers/admin/**` doivent utiliser `verifyAdmin(req)` de `api/_utils/auth.js`. Ne jamais utiliser de vérification custom ni de bypass `devLoginEnabled`.

## 2. Rate Limiting

Implémenté via Upstash Redis (ou KV) et `@upstash/ratelimit`.

| Zone | Limite | Action |
| :--- | :--- | :--- |
| **API Publique (Lecture)** | 60 req / min / IP | 429 Too Many Requests |
| **API Recherche** | 20 req / min / IP | 429 |
| **Login / Auth** | 5 essais / 10 min / IP | 429 (Protection Bruteforce) |
| **API Pro** | 120 req / min / User | 429 |
| **Admin / Cron** | Illimité (si Token valide) | - |

## 3. Gestion des Secrets

- **Stockage** : Variables d'environnement (`.env` local, Vercel Environment Variables).
- **Rotation** : Manuelle (voir `docs/ROTATE_SECRETS.md`).
- **Hygiène** : Aucun secret ne doit être commité (vérifié par `.gitignore` et Gitleaks).

## 4. Données Sensibles (RGPD)

- **Logs** : Anonymisés (IP masquée, pas de PII dans les logs Sentry).
- **Base de Données** :
    - Les données usagers (RDV) sont purgées après X mois (voir `docs/GDPR.md`).
    - Les emails sont stockés en clair (nécessaire pour l'envoi) mais l'accès est restreint.

## 5. Audit & Monitoring

- **Sentry** : Capture des exceptions et erreurs 500.
- **Logs Vercel** : Traçabilité des requêtes HTTP.
- **Admin Runs** : Historique des jobs cron accessible via `/admin/runs`.
