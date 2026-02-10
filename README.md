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