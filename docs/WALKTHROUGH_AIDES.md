# Documentation : Catalogue d'Aides & Annuaire

Cette documentation détaille l'implémentation du catalogue d'aides sociales, de l'annuaire des structures et du pipeline d'ingestion automatisé.

## 1. Schéma de Données (Prisma)

Le modèle `Aide` a été enrichi pour supporter une taxonomie robuste.

### Nouveaux Modèles :
- **AidCategory** : Catégories d'aides (Logement, Santé, etc.)
- **LifeSituation** : Situations de vie (Étudiant, Senior, Chômage, etc.)
- **AidSource** : Tracking des sources d'ingestion.

### Relations :
- `Aide` belongsTo `AidCategory`
- `Aide` belongsToMany `LifeSituation`

## 2. API Endpoints

### Catalogue (`/api/aides`)
Supporte le filtrage multicritère et la recherche pondérée.
- `q` : Recherche textuelle (Titre > Tags > Résumé).
- `category` : Filtre par slug de catégorie.
- `situation` : Filtre par slug de situation de vie.
- `geo` : Code territoire (ex: 67, FR-GES).

### Taxonomie (`/api/taxonomy`)
Retourne l'arbre des catégories et situations avec les compteurs d'items publiés.

### Annuaire (`/api/structures`)
Recherche et filtrage des structures (associations, services publics).

## 3. Ingestion & Automatisation

### Starter Pack
Un jeu de **260 aides initiales** a été généré et injecté en base de données pour garantir que le site soit immédiatement opérationnel.
- Commande : `npx tsx scripts/seed-aids.ts`

### Pipeline (`/api/cron/pipeline`)
Un pipeline unifié déclenche maintenant :
1. L'ingestion des structures locales (Strasbourg/Alsace).
2. L'ingestion des aides via l'API nationale.
3. L'ingestion et l'enrichissement FALC des actualités.

## 4. Interface Utilisateur

### Améliorations :
- **Aides.jsx** : Refonte totale avec barre de filtres latérale, recherche dynamique et gestion des états vides (EmptyState).
- **Annuaire.jsx** : Filtres par type et ville, pagination serveur.
- **Dynamic Routes** : Support des URLs SEO `/categories/:slug` et `/situations/:slug`.

## 5. Commandes Utiles

- **Seed Taxonomy** : `npx tsx scripts/seed-taxonomy.ts`
- **Generate Data** : `npx tsx scripts/generate-aids-json.ts`
- **Seed Data** : `npx tsx scripts/seed-aids.ts`
- **Health Check** : `curl /api/healthz`
