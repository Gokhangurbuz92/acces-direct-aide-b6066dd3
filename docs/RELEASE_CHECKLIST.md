# Checklist de Release

Avant de merger ou déployer en production, vérifier les points suivants.

## Automatique (CI)
- [ ] Build passe (`npm run build`).
- [ ] Tests Unitaires passent (`npm run test`).
- [ ] Tests E2E passent (`npm run test:e2e`).
- [ ] Linting OK.

## Manuel (Review)
- [ ] **Migrations DB** : Si changement de schéma, la migration a-t-elle été appliquée/testée ?
- [ ] **Variables d'Env** : Les nouvelles variables nécessaires sont-elles ajoutées dans Vercel ?
- [ ] **Performance** : Pas de nouvelles requêtes N+1 évidentes ?
- [ ] **Sécurité** :
  - Pas de secrets commités ?
  - Les nouvelles routes sont-elles protégées (Auth/RateLimit) ?
- [ ] **Accessibilité** : Les nouveaux composants UI ont-ils les attributs ARIA ?

## Post-Déploiement (Smoke Test)
- [ ] Vérifier la page d'accueil.
- [ ] Vérifier une page de détail (Aide ou Structure).
- [ ] Tenter une recherche.
- [ ] Vérifier les logs Vercel pour les 5 premières minutes.
