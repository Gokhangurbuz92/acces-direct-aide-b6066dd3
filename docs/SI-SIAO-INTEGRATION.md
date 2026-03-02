# SI-SIAO Integration Guide

## Status: 🔴 NOT ACTIVATED (Feature Flagged)

> **IMPORTANT:** L'intégration SI-SIAO est entièrement codée mais **désactivée** en production.
> La structure n'a pas encore l'accès API SI-SIAO. Ne pas activer sans convention signée.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ Pro Frontend │────▶│ interop-siao │────▶│  SI-SIAO   │
│  (Button)    │     │  (Handler)   │     │    API     │
└─────────────┘     └──────────────┘     └────────────┘
                         │
                    SIAO_ENABLED=true ?
                    ├── YES → fetch SI-SIAO API
                    └── NO  → { ok: false, status: 'not_configured' }
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SIAO_ENABLED` | Non | `false` | Active le connecteur SI-SIAO |
| `SIAO_API_URL` | Si SIAO_ENABLED=true | — | URL de l'API SI-SIAO |
| `SIAO_API_KEY` | Si SIAO_ENABLED=true | — | Clé d'API SI-SIAO |

## API Endpoint

```
POST /api/pro/interop-siao
Authorization: Bearer <pro_token>

Body: { shareId: string }
```

### Responses

**SIAO_ENABLED=false :**
```json
{ "ok": false, "status": "not_configured" }
```

**SIAO_ENABLED=true, success :**
```json
{ "ok": true, "siao_id": "...", "status": "submitted" }
```

## Activation Checklist

- [ ] Convention signée avec SI-SIAO
- [ ] Clé API obtenue
- [ ] Variables d'env configurées sur Vercel
- [ ] `SIAO_ENABLED=true` dans Vercel Environment Variables
- [ ] Test en staging avec un dossier réel
- [ ] Validation par l'équipe métier

## Mock Connector (Tests)

Le handler `interop-siao.js` fonctionne en mode mock quand `SIAO_ENABLED=false`.
Les tests (`p11a-pro-rbac-enforcement.test.js`) vérifient :
- ✅ Auth pro requise (401 sans token)
- ✅ Feature flag respecté (200 + `not_configured` si désactivé)

## Data Mapping (SI-SIAO → ADA)

| Champ SI-SIAO | Champ ADA | Description |
|---|---|---|
| `demandeur.nom` | `situation.lastName` | Nom du bénéficiaire |
| `demandeur.prenom` | `situation.firstName` | Prénom |
| `demandeur.dateNaissance` | `situation.birthDate` | Date de naissance |
| `situation.logement` | `situation.housingStatus` | Type de logement |
| `demande.type` | `results.type` | Type de demande |
| `demande.urgence` | `results.priority` | Niveau d'urgence |
