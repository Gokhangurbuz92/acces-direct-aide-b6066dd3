# Guide d'Ingestion des Aides

## Vue d'ensemble

Le système d'ingestion permet de collecter automatiquement des aides depuis des sources externes (sites web officiels, APIs) et de les intégrer dans la base de données AccesDirectAide.

## Architecture

### Composants

1. **Connecteurs** (`/api/lib/connectors/`)
   - Classes qui implémentent l'interface `BaseConnector`
   - Chaque connecteur est responsable d'une source spécifique
   - Gèrent le fetch, parsing, et mapping des données

2. **Pipeline** (`/api/lib/ingestion-pipeline.js`)
   - Orchestre l'exécution des connecteurs
   - Gère la déduplication et l'idempotence
   - Log les résultats et erreurs

3. **Cron Handler** (`/api/_handlers/cron/ingest-aids.js`)
   - Point d'entrée HTTP pour déclencher l'ingestion
   - Authentification via `CRON_SECRET`

## Connecteurs Disponibles

### Région Grand Est
- **Source**: https://www.grandest.fr/vos-aides/
- **Slug**: `region-grand-est`
- **Type**: Scraping HTML
- **Territoire**: Région Grand Est
- **Organisme**: Région Grand Est

### AGEFIPH
- **Source**: https://www.agefiph.fr/aides-handicap
- **Slug**: `agefiph`
- **Type**: Scraping HTML
- **Territoire**: National
- **Organisme**: AGEFIPH
- **Thème**: Handicap

## Ajouter un Nouveau Connecteur

### 1. Créer la classe du connecteur

Créer un fichier `/api/lib/connectors/mon-connecteur.js`:

```javascript
import { BaseConnector } from './base.js';
import { JSDOM } from 'jsdom';
import slugify from '@sindresorhus/slugify';

export class MonConnecteur extends BaseConnector {
    constructor() {
        super({
            name: 'Mon Organisme',
            domain: 'example.fr',
            rateLimit: 2000 // ms entre requêtes
        });
        this.baseUrl = 'https://www.example.fr';
        this.aidesListUrl = 'https://www.example.fr/aides';
    }

    async fetch() {
        // Récupérer la liste des URLs d'aides
        const items = [];
        // ... logique de fetch
        return items;
    }

    parse(rawItem) {
        // Parser le HTML/JSON en données structurées
        const { url, dom } = rawItem;
        // ... logique de parsing
        return parsedData;
    }

    mapToAide(parsedItem) {
        // Mapper vers le modèle Aide
        return {
            slug: slugify(parsedItem.titre),
            titre: parsedItem.titre,
            cest_quoi: parsedItem.description,
            // ... autres champs
            source_url: parsedItem.source_url,
            organisme: 'Mon Organisme',
            theme: this.inferTheme(parsedItem.titre),
            statut: 'brouillon',
            content_hash: this.generateContentHash(parsedItem)
        };
    }

    getStableId(parsedItem) {
        return this.generateContentHash({
            titre: parsedItem.titre,
            organisme: 'Mon Organisme',
            source_url: parsedItem.source_url
        });
    }
}
```

### 2. Enregistrer le connecteur

Ajouter dans `/api/lib/connectors/index.js`:

```javascript
import { MonConnecteur } from './mon-connecteur.js';

export const connectors = {
    'region-grand-est': RegionGrandEstConnector,
    'agefiph': AgefiphConnector,
    'mon-connecteur': MonConnecteur // Ajouter ici
};
```

### 3. Tester le connecteur

```bash
# Test en dry-run (ne modifie pas la DB)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.accesdirectaide.fr/api/cron/ingest-aids?sources=mon-connecteur&dryRun=true"
```

## Lancer l'Ingestion

### Manuellement (Dev)

```bash
# Toutes les sources
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids"

# Source spécifique
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?sources=region-grand-est"

# Dry run (test sans modification DB)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:5173/api/cron/ingest-aids?dryRun=true"
```

### Via Vercel Cron (Production)

Ajouter dans `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest-aids",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## Déduplication

Le système utilise plusieurs mécanismes pour éviter les doublons:

1. **content_hash**: Hash SHA-256 de (titre + organisme + source_url)
2. **source_url_exact**: URL exacte de la page source
3. **slug**: Slug unique généré depuis le titre

Lors de l'ingestion, le pipeline vérifie si une aide existe déjà avec:
- Même `content_hash` => Skip (contenu identique)
- Même `source_url_exact` => Update si contenu différent
- Même `slug` => Update si contenu différent

## Idempotence

Le pipeline est idempotent: relancer l'ingestion plusieurs fois ne crée pas de doublons.

- Si l'aide existe et le contenu est identique => Skip
- Si l'aide existe et le contenu a changé => Update
- Si l'aide n'existe pas => Create

## Logs et Monitoring

### Logs Structurés

Tous les événements sont loggés avec Pino:

```javascript
logger.info('CONNECTOR_START', { name: 'region-grand-est' });
logger.info('AIDE_CREATED', { id: '...', titre: '...' });
logger.error('CONNECTOR_ERROR', { name: '...', error: '...' });
```

### Table UpdateLog

Chaque run est enregistré dans la table `UpdateLog`:

```sql
SELECT * FROM "UpdateLog" ORDER BY ran_at DESC LIMIT 10;
```

Champs:
- `ran_at`: Date/heure du run
- `status`: success / error / partial
- `items_fetched_count`: Nombre d'items récupérés
- `items_created_count`: Nombre créés
- `items_updated_count`: Nombre mis à jour
- `items_skipped_count`: Nombre skippés
- `errors`: Array des erreurs
- `duration_ms`: Durée totale

### Sentry

Les erreurs critiques sont capturées dans Sentry avec contexte:

```javascript
Sentry.captureException(error, {
    extra: { connector: 'region-grand-est', url: '...' }
});
```

## Taxonomie

Les connecteurs doivent mapper les données vers la taxonomie standard définie dans `/config/taxonomy.json`.

### Thèmes

- `logement`
- `sante`
- `handicap`
- `emploi`
- `famille`
- `budget`
- `mobilite`
- `justice`
- `numerique`
- `etrangers`
- `isolement`
- `lgbtqia`
- `vieillissement`

### Publics

- `handicap`
- `seniors`
- `jeunes`
- `famille`
- `parents-isoles`
- `demandeurs-emploi`
- `travailleurs`
- `etudiants`
- `etrangers`
- `lgbtqia`
- `precaires`
- `tous`

### Territoires

- `national`: France entière
- `grand-est`: Région Grand Est
- `67`: Bas-Rhin
- `68`: Haut-Rhin

## Bonnes Pratiques

### Rate Limiting

Respecter les limites des sites sources:

```javascript
constructor() {
    super({
        rateLimit: 2000 // 2 secondes entre requêtes
    });
}
```

### User-Agent

Utiliser un User-Agent identifiable:

```javascript
this.userAgent = 'AccesDirectAide/1.0 (contact@accesdirectaide.fr)';
```

### Gestion d'Erreurs

Capturer et logger les erreurs sans bloquer le pipeline:

```javascript
try {
    const aide = await this.processItem(item);
} catch (error) {
    logger.error('ITEM_ERROR', { url: item.url, error });
    stats.errors.push({ url: item.url, error: error.message });
    // Continue avec l'item suivant
}
```

### Qualité des Données

- Toujours remplir `source_url` (obligatoire)
- Remplir `apply_url` si disponible
- Générer un `slug` unique
- Mapper vers un `theme` de la taxonomie
- Définir `statut: 'brouillon'` pour review manuelle

## Troubleshooting

### Erreur "search_vector does not exist"

Appliquer la migration:

```bash
npm run db:migrate
```

### Doublons créés

Vérifier que `content_hash` est bien généré:

```javascript
content_hash: this.generateContentHash({
    titre: parsedItem.titre,
    organisme: 'Mon Organisme',
    source_url: parsedItem.source_url
})
```

### Timeout / Rate Limit

Augmenter `rateLimit` dans le connecteur:

```javascript
this.rateLimit = 3000; // 3 secondes
```

### Parsing échoue

Vérifier les sélecteurs CSS avec les DevTools du navigateur sur la page source.

## Roadmap

- [ ] Support API REST (pas seulement scraping)
- [ ] Support pagination automatique
- [ ] Cache des pages HTML pour debug
- [ ] Détection automatique de changements de structure
- [ ] Notifications Slack/Email sur erreurs
- [ ] Dashboard monitoring temps réel
