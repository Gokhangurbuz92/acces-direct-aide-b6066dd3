# RUNBOOK — OpenFisca Legislative Engine Integration

## Overview

The diagnostic system uses [OpenFisca France](https://fr.openfisca.org/) to compute social rights (RSA, Prime d'activité, APL) based on the user's financial situation. The calculation is performed server-side via `POST /api/diagnostic`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENFISCA_BASE_URL` | `https://api.fr.openfisca.org/latest` | OpenFisca API endpoint |
| `OPENFISCA_TIMEOUT_MS` | `4000` | Request timeout in milliseconds |
| `OPENFISCA_ENABLE_TRACE` | `false` | Enable `/trace` endpoint (pro/admin only) |

> **Production**: For stability, deploy a pinned OpenFisca Docker instance and set `OPENFISCA_BASE_URL` accordingly.

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

### Input Variables
| Variable | Entity | Period | Type | Wizard Field |
|----------|--------|--------|------|-------------|
| `date_naissance` | individu | ETERNITY | Date | birthDate |
| `activite` | individu | MONTH | Enum | statut (emploi→actif, chomage→chomeur, etc.) |
| `salaire_net` | individu | MONTH | Float | income.salary |
| `chomage_net` | individu | MONTH | Float | income.unemployment |
| `loyer` | menage | MONTH | Float | housing.rent |
| `charges_locatives` | menage | MONTH | Float | housing.charges |
| `statut_occupation_logement` | menage | MONTH | Enum | housing.status |
| `depcom` | menage | MONTH | String | territory (code INSEE) |

### Output Variables
| Variable | Entity | Label | Code in response |
|----------|--------|-------|-----------------|
| `rsa` | famille | RSA | `rsa` |
| `ppa` | famille | Prime d'activité | `prime_activite` |
| `apl` | famille | APL | `apl` |
| `aide_logement` | famille | Aide au logement | `aide_logement` |

> ⚠️ **`ppa` NOT `prime_activite`** — OpenFisca uses `ppa` internally for Prime d'activité.

## Enum Mappings

### `activite` (OpenFisca)
| Wizard value | OpenFisca value | Label |
|-------------|-----------------|-------|
| `emploi` | `actif` | Actif occupé |
| `chomage` | `chomeur` | Chômeur |
| `etudiant` | `etudiant` | Étudiant |
| `retraite` | `retraite` | Retraité |
| `hebergement` | `inactif` | Inactif |

### `statut_occupation_logement` (OpenFisca)
| Wizard value | OpenFisca value |
|-------------|-----------------|
| `tenant` | `locataire_vide` |
| `tenant_hlm` | `locataire_hlm` |
| `tenant_furnished` | `locataire_meuble` |
| `owner` | `proprietaire` |
| `free` | `loge_gratuitement` |
| `homeless` | `sans_domicile` |

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

`DIAGNOSTIC` action: 10 requests/minute per IP.
