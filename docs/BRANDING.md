# Charte Graphique AccesDirectAide — Design System v1.0

**Date de création :** Janvier 2026  
**Statut :** Production  
**Conformité :** WCAG 2.1 AA minimum

---

## 📋 Table des matières

1. [Palette de couleurs](#palette-de-couleurs)
2. [Règles d'usage des couleurs](#règles-dusage-des-couleurs)
3. [Typographie](#typographie)
4. [Logo](#logo)
5. [Iconographie](#iconographie)
6. [Composants UI](#composants-ui)
7. [Checklist QA](#checklist-qa)

---

## 🎨 Palette de couleurs

### Couleurs Brand

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Primary** | `#002D5A` | `rgb(0, 45, 90)` | Texte, icônes fonctionnelles, boutons, liens, focus ring |
| **Secondary** | `#2BC4D7` | `rgb(43, 196, 215)` | Accent décoratif UNIQUEMENT (jamais texte fin) |
| **Highlight** | `#F6B445` | `rgb(246, 180, 69)` | Focus/attention/mise en avant (surfaces larges) |
| **Background** | `#F7F4EE` | `rgb(247, 244, 238)` | Fond de page principal |

### Couleurs Base

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Cartes, surfaces, conteneurs |

### Couleurs Texte

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Body** | `#1A1A1A` | `rgb(26, 26, 26)` | Texte principal |
| **Muted** | `#5E6E82` | `rgb(94, 110, 130)` | Texte secondaire, métadonnées |

### Couleurs Feedback

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Success** | `#198038` | `rgb(25, 128, 56)` | Messages de succès |
| **Error** | `#D93025` | `rgb(217, 48, 37)` | Messages d'erreur |

### Couleurs Sémantiques

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Surface** | `#FFFFFF` | `rgb(255, 255, 255)` | Cartes et conteneurs |
| **Border** | `#E2E8F0` | `rgb(226, 232, 240)` | Bordures par défaut |
| **Border Muted** | `#F1F5F9` | `rgb(241, 245, 249)` | Bordures subtiles |

---

## ✅ Règles d'usage des couleurs

### ✓ DO (À FAIRE)

- **Primary (#002D5A)** : Utiliser pour tout texte sur fond clair, boutons principaux, liens, icônes fonctionnelles
- **Highlight (#F6B445)** : Utiliser pour les états de focus, badges larges, boutons d'attention (avec texte #1A1A1A)
- **Secondary (#2BC4D7)** : Utiliser uniquement en décoration (bordures épaisses, fonds de sections larges, pictos décoratifs)
- **Contraste** : Toujours vérifier que le ratio de contraste est ≥ 4.5:1 pour le texte normal, ≥ 3:1 pour le texte large

### ✗ DON'T (INTERDITS)

- ❌ **JAMAIS** utiliser Secondary (#2BC4D7) pour du texte fin sur fond blanc (contraste insuffisant)
- ❌ **JAMAIS** utiliser Highlight (#F6B445) pour du texte fin sur fond blanc (contraste insuffisant)
- ❌ **JAMAIS** utiliser du texte blanc sur fond Secondary ou Highlight
- ❌ **JAMAIS** créer de nouvelles couleurs sans validation WCAG

### Exemples de classes Tailwind

```jsx
// ✓ Bouton principal
<button className="bg-brand-primary text-white hover:bg-brand-primary/90">
  Action principale
</button>

// ✓ Bouton secondaire (outline)
<button className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
  Action secondaire
</button>

// ✓ Bouton highlight (attention)
<button className="bg-brand-highlight text-text-body hover:bg-brand-highlight/90">
  Attention
</button>

// ✓ Badge décoratif avec secondary
<span className="bg-brand-secondary/10 text-brand-primary px-3 py-1 rounded-full">
  Nouveau
</span>

// ✗ INTERDIT - Texte secondary sur blanc
<p className="text-brand-secondary">Texte illisible</p>

// ✗ INTERDIT - Texte highlight sur blanc
<p className="text-brand-highlight">Texte illisible</p>
```

---

## 📝 Typographie

### Police principale

**Famille :** Inter  
**Fallback :** `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`  
**Import Google Fonts :** Déjà configuré dans `index.html`

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Échelle typographique

| Élément | Taille | Line Height | Poids | Classe Tailwind |
|---------|--------|-------------|-------|-----------------|
| **H1** | 3rem (48px) | 1.25 | 600 | `text-4xl md:text-5xl font-semibold` |
| **H2** | 2.25rem (36px) | 1.25 | 600 | `text-3xl md:text-4xl font-semibold` |
| **H3** | 1.875rem (30px) | 1.25 | 600 | `text-2xl md:text-3xl font-semibold` |
| **H4** | 1.5rem (24px) | 1.25 | 600 | `text-xl md:text-2xl font-semibold` |
| **H5** | 1.25rem (20px) | 1.25 | 600 | `text-lg md:text-xl font-semibold` |
| **H6** | 1.125rem (18px) | 1.25 | 600 | `text-base md:text-lg font-semibold` |
| **Body** | 1rem (16px) | 1.5 | 400 | `text-base` |
| **Small** | 0.875rem (14px) | 1.5 | 400 | `text-sm` |
| **Caption** | 0.75rem (12px) | 1.5 | 400 | `text-xs` |

### Règles typographiques

- **Line-height minimum :** 1.5 pour le corps de texte (accessibilité)
- **Poids disponibles :** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Couleur par défaut :** `text-text-body` (#1A1A1A)
- **Couleur secondaire :** `text-text-muted` (#5E6E82)

---

## 🎯 Logo

### Variantes disponibles

| Variante | Fichier | Usage | Taille min |
|----------|---------|-------|------------|
| **Full** | `logo-full.svg` | Header desktop, pages internes | 120px largeur |
| **Icon** | `logo-icon.svg` | Header mobile, favicon | 16x16px |
| **White** | `logo-white.svg` | Footer, fonds sombres | 120px largeur |

### Emplacement des assets

```
public/
├── assets/
│   └── branding/
│       ├── logo-full.svg          # Logo complet (couleur)
│       ├── logo-icon.svg          # Icône seule (couleur)
│       ├── logo-white.svg         # Logo complet (blanc)
│       ├── logo-full.png          # Fallback PNG
│       └── logo-icon.png          # Fallback PNG
└── brand/                         # Legacy (à conserver pour compatibilité)
```

### Utilisation du composant Logo

```jsx
import Logo from '@/components/Brand/Logo';

// Logo complet (header desktop)
<Logo variant="full" size={40} />

// Icône seule (header mobile)
<Logo variant="icon" size={40} />

// Logo blanc (footer)
<Logo variant="full" tone="white" size={48} />

// Logo avec lien vers l'accueil
<Logo variant="full" size={40} asLink />
```

### Règles d'usage du logo

#### ✓ DO

- Utiliser le composant `<Logo />` pour toutes les occurrences
- Respecter les tailles minimales (16x16 pour icon, 120px pour full)
- Conserver l'espace de respiration (padding minimum 16px autour)
- Utiliser `tone="white"` sur fonds sombres (#002D5A)

#### ✗ DON'T

- ❌ Ne pas déformer le logo (ratio aspect toujours préservé)
- ❌ Ne pas utiliser le logo sur fond Secondary (#2BC4D7) ou Highlight (#F6B445)
- ❌ Ne pas ajouter d'effets (ombre portée, dégradé, rotation)
- ❌ Ne pas utiliser de versions pixelisées < 16x16

### Checklist QA Logo

- [ ] **SVG propre** : viewBox correct, pas de metadata inutiles
- [ ] **Texte vectorisé** : pas de dépendance à une police externe
- [ ] **Poids** : < 10kb (idéal < 3kb)
- [ ] **Lisibilité 16x16** : icône reconnaissable en favicon
- [ ] **Lisibilité 32x32** : logo complet lisible
- [ ] **Contraste** : visible sur fond clair ET fond #002D5A (version white)
- [ ] **Monochrome** : version white fonctionne en impression N&B
- [ ] **Alt text** : "AccesDirectAide — La lumière sur vos démarches"
- [ ] **Fallback PNG** : disponible si SVG non supporté

---

## 🎨 Iconographie

### Bibliothèque : Lucide React

**Installation :** Déjà installée (`lucide-react`)

```bash
npm install lucide-react
```

### Règles d'usage

| Propriété | Valeur | Usage |
|-----------|--------|-------|
| **stroke** | `2` | Épaisseur standard |
| **linecap** | `round` | Terminaisons arrondies |
| **linejoin** | `round` | Jointures arrondies |
| **Taille meta** | `16px` | Icônes inline, badges |
| **Taille actions** | `24px` | Boutons, navigation |
| **Taille FALC** | `48px+` | Pictos illustratifs |

### Accessibilité des icônes

```jsx
// ✓ Icône décorative (avec texte visible)
<button>
  <Home className="h-5 w-5" aria-hidden="true" />
  <span>Accueil</span>
</button>

// ✓ Icône seule (bouton)
<button aria-label="Fermer le menu">
  <X className="h-5 w-5" />
</button>

// ✗ INTERDIT - Icône seule sans aria-label
<button>
  <X className="h-5 w-5" />
</button>
```

### Couleurs des icônes

- **Fonctionnelles** : `text-brand-primary` (#002D5A)
- **Décoratives** : `text-brand-secondary` (#2BC4D7) ou `text-brand-highlight` (#F6B445)
- **Sur fond sombre** : `text-white`
- **Muted** : `text-text-muted` (#5E6E82)

---

## 🧩 Composants UI

### Boutons (Button)

```jsx
import { Button } from '@/components/ui/button';

// Bouton principal
<Button variant="default">Action principale</Button>

// Bouton outline (secondaire)
<Button variant="outline">Action secondaire</Button>

// Bouton highlight (attention)
<Button variant="highlight">Attention</Button>

// Bouton destructif
<Button variant="destructive">Supprimer</Button>

// Bouton ghost
<Button variant="ghost">Annuler</Button>

// Bouton lien
<Button variant="link">En savoir plus</Button>

// Tailles
<Button size="sm">Petit</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grand</Button>
<Button size="icon"><X /></Button>
```

### Focus Ring (Accessibilité)

Tous les éléments interactifs doivent avoir un focus ring visible :

```jsx
// Automatique sur les boutons
<Button>Cliquez-moi</Button>

// Manuel sur les liens
<a href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
  Lien
</a>

// Classe utilitaire
<div className="focus-ring">...</div>
```

---

## ✅ Checklist QA

### Avant chaque commit

- [ ] **Build** : `npm run build` passe sans erreur
- [ ] **Lint** : `npm run lint` passe sans erreur
- [ ] **Typecheck** : `npm run typecheck` passe sans erreur
- [ ] **Contraste** : Tous les textes ont un ratio ≥ 4.5:1 (vérifier avec WebAIM Contrast Checker)
- [ ] **Focus visible** : Tous les éléments interactifs ont un focus ring visible
- [ ] **Icônes accessibles** : Toutes les icônes seules ont un `aria-label`
- [ ] **Logo** : Composant `<Logo />` utilisé partout (pas d'import direct d'images)

### Avant merge en production

- [ ] **Tests visuels** : Header, Footer, Home, Listing, Détail testés desktop + mobile
- [ ] **Navigation clavier** : Tab navigation fonctionne partout
- [ ] **Lecteur d'écran** : Tester avec NVDA/VoiceOver sur une page type
- [ ] **Performance** : Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- [ ] **Responsive** : Tester sur mobile (375px), tablette (768px), desktop (1440px)

### Outils recommandés

- **Contraste** : [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Accessibilité** : [axe DevTools](https://www.deque.com/axe/devtools/)
- **Performance** : Lighthouse (Chrome DevTools)
- **Lecteur d'écran** : NVDA (Windows), VoiceOver (macOS)

---

## 📦 Fichiers du Design System

```
src/
├── design/
│   └── tokens.json              # Source de vérité (couleurs, typo, espacements)
├── styles/
│   └── tokens.css               # CSS variables générées depuis tokens.json
├── components/
│   ├── Brand/
│   │   └── Logo.tsx             # Composant Logo unifié
│   └── ui/
│       └── button.jsx           # Composant Button avec variants
└── index.css                    # Import tokens + base styles

tailwind.config.js               # Mapping tokens -> Tailwind
index.html                       # Meta tags + Google Fonts
public/
├── assets/branding/             # Logos SVG + PNG
├── manifest.json                # PWA manifest (theme_color: #002D5A)
└── favicon.ico, *.png           # Favicons
```

---

## 🚀 Commandes de vérification

```bash
# Build
npm run build

# Lint
npm run lint

# Typecheck
npm run typecheck

# Tests
npm run test

# Vérifications métier
npm run verify
```

---

## 📞 Support

Pour toute question sur la charte graphique ou le Design System :

- **Documentation** : `docs/BRANDING.md` (ce fichier)
- **Tokens** : `src/design/tokens.json`
- **Composants** : `src/components/Brand/` et `src/components/ui/`

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026  
**Conformité :** WCAG 2.1 AA ✅
