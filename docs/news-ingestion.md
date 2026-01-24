# Documentation du Pipeline d'Actualités

## Vue d'ensemble
Le système d'actualités assure une veille automatique sur les sources officielles (Service-Public, CAF, Ameli, etc.) et propose un contenu à jour sur le site. En l'absence d'actualités récentes, le frontend bascule automatiquement vers une sélection de guides et démarches populaires.

## Modèle de Données
Le modèle `Actualite` (Prisma) stocke les informations :
- `titre`, `slug`
- `contenu` (HTML traité)
- `resume` (Snippet brut)
- `summary_falc` (Version FALC générée)
- `statut` ('brouillon', 'publie', 'archive')
- `source_url`, `source_nom`
- `tags`, `categorie`
- `date_publication`

## Pipeline d'Ingestion
Le pipeline est exécuté via une tâche CRON Vercel (`api/_handlers/cron/pipeline.js`).

### Étapes
1.  **Chargement de la Configuration** :
    - Lecture du fichier `config/rss-sources.json`.
    - Mise à jour de la table `RssSource` (seed).
2.  **Récupération des Flux (RSS)** :
    - Utilisation de `rss-parser` pour fetcher les flux.
    - Déduplication via Hash MD5 (Titre + Lien).
3.  **Création / Mise à jour** :
    - Création des nouvelles actualités avec `statut: 'brouillon'`.
    - Calcul du score de fiabilité.
4.  **Enrichissement (FALC)** :
    - Génération du résumé FALC pour les nouvelles entrées (via LLM/Service interne).
5.  **Publication Automatique** :
    - Les actualités issues de sources officielles (`OFFICIAL`) avec un score suffisant sont passées automatiquement en `statut: 'publie'`.

## Configuration
Les sources RSS sont définies dans `config/rss-sources.json` :
```json
[
    {
        "name": "Service-Public",
        "url": "...",
        "domain": "service-public.fr",
        "trust_level": "OFFICIAL",
        "category": "general"
    }
]
```

## Frontend (Empty State)
Si aucune actualité publiée n'est disponible (ou si le filtrage ne renvoie rien), le composant `NewsFallback` est affiché.
Il présente :
- Un message informatif.
- Une sélection de **Guides Pratiques** récents.
- Une sélection de **Démarches Administratives** récentes.

Ceci garantit que la page "Actualités" n'est jamais vide.
