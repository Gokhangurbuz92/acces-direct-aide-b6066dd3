# Guide: Protection de la branche `main`

Pour sécuriser le déploiement et garantir que la CI est respectée, suivez ces étapes sur GitHub.

### 1. Accéder aux paramètres
1. Allez sur la page du repo : [Gokhangurbuz92/acces-direct-aide-b6066dd3](https://github.com/Gokhangurbuz92/acces-direct-aide-b6066dd3)
2. Cliquez sur l'onglet **Settings**.
3. Dans le menu de gauche, cliquez sur **Branches**.

### 2. Ajouter une règle
1. Cliquez sur le bouton **Add branch protection rule**.
2. **Branch name pattern** : tapez `main`.

### 3. Configurer les règles
Cochez les cases suivantes :

- [x] **Require a pull request before merging**
  - *Optionnel* : Require approvals (1)

- [x] **Require status checks to pass before merging**
  - Dans la barre de recherche qui apparaît, cherchez et sélectionnez :
    - `quality-gate` (C'est le nom du job défini dans `ci.yml`)
  - *Note : Si le job n'apparaît pas, assurez-vous que la CI a tourné au moins une fois sur une PR.*

- [x] **Do not allow bypassing the above settings** (Recommandé)

### 4. Valider
1. Cliquez sur **Create** (ou Save changes) en bas de page.
