# Guide Administrateur (Back-Office)

Ce document est destiné aux administrateurs de la plateforme AccesDirectAide.
Il décrit les procédures de gestion de contenu, d'utilisateurs et de surveillance.

## 1. Accès et Authentification

L'interface d'administration est accessible sur `/admin`.
- **URL** : `https://acces-direct-aide.fr/admin` (ou `/admin/login`)
- **Identifiants** : Un email/mot de passe administrateur est requis.
- **Sécurité** : L'accès est protégé par le `ADMIN_TOKEN` en backend, mais l'interface utilise une session utilisateur standard.

Pour créer un premier administrateur, voir le `README.md` (script `scripts/create-admin.js`).

## 2. Gestion des Contenus

### 2.1 Aides & Dispositifs
- **Listing** : `/admin/aides`. Permet de filtrer par titre, statut (brouillon/publié).
- **Édition** : Modification des champs titre, résumé, critères d'éligibilité.
- **FALC** : Le champ "Résumé Facile à Lire" est critique pour l'accessibilité. Il doit être rédigé selon les règles FALC (voir `docs/FALC_GUIDE.md`).

### 2.2 Démarches
- **Listing** : `/admin/demarches`.
- **Workflow** : Les démarches peuvent être liées à des guides pas-à-pas.

### 2.3 Actualités (Flux RSS)
Les actualités sont souvent importées automatiquement via des flux RSS (CAF, Service-Public).
- **Statut "En Revue"** : Les nouvelles actualités importées nécessitent une validation manuelle.
- **Action requise** :
  1. Aller dans `/admin/inbox` ou filtrer les actus.
  2. Vérifier la pertinence.
  3. Corriger le résumé FALC généré (si IA activée).
  4. Publier ou Supprimer.

### 2.4 Structures (Annuaire)
- **Listing** : `/admin/structures`.
- **Import** : L'import massif se fait via script (voir `scripts/import-structures-*.js`).
- **Édition** : Modification des horaires, coordonnées, services proposés.

## 3. Gestion des Utilisateurs

### Professionnels
Les professionnels accèdent à `/pro`.
- **Invitation** : Depuis la fiche d'une structure dans l'admin, onglet "Utilisateurs".
- **Validation** : Les inscriptions spontanées peuvent nécessiter une validation (selon config).

## 4. Maintenance & Surveillance

### Tâches Automatisées (Crons)
Les tâches de fond (import RSS, nettoyage) sont gérées par Vercel Cron.
Pour vérifier leur exécution :
1. Allez sur le dashboard Vercel du projet.
2. Onglet **Settings** > **Cron Jobs**.
3. Vous verrez l'historique des exécutions.

### Problèmes Courants
- **Erreur 500** : Consulter le `docs/RUNBOOK.md` pour les procédures de diagnostic.
- **Lenteurs** : Vérifier les logs de performance ou l'état de la base de données Neon.

## 5. Support

Pour toute question technique non couverte ici, contactez l'équipe de développement ou consultez la documentation technique dans `docs/`.
