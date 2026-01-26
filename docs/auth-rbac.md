# Authentication & RBAC

## Overview
This document describes the authentication and Role-Based Access Control (RBAC) system for the Professional Space.

## Authentication
Authentication is handled via JWT (JSON Web Tokens).
- **Token Validity**: 8 hours.
- **Storage**: Client-side (localStorage `pro_token`).
- **Endpoints**:
  - `POST /api/pro/auth/login`: Issues token.
  - `POST /api/pro/auth/register`: Creates structure + admin user + issues token.
  - `POST /api/pro/auth/forgot-password`: Initiates reset flow (mock email).
  - `POST /api/pro/auth/reset-password`: Completes reset flow.

## Authorization (RBAC)
We use a role-based system enforced by middleware.

### Roles
1. **PRO**: Standard professional user. Can manage appointments.
2. **STRUCTURE_ADMIN**: Can manage structure settings, team members, and services.
3. **SUPERADMIN**: Global admin (can access everything).

### Middleware (`requireAuth`)
The `requireAuth` Higher-Order Function (HOF) protects API routes.
```javascript
export default requireAuth(handler, [ROLE.STRUCTURE_ADMIN]);
```
- If no roles specified, any authenticated Pro user can access.
- If roles specified, user must have one of them (or be SUPERADMIN).

### Segregation
- **Pro vs Admin**: Pro users cannot access `/api/admin/*` endpoints. Admin endpoints require a static `ADMIN_TOKEN` which is distinct from Pro JWTs.
- **Structure Isolation**: Users can only access data belonging to their structure (`structureId` check in handlers).

## Security Measures

### Rate Limiting
Implemented via `api/_utils/rateLimit.js` (Hybrid: KV / Redis / Memory).
- **Login**: 5 attempts / 15 min.
- **Password Reset**: 3 attempts / hour.
- **Brute-force protection**: Applied to IP and Email.

### Audit Logging
Critical actions are logged to `AuditLog` table.
- **Events**: Login, Register, Password Reset.
- **IP Privacy**: IP addresses are hashed (`sha256`) before storage if required, or stored raw with retention policy (currently storing both/raw for MVP, hash implemented in code).

### Password Security
- Passwords are hashed using `bcrypt`.
- Reset tokens are cryptographically secure (32 bytes hex) and stored in KV with 1 hour TTL.
