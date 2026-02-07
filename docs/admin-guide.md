# Guide Administrateur

## Accès au Back-Office
L'interface d'administration est accessible sur `/admin`.
Connectez-vous avec vos identifiants administrateur.

## Gestion des Contenus

### Validation des Actualités (Flux RSS)
Les actualités importées automatiquement apparaissent avec le statut **En Revue**.
1. Allez dans l'onglet "Actualités".
2. Filtrez par statut "En Revue".
3. Cliquez sur "Éditer".
4. Vérifiez le résumé FALC (champ "Résumé Facile à Lire").
5. Si tout est correct, changez le statut en **Publié**.

### Ajout de Guides / Outils
1. Cliquez sur "Ajouter".
2. Remplissez le titre et le contenu.
3. **Obligatoire** : Remplissez le champ "Résumé FALC".
4. Sélectionnez les publics et catégories.

## Tâches Automatisées (Cron)
Les tâches de fond (import RSS, nettoyage) sont gérées par Vercel Cron.
Pour vérifier leur exécution :
1. Allez sur le dashboard Vercel du projet.
2. Onglet **Settings** > **Cron Jobs**.
3. Vous verrez l'historique des exécutions de `/api/cron/ingest-rss`.

## Gestion des Utilisateurs
- Pour inviter un professionnel : Allez dans "Structures", sélectionnez la structure, et utilisez l'onglet "Utilisateurs" pour envoyer une invitation.
- Pour créer un autre administrateur : (Fonctionnalité technique pour l'instant via script, voir `scripts/create-admin.js`).
