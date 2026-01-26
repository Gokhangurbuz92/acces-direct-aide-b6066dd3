# Stratégie de Recherche (Search Strategy)

## Choix Technique : Option B (Postgres Full-Text Search)

Pour répondre aux besoins de performance, de simplicité et de fonctionnalités (recherche insensible aux accents, classement par pertinence), nous avons opté pour l'utilisation native des capacités de recherche textuelle de PostgreSQL (`tsvector`, `tsquery`) via l'extension `unaccent`.

### Justification
- **Performance** : Les colonnes `search_vector` sont pré-calculées (`GENERATED ALWAYS AS ... STORED`) et indexées avec GIN, ce qui garantit des recherches très rapides même sur de gros volumes.
- **Fonctionnalités** : La combinaison `unaccent` + dictionnaire `french` permet de gérer :
  - Les accents (é = e)
  - Le stemming (racinisation : chevaux = cheval)
  - Les stop-words (le, la, de...)
- **Infrastructure** : Cette solution est compatible avec Neon (Serverless Postgres) qui supporte les extensions standards comme `unaccent`.

### Implémentation
1. **Normalisation** : Une colonne `search_vector` (type `tsvector`) est ajoutée aux tables `Aide`, `Structure`, `Demarche`.
2. **Indexation** : Un index GIN est posé sur cette colonne.
3. **Requêtage** :
   - L'API construit une requête SQL brute (`$queryRaw`) pour utiliser l'opérateur `@@`.
   - Les filtres (catégorie, géographie) sont intégrés dans la clause `WHERE` pour permettre la combinaison "Mots-clés + Filtres".
   - Le classement (`ORDER BY`) utilise `ts_rank_cd` pour faire remonter les résultats les plus pertinents.

### Limitations & Fallbacks
- **Dépendance `unaccent`** : L'extension doit être activée (`CREATE EXTENSION IF NOT EXISTS unaccent`). Une migration dédiée assure sa présence.
- **Syntaxe** : Nous utilisons `plainto_tsquery` (ou `websearch_to_tsquery`) pour transformer l'entrée utilisateur en requête valide, évitant les erreurs de syntaxe SQL.

### Alternatives considérées
- **Option A (Champs normalisés JS)** : Rejetée car moins performante pour le classement (ranking) et nécessitant de réimplémenter la logique de stemming/stop-words côté applicatif.
- **Option C (Trigrammes)** : Utile pour le "fuzzy search" (fautes de frappe), mais plus coûteux en stockage et performance pour la recherche sémantique de base. Pourrait être ajouté en complément futur.
