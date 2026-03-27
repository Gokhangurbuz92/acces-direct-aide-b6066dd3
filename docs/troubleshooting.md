# Troubleshooting

## Le site ne charge pas

1. Vérifier `/api/health` → `{"ok": true}`
2. Vérifier Vercel Dashboard → Deployments
3. Si erreur persistante → Rollback (voir [deployment.md](deployment.md))
4. Si DNS → vérifier résolution `dig www.accesdirectaide.fr`

## La DB ne répond pas

1. Vérifier `/api/monitor/core` → `deps.db.ok: true`
2. Vérifier Neon Console (neon.tech)
3. Si down → attendre Neon recovery (~5 min)
4. Si données perdues → PITR Neon (voir [disaster-recovery.md](disaster-recovery.md))

## Le chatbot ne répond pas

1. Vérifier `ENABLE_AI_AGENT=true` dans les env vars
2. Vérifier `GEMINI_API_KEY` est valide
3. Circuit breaker peut être ouvert → attendre 30s (auto-recovery)
4. Vérifier `/api/admin/ai-metrics` pour les erreurs récentes
5. Si quota Gemini dépassé → attendre reset ou changer clé

## Les crons ne tournent pas

1. Vérifier `CRON_SECRET` dans Vercel env vars
2. Vérifier `vercel.json` → section `crons`
3. Logs : Vercel Dashboard → Functions → Logs
4. Tester manuellement : `curl -H "Authorization: Bearer $CRON_SECRET" https://www.accesdirectaide.fr/api/cron/health-alert`

## Rate limiting bloque un utilisateur légitime

1. Le lockout citoyen dure 15 minutes → attendre
2. Rate limit se réinitialise chaque minute (IP + email)
3. Pour reset en urgence : Upstash Console → supprimer la clé
4. Cron `reset-lock` peut être lancé manuellement

## npm test échoue

1. `npm install` (dépendances manquantes ?)
2. Vérifier `.env.local` existe avec `DATABASE_URL`
3. `npx vitest run --reporter=verbose` pour les détails
4. Si tests E2E → lancer `npm run dev` d'abord

## Le build échoue

1. `npm run lint` (erreurs TS/ESLint ?)
2. `npm run typecheck` (erreurs de types ?)
3. Vérifier les imports circulaires
4. `npm run build -- --debug` pour le détail

## Email non reçu (inscription, reset pwd)

1. Vérifier `MAILJET_API_KEY` et `MAILJET_SECRET_KEY` dans env vars
2. Vérifier le domaine expéditeur dans Mailjet dashboard (app.mailjet.com → Sender domains)
3. Check spam/indésirables
4. Logs Mailjet : app.mailjet.com → Email Logs
