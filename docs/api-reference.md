# API Reference — Accès Direct Aide

> 170+ routes · Dernière mise à jour : 2026-03-24

## Public (aucune auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/monitor/core` | Deep health (DB + KV) |
| GET | `/api/aides` | Liste des aides |
| GET | `/api/aides/:id` | Détail aide |
| GET | `/api/structures` | Liste structures |
| GET | `/api/demarches` | Liste démarches |
| GET | `/api/actualites` | Liste actualités |
| GET | `/api/ressources` | Ressources |
| GET | `/api/guides` | Guides |
| POST | `/api/search` | Recherche plein texte |
| POST | `/api/diagnostic` | Diagnostic OpenFisca |
| POST | `/api/assistant/chat` | Chatbot IA (Gemini) |
| GET | `/api/assistant/recommendations` | Recommandations IA |
| POST | `/api/feedback` | Feedback utilisateur |
| POST | `/api/contact` | Formulaire contact |
| GET | `/api/taxonomy` | Taxonomie aides |
| GET | `/api/rdv` | Rendez-vous publics |
| GET | `/api/openapi` | Spécification OpenAPI |
| GET | `/api/robots.txt` | Robots |
| GET | `/api/sitemap.xml` | Sitemap |

## Auth Citoyen

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Inscription (password policy) |
| POST | `/api/auth/login` | Connexion (lockout 5/15min) |
| GET | `/api/auth/me` | Profil utilisateur |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/verify-email` | Vérification email |
| POST | `/api/auth/resend-verification` | Renvoyer vérification |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password` | Réinitialiser mdp |
| GET | `/api/auth/export-data` | Export RGPD (JSON) |
| DELETE | `/api/auth/delete-account` | Suppression compte |
| GET | `/api/auth/outlook-callback` | OAuth Outlook |

## Pro (auth pro requise)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/pro/auth/login` | Connexion pro |
| POST | `/api/pro/auth/register` | Inscription pro |
| POST | `/api/pro/auth/register-invite` | Inscription sur invitation |
| POST | `/api/pro/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/pro/auth/reset-password` | Réinitialiser mdp |
| POST | `/api/pro/auth/mfa-verify` | Vérification MFA |
| POST | `/api/pro/auth/refresh` | Refresh token |
| GET | `/api/pro/appointments` | RDV pro |
| GET | `/api/pro/services` | Services pro |
| GET | `/api/pro/team` | Équipe pro |
| GET | `/api/pro/dossiers` | Dossiers |
| GET | `/api/pro/messages` | Messages |
| POST | `/api/pro/resend-invite` | Renvoyer invitation |
| GET | `/api/pro/slots` | Créneaux disponibles |
| GET | `/api/pro/timeoff` | Congés |

## Admin (auth admin requise)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Dashboard opérationnel |
| GET | `/api/admin/stats` | Statistiques globales |
| GET | `/api/admin/ai-metrics` | Métriques Gemini AI |
| GET | `/api/admin/analytics` | Analytics détaillées |
| GET | `/api/admin/conversations` | Logs conversations |
| GET | `/api/admin/logs` | Logs système |
| GET | `/api/admin/features` | Feature flags |
| GET | `/api/admin/review-queue` | File de revue |
| GET | `/api/admin/link-checks` | Vérification liens |
| GET | `/api/admin/inbox` | Inbox admin |
| GET | `/api/admin/national-stats` | Stats nationales |
| GET | `/api/admin/partnerships` | Partenariats |
| GET | `/api/admin/rag-health` | Santé RAG |
| GET | `/api/admin/runs` | Historique exécutions |
| GET | `/api/admin/cron-runs` | Historique crons |
| GET | `/api/admin/alerts` | Alertes |
| POST | `/api/admin/actions` | Actions admin |
| POST | `/api/admin/bulk-repair` | Réparation bulk |
| POST | `/api/admin/hive-repair` | Réparation hive |
| POST | `/api/admin/validate-publication` | Validation publication |
| POST | `/api/admin/mfa-setup` | Configuration MFA |
| POST | `/api/admin/mfa-verify` | Vérification MFA |
| GET | `/api/admin/export` | Export données |
| POST | `/api/admin/import` | Import données |
| GET | `/api/admin/versions` | Versions |

## Crons (CRON_SECRET requis)

| Route | Fréquence | Description |
|-------|-----------|-------------|
| `/api/cron/health-alert` | 5 min | Alerte si service down |
| `/api/cron/actualites` | 6h | Actualités RSS |
| `/api/cron/gdpr-purge` | Hebdomadaire | Purge données RGPD |
| `/api/cron/backup-db` | Hebdomadaire | Vérification backup |
| `/api/cron/hive-scan` | 4h | Scan qualité données |
| `/api/cron/review-queue-scan` | 1h | Scan file de revue |
| `/api/cron/ingest-aids` | Quotidien | Import aides-territoires |
| `/api/cron/ingest-annuaire` | Quotidien | Import annuaire service public |
| `/api/cron/ingest-structures` | Quotidien | Import structures |
| `/api/cron/ingest-demarches` | Quotidien | Import démarches |
| `/api/cron/link-check` | Hebdomadaire | Vérification liens morts |
| `/api/cron/pipeline` | Configurable | Pipeline d'ingestion |
| `/api/cron/rdv-reminder` | 1h | Rappels RDV |

## Public Services

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/public/assistant/orient` | Orientation IA |
| POST | `/api/public/falc/summarize` | Résumé FALC |
| GET | `/api/public/passport` | Passeport social |
| POST | `/api/public/sms-notify` | Notification SMS |
| POST | `/api/public/suggest-structure` | Suggestion structure |
| POST | `/api/public/dossier-revoke` | Révocation dossier |

## Autres

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/share/create` | Créer lien partagé |
| GET | `/api/share/get` | Récupérer lien partagé |
| GET | `/api/download` | Téléchargement fichier |
| POST | `/api/secure-messages` | Messages sécurisés |
| POST | `/api/search-pro` | Recherche pro |
| POST | `/api/otp/generate` | Générer OTP |
| POST | `/api/otp/verify` | Vérifier OTP |
| GET | `/api/drees` | Données DREES |
| GET | `/api/reports` | Rapports |
| GET | `/api/tools` | Outils |
| GET | `/api/tts` | Text-to-speech |
