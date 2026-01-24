# Release Gate Checklist

Ce document définit la checklist obligatoire avant toute mise en production (Release Gate).

## 1. Release Gate Checklist (Obligatoire)

Avant de tagger et d'annoncer une release, vérifier les points suivants sur l'environnement de production (ou pré-production fidèle).

### Domaines & SEO
- [ ] **Domaine canonique OK** : `https://www.accesdirectaide.fr` est accessible.
    - `http://accesdirectaide.fr` redirige vers `https://www.accesdirectaide.fr` (301/308).
    - `https://accesdirectaide.fr` redirige vers `https://www.accesdirectaide.fr` (301/308).
- [ ] **robots.txt OK** : Accessible à `/robots.txt`.
    - Contient `Sitemap: https://www.accesdirectaide.fr/sitemap.xml`.
    - Pas de règle `Disallow: /` pour les bots de recherche (sauf si intentionnel sur tout le site).
- [ ] **sitemap.xml OK** : Accessible à `/sitemap.xml`.
    - Contient des URLs canoniques (pas de URLs de staging ou vercel.app).
    - Les dates `lastmod` sont présentes si prévu.
- [ ] **Prod indexable** :
    - Vérifier l'absence de header `x-robots-tag: noindex` sur les pages principales.
    - Vérifier l'absence de meta tag `<meta name="robots" content="noindex" ...>` dans le HTML.

### Fonctionnel & Technique
- [ ] **Endpoints critiques OK** : Les pages suivantes répondent en 200 OK :
    - `/` (Accueil)
    - `/aides` (Recherche)
    - `/demarches`
    - `/annuaire`
    - `/actualites`
- [ ] **API Version OK** :
    - `/api/version` répond en 200 OK et retourne le JSON avec le commit attendu.
    - Header `x-release-sha` présent sur les réponses API/Document.
- [ ] **Sentry Release OK** :
    - La release est créée dans Sentry et associée au commit.
    - Pas de pic d'erreurs immédiat après déploiement.
