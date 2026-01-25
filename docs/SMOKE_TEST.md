# Smoke Tests - Vérification Production

Ce document liste les commandes et vérifications à effectuer pour valider le déploiement.

## 1. Santé Globale
Vérifier que l'API répond et que la DB est accessible.
```bash
curl -I https://www.accesdirectaide.fr/api/health
# Doit retourner HTTP 200
```

## 2. Pipeline d'Ingestion (Cron)
Tester l'authentification hybride et l'exécution.

**Test 1 : Query Param (Legacy)**
```bash
curl "https://www.accesdirectaide.fr/api/cron/pipeline?secret=${CRON_SECRET}"
```
*Attendu : JSON avec stats (`total_created`, `runs`...)*

**Test 2 : Bearer Token (Standard)**
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" "https://www.accesdirectaide.fr/api/cron/pipeline"
```
*Attendu : JSON avec stats identiques.*

## 3. Navigation & Frontend
Vérifier manuellement ou via script Playwright :

1. **Accueil** : Charger la racine `/`.
2. **Recherche** : Taper "logement" dans la barre de recherche.
3. **Fiche Aide** : Cliquer sur une aide -> Vérifier que l'URL change (`/aides/slug`) et que le contenu s'affiche.
4. **Dispositifs** : Aller sur `/dispositifs` -> Cliquer sur un dispositif -> Vérifier le détail.
5. **404** : Aller sur `/dispositifs/inexistant` -> Vérifier que la page 404 s'affiche avec le header/footer.

## 4. Base de Données (Admin)
Si accès possible :
- Vérifier la table `SourceSnapshot` : Doit contenir des entrées récentes après un run du pipeline.
- Vérifier la table `ImportLog` : Doit contenir les logs de succès/erreur.
