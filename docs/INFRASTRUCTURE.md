# Infrastructure & Choix Techniques

Ce document recense les décisions d'architecture et de cohérence technique.

## 1. Langage : JavaScript (ESM)
- **Stratégie** : Le projet est majoritairement en JavaScript standard (ES Modules).
- **TypeScript** : Pas de migration complète prévue. Le typage est géré via JSDoc si nécessaire.
- **Règle** : Tout nouveau fichier doit être en `.js`. Les fichiers `.ts` sont tolérés uniquement si une configuration de build spécifique est présente (ce qui n'est pas le cas actuellement pour le runtime).
- **Utils** : `src/utils/index.js` est la source de vérité pour les utilitaires partagés (pas de `.ts`).

## 2. Client API Frontend
- **Fichier unique** : Le client API est centralisé dans `src/api/client.js`.
- **Interdiction** : Pas de fichier `src/api/client.jsx`.
- **Raison** : Éviter les imports circulaires ou incohérents. Le client est purement logique (fetch), pas de JSX.

## 3. Moteur FALC (Facile à Lire et à Comprendre)
- **Source de vérité** : `api/lib/falc-summarizer.js`.
- **Usage** : Utilisé par le backend pour simplifier les contenus.
- **Obsolescence** : Tout code FALC dans `lib/` (racine) ou ailleurs est considéré comme déprécié et doit être supprimé.

## 4. Architecture Serverless
- **Monolithe Router** : `api/index.js` capture toutes les requêtes et délègue à `api/routes.js`.
- **Handlers** : Les fichiers dans `api/_handlers/` sont des modules Node.js standard exportant une fonction `(req, res)`.
