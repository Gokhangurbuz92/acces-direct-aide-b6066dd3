# Assistant — Documentation technique

## Vue d'ensemble

L'assistant d'orientation (`/orientation`) guide l'utilisateur à travers un wizard en 4 étapes, puis affiche des recommandations personnalisées issues de la recherche ADA.

## Flux du Wizard

```
Étape 1 — Besoin principal (logement/santé/travail/papiers/urgence)
     ↓
Étape 2 — Territoire (ville ou code postal, optionnel)
     ↓
Étape 3 — Profil (situation familiale + statut emploi)
     ↓
Étape 4 — Urgence + options (handicap/langue/numérique)
     ↓
Résultats — Cartes cliquables + plan d'action IA
```

## Intégration API

### 1. Recommandations — `POST /api/assistant/recommendations`

Appelé à la fin du wizard avec :
- `need` : label du besoin sélectionné
- `territory` : code postal/ville (si renseigné)
- `limit` : 6
- `types` : `["aide", "demarche", "structure"]`

Renvoie des items réels issus de la base ADA (embedding + lexical search).

### 2. Résumé IA — `POST /api/assistant/chat`

Appelé après les recommandations, en mode non-bloquant :
- `message` : prompt structuré avec les titres des recommandations
- `context.wizard` : données du wizard complètes

Le résumé est optionnel — si l'appel échoue, les cartes restent visibles.

## Composants

| Composant | Fichier | Rôle |
|:----------|:--------|:-----|
| `Wizard` | `src/components/assistant/Wizard.jsx` | Orchestrateur (state machine) |
| `StepNeed` | `src/components/assistant/StepNeed.jsx` | Sélection du besoin |
| `StepTerritory` | `src/components/assistant/StepTerritory.jsx` | Input territoire |
| `StepProfile` | `src/components/assistant/StepProfile.jsx` | Situation + statut |
| `StepUrgency` | `src/components/assistant/StepUrgency.jsx` | Urgence + options |
| `ResultPanel` | `src/components/assistant/ResultPanel.jsx` | Affichage résultats |
| `RecommendationCard` | `src/components/assistant/RecommendationCard.jsx` | Carte cliquable |

## Accessibilité

- `aria-label` sur tous les groupes et boutons
- `role="radiogroup"` et `aria-checked` pour les sélections
- `role="progressbar"` pour la barre de progression
- `focus-visible` ring sur tous les éléments interactifs
- Navigation clavier complète (Tab/Enter/Space)
- Safety note visible interdisant les données sensibles

## Sécurité

- Aucune donnée sensible demandée (pas de NIR, RIB, adresse exacte)
- Les données du wizard ne sont pas persistées
- Les recommandations proviennent uniquement de la recherche ADA (pas d'hallucination)
- Le résumé IA est contraint au contenu des recommandations renvoyées
