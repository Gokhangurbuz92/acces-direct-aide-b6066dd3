# Accès Direct Aide

Platform connecting professional aid structures with beneficiaries, featuring secure appointment booking, messaging, and document exchange. Built with React, Node.js (Vercel Serverless), and Prisma (PostgreSQL).

## Features

- **Public**: Search & View Aid/Structure information (FALC accessibility).
- **Pro**: Manage structure, team, services, and availability.
- **Appointments**: Secure booking flow with token-based access for beneficiaries.
- **Messaging**: End-to-end encrypted messaging and file exchange between Pro and Beneficiary.
- **Privacy**: Strict PII encryption (AES-256-GCM) and tenant isolation.

## Prerequisites

- **Node.js**: v20 or later.
- **Docker**: (Recommended) for local PostgreSQL.
- **NPM**: v10 or later.

## Getting Started (Development)

1.  **Install Dependencies**
    Always use `npm ci` to ensure a consistent environment based on the lockfile.
    ```bash
    npm ci
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env`.
    ```bash
    cp .env.example .env
    ```
    *Note: For local development, ensure your DATABASE_URL points to a local PostgreSQL instance.*

3.  **Local Database (Docker)**
    Start a local PostgreSQL instance and apply migrations:
    ```bash
    docker-compose up -d
    npx prisma migrate dev
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.


## Architecture

- **Frontend**: Vite + React + Tailwind CSS.
- **Backend**: Node.js API (Serverless functions in `/api`).
- **Database**: PostgreSQL (Prisma ORM).
- **Storage**: Local (Dev) or S3-compatible (Prod).
- **Security**:
    - Passwords hashed with `bcrypt`.
    - Sensitive data (names, contacts, messages, files) encrypted with `AES-256-GCM`.
    - Rate limiting via Vercel KV.

## Deployment

1.  **Build**
    ```bash
    npm run build
    ```

2.  **Vercel Deployment**
    - Connect repository to Vercel.
    - Set Environment Variables (see `.env.example`).
    - Deploy.

## Deployment & Infrastructure

For detailed information about our Production and Staging environments, DNS configuration, and Git workflow, please refer to:

- [Infrastructure Source of Truth](docs/INFRASTRUCTURE.md)
- [Vercel Migration Guide](docs/VERCEL_MIGRATION_GUIDE.md)

## Setup Chromatic

To enable the blocking visual regression CI:
1. Go to your GitHub repository **Settings** -> **Secrets and variables** -> **Actions**
2. Click **New repository secret**.
3. Name MUST be exactly: `CHROMATIC_PROJECT_TOKEN`
4. Value: The token obtained from your Chromatic project dashboard.
*(Never commit this token into the codebase).*

## Contribuer / Guardrails

### Préflight
Avant de soumettre une Pull Request, exécutez la commande suivante qui regroupe toutes les vérifications :

```bash
npm run preflight
```
*(Celle-ci lance : `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`)*

### Règles Minimales (DoD)
- **Couleurs :** Pas de couleurs hardcodées (ex: `#xxxxxx`) dans `src/components/**`.
- **Design System :** Pas de classes palette (ex: `bg-blue-500` ou `text-slate-400`) dans `src/components/ui/**`. Utilisez les tokens fournis.
- **Storybook :** Stories Storybook obligatoires pour chaque nouveau composant du Design System (DS).