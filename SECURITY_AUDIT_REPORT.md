# Rapport d'Audit de Sécurité et Correctifs

## Contexte
Audit de l'API serverless AccesDirectAide pour identifier et corriger les vulnérabilités liées à l'exposition de routes, au scraping et aux configurations de sécurité (CORS/CSP).

## Risques Identifiés

1.  **Exposition de routes sensibles**
    - **Problème** : Une logique de débogage dans `api/index.js` permettait de révéler le chemin interne via le paramètre `?debug=1`.
    - **Impact** : Fuite d'informations sur la structure interne de l'API.
    - **Correction** : Suppression du bloc conditionnel de débogage.

2.  **Absence de Rate Limiting sur endpoints coûteux**
    - **Problème** : Les endpoints de recherche (`/api/aides`, `/api/structures`) et de taxonomie (`/api/taxonomy`) n'avaient aucune limitation de débit.
    - **Impact** : Risque de scraping intensif, déni de service (DoS) et surcoût d'infrastructure.
    - **Correction** : Implémentation de limites spécifiques :
        - Recherche Aides & Structures : 30 requêtes/min.
        - Taxonomie : 60 requêtes/min.

3.  **Pagination non bornée**
    - **Problème** : Le paramètre `pageSize` n'était pas plafonné, permettant de demander un nombre arbitraire d'éléments.
    - **Impact** : DoS par épuisement de la mémoire ou CPU de la base de données.
    - **Correction** : Plafonnement strict de `pageSize` à 100 éléments maximum.

4.  **Configuration CSP permissive**
    - **Problème** : La directive `script-src` incluait `'unsafe-eval'`.
    - **Impact** : Risque accru d'attaques XSS.
    - **Correction** : Suppression de `'unsafe-eval'` dans `vercel.json`.

## Vérification

Un script de test automatisé (`scripts/security-check.js`) a été créé pour valider les correctifs.

### Résultats des tests :
- **Debug Route** : Le paramètre `debug=1` est ignoré.
- **Rate Limit** :
    - `/api/aides` bloque après 30 requêtes.
    - `/api/taxonomy` bloque après 60 requêtes.
- **Pagination** : Le code force `Math.min(pageSize, 100)`.

## État Final
- Toutes les routes sensibles identifiées sont sécurisées ou nettoyées.
- Les mécanismes de protection contre le scraping sont actifs.
- La configuration CSP est durcie.
