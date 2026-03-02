# Espace Pro — API Reference

## Authentication

All pro endpoints require a JWT Bearer token:
```
Authorization: Bearer <pro_token>
```

Tokens are obtained via `POST /api/pro/login`.

---

## Endpoints

### 🔐 Auth & Security

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/pro/login` | Public | Login pro user |
| POST | `/api/pro/register` | Public | Register pro user |
| GET | `/api/pro/me` | Pro | Current user info |
| GET/POST | `/api/pro/mfa-setup` | Pro | MFA TOTP setup |
| GET | `/api/pro/health-check` | Pro | System health status |

### 📅 Rendez-vous

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/pro/appointments` | Pro | List/create appointments |
| GET/PATCH | `/api/pro/appointment/:id` | Pro | Get/update appointment |
| POST | `/api/pro/start-visio` | Pro | Launch video call for RDV |

### 💬 Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/pro/messages` | Pro | List/send messages |

### 🔔 Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pro/notifications` | Pro | List notifications (paginated) |
| PATCH | `/api/pro/notifications` | Pro | Mark read/unread |

**GET params:** `?page=1&limit=20&unread=true`

**PATCH body:**
```json
{ "ids": ["id1", "id2"], "action": "read" }
```

### 👥 Équipe (Admin-only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pro/team` | Admin | List team members (paginated) |
| PATCH | `/api/pro/team` | Admin | Change user role |
| DELETE | `/api/pro/team?userId=xxx` | Admin | Disable user |

**GET params:** `?page=1&limit=20`

**PATCH body:**
```json
{ "targetUserId": "xxx", "role": "STRUCTURE_ADMIN" }
```

Valid roles: `PRO`, `STRUCTURE_ADMIN`, `SUPERADMIN`

### 📁 Dossiers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pro/dossier?shareId=xxx` | Pro | View shared diagnostic |
| PATCH | `/api/pro/dossier?shareId=xxx` | Pro | Update follow-up status |
| POST | `/api/pro/dossier/upload-secure` | Pro | Upload secure document |
| GET | `/api/pro/dossier/export?shareId=xxx&format=json` | Pro | Export dossier (RGPD) |
| GET | `/api/pro/dossier/views?shareId=xxx` | Pro | View access log (RGPD) |
| POST | `/api/pro/dossier-synthesis` | Pro | Generate AI synthesis |
| POST | `/api/pro/consent` | Pro | Record consent |

### 🔌 Intégrations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/pro/interop-siao` | Pro | SI-SIAO data exchange (feature-flagged) |
| GET | `/api/pro/outlook?action=authorize` | Pro | Start Outlook OAuth |
| GET | `/api/pro/outlook?action=callback&code=xxx` | Pro | OAuth callback |
| GET | `/api/pro/outlook?action=status` | Pro | Check Outlook connection |
| POST | `/api/pro/outlook?action=disconnect` | Pro | Disconnect Outlook |

### 📊 Rapports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pro/regional-stats` | Pro | Regional statistics |
| GET | `/api/pro/attestation-data` | Pro | Attestation generation data |
| GET | `/api/pro/reports` | Pro | Impact reports |
| GET | `/api/pro/team-stats` | Pro | Team performance stats |

### ⚙️ Système (Admin-only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/pro/system-maintenance` | Admin | System maintenance (backup, cleanup) |
| POST | `/api/pro/agent-scheduler` | Pro | Trigger agent scheduler |
| POST | `/api/pro/agent-discovery` | Pro | AI agent discovery |

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Bad Request (missing/invalid params) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 410 | Gone (expired resource) |
| 500 | Internal Server Error |

## Feature Flags

| Variable | Default | Description |
|---|---|---|
| `SIAO_ENABLED` | `false` | Enable SI-SIAO interoperability |
| `OUTLOOK_ENABLED` | `false` | Enable Outlook OAuth integration |
