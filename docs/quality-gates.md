# Quality Gates & CI

Ce projet utilise une stratégie "Zéro Régression" pour assurer des déploiements sans peur.

## 1. Pipeline d'Intégration Continue (CI)

Chaque Pull Request et chaque commit sur `main` déclenche le workflow `.github/workflows/ci.yml`.
Ce workflow exécute les vérifications suivantes :

1.  **Quality** :
    *   **Lint** : Vérifie le style et les erreurs potentielles avec ESLint. (`npm run lint`)
    *   **Typecheck** : Vérifie la cohérence des types (TypeScript/JSDoc) avec `tsc`. (`npm run typecheck`)
2.  **Tests** :
    *   **Tests Unitaires/Intégration** : Vérifie la logique backend avec Vitest. (`npm run test:api`)
    *   **Tests E2E (Vital Paths)** : Vérifie les 10 parcours utilisateurs critiques avec Playwright. (`npm run test:e2e`)
3.  **Build** :
    *   Vérifie que l'application compile correctement pour la production. (`npm run build`)

## 2. Release Gate (Local)

Avant de pousser votre code ou de demander une review, vous DEVEZ valider la "Release Gate" locale.
Ce script exécute la même suite de tests que la CI.

**Commande :**
```bash
node scripts/release-gate.js
```

Si ce script échoue, **ne pushez pas**. Corrigez les erreurs d'abord.

## 3. Tests "Vital Paths"

Les tests End-to-End (E2E) couvrent les 10 parcours les plus critiques de l'application :

1.  **Home Page** : Chargement et présence de la recherche.
2.  **Recherche Aides** : Fonctionnement du moteur de recherche.
3.  **Recherche Structures** : Fonctionnement de l'annuaire.
4.  **Détail Aide** : Affichage d'une fiche aide.
5.  **Détail Structure** : Affichage d'une fiche structure.
6.  **Connexion Pro** : Parcours de login (mocké).
7.  **Dashboard Pro** : Accès à l'espace protégé.
8.  **Prise de RDV (Public)** : Parcours complet de demande de rendez-vous.
9.  **Contact** : Page de contact.
10. **Erreur 404** : Gestion des pages inexistantes.

Ces tests utilisent des mocks API pour être rapides et déterministes.

## 4. Auto-merge

Si une Pull Request passe tous les checks CI (Vert) et possède le label `automerge`, elle sera automatiquement mergée.
Ceci encourage les petites PRs atomiques et réduit le temps d'attente.

## 5. Maintenance

- **Ajout de tests** : Pour ajouter un parcours vital, éditez `e2e/vital-paths.spec.js`.
- **Linting** : La configuration ESLint est stricte sur les nouvelles erreurs. Utilisez `npm run lint -- --fix` pour corriger automatiquement ce qui est possible.
