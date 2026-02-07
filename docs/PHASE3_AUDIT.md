# PHASE 3 - AUDIT PORTAIL PUBLIC COMPLET

**Date:** 2026-02-03  
**Objectif:** Audit complet du portail public avant implémentation des améliorations P1

---

## 1. INVENTAIRE PAGES & ROUTES

### Pages Publiques (69 total)
#### Modules Contenu (6 modules principaux)
1. **Aides** ✅
   - Liste: `/aides` (Aides.jsx)
   - Détail: `/aides/:slug` (AideDetail.jsx)
   - SourceTraceability: ✅ Présent
   - Filtres: thème, situation, territoire, public, organisme
   - Pagination: ✅

2. **Démarches** ✅
   - Liste: `/demarches` (Demarches.jsx)
   - Détail: `/demarches/:slug` (DemarcheDetail.jsx)
   - SourceTraceability: ✅ Présent
   - Filtres: recherche, catégorie
   - Pagination: ✅

3. **Structures/Annuaire** ✅
   - Liste: `/annuaire` (Annuaire.jsx)
   - Détail: `/structures/:slug` (StructureDetail.jsx)
   - SourceTraceability: ✅ Présent
   - Filtres: type, département, public, accessibilité PMR
   - Recherche: ✅

4. **Dispositifs** ✅
   - Liste: `/dispositifs` (Dispositifs.jsx)
   - Détail: `/dispositifs/:slug` (DispositifDetail.jsx)
   - SourceTraceability: ✅ Présent
   - Filtres: département, public
   - Pagination: ⚠️ À vérifier

5. **Ressources Accessibilité** ⚠️
   - Liste: `/ressources` (Ressources.jsx)
   - Détail: `/ressources/:slug` (RessourceDetail.jsx)
   - SourceTraceability: ❌ **MANQUANT**
   - Filtres: type
   - Affiche source_url mais pas via composant standard

6. **Actualités** ⚠️
   - Liste: `/actualites` (Actualites.jsx)
   - Détail: `/actualites/:slug` (ActualiteDetail.jsx)
   - SourceTraceability: ❌ **MANQUANT**
   - Filtres: catégorie, type
   - Affiche source_url mais pas via composant standard

#### Modules Secondaires
7. **Guides** (Bonnes Pratiques)
   - Liste: `/bonnes-pratiques` (Guides.jsx)
   - Détail: `/bonnes-pratiques/:slug` (GuideDetail.jsx)

8. **Outils** (Toolbox)
   - Liste: `/outils` (Tools.jsx)
   - Détail: `/outils/:slug` (ToolDetail.jsx)

#### Pages Institutionnelles (13)
- `/` (Home.jsx)
- `/apropos` (APropos.jsx)
- `/accessibilite` (Accessibilite.jsx)
- `/contact` (Contact.jsx)
- `/mentionslegales` (MentionsLegales.jsx)
- `/confidentialite` (Confidentialite.jsx)
- `/cookies` (Cookies.jsx)
- `/notre-mission` (Mission.jsx)
- `/notre-methode` (Method.jsx)
- `/sources` (Sources.jsx)
- `/sources-et-methode` (SourcesMethode.jsx)
- `/securite-et-rgpd` (Security.jsx)
- `/impact` (Impact.jsx)
- `/partenaires` (Partners.jsx)
- `/proposer-une-structure` (SuggestStructure.jsx)

#### Pages Service (Pro/RDV)
- `/pro/*` (ProLayout.jsx + 8 sous-pages)
- `/rdv` (AppointmentRequest.jsx)
- `/messages/:token` (BeneficiaryMessages.jsx)

#### Pages Admin (17)
- `/admin/*` (AdminGuard + 17 pages)

### Routes API (107 total)
- Endpoints publics: ~40
- Endpoints admin: ~30
- Endpoints pro: ~20
- Endpoints cron/sync: ~10
- Utilitaires (health, sitemap, robots): ~7

---

## 2. ÉTAT ACTUEL TRACEABILITY

### ✅ Composant SourceTraceability Existant
**Fichier:** `/src/components/SourceTraceability.jsx`

**Props supportées:**
- `source_url` (requis)
- `retrieved_at` (ou `fetched_at` en fallback)
- `last_checked_at`
- `source_last_modified`

**Affichage:**
- Lien vers source officielle avec icône ExternalLink
- Date de récupération
- Date dernière vérification
- Date dernière modification source

### ✅ Pages avec SourceTraceability (4/6)
1. AideDetail.jsx ✅
2. DemarcheDetail.jsx ✅
3. StructureDetail.jsx ✅
4. DispositifDetail.jsx ✅

### ❌ Pages SANS SourceTraceability (2/6)
1. **ActualiteDetail.jsx** - Affiche `source_url` manuellement
2. **RessourceDetail.jsx** - Affiche `source_url` manuellement

### Champs Manquants à Ajouter
Pour ActualiteDetail et RessourceDetail, il faut:
- Importer le composant SourceTraceability
- Remplacer l'affichage manuel par le composant
- Passer les props: source_url, retrieved_at, last_checked_at, source_last_modified

---

## 3. ÉTAT ACTUEL SEO

### ✅ Sitemap Dynamique
**Fichier:** `/api/_handlers/sitemap.js`

**Contenu:**
- Pages statiques (21 URLs)
- Aides dynamiques (slug + lastmod)
- Démarches dynamiques
- Structures dynamiques
- Dispositifs dynamiques
- Ressources dynamiques
- Guides dynamiques
- Outils dynamiques
- Actualités dynamiques

**Features:**
- ETag pour cache
- Cache-Control: 1h
- X-Robots-Tag selon environnement
- Fallback XML en cas d'erreur

### ✅ Robots.txt
**Fichier:** `/api/_handlers/robots.js`

**Règles Production:**
```
User-agent: *
Disallow: /admin
Disallow: /pro
Disallow: /__dev
Disallow: /api/admin
Disallow: /api/_*
Sitemap: {canonical}/sitemap.xml
```

**Règles Preview/Staging:**
```
User-agent: *
Disallow: /
```

### ⚠️ Canonical Tags
**À vérifier:** Présence sur toutes les pages list/detail

### ⚠️ Open Graph / Twitter Cards
**À vérifier:** Metas OG/Twitter sur pages détail

### ⚠️ JSON-LD Structured Data
**Fichier existant:** `/src/utils/schema.js`

**Schemas disponibles:**
- `generateBreadcrumbSchema`
- `generateAideSchema`
- `generateDemarcheSchema`
- `generateStructureSchema`
- `generateActualiteSchema`

**À vérifier:** Utilisation effective sur toutes pages détail

---

## 4. ÉTAT ACTUEL ACCESSIBILITÉ

### ✅ Composant AccessibilityToolbar
**Fichier:** `/src/components/ui/AccessibilityToolbar.jsx`
- Présent dans Layout.jsx
- Permet ajustement taille texte, contraste

### ⚠️ À Auditer
1. **Navigation clavier**
   - Menus déroulants
   - Filtres
   - Pagination
   - Boutons d'action

2. **Focus visible**
   - Tous les éléments interactifs
   - Ordre de tabulation logique

3. **ARIA labels**
   - Icônes sans texte
   - Boutons avec icônes seules
   - Champs de formulaire

4. **Structure titres**
   - H1 unique par page
   - Hiérarchie H2/H3 logique

5. **Contraste couleurs**
   - Texte sur fond
   - Liens
   - Boutons

---

## 5. ÉTAT ACTUEL FALC

### ✅ Champ `summary_falc` dans DB
**Modèles Prisma avec FALC:**
- Aide
- Demarche
- Structure
- Dispositif
- ResourceAccessibility
- Guide
- ToolboxItem

### ⚠️ Affichage FALC sur Pages
**À vérifier sur chaque page détail:**
1. Affichage conditionnel si `summary_falc` présent
2. Label clair "Résumé simplifié" ou "Version Facile à Lire"
3. Avertissement: "Ne remplace pas la source officielle"
4. Lien vers source officielle
5. Fallback propre si absent

---

## 6. ÉTAT ACTUEL FILTRES & PAGINATION

### Aides.jsx
**Filtres:**
- `q` (recherche)
- `theme` / `category` / `categorie`
- `situation`
- `territoire` / `geo`
- `public`
- `organisme`

**Pagination:** ✅ Implémentée
**URL stable:** ✅ Query params

### Demarches.jsx
**Filtres:**
- `q` (recherche)
- `categorie`

**Pagination:** ✅ Implémentée
**URL stable:** ✅ Query params

### Annuaire.jsx (Structures)
**Filtres:**
- `q` (recherche)
- `type`
- `departement`
- `public`
- `pmr` (accessibilité)

**Pagination:** ⚠️ À vérifier
**URL stable:** ✅ Query params

### Dispositifs.jsx
**Filtres:**
- `departement`
- `public`

**Pagination:** ❌ Pas visible dans le code
**URL stable:** ⚠️ À vérifier

### Ressources.jsx
**Filtres:**
- `type`

**Pagination:** ❌ Pas visible
**URL stable:** ⚠️ À vérifier

### Actualites.jsx
**Filtres:**
- `categorie`
- `type`

**Pagination:** ⚠️ À vérifier
**URL stable:** ✅ Query params

---

## 7. PRIORITÉS PHASE 3

### P1 - CRITIQUE (Bloquant DoD P1)
1. ✅ **Ajouter SourceTraceability sur ActualiteDetail**
2. ✅ **Ajouter SourceTraceability sur RessourceDetail**
3. ⚠️ **Vérifier canonical tags partout**
4. ⚠️ **Vérifier OG/Twitter metas**
5. ⚠️ **Vérifier JSON-LD sur toutes pages détail**

### P2 - IMPORTANT
6. ⚠️ **Audit accessibilité clavier complet**
7. ⚠️ **Vérifier focus visible partout**
8. ⚠️ **Audit ARIA labels**
9. ⚠️ **Vérifier affichage FALC sur toutes pages**

### P3 - AMÉLIORATION
10. ⚠️ **Ajouter pagination manquante (Dispositifs, Ressources)**
11. ⚠️ **Standardiser filtres (UI cohérente)**
12. ⚠️ **Tests E2E navigation list->detail**

---

## 8. CHECKLIST DoD P1 (État Actuel)

- [ ] P1-01 Aides: list+detail+filtres+paging+SEO+traceability OK
  - ✅ List + Detail
  - ✅ Filtres complets
  - ✅ Pagination
  - ✅ SourceTraceability
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-02 Démarches: list+detail+filtres+paging+SEO+traceability OK
  - ✅ List + Detail
  - ✅ Filtres
  - ✅ Pagination
  - ✅ SourceTraceability
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-03 Structures: list+detail+recherche+filtres+SEO+traceability OK
  - ✅ List + Detail
  - ✅ Recherche
  - ✅ Filtres complets
  - ⚠️ Pagination à vérifier
  - ✅ SourceTraceability
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-04 Dispositifs: list+detail+filtres+paging+SEO+traceability OK
  - ✅ List + Detail
  - ✅ Filtres
  - ❌ Pagination manquante
  - ✅ SourceTraceability
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-05 Ressources: list+detail+catégories+SEO+traceability OK
  - ✅ List + Detail
  - ✅ Filtres (type)
  - ❌ Pagination manquante
  - ❌ SourceTraceability manquant
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-06 Actualités: list+detail+sources+SEO OK
  - ✅ List + Detail
  - ✅ Filtres
  - ⚠️ Pagination à vérifier
  - ❌ SourceTraceability manquant
  - ⚠️ SEO (canonical/OG/JSON-LD à vérifier)

- [ ] P1-07 SourceTraceability présent partout + fallback safe
  - ✅ 4/6 modules (Aides, Démarches, Structures, Dispositifs)
  - ❌ 2/6 manquants (Actualités, Ressources)

- [ ] P1-08 Sitemap/robots/canonical validés
  - ✅ Sitemap dynamique complet
  - ✅ Robots.txt avec règles prod/preview
  - ⚠️ Canonical à vérifier sur pages

- [ ] P1-09 A11y base validée (clavier + focus + aria)
  - ⚠️ Audit complet à faire

- [ ] P1-10 FALC affiché proprement
  - ⚠️ Vérification sur toutes pages détail à faire

---

## 9. PLAN D'ACTION IMMÉDIAT

### Étape 1: SourceTraceability (30 min)
1. Ajouter sur ActualiteDetail.jsx
2. Ajouter sur RessourceDetail.jsx
3. Tester affichage

### Étape 2: SEO Complet (1h)
1. Vérifier composant SEO sur toutes pages
2. Ajouter canonical si manquant
3. Vérifier OG/Twitter metas
4. Vérifier JSON-LD sur pages détail

### Étape 3: Pagination Manquante (45 min)
1. Ajouter pagination Dispositifs.jsx
2. Ajouter pagination Ressources.jsx
3. Tester navigation

### Étape 4: Audit Accessibilité (1h30)
1. Test navigation clavier sur toutes pages
2. Vérifier focus visible
3. Audit ARIA labels
4. Vérifier structure titres H1/H2

### Étape 5: FALC (30 min)
1. Vérifier affichage sur toutes pages détail
2. Standardiser présentation
3. Ajouter fallback si manquant

### Étape 6: Tests & Preuves (1h)
1. Tests manuels navigation
2. Captures d'écran
3. Logs validation
4. Mise à jour STATUS.md

---

**TOTAL ESTIMÉ:** ~5h30 pour compléter Phase 3
**PROCHAINE ÉTAPE:** Commencer par SourceTraceability (quick win)
