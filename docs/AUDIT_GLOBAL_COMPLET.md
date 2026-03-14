# 📸 1. PHOTOGRAPHIE EXACTE DE L'ÉTAT ACTUEL

## Cartographie de l'Architecture
- **Frontend** : Application React construite via **Vite** (`vite.config.js`). L'architecture inclut un fort découpage en *chunks* (ex: React Router, Radix UI, module Markdown, charts) pour optimiser les performances de chargement.
- **Backend / API** : Fonctions serverless déployées sur **Vercel** (`vercel.json`), interfacées via un middleware local en mode dev. Présence de nombreuses tâches planifiées (CRON) pour l'ingestion asynchrone (Aides, Structures, Démarches, Actualités).
- **Base de Données** : **PostgreSQL** géré via ORM **Prisma** (`schema.prisma`). La base de données intègre l'extension **pgvector** pour stocker les embeddings de l'IA (champ `Unsupported("vector(3072)")` sur le modèle `Aide`).

## État de Fonctionnement
### 🟢 100% Fonctionnel et Robuste
- **Espace Pro et Prise de RDV** : Le système de réservation (tables `ProUser`, `Appointment`, `Availability`, `StructureRdvSettings`) est pleinement fonctionnel et interfacé avec des logs et des systèmes de messagerie internes.
- **Authentification et Sécurité** : La gestion des rôles (Admin, Pro, Citizen) est fonctionnelle. Le SSO, les JWT et la couche cryptographique (mots de passe bcrypt, accès via tokens) sont en place.
- **La plateforme de test (E2E)** : L'infrastructure globale est solidement éprouvée par environ 50 suites de tests **Playwright** (`e2e/`), garantissant la non-régression sur le cœur de l'app.

### 🟠 Partiellement Codé / Instable
- **Moteur législatif OpenFisca** : L'intégration est présente visuellement et de manière logicielle (`src/pages/SharedDiagnostic.jsx`, `api/_handlers/diagnostic.js`, `docs/RUNBOOK_OPENFISCA.md`). Cependant, le système se base sur l'API publique `api.fr.openfisca.org` qui **n'a aucun SLA**. Cela rend ce bloc techniquement instable et dépendant en production.
- **Moteur IA RAG / Ingestion vectorielle** : La tuyauterie IA est en place (`api/_handlers/assistant/achat.js`), mais le volume d'ingestion constant sans limitation explicite pourrait potentiellement amener des crashs si l'optimisation n'est pas parfaite.
- **Import/Export de données (API Tiers / DREES / Aides-territoires)** : Les scripts d'ingestion existent (`cron/ingest-*`), mais la gestion fine des doublons ou des anomalies réseau peut engendrer des tâches zombies ou de la donnée obsolète.

### 🔴 Ce qui manque totalement
- **Monitoring des métriques vitales Web (Core Web Vitals)** au-delà de Sentry et Vercel Analytics (pas de Lighthouse CI dans les workflows GitHub).
- **Service Worker / PWA avancé** : Rien ne permet à l'heure actuelle de consulter ses aides ou son diagnostic "hors-ligne", ce qui contredit partiellement l'accessibilité dans des zones rurales.

---

# 🛡️ 2. AUDIT DE SÉCURITÉ ET ZERO-KNOWLEDGE (SecOps)

- **Failles XSS** : Les utilisations de `dangerouslySetInnerHTML` dans le frontend (`src/pages/ToolDetail.jsx`, `src/components/Messaging/SecureChat.jsx`, `src/components/ui/chart.jsx`) sont correctement systématiquement englobées par une fonction `sanitizeHtml()` (via DOMPurify). **Aucune faille XSS critique détectée**.
- **Fuites de données PII** : 
  - L'utilisation massive de `Sentry.captureException` (`api/_handlers/*`) loggue occasionnellement le `req.query` ou des `extra`. Il est *impératif* de vérifier que la fonction de *data scrubbing* de Sentry (côté dashboard ou initialisation) est configurée pour bloquer les PII (Emails, Téléphones).
- **Vulnérabilités réseau (Rate Limiting)** : Excellente posture. Le rate limiting via `@upstash/ratelimit` (Redis) est utilisé presque systématiquement sur toutes les routes sensibles : `SEARCH_AIDES`, `DIAGNOSTIC`, `messages`, `RDV`, API drees, etc.
- **Cryptographie et Zero-Knowledge** :
  - L'algorithme **AES-256-GCM** est solidement implémenté (`api/lib/crypto.js` et `api/_utils/vault.js`).
  - Il est utilisé pour le chiffrement des messages, des tokens de l'Espace Pro (Outlook), et surtout pour protéger le **secret de configuration MFA (TOTP)** des `AdminUser` stocké dans la BDD. C'est robuste.

---

# 🏗️ 3. ARCHITECTURE BDD & PERFORMANCES

- **Analyse des requêtes Prisma** : 
  - Prisma est fortement sollicité avec des modèles complexes (relations profondes entre `Aide`, `Structure`, `Demarche`). Il n'a pas été détecté de requêtes `await prisma.*` primaires situées au milieu de grosses boucles `for` (ce qui créerait un N+1 flagrant au niveau du code de l'API), mais la structure même des `include` combinés lors des requêtes REST peut provoquer des ralentissements importants du côté BDD limitant la scalabilité.
- **Constitution de la base `pgvector`** :
  - Le modèle `Aide` utilise le champ `embedding Unsupported("vector(3072)")`.
  - **Risque Critique de Performance (OOM)** : Les migrations montrent l'utilisation d'index FTS (Full Text Search) mais sans index `IVFFlat` ou `HNSW` sur le vecteur 3072D, la similarité des requêtes est calculée mathématiquement sur *l'ensemble* des lignes à chaque recherche IA. Cela amènera un "Out Of Memory" ou du lag dès que le volume d'Aides grimpera. 
- **Cold starts Vercel / Split Frontend** :
  - Le frontend React est très bien scindé (`vite.config.js`). Des *manualChunks* regroupent les librairies d'UI, Radix, et les icônes.
  - Le déploiement API via serverless Vercel expose un `maxDuration: 300` (`vercel.json`). Avec l'appel du LLM + la recherche pgvector sans HNSW, un cold-start risque très fortement de dépasser ce seuil.

---

# 🧹 4. DETTE TECHNIQUE ET QUALITÉ DU CODE

- **Typage** : Configuration TS/JS moderne en mode strict (JSDoc vérifié par `tsc --noEmit`), c'est un excellent standard qui évite d'énormes refactos, mais limite le "Developer Experience" pure par rapport à un `.ts` complet (surtout pour Prisma).
- **Couverture de Tests** : 
  - **Exceptionnelle sur l'E2E**: Présence impressionnante de plus de 45 fichiers de spécifications Playwright dans `e2e/` (Auth, A11y, Admin, CP1 à CP5, Diagnostic, RDV…).
- **Code mort ou duplication** :
  - Logique d'ingestion fortement dupliquée : les handlers CRON pour (`ingest-aids.js`, `ingest-demarches.js`, `ingest-structures.js`) partagent beaucoup de code (catch errors, mise à jour DB, Sentry traps). Il conviendrait de créer un service centralisé `IngestionPipelineCore`.

---

# 🚀 5. LE PLAN DE BATAILLE DÉFINITIF (Master Roadmap)

Voici les prochaines étapes prioritaires pour stabiliser une version **v1.1.0** parfaite, ordonnées par urgence vitale.

### 🔴 P0 : Urgences absolues (Corrections de Sécurité et Prévention Crash)
1. **OOM Prevent (pgvector)** : Créer une migration Prisma SQL raw pour ajouter un index **IVFFlat ou HNSW** au champ vectoriel `embedding` (3072) du modèle `Aide`. Sans cela, la BDD crashera sous le poids des requêtes IA.
2. **Sentry Data Scrubbing** : Valider manuellement l'obfuscation des PII (Emails, IPs, `req.query`) dans la stack de logs Sentry existante.

### 🟠 P1 : Finalisation du "Cœur de métier"
3. **Fiabilisation d'OpenFisca** : S'affranchir de l'API publique (`api.fr.openfisca.org`). Déployer l'image Docker officielle d'OpenFisca-France en privé (ex: Fly.io ou Render) avec SLA garanti et injecter l'URL interne en prod.
4. **Solidifier les Ingestions** : Factoriser les comportements communs des CRON jobs (`ingest-*`) pour obtenir un pipeline unifié avec gestion des retries et tracking d'erreur.

### 🟡 P2 : Résorption de la dette technique
5. **Coverage et TS strict** : Convertir les utilitaires sensibles (`crypto.js`, `vault.js`, middlewares Auth) de JS+JSDoc vers TypeScript strict pur (`.ts`) pour accroître la sûreté de la sécurité au build time.
6. **Vercel Functions Size** : Vérifier le poids du Serverless function `api/` et s'assurer que les bibliothèques lourdes (`mongoose` si ex-DB, `puppeteer` export PDF) ne créent pas des cold-starts rédhibitoires.

### 🟢 P3 : Améliorations futures
7. **PWA et Offline Mode** : Développer un Service Worker local avec base IndexedDB pour permettre aux utilisateurs isolés ou mal-connectés de stocker le résultat de leur Diagnostic sans réseau.
8. **Observabilité Vitals** : Intégrer les Web Vitals metrics réels (TTFB, LCP, CLS) des citoyens dans Google Analytics / Sentry Monitor au quotidien.
