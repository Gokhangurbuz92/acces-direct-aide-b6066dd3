# feat(phase3): FALC visible sur pages détail

## WHAT
Affiche un bloc "Résumé facile à lire" (FALC) sur toutes les pages détail du portail public.

## WHY
Améliorer l'accessibilité et la compréhension des contenus pour tous les utilisateurs, en particulier ceux ayant des difficultés de lecture, conformément aux principes FALC (Facile à Lire et à Comprendre).

## CHANGES

### Nouveau composant réutilisable
- **`src/components/FalcSummary.jsx`** : Composant React pour afficher un résumé FALC
  - Affichage conditionnel (ne s'affiche que si du contenu existe)
  - Badge "FALC" pour identification visuelle
  - Accessible avec `aria-label`
  - Préserve les espaces blancs et sauts de ligne
  - Fallback silencieux (pas de div vide si pas de contenu)

### Intégration sur 6 pages détail
1. **AideDetail.jsx** : `aide?.summary_falc`
2. **DemarcheDetail.jsx** : `demarche?.summary_falc || description_falc || resume_falc`
3. **StructureDetail.jsx** : `structure?.resume_falc || summary_falc || description_falc`
4. **DispositifDetail.jsx** : `dispositif?.description_falc || summary_falc`
5. **RessourceDetail.jsx** : `ressource?.resume_falc || summary_falc || description_falc`
6. **ActualiteDetail.jsx** : `actu?.summary_falc`

### Tests unitaires
- **`tests/unit/falcsummary.test.js`** : 9 tests complets
  - Utilise `React.createElement()` au lieu de JSX (pas de modification ESLint nécessaire)
  - Teste tous les cas limites : vide, null, undefined, espaces, multiline
  - Teste les props personnalisées : title, className
  - Vérifie la présence du badge FALC

## TECHNICAL DETAILS

### Approche d'intégration
- Import avec alias : `import FalcSummary from '@/components/FalcSummary'`
- Fallback multiple pour supporter différentes conventions de nommage des champs FALC
- Placement UI : après le titre/intro, avant le contenu principal

### Accessibilité
- Utilisation de balises sémantiques (`<section>`)
- Attribut `aria-label` pour les lecteurs d'écran
- Contraste de couleurs conforme WCAG
- Badge visuel "FALC" pour identification rapide

### Performance
- Composant léger (27 lignes)
- Pas de dépendances externes
- Rendu conditionnel pour éviter les divs vides

## QA

### Tests automatisés
```bash
npm test        # ✅ 92 tests passing (9 nouveaux)
npm run lint    # ✅ 0 errors, 0 warnings
npm run typecheck # ✅ 0 errors
npm run build   # ✅ Success (6.80s)
```

### Vérification manuelle
1. Ouvrir une page détail (ex: `/aides/aide-test`)
2. Si un champ FALC existe dans les données, le bloc "Résumé facile à lire" apparaît
3. Si aucun champ FALC n'existe, rien ne s'affiche (pas de bloc vide)
4. Le badge "FALC" est visible en haut à droite du bloc
5. Le texte préserve les sauts de ligne et la mise en forme

### Intégration vérifiée
```bash
grep -R "FalcSummary" src/pages/*Detail.jsx
# ✅ 6/6 pages intégrées
```

## IMPACT

### Utilisateurs
- Meilleure compréhension des contenus complexes
- Accessibilité améliorée pour les personnes en situation de handicap
- Expérience utilisateur plus inclusive

### Développeurs
- Composant réutilisable pour futures pages
- Pattern clair pour l'intégration FALC
- Tests unitaires pour garantir la stabilité

### SEO
- Pas d'impact (le contenu FALC est déjà présent dans les données)
- Amélioration potentielle de l'engagement utilisateur

## SCREENSHOTS

### Avant
- Pas de résumé FALC visible sur les pages détail

### Après
- Bloc "Résumé facile à lire" avec badge FALC
- Affichage conditionnel selon disponibilité des données
- Design cohérent avec le reste du portail

## NOTES

### Champs FALC supportés
Le composant supporte plusieurs conventions de nommage :
- `summary_falc` (standard)
- `description_falc` (dispositifs)
- `resume_falc` (structures, ressources)

### Fallback
Si aucun champ FALC n'est disponible, le composant ne s'affiche pas (pas de message d'erreur, pas de bloc vide).

### Évolutions futures possibles
- Ajouter un bouton "Lire en FALC" pour basculer entre version normale et FALC
- Intégrer un indicateur de niveau de lecture
- Ajouter une option pour agrandir la police

## CHECKLIST

- [x] Code écrit et testé
- [x] Tests unitaires ajoutés (9 tests)
- [x] Lint et typecheck passent
- [x] Build réussit
- [x] Intégration sur les 6 pages détail
- [x] Documentation PR complète
- [x] Pas de breaking changes
- [x] Pas de secrets committés
- [x] Pas de dépendances externes ajoutées

## FILES CHANGED

```
src/components/FalcSummary.jsx      | 27 ++++++++++++++++++++
src/pages/ActualiteDetail.jsx       |  4 +++
src/pages/AideDetail.jsx            |  4 +++
src/pages/DemarcheDetail.jsx        |  4 +++
src/pages/DispositifDetail.jsx      |  6 ++++-
src/pages/RessourceDetail.jsx       |  4 +++
src/pages/StructureDetail.jsx       |  4 +++
tests/unit/falcsummary.test.js      | 56 ++++++++++++++++++++++++++++++++++++++++++
8 files changed, 108 insertions(+), 1 deletion(-)
```

## RELATED

- Phase 3: Portail Public - Amélioration de l'accessibilité
- Conformité FALC (Facile à Lire et à Comprendre)
- Accessibilité numérique
