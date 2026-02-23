# Guide d'intégration Auth JWT — AccesDirectAide

> **Dernière mise à jour** : 2026-02-23
> Voir aussi : [Auth.md](./Auth.md) (parcours utilisateurs) · [SECURITY_MODEL.md](./SECURITY_MODEL.md) · [RUNBOOK.md](./RUNBOOK.md)

---

## 1. Vue d'ensemble

AccesDirectAide utilise une authentification **maison** basée sur :

- **bcryptjs** — hachage des mots de passe (coût 10)
- **jsonwebtoken** — émission et vérification des JWT (HS256)
- **Prisma** — persistance des utilisateurs (`ProUser`, `AdminUser`, `CitizenUser`)

Trois personas utilisent l'auth avec des parcours **entièrement isolés** :

| Persona | Modèle Prisma | JWT scope | Stockage token client | Expiration |
|---------|---------------|-----------|----------------------|------------|
| **Pro** (professionnel) | `ProUser` | `pro` | `localStorage('pro_token')` | 8 h |
| **Admin** (opérateur) | `AdminUser` | `admin` | `sessionStorage('access_token')` | 8 h (JWT) ou permanent (token statique) |
| **User** (citoyen) | `CitizenUser` | `user` | Cookie HttpOnly `ada_user_session` | 7 jours |

Aucun token n'est partagé entre personas. Chaque système possède son propre secret, issuer et audience.

**Preuve** : `api/lib/pro-auth.js` L21-22, `api/_utils/auth.js` L6-7, `api/_utils/user-auth.js` L8-9

---

## 2. Variables d'environnement

> ⚠️ **Ne jamais exposer de valeurs.** Seuls les noms et formats sont documentés.
> Ne jamais préfixer un secret par `VITE_` (exposé côté client).

| Variable | Rôle | Format attendu | Fichier source |
|----------|------|---------------|----------------|
| `JWT_SECRET` | Secret principal pour signer/vérifier tous les JWT | Chaîne ≥ 32 caractères, aléatoire | `api/lib/pro-auth.js` L12, `api/_utils/env.js` L209 |
| `ADMIN_TOKEN` | Token statique legacy pour l'auth admin API | Chaîne ≥ 32 caractères, aléatoire | `api/_utils/env.js` L218, `api/_utils/auth.js` L49 |
| `ADMIN_EMAIL` | Email de l'administrateur | Format email valide | `api/_handlers/auth/login.js` L29 |
| `ADMIN_PASSWORD` | Mot de passe admin (mode `token`) | Chaîne sécurisée | `api/_handlers/auth/login.js` L33 |
| `AUTH_SECRET` | Secret alternatif pour JWT admin/user (fallback sur `JWT_SECRET`) | Chaîne ≥ 32 caractères | `api/_utils/env.js` L239 |
| `AUTH_MODE` | Mode d'auth admin : `token` (défaut) ou `jwt` | `token` \| `jwt` | `api/_handlers/auth/login.js` L23 |
| `ADA_ENCRYPTION_KEY` | Clé de chiffrement des données sensibles | Chaîne ≥ 32 caractères | Vérifié par `scripts/diagnostic-env.js` |

**Preuve** — résolution du secret JWT :

```js
// api/_utils/env.js L209
return getEnv('JWT_SECRET');

// api/_utils/auth.js L57-58 (fallback)
function getAdminSessionSecret() {
  return env.auth.secret || env.secrets.jwtSecret;
}
```

---

## 3. Endpoints d'authentification

### 3.1 Login Admin + User — `POST /api/auth/login`

**Fichier** : `api/_handlers/auth/login.js`

Cet endpoint gère **deux flux** dans le même handler :

#### Flux Admin (si `mode=admin` ou credentials admin valides)

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***", "password": "***", "mode": "admin" }` |
| Succès (200) | `{ "success": true, "token": "***", "authMode": "token|jwt", "user": { "email": "***", "role": "admin" } }` |
| 401 | Credentials invalides |
| 500 | `JWT_SECRET` ou `ADMIN_TOKEN` manquant (selon `AUTH_MODE`) |

**Preuve** : `api/_handlers/auth/login.js` L38-59

#### Flux Citoyen (sinon)

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***", "password": "***" }` |
| Succès (200) | `{ "success": true, "session": { "kind": "user" }, "user": { "id": "***", "role": "user" } }` + cookie `Set-Cookie: ada_user_session=***` |
| 400 | Email invalide ou mot de passe manquant |
| 401 | Credentials invalides |
| 403 | Email non vérifié (`EMAIL_NOT_VERIFIED`) |
| 429 | Rate limit (IP ou email) |
| 500 | Erreur interne |

**Preuve** : `api/_handlers/auth/login.js` L83-121

---

### 3.2 Inscription Citoyen — `POST /api/auth/signup`

**Fichier** : `api/_handlers/auth/signup.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***", "password": "***", "phone": "***" }` |
| Succès (200) | `{ "ok": true, "message": "Si l'email est valide, un lien a été envoyé." }` |
| 400 | Email invalide ou mot de passe < 8 caractères |
| 429 | Rate limit (IP ou email) |

> Envoie un email de vérification. Ne retourne **jamais** de token directement.

**Preuve** : `api/_handlers/auth/signup.js` L22-111

---

### 3.3 Session utilisateur — `GET /api/auth/me`

**Fichier** : `api/_handlers/auth/me.js`

Résout la session en 3 étapes :
1. Tente `Bearer` token → vérifie Pro JWT ou Admin token/JWT
2. Sinon, lit cookie `ada_user_session` → vérifie User JWT
3. Retourne `401` si rien ne match

| Entrée | Valeur |
|--------|--------|
| Header | `Authorization: Bearer <token>` **ou** cookie `ada_user_session` |
| Succès Pro (200) | `{ "session": { "kind": "pro", "authType": "pro_jwt" }, "user": { "id": "***", ... } }` |
| Succès Admin (200) | `{ "session": { "kind": "admin", "authType": "admin_token|admin_jwt" }, ... }` |
| Succès User (200) | `{ "session": { "kind": "user", "authType": "user_cookie" }, ... }` |
| 401 | Aucun token/cookie valide |

**Preuve** : `api/_handlers/auth/me.js` L10-81

---

### 3.4 Déconnexion citoyen — `POST /api/auth/logout`

**Fichier** : `api/_handlers/auth/logout.js`

| Champ | Valeur |
|-------|--------|
| Succès (200) | `{ "ok": true }` + `Set-Cookie: ada_user_session=; Max-Age=0` |

**Preuve** : `api/_handlers/auth/logout.js` L7-14

---

### 3.5 Vérification email — `GET /api/auth/verify-email`

**Fichier** : `api/_handlers/auth/verify-email.js`

Redirige (302) vers `/auth/verify-email?status=success|invalid|expired`.

---

### 3.6 Mot de passe oublié — `POST /api/auth/forgot-password`

**Fichier** : `api/_handlers/auth/forgot-password.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***" }` |
| Retour (200 toujours) | `{ "ok": true, "message": "Si l'email est valide, un lien a été envoyé." }` |
| 429 | Rate limit |

> Retourne toujours 200 pour éviter l'énumération d'emails.

---

### 3.7 Reset mot de passe citoyen — `POST /api/auth/reset-password`

**Fichier** : `api/_handlers/auth/reset-password.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "token": "***", "password": "***" }` |
| Succès (200) | `{ "ok": true }` |
| 400 | Token manquant, mot de passe < 8 chars, token invalide/expiré |
| 429 | Rate limit |

---

### 3.8 Login Pro — `POST /api/pro/auth/login`

**Fichier** : `api/_handlers/pro/auth/login.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***", "password": "***" }` |
| Succès (200) | `{ "token": "<JWT>", "user": { "id": "***", "email": "***", "role": "***", "structureId": "***" } }` |
| 400 | Email ou mot de passe manquant |
| 401 | Credentials invalides |
| 403 | Compte désactivé |
| 429 | Rate limit (IP ou email) |
| 500 | Erreur interne |

**Preuve JWT** :

```js
// api/lib/pro-auth.js L56-71 — signProToken()
return jwt.sign(
    { userId: user.id, email: user.email,
      structureId: user.structureId, role: user.role,
      scope: 'pro' },
    JWT_SECRET,
    { expiresIn: '8h', issuer: 'accesdirectaide',
      audience: 'accesdirectaide-pro', algorithm: 'HS256' }
);
```

---

### 3.9 Inscription Pro — `POST /api/pro/auth/register`

**Fichier** : `api/_handlers/pro/auth/register.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "email": "***", "password": "***", "structureName": "***" }` |
| Succès (200) | `{ "token": "<JWT>", "user": { ... } }` |
| 400 | Champ manquant ou email déjà utilisé |
| 429 | Rate limit IP |
| 500 | Erreur interne |

> Crée la structure **et** le ProUser dans une transaction atomique.

**Preuve** : `api/_handlers/pro/auth/register.js` L58-83

---

### 3.10 Reset mot de passe Pro — `POST /api/pro/auth/reset-password`

**Fichier** : `api/_handlers/pro/auth/reset-password.js`

| Champ | Valeur |
|-------|--------|
| Body | `{ "token": "***", "password": "***" }` |
| Succès (200) | `{ "message": "Mot de passe modifié avec succès." }` |
| 400 | Champ manquant, mdp < 8 chars, token invalide/expiré |
| 429 | Rate limit |

---

## 4. Schéma d'échange Front ↔ Back

### 4.1 Flux Pro

```
┌──────────┐     POST /api/pro/auth/login      ┌──────────┐
│  Client  │ ──────────────────────────────────→│  Server  │
│ (React)  │     { email, password }            │ (Vercel) │
│          │ ←──────────────────────────────────│          │
│          │     { token: "<JWT>" }              │          │
│          │                                    │          │
│  localStorage.setItem('pro_token', token)     │          │
│          │                                    │          │
│          │     GET /api/pro/rdv/services      │          │
│          │     Authorization: Bearer <JWT>    │          │
│          │ ──────────────────────────────────→│          │
│          │                                    │ requireAuth()
│          │ ←── 200 { data: [...] }            │ → req.user
└──────────┘                                    └──────────┘
```

**Stockage** : `localStorage.setItem('pro_token', token)`
**Preuve** : `src/pages/pro/Login.jsx` L42, `src/components/ProGuard.jsx` L6

**Expiration** : 8 h. **Aucun mécanisme de refresh token.** À l'expiration, l'appel API retourne `401` et `ProGuard` redirige vers `/login?mode=pro`.

---

### 4.2 Flux Admin

```
┌──────────┐     POST /api/auth/login           ┌──────────┐
│  Client  │     { email, password,             │  Server  │
│          │       mode: "admin" }              │          │
│          │ ──────────────────────────────────→│          │
│          │ ←── { token, authMode }            │          │
│          │                                    │          │
│  sessionStorage.setItem('access_token', token)│          │
│          │                                    │          │
│          │    GET /api/admin/health            │          │
│          │    Authorization: Bearer <token>   │          │
│          │ ──────────────────────────────────→│          │
│          │                                    │ resolveAuthContext()
│          │ ←── 200 { ... }                    │ → admin_token | admin_jwt
└──────────┘                                    └──────────┘
```

**Stockage** : `sessionStorage.setItem('access_token', token)` — détruit à la fermeture de l'onglet.
**Preuve** : `src/api/client.js` L135, L16

---

### 4.3 Flux Citoyen

```
┌──────────┐     POST /api/auth/login           ┌──────────┐
│  Client  │     { email, password }            │  Server  │
│          │ ──────────────────────────────────→│          │
│          │ ←── 200 + Set-Cookie:              │          │
│          │    ada_user_session=<JWT>;          │          │
│          │    HttpOnly; SameSite=Lax; Path=/   │          │
│          │                                    │          │
│          │    GET /api/auth/me                 │          │
│          │    Cookie: ada_user_session=<JWT>  │          │
│          │ ──────────────────────────────────→│          │
│          │ ←── 200 { session: { kind:"user" }}│          │
└──────────┘                                    └──────────┘
```

**Stockage** : Cookie HttpOnly `ada_user_session` (7 jours, `Secure` en production).
**Preuve** : `api/_utils/user-auth.js` L185-199 (`buildUserSessionCookie`)

---

## 5. Stockage du token côté client

| Persona | Mécanisme | Clé | Persistance | Preuve |
|---------|-----------|-----|-------------|--------|
| **Pro** | `localStorage` | `pro_token` | Persiste entre sessions/onglets | `src/pages/pro/Login.jsx` L42, `src/components/ProGuard.jsx` L6 |
| **Admin** | `sessionStorage` | `access_token` | Détruit à la fermeture de l'onglet | `src/api/client.js` L16, L135 |
| **User** | Cookie HttpOnly | `ada_user_session` | 7 jours, HttpOnly, SameSite=Lax | `api/_utils/user-auth.js` L185-199 |

> **Note** — le Pro token dans `localStorage` est accessible au JS client. C'est un choix délibéré pour simplifier le flux SPA. La sécurité repose sur la durée courte (8 h) et le rate limiting.

---

## 6. Règles de sécurité

### 6.1 Ne jamais exposer les secrets côté client

```
✅ JWT_SECRET        → variable serveur uniquement
✅ ADMIN_TOKEN       → variable serveur uniquement
✅ ADA_ENCRYPTION_KEY → variable serveur uniquement

❌ VITE_JWT_SECRET   → INTERDIT (exposé dans le bundle)
```

**Preuve** — `VITE_` expose côté client :

```js
// api/_handlers/auth/login.js L48-51
token = env.secrets.adminToken || '';
if (!token) {
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_TOKEN missing' });
}
```

### 6.2 Header/cookie attendu pour les endpoints protégés

| Endpoint | Header/Cookie requis | Guard backend |
|----------|---------------------|---------------|
| `/api/pro/*` | `Authorization: Bearer <pro_jwt>` | `requireProAuth()` — `api/_utils/auth.js` L307-345 |
| `/api/admin/*` | `Authorization: Bearer <admin_token\|admin_jwt>` | `requireAdminAuth()` — `api/_utils/auth.js` L278-299 |
| `/api/auth/me` | `Authorization: Bearer <*>` ou cookie `ada_user_session` | `resolveAuthContext()` + `verifyUserSessionToken()` |
| `/api/auth/logout` | Cookie `ada_user_session` | Aucun (efface le cookie) |

### 6.3 Rate limiting

**Prouvé actif** sur tous les endpoints d'authentification :

| Endpoint | Clé rate limit | Preuve |
|----------|---------------|--------|
| `POST /api/auth/login` | `LOGIN_USER` → IP + email | `api/_handlers/auth/login.js` L74-81 |
| `POST /api/auth/signup` | `SIGNUP_USER` → IP + email | `api/_handlers/auth/signup.js` L37-45 |
| `POST /api/auth/forgot-password` | `FORGOT_USER` → IP + email | `api/_handlers/auth/forgot-password.js` L34-41 |
| `POST /api/auth/reset-password` | `RESET_USER` → IP | `api/_handlers/auth/reset-password.js` L21-24 |
| `POST /api/pro/auth/login` | `LOGIN_PRO` → IP + email | `api/_handlers/pro/auth/login.js` L24-34 |
| `POST /api/pro/auth/register` | `LOGIN_PRO` → IP | `api/_handlers/pro/auth/register.js` L33-36 |
| `POST /api/pro/auth/reset-password` | `RESET_PASSWORD` → IP | `api/_handlers/pro/auth/reset-password.js` L29-32 |

### 6.4 Audit logging

**Prouvé actif** pour le parcours Pro uniquement :

```js
// api/lib/pro-auth.js L155-171
await prisma.auditLog.create({
    data: { action, actor_id: actorId, entity: 'ProUser',
            details: { ...details, structureId },
            ip, ip_hash: hashIp(ip) }
});
```

Actions loguées : `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTER_SUCCESS`, `RESET_SUCCESS`.

**Admin et User** : NON TROUVÉ — aucun audit log pour ces parcours.

### 6.5 Vérification JWT renforcée

L'algorithme est verrouillé à **HS256** pour prévenir les attaques par confusion d'algorithme :

```js
// api/lib/pro-auth.js L87-91
const strictDecoded = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: PRO_SESSION_ISSUER,
    audience: PRO_SESSION_AUDIENCE,
});
```

### 6.6 Comparaison timing-safe pour l'admin token

```js
// api/_utils/auth.js L37-42
function timingSafeEquals(left, right) {
    const leftBuf = Buffer.from(left);
    const rightBuf = Buffer.from(right);
    if (leftBuf.length !== rightBuf.length) return false;
    return crypto.timingSafeEqual(leftBuf, rightBuf);
}
```

---

## 7. Checklist d'intégration

### Mise en production

- [ ] `JWT_SECRET` défini (≥ 32 chars, aléatoire, unique par environnement)
- [ ] `ADMIN_TOKEN` défini (≥ 32 chars, aléatoire)
- [ ] `ADMIN_EMAIL` défini (email admin valide)
- [ ] `ADMIN_PASSWORD` défini (mot de passe admin sécurisé)
- [ ] `ADA_ENCRYPTION_KEY` défini (≥ 32 chars)
- [ ] `AUTH_MODE` défini (`token` ou `jwt`, défaut: `token`)
- [ ] Aucune variable `VITE_*` ne contient de secret

### Tests fonctionnels

- [ ] Login pro → reçoit un JWT → appels API protégés fonctionnent
- [ ] Login admin → reçoit un token → accès `/api/admin/*` fonctionne
- [ ] Login citoyen → reçoit un cookie HttpOnly → `/api/auth/me` retourne `kind: "user"`
- [ ] Token expiré → retourne `401` → frontend redirige vers login
- [ ] Rate limit → après N tentatives, retourne `429`
- [ ] Inscription citoyen → email de vérification envoyé
- [ ] Reset mot de passe → lien fonctionnel, ancien lien invalidé

### Sécurité

- [ ] `JWT_SECRET` ≠ `ADMIN_TOKEN` (secrets distincts)
- [ ] Aucun secret dans les logs ou le bundle client
- [ ] Cookie `ada_user_session` a `HttpOnly` et `Secure` (prod)

---

## 8. Troubleshooting

| Symptôme | Cause probable | Fix |
|----------|---------------|-----|
| Login admin → `500 Server misconfiguration: ADMIN_TOKEN missing` | `ADMIN_TOKEN` non défini et `AUTH_MODE=token` | Définir `ADMIN_TOKEN` dans les variables d'environnement |
| Login admin → `500 Server misconfiguration: AUTH_SECRET missing` | `AUTH_MODE=jwt` mais ni `AUTH_SECRET` ni `JWT_SECRET` défini | Définir `JWT_SECRET` ou `AUTH_SECRET` |
| Login pro → `500 JWT_SECRET is missing` | `JWT_SECRET` non défini | Définir `JWT_SECRET` dans les variables d'environnement |
| `401 Unauthorized` sur `/api/pro/*` | Token non envoyé, expiré, ou `pro_token` absent du `localStorage` | Vérifier `Authorization: Bearer <token>` header |
| `401` sur `/api/auth/me` | Ni Bearer token ni cookie `ada_user_session` valide | Re-login |
| `403 Forbidden` sur `/api/pro/*` | Rôle insuffisant (ex: `PRO` tente action `STRUCTURE_ADMIN`) | Vérifier les claims `role` du JWT |
| `403 Account disabled` | `ProUser.status !== 'active' && status !== 'pending'` | Contacter l'administrateur de la structure |
| `403 EMAIL_NOT_VERIFIED` | Citoyen n'a pas cliqué le lien de vérification | Vérifier email ou renvoyer la vérification |
| `429 Too many attempts` | Rate limit atteint (IP ou email) | Attendre avant de réessayer |
| Token pro ne persiste pas entre onglets | Utilise `sessionStorage` au lieu de `localStorage` | Vérifier que le code utilise `localStorage.setItem('pro_token', ...)` |
| Admin token perdu après fermeture onglet | Comportement normal : `sessionStorage` est scoped à l'onglet | Se reconnecter |
| Pro token accepté sur routes admin | **Ne devrait jamais arriver** : `requireAdminAuth` rejette `authType: 'pro_jwt'` | Vérifier `api/_utils/auth.js` L288-289 |

---

## Références

| Document | Contenu |
|----------|---------|
| [Auth.md](./Auth.md) | Parcours utilisateurs détaillés (routes, guards, modèles) |
| [SECURITY_MODEL.md](./SECURITY_MODEL.md) | Modèle de sécurité global |
| [RUNBOOK.md](./RUNBOOK.md) | Procédures opérationnelles |
