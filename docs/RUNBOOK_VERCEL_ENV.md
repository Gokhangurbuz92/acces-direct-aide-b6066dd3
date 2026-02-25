# Vercel Environment Variables — Phase 1 Runbook

## Variables requises en production

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | URL de connexion PostgreSQL (Neon) |
| `POSTGRES_URL_NON_POOLING` | ✅ | URL directe sans pooling (migrations Prisma) |
| `JWT_SECRET` | ✅ | Secret pour les tokens JWT |
| `ADA_ENCRYPTION_KEY` | ✅ | Clé de chiffrement interne |
| `ADMIN_TOKEN` | ✅ | Token d'accès admin |
| `GEMINI_API_KEY` | ⚠️ Requis pour l'assistant | Clé API Google Gemini |

## Ajouter GEMINI_API_KEY sur Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/) → Projet AccesDirectAide
2. **Settings** → **Environment Variables**
3. Cliquer **Add New**
4. **Key** : `GEMINI_API_KEY`
5. **Value** : coller la clé API Google AI Studio
6. **Environment** : cocher `Production`, `Preview`, `Development`
7. Cliquer **Save**
8. **Redéployer** : aller dans l'onglet **Deployments** → cliquer les 3 points sur le dernier déploiement → **Redeploy**

## Vérification

Après redéploiement, tester :

```bash
curl -s -X POST https://www.accesdirectaide.fr/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour"}' | jq .
```

- **Sans clé** : HTTP 503 + `{ "ok": false, "error": "service_unavailable" }`
- **Avec clé** : HTTP 200 + `{ "answer": "...", "meta": {...} }`

## Obtenir une clé Gemini

1. Aller sur [Google AI Studio](https://aistudio.google.com/apikey)
2. Cliquer **Create API Key**
3. Copier la clé générée
