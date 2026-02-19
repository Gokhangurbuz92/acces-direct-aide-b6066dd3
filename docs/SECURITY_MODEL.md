# Modèle de Sécurité

## 1. Authentification & RBAC
L'application gère trois niveaux d'accès :

### Public (Anonyme)
- Accès en lecture seule aux Aides, Démarches, Annuaire, Actualités.
- Accès aux routes de prise de RDV (création avec token temporaire si nécessaire).

### Professionnel (Pro)
- **Authentification** : JWT (JSON Web Token) signé.
- **Scope** : `/pro/*`.
- **Données** : Isolation par `structureId`. Un Pro ne voit que les données de sa structure.

### Administrateur (Admin)
- **Authentification** : Token statique (Bearer) défini via `ADMIN_TOKEN` ou session spécifique.
- **Scope** : `/admin/*`.
- **Privilèges** : Accès complet (lecture/écriture) sur toutes les entités.

## 2. Protection des Données (PII)
- **Chiffrement au repos** : Les champs sensibles (noms, emails, téléphones) sont chiffrés en base de données via AES-256-GCM (`ADA_ENCRYPTION_KEY`).
- **Logs** : Les logs ne doivent jamais contenir de PII en clair.

## 3. Rate Limiting
- Implémenté via Upstash Redis (ou Vercel KV).
- Limites (exemple) :
  - API Publique : 100 req/min par IP.
  - Login : 5 essais/min.
  - Recherche : 60 req/min.

## 4. Sécurité Infra
- **Vercel** : Hébergement Serverless.
- **Postgres** : Accès DB restreint aux IPs Vercel (ou via proxy).
- **Headers** : HSTS, X-Content-Type-Options, etc. configurés via `vercel.json` ou middleware.
