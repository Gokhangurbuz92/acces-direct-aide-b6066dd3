# Rapport d'Amélioration A11y & UX

## État des lieux initial

### Problèmes identifiés
1. **Accessibilité (A11y)** :
   - Langue du document définie sur `en` au lieu de `fr`.
   - Absence de label pour le champ de recherche (`Input` sans label associé).
   - Liens "Voir cette aide" génériques sans contexte pour les lecteurs d'écran.
   - Contrastes parfois insuffisants (texte bleu clair sur fond dégradé).
   - Navigation au clavier non vérifiée.

2. **UX & FALC (Facile à Lire et à Comprendre)** :
   - Textes parfois complexes ou verbeux sur la page d'accueil.
   - Absence de feedback visuel (Skeleton) lors du chargement des données (Aides urgentes, Actualités), provoquant des sauts de mise en page.

## Améliorations apportées

### 1. Accessibilité (Conformité WCAG AA visée)

- **Configuration globale** :
  - Modification de `index.html` pour définir `lang="fr"`.
  - Vérification de la présence et du fonctionnement du lien d'évitement ("Skip link") pour la navigation clavier.

- **Composants** :
  - **Barre de recherche (`SearchBar.jsx`)** : Ajout d'un `<label>` masqué visuellement (`sr-only`) et association via `id` et `htmlFor`.
  - **Cartes d'aides (`AideCard.jsx`)** : Ajout d'un `aria-label` dynamique sur le lien "Voir cette aide" incluant le titre de l'aide (ex: "Voir l'aide Aide au logement").
  - **Page d'accueil (`Home.jsx`)** : Amélioration du contraste dans la section Hero (`text-blue-50` au lieu de `text-blue-200`).

### 2. FALC (Facile à Lire et à Comprendre)

- **Simplification des textes (`Home.jsx`)** :
  - "Trouvez les aides et les services près de chez vous" (Simplifié).
  - Remplacement de "Un site simple et gratuit pour trouver des aides..." par "Un site gratuit pour trouver vos aides et vos démarches simplement."
  - "Comment pouvons-nous vous aider ?" devient "Que cherchez-vous ?".
  - Section Engagement reformulée : "Informations sûres", "Site gratuit", "Pour tout le monde".

### 3. Expérience Utilisateur (UX)

- **États de chargement** :
  - Implémentation de `Skeleton` loaders pour les sections asynchrones (Aides urgentes, Dernières aides, Actualités).
  - Évite l'effet de "pop-in" du contenu et indique clairement que le site travaille.

## Vérification

- **Tests E2E (Playwright)** :
  - Création de `e2e/a11y.spec.js`.
  - Succès de la navigation clavier (Tabulation) du haut de page jusqu'à la recherche.
  - Validation de l'attribut `lang="fr"`.

- **Score Lighthouse (Est.)** :
  - Accessibilité : Augmentation prévue vers 100/100 (Correction des labels et langue).
  - Best Practices : Amélioration via la gestion correcte des attributs ARIA.
