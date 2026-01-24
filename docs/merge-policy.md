# Politique de Merge & Autonomie Sécurisée

Objectif : Garantir qu'aucune régression n'atteint la production (`main`), tout en accélérant le développement.

## 1. Règle d'Or (P0)
**"Si c'est VERT, c'est SAFE."**
Le repo est configuré pour que la CI (Continuous Integration) soit la seule juge de la qualité technique.

- **INTERDIT :** Push direct sur `main` ou `staging`.
- **OBLIGATOIRE :** Passer par une Pull Request (PR).
- **BLOQUANT :** Si la CI échoue, le merge est impossible.

## 2. Le Pipeline "Release Gate"
À chaque push sur une PR, GitHub Actions exécute le script `release:gate` :
1.  **Linting :** Vérifie la qualité du code (actuellement en mode "baseline" warnings-only pour la dette technique).
2.  **Build :** Vérifie que l'application compile (Vite + Vercel Headers).
3.  **Smoke Tests (E2E) :** Playwright simule un utilisateur réel sur 10 parcours critiques (Aides, Démarches, Search, etc.) pour garantir qu'aucun écran blanc ou lien mort n'existe.

## 3. Comment Merger ?

### Mode Manuel (Classique)
1.  Ouvrez votre PR.
2.  Attendez que tous les checks soient verts (✅).
3.  Cliquez sur "Squash and merge".

### Mode Automatique ("Autonomie")
Si vous êtes confiant dans votre PR et voulez qu'elle soit mergée dès que les tests passent (sans attendre devant l'écran) :

1.  Ajoutez le label **`automerge`** à votre PR.
2.  C'est tout.
    *   Si les tests passent -> La PR sera mergée automatiquement (Squash).
    *   Si les tests échouent -> Le merge est bloqué, vous devez corriger.

## 4. En cas d'échec (Rouge ❌)
1.  Regardez l'onglet "Actions" ou "Details" sur la PR.
2.  Si c'est un test E2E qui échoue, téléchargez l'artefact `playwright-report` pour voir la capture d'écran de l'erreur.
3.  Reproduisez localement avec `npm run release:gate`.

---
*Ce document fait foi pour toute contribution.*
