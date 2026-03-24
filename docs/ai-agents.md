# Agents IA

## Architecture

```
┌─────────────────────────────────────────────┐
│           ORCHESTRATEUR CENTRAL             │
│     POST /api/admin/orchestrator            │
│                                             │
│  6 étapes : Discovery → Enrichment →        │
│  Validation → Classification → FALC →       │
│  Alerting                                   │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────┬───────┼───────┬──────┬──────┐
    │      │       │       │      │      │
    ▼      ▼       ▼       ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌────┐┌──────┐
│Veill.││Enrich││Valid.││Class.││FALC││Alert.│
│      ││      ││      ││      ││    ││      │
│Trouv.││Ident.││Queue ││Catég.││Simp││Notif.│
│aides ││FALC  ││human.││+tague││lify││pros  │
└──────┘└──────┘└──────┘└──────┘└────┘└──────┘
                   │
                   ▼
          ReviewQueueItem
       (validation humaine)
```

## 6 Agents spécialisés

| # | Agent | Fichier | Mission |
|---|-------|---------|---------|
| 1 | Veilleur | `agent-discovery.js` | Trouver nouvelles aides via Gemini |
| 2 | Rédacteur FALC | `agents/falc-writer.js` | Simplifier en FALC (15 mots, pas de jargon) |
| 3 | Contrôleur | `hive-scan.js` | Scanner 12 catégories (cron hebdo) |
| 4 | Classeur | `agents/classifier.js` | Catégoriser (12 cat.) + audiences (8 types) |
| 5 | Réparateur | `hive-repair.js` | Corriger les ReviewQueueItems signalés |
| 6 | Alerteur | `agents/alerter.js` | Notifier les pros des changements |

## Endpoints

| Agent | Endpoint | Trigger | Auth |
|-------|----------|---------|------|
| Discovery | POST /api/pro/agent-discovery | Pro (manuel) | JWT Pro |
| Scheduler | POST /api/pro/agent-scheduler | Pro (manuel) | JWT Pro |
| Hive Scan | GET /api/cron/hive-scan | Cron (lundi 6h) | CRON_SECRET |
| Hive Repair | POST /api/admin/hive-repair | Admin (manuel) | Admin token |
| Orchestrateur | POST /api/admin/orchestrator | Admin (manuel) | Admin token |

## Pipeline orchestrateur (6 étapes)

```
1. Discovery      → Chercher aides non vérifiées (>30 jours)
2. Enrichment     → Identifier celles sans description FALC
3. Validation     → Créer ReviewQueueItem (validation humaine)
4. Classification → Catégoriser (12 catégories + 8 audiences)
5. FALC           → Simplifier les descriptions (max 15 mots/phrase)
6. Alerting       → Notifier les pros concernés
```

## Feature Flag

Tous les agents nécessitent `ENABLE_AI_AGENT=true`.
Pour activer : Vercel → Settings → Environment Variables → Redeploy.

## Module partagé

`api/lib/ai-discovery-core.js` — logique Gemini partagée entre Discovery et Scheduler.

## Catégories (12)

EMPLOI, LOGEMENT, SANTE, FAMILLE, HANDICAP, ETUDES, MOBILITE, ENERGIE, ALIMENTATION, NUMERIQUE, JUSTICE, SENIORS

## Sécurité

- Circuit breaker (opossum) sur tous les appels Gemini
- Feature flag `ENABLE_AI_AGENT` sur **tous** les agents
- Validation humaine obligatoire (ReviewQueue)
- Métriques (AiMetric) + rate limiting + auth
- Input sanitization (strip HTML, max 100-255 chars)
- Aucune publication automatique

## Agent 7 — Curateur de Ressources

**Fichier :** `api/lib/agents/resource-curator.js`

Mission : Trouver et organiser des ressources fiables pour les pages du site.

### Sources autorisées (UNIQUEMENT)

`*.gouv.fr`, `service-public.fr`, `caf.fr`, `ameli.fr`, `francetravail.fr`

### 4 types de contenu

| Type | Description | Page |
|------|-------------|------|
| RESSOURCE | Guides, liens officiels | /ressources |
| BONNE_PRATIQUE | Conseils pour les pros | /bonnes-pratiques |
| OUTIL | Simulateurs, calculateurs | /outils |
| DISPOSITIF | Programmes gouvernementaux | /dispositifs |

### Contenu initial

12 ressources pré-configurées dans `api/lib/seed-resources.js` — toutes sources gouvernementales vérifiées.

## Activation en production

### Étape 1 — Activer le feature flag
Vercel → Settings → Environment Variables → `ENABLE_AI_AGENT=true` → Redéployer.

### Étape 2 — Tester en dry-run
```bash
POST /api/admin/orchestrator
Body : { "dryRun": true }
```
Vérifie que le pipeline tourne sans erreur.

### Étape 3 — Lancer en réel
```bash
POST /api/admin/orchestrator
Body : { "dryRun": false }
```
Les agents appellent Gemini → résultats dans ReviewQueue → validation humaine requise.

### Étape 4 — Vérifier
- `GET /api/admin/ai-metrics` → métriques par agent
- `GET /api/admin/dashboard` → review queue items
