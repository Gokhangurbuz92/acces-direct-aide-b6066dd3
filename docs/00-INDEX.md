# 00 - INDEX CP0 (Cartographie)

Ce dossier contient la cartographie du projet `AccesDirectAide` (Stabilisation V1).

## Documents CP0

| Fichier | Description | Données Source |
| :--- | :--- | :--- |
| [01-repo-map-as-is.md](./01-repo-map-as-is.md) | **AS-IS Cartographie**. L'état actuel du dépôt, ses dossiers, routes, et risques identifiés. | `tree`, `grep`, code audit |
| [02-target-map-from-blueprint.md](./02-target-map-from-blueprint.md) | **TARGET Cartographie**. L'architecture cible définie par le Blueprint NotebookLM. | Blueprint NotebookLM |
| [03-delta-plan.md](./03-delta-plan.md) | **DELTA & Plan**. Analyse d'écart entre AS-IS et TARGET, priorisation des actions. | AS-IS vs TARGET |

## Preuves (Archivées)

Les fichiers bruts ayant servi à l'analyse sont archivés dans `/release/v1.0.0/proofs/00-mapping/` :

- `repo-tree.txt` : Arborescence complète (hors node_modules)
- `routes-front.txt` : Extraction des `<Route>` React
- `endpoints-api.txt` : Liste des fichiers handlers API
- `env-usage.txt` : Occurrences des variables d'environnement (`process.env`, `import.meta.env`)

## Liens Utiles

- [REPO_MAP.md](./REPO_MAP.md) (Ancienne cartographie, référence)
- [API_CONTRACT.md](./API_CONTRACT.md) (Contrat d'interface)
