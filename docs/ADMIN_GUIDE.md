# Guide d'Administration (Back-office)

## Accès
L'interface d'administration est accessible via :
- URL : `/admin/login`
- Credentials : Définis via les variables d'environnement `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

## Fonctionnalités

### Gestion de Contenu (CRUD)
Le panneau d'administration permet de gérer les types de contenus suivants :
- **Aides** (`/adminaides`)
- **Démarches** (`/admindemarches`)
- **Structures** (`/adminstructures`)
- **Actualités** (`/adminactualites`)

Pour chaque type, vous pouvez :
- **Lister** : Voir tous les éléments, filtrer par statut (Brouillon, Publié).
- **Créer** : Ajouter une nouvelle fiche via le bouton "Créer".
- **Modifier** : Éditer les champs, changer le statut, voir le "Score de Qualité" et le dernier auteur (`updatedBy`).
- **Supprimer** : Retirer une fiche (Action irréversible).

### Import / Export CSV

#### Import
Sur chaque page de liste, un bouton "Import CSV" permet de charger des données en masse.
- Le fichier doit être au format CSV (séparateur virgule).
- Les colonnes doivent correspondre aux noms de champs techniques (ex: `titre`, `description`, `statut`).
- Si une colonne `id` ou `slug` est présente et correspond à un élément existant, l'élément sera **mis à jour**. Sinon, il sera **créé**.

**Format exemple (Aide) :**
```csv
slug,titre,categorie,statut,quality_score
aide-logement-jeune,Aide Logement Jeune,logement,brouillon,80
```

#### Export
Le bouton "Export CSV" génère un fichier contenant **toutes** les données du type sélectionné, triées par date de modification récente.

## Workflow de Publication
1.  **Création** : Par défaut, tout nouvel élément est créé avec le statut `brouillon`.
2.  **Revue** : L'administrateur complète les champs manquants (Score de qualité visible).
3.  **Publication** : Changer le statut à `Publié` dans le formulaire d'édition ou via la liste.
4.  **Archivage** : Passer le statut à `Archivé` (si disponible) ou `Brouillon` pour retirer du site public.

## Tests E2E
Un test de "Smoke" est disponible pour vérifier le parcours critique :
`npx playwright test e2e/admin-smoke.spec.js`
Ce test simule : Login -> Création Brouillon -> Publication -> Vérification.
