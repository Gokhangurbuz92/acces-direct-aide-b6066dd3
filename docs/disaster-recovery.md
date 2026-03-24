# Disaster Recovery — Accès Direct Aide

## Méthodes de backup

| Méthode | Fréquence | Stockage | Contenu |
|---------|-----------|----------|---------|
| **Neon PITR** | Continu (WAL) | Neon Cloud | Base complète |
| `backup-db.js` cron | Hebdo (dimanche 01:00 UTC) | Cloudflare R2 | Aide + ConversationLog (JSON) |
| Neon branch snapshot | Manuel | Neon Cloud | Fork complet |

### Neon PITR (méthode principale)

Neon conserve les WAL automatiquement → restauration à la seconde près.

- **Console** : https://console.neon.tech
- **Rétention** : 7j (Free) / 30j (Pro)

### Backup JSON (cron)

```json
{
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-03-21T01:00:00.000Z",
    "counts": { "aides": 987, "conversationLogs": 42 }
  },
  "data": { "aides": [...], "conversationLogs": [...] }
}
```

⚠️ **Limitation** : ne couvre pas Structure, Demarche, Users, etc. Complémentaire à Neon PITR.

### Backup script execution status
- **Script**: `scripts/backup-db.js`
- **Current load**: Fails to import `src/db/index.js` (module not found). Requires database module to be present.
- **Dry‑run**: Not available.
- **Action**: Ensure `src/db/index.js` exists and exports the DB connection, or adjust import path.


### Backup manuel (CLI)

```bash
# pg_dump complet
pg_dump "$DATABASE_URL" --format=custom --file=backup-$(date +%Y%m%d).dump

# Neon branch
npx neonctl branches create --name backup-$(date +%Y-%m-%d)

# Déclencher le cron JSON manuellement
curl -X POST https://www.accesdirectaide.fr/api/cron/backup-db \
  -H "x-cron-secret: $CRON_SECRET"
```

---

## Restauration

### Depuis Neon PITR (recommandé)

1. console.neon.tech → **Branches** → **Create Branch**
2. Choisir **Point in Time** → date/heure cible
3. Nommer : `restore-YYYY-MM-DD-HHmm`
4. Copier la connection string
5. Mettre à jour `DATABASE_URL` sur Vercel
6. Redéployer

### Depuis pg_dump

```bash
# 1. Nouvelle branche Neon
npx neonctl branches create --name restore-$(date +%Y%m%d)

# 2. Restaurer
pg_restore --clean --no-owner --dbname="<NEW_CONNECTION_STRING>" backup.dump

# 3. Vérifier
psql "<NEW_CONNECTION_STRING>" -c \
  "SELECT 'Aide', COUNT(*) FROM \"Aide\" UNION ALL SELECT 'Structure', COUNT(*) FROM \"Structure\";"

# 4. Basculer DATABASE_URL sur Vercel → Redéployer
```

---

## Test de vérification DR

```bash
node scripts/test-disaster-recovery.mjs
```

Vérifie : connectivité DB, counts sur 11 tables critiques, création + validation backup JSON.

**Fréquence recommandée** : mensuel.

---

## Checklist post-restore

- [ ] Aides présentes (`SELECT COUNT(*) FROM "Aide"` → ~987+)
- [ ] Structures présentes
- [ ] `/api/health` → 200
- [ ] `/api/monitor/core` → `ok: true`
- [ ] `/api/aides` retourne des données
- [ ] `/api/search?q=logement` retourne des résultats
- [ ] Login admin fonctionne
- [ ] Chatbot fonctionne
- [ ] Déclencher un cron manuellement
- [ ] `DATABASE_URL` Vercel mis à jour si branche changée
- [ ] Redéployer sur Vercel
- [ ] Surveiller Sentry 1h
- [ ] Documenter l'incident (date, cause, durée, actions)

---

## Contacts

| Rôle | Contact |
|------|---------|
| Responsable technique | gokhangurbuz92@gmail.com |
| DB Neon | console.neon.tech / support@neon.tech |
| Hosting Vercel | vercel.com/dashboard |
| Monitoring | sentry.io |
| Storage R2 | Cloudflare Dashboard |
