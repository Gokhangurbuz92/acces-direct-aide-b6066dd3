# Modèle de Sécurité

## Authentification

### Admin
- Authentification par session (ou token selon implémentation).
- Accessible uniquement via `/admin/*`.
- Protection par Guard `RequireAuth` ou `AdminRoute`.

### Professionnels
- Authentification par JWT (JSON Web Token).
- Durée de validité : 8 heures.
- Routes : `/api/pro/*`.
- Stockage : `sessionStorage` (pour éviter la persistance longue durée sur postes partagés).

### Bénéficiaires (Messagerie / RDV)
- Authentification par Token temporaire (Magic Link).
- Hashé (SHA-256) avant stockage en base.
- Utilisé pour annuler un RDV ou accéder à une conversation sécurisée.

## RBAC (Role-Based Access Control)

Les rôles sont définis (implicitement ou explicitement) :
- `PUBLIC`: Accès lecture seule aux Aides/Structures.
- `PRO`: Accès à ses propres données (RDV, Structure).
- `STRUCTURE_ADMIN`: Gestion de l'équipe de la structure.
- `SUPERADMIN`: Accès global (Back-office).

## Rate Limiting

- Implémenté via `@vercel/kv` (ou Map en mémoire pour dev).
- Limites strictes sur :
  - Login (`LOGIN_PRO`, `LOGIN_ADMIN`).
  - Envoi de messages (`SEND_MESSAGE`).
  - Création de RDV (`CREATE_APPOINTMENT`).
- Headers standard renvoyés : `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

## Protection des Données

- **PII (Personal Identifiable Information)** : Minimisation de la collecte.
- **Logs** : Les emails et téléphones sont masqués dans les logs applicatifs (`api/lib/logger.js`).
- **Base de données** : Hébergée sur Neon (Postgres), accès sécurisé.
- **Chiffrement** : `ADA_ENCRYPTION_KEY` (32 bytes) utilisée pour chiffrer les données sensibles au repos si nécessaire.
