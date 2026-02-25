# RUNBOOK — OpenFisca Legislative Engine Integration

## Overview

The diagnostic system uses [OpenFisca France](https://fr.openfisca.org/) to compute social rights (RSA, Prime d'activité, APL) based on the user's financial situation. The calculation is performed server-side via `POST /api/diagnostic`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENFISCA_BASE_URL` | `https://api.fr.openfisca.org/latest` | OpenFisca API endpoint |
| `OPENFISCA_TIMEOUT_MS` | `4000` | Request timeout in milliseconds |
| `OPENFISCA_ENABLE_TRACE` | `false` | Enable `/trace` endpoint (pro/admin only) |

> ⚠️ **IMPORTANT**: The correct public API URL is `https://api.fr.openfisca.org/latest`.
> The URL `https://fr.openfisca.org/api/v21` is **invalid** (DNS does not resolve).
>
> **Production value** (Vercel): `OPENFISCA_BASE_URL=https://api.fr.openfisca.org/latest`
>
> ⚠️ The public OpenFisca API has **no SLA**. For production traffic with guaranteed availability,
> deploy a self-hosted OpenFisca Docker instance (`openfisca/openfisca-france:latest`).

### Resilience

- **URL normalization**: Trailing slashes are stripped automatically to prevent `//calculate` paths.
- **Health probe cache**: `isAvailable()` caches the result for 60 seconds. If the engine is down, `/api/diagnostic` returns `503 OPENFISCA_UNAVAILABLE` immediately without attempting calculation.
- **Error contract**: The diagnostic endpoint never returns HTTP 500. Only `200` (success), `400` (validation error), `429` (rate limit), or `503` (engine unavailable).

## API Endpoints

### `POST /api/diagnostic`

**Public** — Computes rights from wizard answers.

**Request:**
```json
{
  "answers": {
    "birthDate": "1992-06-15",
    "statut": "chomage",
    "situation": "seul",
    "territory": "67000",
    "income": { "salary": 0, "unemployment": 800 },
    "housing": { "rent": 520, "charges": 50, "status": "tenant" }
  }
}
```

**Response:**
```json
{
  "period": "2026-02",
  "rights": [
    {
      "code": "rsa",
      "label": "RSA (Revenu de solidarité active)",
      "eligible": true,
      "amount": 564.78,
      "explain": "...",
      "explain_falc": "...",
      "next_steps": [{ "type": "aide", "slug": "rsa" }],
      "category": "minimum_social"
    }
  ],
  "meta": { "source": "openfisca", "requestId": "diag_...", "duration_ms": 420 }
}
```

### `POST /api/diagnostic/trace`

**Pro/Admin only** — Returns OpenFisca [trace](https://openfisca.org/doc/openfisca-web-api/trace-tool).

Requires `Authorization: Bearer {ADMIN_TOKEN}` or active pro session.

## OpenFisca Variables Reference

All variables verified against `GET https://api.fr.openfisca.org/latest/variable/{name}` on 2026-02-25.

### Input Variables
| Variable | Entity | Period | Type | Wizard Field | Description (OpenFisca) |
|----------|--------|--------|------|-------------|------------------------|
| `date_naissance` | individu | ETERNITY | Date | birthDate | Date de naissance |
| `activite` | individu | MONTH | String (enum) | statut | Activité (actif, chomeur, etudiant, retraite, inactif) |
| `salaire_net` | individu | MONTH | Float | income.salary | Salaires nets d'après définition INSEE |
| `chomage_net` | individu | MONTH | Float | income.unemployment | Allocations chômage nettes |
| `loyer` | menage | MONTH | Float | housing.rent | Loyer ou mensualité d'emprunt |
| `charges_locatives` | menage | MONTH | Float | housing.charges | Charges locatives |
| `statut_occupation_logement` | menage | MONTH | String (enum) | housing.status | Statut d'occupation du logement |
| `depcom` | menage | MONTH | String | territory | Code INSEE commune |

### Output Variables
| Variable | Entity | Type | Code in response | Description (OpenFisca) |
|----------|--------|------|-----------------|------------------------|
| `rsa` | famille | Float | `rsa` | Revenu de solidarité active |
| `ppa` | famille | Float | `prime_activite` | Prime Pour l'Activité |
| `apl` | famille | Float | `apl` | Aide personnalisée au logement |
| `aide_logement` | famille | Float | `aide_logement` | Aide au logement (tout type) = APL + ALS + ALF |

> ⚠️ **`ppa` NOT `prime_activite`** — OpenFisca uses `ppa` internally for Prime d'activité.

## Enum Mappings

### `activite` (OpenFisca)
| Wizard value | OpenFisca value | Label |
|-------------|-----------------|-------|
| `emploi` | `actif` | Actif occupé |
| `chomage` | `chomeur` | Chômeur |
| `etudiant` | `etudiant` | Étudiant |
| `retraite` | `retraite` | Retraité |
| `hebergement` | `inactif` | Autre, inactif |

### `statut_occupation_logement` (OpenFisca)
| Wizard value | OpenFisca value | OpenFisca Label |
|-------------|-----------------|-----------------|
| `tenant` | `locataire_vide` | Locataire ou sous-locataire d'un logement loué vide non-HLM |
| `tenant_hlm` | `locataire_hlm` | Locataire d'un logement HLM |
| `tenant_furnished` | `locataire_meuble` | Locataire d'un logement loué meublé |
| `owner` | `proprietaire` | Propriétaire (non accédant) du logement |
| `free` | `loge_gratuitement` | Logé gratuitement |
| `homeless` | `sans_domicile` | Sans domicile stable |
| _(other)_ | `non_renseigne` | Non renseigné |

> **Additional OpenFisca values** not mapped by the wizard: `locataire_foyer`, `primo_accedant`.

## Local Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/diagnostic \
  -H "Content-Type: application/json" \
  -d '{"answers":{"birthDate":"1992-06-15","statut":"chomage","territory":"67000","income":{"salary":0,"unemployment":0},"housing":{"rent":520,"charges":50,"status":"tenant"}}}'

# Run unit tests
npm test -- --testPathPattern=openfisca

# Verify a specific variable exists in OpenFisca
curl -s "https://api.fr.openfisca.org/latest/variable/ppa" | jq '{id, entity, definitionPeriod, valueType}'

# Test trace endpoint (requires ADMIN_TOKEN)
ADMIN_TOKEN="<your-admin-token>" curl -X POST http://localhost:3000/api/diagnostic/trace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"answers":{"birthDate":"1992-06-15","housing":{"status":"tenant"}}}'
```

## Architecture

```
Wizard (frontend)
  └── StepDiagnostic → POST /api/diagnostic
                          ├── buildTestCase()  → OpenFisca JSON
                          ├── openfiscaClient.calculate()
                          └── parseResults() → normalized rights[]
  └── DiagnosticResults → renders eligibility cards + FALC toggle
  └── DiagnosticTraceModal → POST /api/diagnostic/trace (pro only)
```

## Rate Limiting

`DIAGNOSTIC` action: 30 requests/minute per IP.

## FALC Explanations

Each right includes structured FALC (Facile à Lire et à Comprendre) text with:
- **📋 Résumé** — one simple sentence
- **👤 Pour qui ?** — eligibility conditions in simple terms
- **💶 Ce que ça apporte** — what the benefit provides
- **📝 Comment faire ?** — numbered action steps (3–5 steps)
- **📎 Documents nécessaires** — required documents list
- **🔗 Liens officiels** — official service-public.fr and CAF links

Toggle between standard and FALC explanations via the 📖 button on each result card.
