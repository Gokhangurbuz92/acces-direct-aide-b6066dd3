# Guide d'Ingestion de Données

Ce document décrit comment ajouter de nouvelles sources de données et exécuter le pipeline d'ingestion.

## Architecture

L'ingestion repose sur une architecture modulaire :
1. **Pipeline (`api/ingest/Pipeline.js`)** : Gère la logique commune (Idempotence, Audit, Upsert DB).
2. **Connecteurs (`api/ingest/connectors/`)** : Stratégies spécifiques pour récupérer et normaliser les données depuis une source.
3. **Politique (`api/ingest/Policy.js`)** : Définit les règles (API vs Scrape).

## Ajouter une Nouvelle Source

1. **Créer un Connecteur**
   Créez un nouveau fichier dans `api/ingest/connectors/`, ex: `MaSourceConnector.js`.
   Il doit étendre `BaseConnector`.

   ```javascript
   import BaseConnector from './BaseConnector.js';
   import { IngestionMode } from '../Policy.js';

   export default class MaSourceConnector extends BaseConnector {
       constructor() {
           super({
               name: 'MA_SOURCE_UNIQUE',
               mode: IngestionMode.API // ou SCRAPE
           });
       }

       async fetchItems() {
           // Récupérer les données (fetch, axios, parsing XML...)
           // Retourner un tableau d'objets standardisés :
           return [{
               entityType: 'Aide', // Ou Structure, Dispositif...
               data: {
                   slug: 'mon-slug-unique',
                   titre: 'Titre',
                   // ... champs du modèle Prisma ...
                   source_url_exact: 'https://...',
                   territory_scope: 'NATIONAL'
               },
               rawContent: '...' // Pour l'audit et FALC
           }];
       }
   }
   ```

2. **Enregistrer le Connecteur**
   Ajoutez votre connecteur dans `api/_handlers/cron/pipeline.js` :

   ```javascript
   import MaSourceConnector from '../../ingest/connectors/MaSourceConnector.js';

   // ... dans la fonction handler
   const maSrc = new MaSourceConnector();
   await new Pipeline(maSrc.getName(), maSrc).run();
   ```

## Exécuter le Pipeline

### En Local
```bash
# Via cURL (assurez-vous que le serveur tourne sur localhost:3000)
curl "http://localhost:3000/api/cron/pipeline?secret=VOTRE_CRON_SECRET"
```

### En Production
Le pipeline est exécuté automatiquement via Cron (Vercel Cron Jobs).
Vous pouvez aussi le déclencher manuellement via l'interface Vercel ou un appel API sécurisé.

## Vérification (Audit)
Chaque exécution :
- Crée/Met à jour les entités (`Aide`, `Structure`...).
- Crée une entrée `SourceSnapshot` pour prouver l'état de la donnée à l'instant T.
- Loggue le résultat dans `ImportLog`.

## FALC & Enrichissement
Le champ `raw_excerpt` stocké dans `SourceSnapshot` peut être utilisé par des tâches d'arrière-plan pour générer des résumés FALC via LLM.
