# Authentification — Parcours Public / Pro / Admin

> **Dernière mise à jour** : 2026-02-23
> Voir aussi : [SECURITY_MODEL.md](./SECURITY_MODEL.md) · [RUNBOOK.md](./RUNBOOK.md)

---

## 1. Vue d'ensemble

AccesDirectAide expose **trois personas** avec des parcours d'authentification distincts :

| Persona | Description | Point d'entrée | Protection |
|---------|-------------|----------------|------------|
| **Public (Bénéficiaire)** | Usager citoyen qui consulte les aides/démarches | `/login`, `/auth/login` | Aucune (pages publiques) + `RequireAuth` pour `/compte/*` |
| **Pro (Professionnel)** | Agent de structure qui gère RDV et services | `/pro/login`, `/pro/register` | `ProGuard` (vérifie `pro_token` dans `localStorage`) |
| **Admin** | Opérateur plateforme | `/admin/login` | `AdminGuard` (UI) + `verifyAdmin` (API) |

Aucun de ces parcours ne partage de token ou de mécanisme d'auth. Ils sont **entièrement isolés**.

---

## 2. Parcours Public (Bénéficiaire / Citoyen)

### Routes

| Route | Composant | Usage |
|-------|-----------|-------|
| `/login` | `Login` | Page d'accueil connexion (liens vers auth et pro) |
| `/auth/login` | `AuthRdvAccess mode="login"` | Connexion citoyen (email/mot de passe) |
| `/auth/signup` | `AuthRdvAccess mode="signup"` | Inscription citoyen |
| `/auth/verify-email` | `AuthVerifyEmail` | Vérification email |
| `/auth/forgot` | `AuthForgotPassword` | Mot de passe oublié |
| `/auth/reset` | `AuthResetPassword` | Réinitialisation mot de passe |
| `/compte/messages` | `CompteMessages` | Messages RDV (requiert auth citoyen) |
| `/compte/messages/:id` | `CompteMessageThread` | Fil de conversation (requiert auth citoyen) |

**Preuve** : `src/pages/index.jsx` L208-215

### Modèle de données

```
model CitizenUser {
  id               String   @id @default(uuid())
  email            String   @unique
  passwordHash     String
  emailVerifiedAt  DateTime?
  // ... authTokens, rdvConversations
}
```

**Preuve** : `prisma/schema.prisma` L475-489

### Stockage token côté client

- **Clé** : `sessionStorage.getItem('access_token')`
- **Type** : Opaque (géré par `apiClient.auth`)

**Preuve** : `src/api/client.js` L16

### UX attendu

1. L'usager clique "Se connecter" dans le header → `/login`
2. Depuis `/login`, il choisit "Connexion citoyen" → `/auth/login`
3. Après connexion, redirection vers la page précédente (via param `next`)
4. Les routes `/compte/*` nécessitent un token citoyen valide

---

## 3. Parcours Pro (Professionnel)

### Routes

| Route | Composant | Protection |
|-------|-----------|------------|
| `/pro/login` | `ProLogin` | Aucune (publique) |
| `/pro/register` | `ProRegister` | Aucune (publique) |
| `/pro/forgot-password` | `ProForgotPassword` | Aucune (publique) |
| `/pro/reset-password` | `ProResetPassword` | Aucune (publique) |
| `/pro/dashboard` | `ProDashboard` | `ProGuard` |
| `/pro/rdv/*` | RDV (services, agenda, etc.) | `ProGuard` |
| `/pro/messages` | `ProMessages` | `ProGuard` |
| `/pro/messages/:id` | `ProMessageThread` | `ProGuard` |
| `/pro/team` | `ProTeam` | `ProGuard` |
| `/pro/structure` | `ProStructure` | `ProGuard` |
| `/pro/appointments/:id` | `ProAppointmentDetail` | `ProGuard` |

**Preuve** : `src/pages/index.jsx` L174-197

### Redirect legacy

`/login/pro` → redirige automatiquement vers `/pro/login` (via `<Navigate>`)

**Preuve** : `src/pages/index.jsx` L278

### Modèle de données

```
model ProUser {
  id            String  @id @default(uuid())
  email         String
  password_hash String
  role          String  // PRO | STRUCTURE_ADMIN | SUPERADMIN
  status        String  @default("pending")
  structureId   String
  // ... appointments, messages
  @@unique([structureId, email])
}
```

**Preuve** : `prisma/schema.prisma` L518-535

### Token JWT

| Propriété | Valeur |
|-----------|--------|
| Algorithme | HS256 |
| Durée | 8 heures |
| Issuer | `accesdirectaide` |
| Audience | `accesdirectaide-pro` |
| Claims | `userId`, `email`, `structureId`, `role`, `scope: "pro"` |
| Stockage client | `localStorage.getItem('pro_token')` |

**Preuve** : `api/lib/pro-auth.js` `signProToken()` L46-72 (JWT) · `src/pages/pro/Login.jsx` L42 (stockage)

### ProGuard (Frontend)

```jsx
// src/components/ProGuard.jsx
export default function ProGuard({ children }) {
    const token = localStorage.getItem('pro_token');
    if (!token) {
        return <Navigate to={`/login?mode=pro&next=...`} replace />;
    }
    return children;
}
```

Si pas de `pro_token`, redirecte vers `/login?mode=pro&next=<path>`.

**Preuve** : `src/components/ProGuard.jsx` L4-14

### API — `requireAuth` (Backend)

Tous les endpoints `/api/pro/*` utilisent le HOF `requireAuth(handler, allowedRoles)` de `api/lib/pro-auth.js` qui :
1. Extrait le `Bearer` token du header `Authorization`
2. Vérifie via `verifyProToken(token)` (HS256, issuer, audience)
3. Rejette si claims invalides (scope ≠ "pro", role inconnu, userId/structureId manquants)
4. Attache `req.user` avec `{ userId, email, structureId, role }`

**Preuve** : `api/lib/pro-auth.js` `requireAuth()` L173-205

---

## 4. Parcours Admin

### Routes

| Route | Composant | Protection |
|-------|-----------|------------|
| `/admin/login` | `AdminLogin` | Aucune (publique) |
| `/admin` | → Redirige vers `/admin/aides` | `<Navigate>` |
| `/admin/aides` | `AdminAides` | `AdminGuard` |
| `/admin/aides/:id` | `AdminAideEdit` | `AdminGuard` |
| `/admin/demarches` | `AdminDemarches` | `AdminGuard` |
| `/admin/demarches/:id` | `AdminDemarcheEdit` | `AdminGuard` |
| `/admin/structures` | `AdminStructures` | `AdminGuard` |
| `/admin/appointments` | `AdminAppointments` | `AdminGuard` |
| `/admin/health` | `AdminHealth` | `AdminGuard` |
| `/admin/observability` | `AdminObservability` | `AdminGuard` |
| `/admin/review-queue` | `AdminReviewQueue` | `AdminGuard` |
| `/admin/inbox` | `AdminInbox` | `AdminGuard` |
| `/admin/runs` | `AdminRuns` | `AdminGuard` |
| `/admin/guides/sync` | `AdminGuideSync` | `AdminGuard` |
| `/admin/messages` | `AdminMessages` | `AdminGuard` |
| `/admin/review` | `AdminReview` | `AdminGuard` |
| `/admin/sync/recent` | `AdminRecentSyncs` | `AdminGuard` |
| `/admin/sources` | `AdminSources` | `AdminGuard` |
| `/admin/sync` | `AdminSync` | `AdminGuard` |
| `/admin/sync/test` | `AdminTestSync` | `AdminGuard` |

**Preuve** : `src/pages/index.jsx` L222-247

### Modèle de données

```
model AdminUser {
  id                  String   @id @default(uuid())
  email               String   @unique
  password            String
  role                String   @default("admin")
  failedLoginAttempts Int      @default(0)
  lockoutUntil        DateTime?
}
```

**Preuve** : `prisma/schema.prisma` L463-473

### AdminGuard (Frontend)

```jsx
// src/components/AdminGuard.jsx (simplifié)
export default function AdminGuard({ children }) {
    const user = await apiClient.auth.getUser();
    if (!isAdminUser(user)) return <Navigate to="/admin/login" />;
    return <>
        <meta name="robots" content="noindex, nofollow" />
        {children}
    </>;
}
```

Vérifie `role === "admin"` (+ variantes legacy `is_admin`, `isAdmin`, `roles.includes("admin")`).
Si échec → redirige vers `/admin/login`.
Toutes les pages admin reçoivent `noindex, nofollow`.

**Preuve** : `src/components/AdminGuard.jsx` L1-64

### Token admin côté client

- **Clé** : `sessionStorage.getItem('access_token')`
- **Lifecycle** : défini à `/admin/login`, supprimé à la déconnexion ou fermeture onglet

**Preuve** : `src/api/client.js` L16, L135, L139

### `verifyAdmin` (Backend)

Tous les handlers `/api/admin/*` utilisent `verifyAdmin(req)` de `api/_utils/auth.js` :

1. Extrait le `Bearer` token
2. Vérifie d'abord via `verifyLegacyAdminToken` (comparaison timing-safe vs `ADMIN_TOKEN`)
3. Sinon vérifie via `verifyAdminSessionToken` (JWT HS256, issuer/audience admin)
4. Retourne `true` si l'un des deux passe, `false` sinon

> **Important** : Aucun bypass `devLoginEnabled` n'est autorisé (supprimé en P0-04).

**Preuve** : `api/_utils/auth.js` `verifyAdmin()` L201-210

---

## 5. Matrice des routes

| Route | Persona | Visible nav ? | Protection | Token requis |
|-------|---------|--------------|------------|--------------|
| `/` | Public | ✅ Header | Aucune | Non |
| `/aides` | Public | ✅ Header | Aucune | Non |
| `/demarches` | Public | ✅ Header | Aucune | Non |
| `/annuaire` | Public | ✅ Header | Aucune | Non |
| `/actualites` | Public | ✅ Header | Aucune | Non |
| `/login` | Public | ✅ Header ("Se connecter") | Aucune | Non |
| `/auth/login` | Public | ❌ | Aucune | Non |
| `/auth/signup` | Public | ❌ | Aucune | Non |
| `/auth/verify-email` | Public | ❌ | Aucune | Non |
| `/auth/forgot` | Public | ❌ | Aucune | Non |
| `/auth/reset` | Public | ❌ | Aucune | Non |
| `/compte/messages` | Public | ❌ | `RequireAuth` (citoyen) | `sessionStorage('access_token')` |
| `/pro/login` | Pro | ❌ | Aucune | Non |
| `/pro/register` | Pro | ✅ Footer ("Créer un compte") | Aucune | Non |
| `/pro/forgot-password` | Pro | ❌ | Aucune | Non |
| `/pro/dashboard` | Pro | ❌ (dans layout pro) | `ProGuard` | `localStorage('pro_token')` |
| `/pro/rdv/*` | Pro | ❌ (dans layout pro) | `ProGuard` | `localStorage('pro_token')` |
| `/pro/messages` | Pro | ❌ (dans layout pro) | `ProGuard` | `localStorage('pro_token')` |
| `/pro/team` | Pro | ❌ (dans layout pro) | `ProGuard` | `localStorage('pro_token')` |
| `/pro/structure` | Pro | ❌ (dans layout pro) | `ProGuard` | `localStorage('pro_token')` |
| `/admin/login` | Admin | ❌ | Aucune | Non |
| `/admin/aides` | Admin | ❌ | `AdminGuard` + `verifyAdmin` (API) | `sessionStorage('access_token')` |
| `/admin/*` (autres) | Admin | ❌ | `AdminGuard` + `verifyAdmin` (API) | `sessionStorage('access_token')` |

---

## 6. Variables d'environnement

> ⚠️ **Ne jamais exposer les valeurs.** Seuls les noms sont listés ici.

| Variable | Rôle | Fichier |
|----------|------|---------|
| `JWT_SECRET` | Secret pour signer/vérifier les JWT (pro et admin) | `api/lib/pro-auth.js`, `api/_utils/auth.js` |
| `ADMIN_TOKEN` | Token statique legacy pour authentification admin API | `api/_utils/auth.js` (`verifyLegacyAdminToken`) |
| `ADA_ENCRYPTION_KEY` | Clé de chiffrement des données sensibles (bénéficiaires) | `api/_utils/encryption-v1.js` |
| `VITE_DEV_LOGIN_ENABLED` | **Legacy** — référencé dans `src/config/env.js` mais ne contrôle plus aucune route | `src/config/env.js` L33 |

> **Note** : `AUTH_SECRET` et `AUTH_MODE` ne sont **pas trouvés** dans le code source.

---

## 7. FAQ — "Pourquoi je ne vois pas Se connecter / Créer un compte ?"

### Le header affiche bien ces liens

Les liens "Se connecter" et "Créer un compte (Pro)" sont rendus dans `src/pages/Layout.jsx` :

```jsx
// Layout.jsx L291-308 — Desktop auth links
<div className="hidden items-center gap-2 lg:flex">
  <Link to="/login">Se connecter</Link>
  <Link to="/pro/register">Créer un compte (Pro)</Link>
</div>
```

**Preuve** : `src/pages/Layout.jsx` L291-308 (desktop) + L380-400 (mobile drawer)

### Diagnostic rapide

1. **Vérifier le viewport** : les liens desktop sont masqués sous `lg:` (1024px). En mobile, ils sont dans le drawer hamburger.

2. **Vérifier le routeur** : les pages `/pro/*` sont rendues dans un `ProLayout` isolé (L170-201 de `index.jsx`). Elles n'utilisent **pas** le `Layout.jsx` principal → pas de header avec "Se connecter".

> Le composant `src/components/layout/Header.jsx` existe mais est **orphelin** : il n'est importé par aucune page active. Le header effectif est celui codé dans `Layout.jsx`.

---

## 8. Conventions et standards

- **Frontend** :
  - `AdminGuard` pour toute route `/admin/*` (sauf `/admin/login`)
  - `ProGuard` pour toute route `/pro/*` authentifiée
  - `<Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>` sur toutes les pages admin

- **Backend** :
  - `verifyAdmin(req)` de `api/_utils/auth.js` pour tout handler `/api/admin/*`
  - `requireAuth(handler, roles)` de `api/lib/pro-auth.js` pour tout handler `/api/pro/*`
  - **Interdit** : bypass `devLoginEnabled`, vérification custom `isAdmin`, JWT non-HS256

- **Tokens** :
  - Pro : `localStorage('pro_token')` — persiste entre sessions
  - Admin : `sessionStorage('access_token')` — détruit à la fermeture de l'onglet
  - Citoyen : `sessionStorage('access_token')` — même clé que admin, contexte différent

> Voir [SECURITY_MODEL.md](./SECURITY_MODEL.md) pour les détails sur rate limiting, chiffrement, et niveaux d'accès.
