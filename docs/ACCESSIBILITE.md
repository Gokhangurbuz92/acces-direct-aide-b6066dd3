# Accessibilité — AccesDirectAide

Ce document décrit les principes d'accessibilité appliqués au projet AccesDirectAide, conformément au **RGAA 4.1.2** (Référentiel Général d'Amélioration de l'Accessibilité).

## Principes RGAA appliqués

### 1. Structure HTML sémantique
- Chaque page utilise `<header>`, `<nav>`, `<main id="main-content">`, `<footer>` avec les rôles ARIA appropriés.
- Hiérarchie des titres : un seul `<h1>` par page, suivi de `<h2>` → `<h3>` sans saut de niveau.
- Les listes utilisent `<ul>` / `<li>` pour les contenus énumérés.

### 2. Skip link
- Un lien « Aller au contenu principal » est présent en haut de chaque page.
- Il est invisible par défaut et apparaît lors du focus clavier.
- Il pointe vers `#main-content` pour sauter l'en-tête et la navigation.

### 3. Formulaires accessibles
- Chaque champ de formulaire a un `<label>` associé ou un `aria-label`.
- Les groupes de choix (radio, checkbox) utilisent `<fieldset>` + `<legend>` quand applicable.
- Les messages d'erreur sont liés aux champs via `aria-describedby`.

### 4. Navigation clavier
- Tous les éléments interactifs sont accessibles via Tab / Shift+Tab.
- Le **chat flottant** dispose d'un **focus trap** : Tab circule à l'intérieur, Esc ferme et restitue le focus.
- Les indicateurs de focus sont visibles (outline bleu de 3px).

### 5. Contrastes
- Les textes respectent un ratio de contraste AA : 4.5:1 pour les textes normaux, 3:1 pour les textes larges.
- Le mode haut contraste est disponible via la barre d'accessibilité.

### 6. WAI-ARIA
- **Chat** : `role="dialog"`, `aria-modal="true"`, messages en `aria-live="polite"`.
- **Wizard** : barre de progression avec `role="progressbar"`, `aria-valuetext="Étape X sur Y"`.
- **Navigation** : `role="navigation"` avec `aria-label` sur chaque `<nav>`.
- **Menus déroulants** : `aria-expanded`, `aria-controls`, `role="menu"` / `role="menuitem"`.

### 7. Images et icônes
- Les images porteuses d'information ont un attribut `alt` descriptif.
- Les icônes décoratives ont `aria-hidden="true"`.

---

## Commandes de test

```bash
# Linter a11y (jsx-a11y)
npm run lint

# Tests E2E accessibilité (axe-core + navigation clavier)
npx playwright test e2e/accessibility.spec.js

# Audit axe sur les pages clés
npx playwright test e2e/accessibility.spec.js --grep "axe audit"
```

---

## Règles ESLint a11y

Le projet utilise `eslint-plugin-jsx-a11y` en mode recommandé. Les règles suivantes sont configurées :

| Règle | Niveau | Justification |
|-------|--------|---------------|
| `jsx-a11y/*` (recommandé) | error | Standard RGAA |
| `label-has-associated-control` | warn | Faux positifs avec le composant Label shadcn (forwardRef) |
| `no-autofocus` | warn | Utilisé de manière contrôlée dans le chat |

---

## Bonnes pratiques pour les développeurs

1. **Toujours ajouter un `aria-label`** aux boutons qui n'ont que des icônes.
2. **Utiliser `aria-hidden="true"`** sur les icônes décoratives (Lucide icons).
3. **Ne jamais supprimer `outline`** — personnaliser avec `focus-visible:ring-*` à la place.
4. **Tester au clavier** chaque nouveau composant interactif.
5. **Utiliser `aria-live="polite"`** pour les contenus dynamiques (résultats de recherche, messages).
6. **Respecter la hiérarchie des titres** : ne pas sauter de `<h1>` à `<h3>`.
7. **Préférer les balises HTML natives** (`<button>`, `<a>`, `<input>`) aux `<div>` avec `onClick`.

---

## Outils recommandés

- **[axe DevTools](https://www.deque.com/axe/)** — Extension navigateur pour audit rapide
- **[Contrast Checker](https://webaim.org/resources/contrastchecker/)** — Vérification ratio de contraste
- **VoiceOver** (macOS) — Lecteur d'écran natif pour tests manuels
- **Playwright + @axe-core/playwright** — Tests automatisés (intégrés au projet)
