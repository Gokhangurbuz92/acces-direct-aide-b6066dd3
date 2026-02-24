# Runbook — Open Data Integration

Ce document décrit les sources Open Data intégrées à AccesDirectAide, les crons planifiés, et les commandes d'exploitation.

## Sources intégrées

| Source | Type | Fréquence | Endpoint cron | Données |
|--------|------|-----------|---------------|---------|
| **Aides Territoires** | API REST | Quotidien (3h) | `/api/cron/ingest-aids` | ~3000 aides publiées |
| **Grand Est** | Web scraping | Quotidien (3h) | `/api/cron/ingest-aids` | Aides régionales |
| **Agefiph** | Web scraping | Quotidien (3h) | `/api/cron/ingest-aids` | Aides handicap emploi |
| **DREES** | Données curées | Quotidien (3h) | `/api/cron/ingest-aids` | APA, PCH, ASH, AAH, ASPA |
| **Service-Public.fr** | Données curées | Hebdo (lundi 4h) | `/api/cron/ingest-demarches` | 12 démarches clés |
| **RSS Actualités** | RSS/Atom | Toutes les 6h | `/api/cron/actualites` | Actualités nationales/locales |
| **Structures** | Open Data | Hebdo (dimanche 2h) | `/api/cron/ingest-structures` | Annuaire (Strasbourg etc.) |

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `CRON_SECRET` | ✅ | Secret partagé pour authentifier les appels cron |
| `DATABASE_URL` | ✅ | URL de connexion PostgreSQL (pooling) |
| `POSTGRES_URL_NON_POOLING` | ✅ | URL directe (migrations) |

> **Note** : L'API Aides Territoires est publique — aucun token nécessaire pour la lecture.

## Commandes manuelles

```bash
# Lancer manuellement l'ingestion des aides (avec limite)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-aids?limit=10"

# Lancer manuellement l'ingestion des démarches
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-demarches"

# Vérifier le dernier run
SELECT * FROM "ImportLog" ORDER BY "createdAt" DESC LIMIT 5;

# Vérifier les aides importées par source
SELECT "providerName", COUNT(*) FROM "Aide"
WHERE "statut" = 'publie' GROUP BY "providerName";
```

## Architecture de données

```
vercel.json (crons)
    │
    ├── /api/cron/ingest-aids → ingest-aids.js
    │       ├── GrandEstConnector
    │       ├── AgefiphConnector
    │       ├── AidesTerritoiresConnector  ← NOUVEAU
    │       └── DreesConnector             ← NOUVEAU
    │
    ├── /api/cron/ingest-demarches → ingest-demarches.js  ← NOUVEAU
    │
    ├── /api/cron/ingest-structures → ingest-structures.js
    │
    └── /api/cron/actualites → ingest-actualites-rss.js
```

## Monitoring

- **ImportLog** : chaque run écrit une entrée avec `source_name`, `status`, `items_new`, `items_updated`, `error_count`
- **CronRun** : traçabilité des exécutions cron (durée, statut, erreurs)
- **Sentry** : les erreurs d'ingestion sont remontées avec contexte (connector, runId, stage)

## Idempotence

Toutes les ingestions sont **idempotentes** :
- Détection par `content_hash` : si le contenu n'a pas changé, l'item est ignoré
- Détection par `slug` ou `lien_officiel` : pas de doublon
- Les updates ne touchent que les items dont le hash a changé
