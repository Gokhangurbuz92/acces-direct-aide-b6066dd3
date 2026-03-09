# 📖 Accès Direct Aide — Code Wiki & Documentation Rapide

Bienvenue dans la documentation technique centrale du projet **Accès Direct Aide**. Ce projet propose une plateforme sécurisée connectant les structures professionnelles d'aide sociale avec les bénéficiaires (citoyens).

---

## 🌍 Vue d'ensemble du projet

### But Principal
**Accès Direct Aide** a pour vocation de simplifier, centraliser et sécuriser l'accès à l'information et à l'accompagnement social. Le projet s'appuie sur une philosophie **Zero-Knowledge** garantissant que les données sensibles des usagers (documents, messages) restent strictement confidentielles via un chiffrement de bout en bout.

### À qui s'adresse l'application ?
L'application cible deux publics majeurs :
1. **Les Citoyens (Bénéficiaires) :** Peuvent rechercher des aides adaptées à leur situation (traduites en langage simplifié FALC par l'IA), prendre rendez-vous, transférer des documents de manière sécurisée sans avoir à créer de compte classique (système de "Passeport" par token).
2. **Les Professionnels (Structures Sociales, Agents) :** Disposent d'un tableau de bord (Espace Pro) pour gérer leurs disponibilités, accepter des rendez-vous locaux ou en visioconférence, exporter des rapports d'impact et échanger de façon sécurisée avec les bénéficiaires.

---

## 🛠️ Stack Technique

Le projet repose sur une pile moderne de type "Serverless" optimisée pour la performance, l'accessibilité et la sécurité.

*   **Frontend :**
    *   **Cœur :** React 18, Vite, React Router DOM v7.
    *   **UI & Stylisation :** Tailwind CSS, Radix UI (base pour les composants accessibles façon shadcn/ui), Framer Motion (animations), Lucide React (icônes).
    *   **Data Fetching & State :** TanStack React Query.
    *   **Analyse & Graphiques :** Recharts.
*   **Backend (API) :**
    *   **Infrastructure :** Node.js avec architecture Serverless déployée sur **Vercel** (dossier `/api`).
    *   **Base de Données :** PostgreSQL interfacé via l'ORM **Prisma**.
    *   **Cache & Rate Limiting :** Redis (via `@upstash/redis` et `@vercel/kv`).
*   **Intelligence Artificielle & Inclusion (Phase 3) :**
    *   **LLMs :** OpenAI et Google Generative AI (Gemini). Utilisés pour la simplification FALC (Facile À Lire et à Comprendre) et le moteur RAG "Boussole Sociale".
*   **Sécurité (Zero-Knowledge) :**
    *   Chiffrement **AES-256-GCM** pour les données personnelles (PII).
    *   Hachage des mots de passe avec `bcryptjs`.
    *   JWT pour les sessions de l'espace professionnel.
*   **DevOps & Qualité :**
    *   **Tests E2E :** Playwright (tests d'accessibilité et fonctionnels).
    *   **Composants & Design System :** Storybook & Chromatic.
    *   **Linting/Typage :** ESLint, TypeScript (vérification avec `tsc`), Prettier.
    *   **Observabilité :** Sentry, Pino (Logging structuré).

---

## 🏢 Architecture du Code

L'architecture du projet est conçue de manière modulaire, séparant clairement la logique front-end, l'API back-end et la donnée.

| Dossier Principal | Description |
| :--- | :--- |
| **`/src`** | Contient l'intégralité du code front-end (React). Organisé par `/components` (UI partagée), `/pages` (vues de l'application), `/lib` (utilitaires et api client), `/hooks`, `/contexts`. |
| **`/api`** | Héberge les Serverless Functions (Backend complet routé pour Vercel). On y trouve les endpoints pour l'authentification (`/auth`), la gestion des pros, les intégrations IA et la signature des rendez-vous. |
| **`/prisma`** | Contient le schéma de la base de données (`schema.prisma`) décrivant des dizaines de modèles (Aides, Structures, Appointments, Messages, etc.), ainsi que les fichiers de `seed` et les migrations SQL. |
| **`/docs`** | Documentation approfondie (infrastructures, protocoles Vercel, rapports d'audit, guides E2E). |
| **`/tests` et `/e2e`** | Suites de tests. `/e2e` est propulsé par Playwright pour valider le parcours utilisateur global et vérifier le respect stricts des règles d'accessibilité (A11y). |
| **`/scripts`** | Outils internes (Node/Bash) pour le build, le typage strict (`tsc`), les diagnostics système, backfill DB, et audits de sécurité. |
| **`/packages`** | Indique potentiellement une future ou actuelle structure monorepo permettant de partager du code entre plusieurs applications. |

---

## ✨ Fonctionnalités Clés

1.  **Annuaire Universel & Aides :** Scraping/Ingestion d'aides depuis diverses sources avec simplification instantanée en FALC par IA pour l'accessibilité cognitive.
2.  **Boussole Sociale (Assistant RAG) :** Un outil d'orientation propulsé par l'IA pour guider l'usager vers le bon service ou la bonne démarche selon son profil.
3.  **Booking de Rendez-vous (Public & Pro) :**
    *   Côté Usager : Prise de rendez-vous fluide sans création de compte complexe (géré par un token/passeport encrypté).
    *   Côté Pro : Gestion d'agenda, synchronisation Outlook, paramétrage avancé des buffers de temps, et déclenchement de Visioconférence (Jitsi).
4.  **Messagerie et Coffre-fort E2EE :**
    *   Échange de pièces jointes (via AWS S3) et de messages.
    *   Déchiffrement effectué uniquement dans le navigateur client de l'agent ou de l'usager, garantissant l'absence de fuite côté serveur.
5.  **Pilotage, Rapports & Audit :** Outils de reporting incluant des statistiques d'impact, un journal d'audit strict RGPD et la transmission automatique au SI-SIAO.

---

## 🚀 Guide de Démarrage (Local Development)

Pour qu'un nouveau développeur puisse configurer l'environnement complet en local, suivez ces étapes :

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js** (v20+)
- **NPM** (v10+)
- **Docker** et **Docker Compose** (pour la base PostgreSQL locale)

### 2. Installation des dépendances
Cloner le dépôt, puis installer les paquets à l'aide de :
```bash
npm ci
```
*(Utilisez `npm ci` plutôt que `npm install` pour garantir la reproductibilité depuis le `package-lock.json`.)*

### 3. Configuration de l'environnement
Copiez le fichier d'exemple pour initialiser vos variables d'environnement locales :
```bash
cp .env.example .env
```
Assurez-vous que la variable `DATABASE_URL` pointe bien vers votre base locale (c'est le cas par défaut dans l'exemple).

### 4. Lancement de la Base de Données (Docker)
Démarrez le conteneur PostgreSQL en arrière-plan et appliquez les migrations Prisma pour générer les tables :
```bash
docker compose up -d
npx prisma migrate dev
```
*(Optionnel) Si vous souhaitez avoir un jeu d'essai, vous pouvez lancer `npm run db:seed`.*

### 5. Démarrer le Serveur de Développement
Lancez le backend API et le front-end React avec Vite :
```bash
npm run dev
```
Vous pouvez désormais accéder à l'application métier sur **[http://localhost:5173](http://localhost:5173)**.

### Vérification Avant Commit (Preflight)
Avant de proposer un correctif (Pull Request), lancez la pipeline de vérification locale complète :
```bash
npm run preflight
```
Cette commande exécute le lint, le typecheck TypeScript, la suite de tests unitaires et vérifie que le build de production s'effectue sans erreur.
