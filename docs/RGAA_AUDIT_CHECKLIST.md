# Checklist RGAA 4.1.2 — AccesDirectAide

> **Date** : 2026-02-25
> **Périmètre** : Pages publiques (Home, Aides, Démarches, Orientation, Login)
> **Outil** : axe-core (CI) + inspection manuelle

## Méthodologie

1. **Automatisé** : axe-core via `@axe-core/playwright` dans `e2e/a11y.spec.js` + CI `.github/workflows/a11y.yml`
2. **Semi-automatisé** : WAVE browser extension (contrastes, structure)
3. **Manuel** : VoiceOver (macOS) ou NVDA (Windows) pour navigation clavier et lecteur d'écran

## Critères vérifiés

### Images (1.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 1.1 | Chaque image a une alternative textuelle | ⚠️ À vérifier | Icônes Lucide via `aria-hidden`, images de contenu à auditer |
| 1.2 | Alternatives pertinentes | ⚠️ À vérifier | |

### Cadres (2.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 2.1 | Cadres avec titre | N/A | Pas d'iframe dans les pages publiques |

### Couleurs (3.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 3.1 | Information pas uniquement par la couleur | ✅ OK | Badges utilisent texte + couleur |
| 3.2 | Contraste texte ≥ 4.5:1 (AA) | ⚠️ À mesurer | Classes Tailwind `*-100 text-*-800` conformes en théorie |
| 3.3 | Contraste grands textes ≥ 3:1 | ⚠️ À mesurer | |

### Multimédia (4.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 4.x | Sous-titres, audiodescription | N/A | Pas de contenu multimédia |

### Tableaux (5.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 5.1 | Tableaux de données avec en-têtes | N/A | Tableaux uniquement dans admin |

### Liens (6.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 6.1 | Intitulés de liens explicites | ✅ OK | "Voir la fiche", "Demander cette aide" |
| 6.2 | Liens identiques mènent à la même destination | ✅ OK | |

### Scripts (7.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 7.1 | Scripts compatibles avec les AT | ⚠️ À vérifier | Wizard utilise `role="radiogroup"`, modales avec `aria-modal` |
| 7.3 | Scripts accessibles au clavier | ✅ OK | Focus visible, skip link fonctionnel |

### Éléments obligatoires (8.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 8.1 | Doctype valide | ✅ OK | `<!DOCTYPE html>` |
| 8.2 | Langue par défaut | ✅ OK | `<html lang="fr">` |
| 8.3 | Titre de page | ✅ OK | Via `react-helmet-async` |
| 8.5 | Titre de page pertinent | ✅ OK | |

### Structuration (9.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 9.1 | Utilisation de titres (h1-h6) | ✅ OK | Un seul h1 par page |
| 9.2 | Structure HTML5 (header, nav, main, footer) | ✅ OK | Layout.jsx |
| 9.3 | Listes structurées | ✅ OK | |

### Présentation (10.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 10.1 | Feuilles de styles pour la présentation | ✅ OK | CSS/Tailwind |
| 10.7 | Focus visible | ✅ OK | Ring focus visible au Tab |

### Formulaires (11.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 11.1 | Labels associés aux champs | ⚠️ 42 warnings | `jsx-a11y/label-has-associated-control` (voir rapport lint) |
| 11.2 | Informations de même nature groupées | ✅ OK | Fieldsets dans wizard |
| 11.10 | Messages d'erreur explicites | ✅ OK | |

### Navigation (12.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 12.1 | Système de navigation cohérent | ✅ OK | Header + footer identiques partout |
| 12.7 | Lien d'évitement | ✅ OK | `SkipToContent.jsx` — "Aller au contenu principal" |
| 12.8 | Ordre de tabulation cohérent | ✅ OK | |

### Consultation (13.x)

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 13.1 | Contenu consultable sans limite de temps | ✅ OK | Pas de timeout session publique |
| 13.7 | Contenus en mouvement contrôlables | ✅ OK | `prefers-reduced-motion` respecté |

## Résumé

| Catégorie | ✅ OK | ⚠️ À vérifier | ❌ Non conforme |
|-----------|-------|----------------|-----------------|
| Total | 18 | 6 | 0 |

## Plan de remédiation

1. **Priorité 1** : Résoudre les 42 warnings `label-has-associated-control` (formulaires admin principalement)
2. **Priorité 2** : Mesurer contrastes avec WAVE sur les 5 pages publiques
3. **Priorité 3** : Tester avec VoiceOver le parcours wizard /orientation complet
4. **Priorité 4** : Vérifier les alternatives textuelles de chaque image

## Outillage en place

| Outil | Intégration | Fichier |
|-------|-------------|---------|
| `@axe-core/playwright` | E2E tests | `e2e/a11y.spec.js` |
| `eslint-plugin-jsx-a11y` | Lint | `eslint.config.js` |
| CI workflow | GitHub Actions | `.github/workflows/a11y.yml` |
| Storybook addon | Visual dev | `@storybook/addon-a11y` |
