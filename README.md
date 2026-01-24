# Accès Direct Aide

Platform connecting professional aid structures with beneficiaries, featuring secure appointment booking, messaging, and document exchange. Built with React, Node.js (Vercel Serverless), and Prisma (PostgreSQL).

## Features

- **Public**: Search & View Aid/Structure information (FALC accessibility).
- **Pro**: Manage structure, team, services, and availability.
- **Appointments**: Secure booking flow with token-based access for beneficiaries.
- **Messaging**: End-to-end encrypted messaging and file exchange between Pro and Beneficiary.
- **Privacy**: Strict PII encryption (AES-256-GCM) and tenant isolation.

## Getting Started (Development)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in the required keys.
    ```bash
    cp .env.example .env
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## Turnkey Verification (Quick Start)

To quickly generate a test environment with a Pro account, Beneficiary, and active conversation:

1.  Ensure `npm run dev` is running.
2.  Run the setup script:
    ```bash
    node scripts/dev-demo-setup.js
    ```
3.  The script will output:
    - A **Beneficiary Magic Link** (access messages without login).
    - **Pro Credentials** (login at `/pro/login`).

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