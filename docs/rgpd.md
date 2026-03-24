# RGPD — Conformité

> Dernière revue : 2026-03-24

## Données collectées

| Donnée | Base légale | Durée conservation | Purge auto |
|--------|-----------|-------------------|:---:|
| Email citoyen | Consentement | Jusqu'à suppression | ❌ |
| Conversations chat | Intérêt légitime | 90 jours | ✅ |
| Logs d'audit | Obligation légale | 365 jours | ✅ |
| Cookies analytics | Consentement | 13 mois | ✅ |
| Consent log | Preuve légale | 3 ans | ✅ |
| Tokens auth expirés | — | 30 jours | ✅ |
| Invitations expirées | — | 30 jours | ✅ |
| Diagnostics partagés | Consentement | Durée configurée | ✅ |

## Droits des utilisateurs

| Droit | Endpoint | Implémenté |
|-------|---------|:---:|
| **Accès** | `GET /api/auth/export-data` | ✅ |
| **Suppression** | `DELETE /api/auth/delete-account` | ✅ |
| **Portabilité** | `GET /api/auth/export-data` (JSON) | ✅ |
| **Rectification** | Via profil utilisateur | ✅ |
| **Opposition** | Via suppression de compte | ✅ |

## Purge automatique (GDPR Purge Cron)

Le cron `gdpr-purge` s'exécute hebdomadairement et supprime :

| Table | Condition | Délai |
|-------|-----------|-------|
| `ConversationLog` | `createdAt < 90j` | 90 jours |
| `AuditLog` | `createdAt < 365j` | 1 an |
| `SharedDiagnostic` | Expirés | Selon config |
| `AuthToken` | Expirés | 30 jours |
| `ConsentLog` | `createdAt < 3ans` | 3 ans |
| `ProInvitation` | Expirées | 30 jours |

## Chiffrement des données sensibles

| Donnée | Méthode |
|--------|---------|
| Mots de passe | scrypt (salt + 64 bytes) |
| NIR/IBAN/CB dans prompts | Bloqués par sanitizer |
| Tokens OAuth | AES-256-GCM (`vault-crypto.js`) |
| Tokens MFA | AES-256-GCM |

## Cookie banner

Implémenté dans le frontend (`src/pages/Confidentialite.jsx`).
- Aucun cookie analytics placé avant consentement
- Consentement enregistré dans `ConsentLog`

## PII Detection

Le `prompt-sanitizer.js` détecte et bloque :
- Numéros de sécurité sociale (NIR)
- IBAN
- Numéros de carte bancaire

## DPO
Contact : gokhangurbuz92@gmail.com
