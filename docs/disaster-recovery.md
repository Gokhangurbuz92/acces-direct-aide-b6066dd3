# Disaster Recovery — Accès Direct Aide

## Backup

### Automatique (Cron Vercel)

| Paramètre | Valeur |
|-----------|--------|
| **Fichier** | `api/_handlers/cron/backup-db.js` |
| **Fréquence** | Chaque dimanche à 01:00 UTC |
| **Stockage** | Cloudflare R2 (S3-compatible) |
| **Format** | JSON (`ada-backup-{timestamp}.json`) |
| **Données** | Aides, ConversationLogs |
| **Auth** | `CRON_SECRET` (header ou query param) |

### Contenu du backup

```json
{
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-03-21T01:00:00.000Z",
    "counts": { "aides": 987, "conversationLogs": 42 }
  },
  "data": {
    "aides": [...],
    "conversationLogs": [...]
  }
}
```

### Manuel (CLI)

```bash
# Backup complet via pg_dump (Neon)
pg_dump "$DATABASE_URL" --format=custom --file=backup-$(date +%Y%m%d).dump

# Backup data-only
pg_dump "$DATABASE_URL" --data-only --format=custom --file=data-$(date +%Y%m%d).dump
```

---

## Restore

### Depuis le backup JSON (R2)

1. **Télécharger** le dernier backup depuis Cloudflare R2
2. **Créer une branche Neon** (console.neon.tech → Branches → Create)
3. **Importer** les données :

```bash
# Via le script de restore
npx tsx scripts/test-backup-restore.js --restore <fichier-backup.json>
```

### Depuis pg_dump

```bash
# 1. Créer une branche Neon de test
#    → console.neon.tech → Branches → "restore-test"

# 2. Restaurer
pg_restore --dbname="$DATABASE_URL_STAGING" --clean --if-exists backup.dump

# 3. Vérifier les données
psql "$DATABASE_URL_STAGING" -c "SELECT COUNT(*) FROM \"Aide\";"
psql "$DATABASE_URL_STAGING" -c "SELECT COUNT(*) FROM \"ConversationLog\";"

# 4. Si OK → basculer DATABASE_URL dans Vercel
#    → Vercel → Settings → Environment Variables → DATABASE_URL
```

---

## Checklist post-restore

- [ ] Vérifier le nombre d'aides (`SELECT COUNT(*) FROM "Aide"`)
- [ ] Vérifier les logs de conversation
- [ ] Tester la recherche (`POST /api/search`)
- [ ] Tester le chatbot
- [ ] Vérifier les crons (ingestion, purge RGPD)
- [ ] Monitorer Sentry pendant 1h

---

## Contacts

| Rôle | Contact |
|------|---------|
| **DB Neon** | console.neon.tech |
| **Storage R2** | Cloudflare Dashboard |
| **Hosting** | Vercel Dashboard |
| **Monitoring** | sentry.io |
