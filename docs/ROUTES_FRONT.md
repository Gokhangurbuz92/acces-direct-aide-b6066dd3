# Routes Frontend

Ce document recense l'ensemble des routes définies dans l'application Frontend (`src/pages/index.jsx`).

## Légende
- **Route**: Chemin URL (ex: `/aides/:slug`)
- **Page**: Composant React principal
- **Guard**: Protection d'accès (Public, AdminRoute, RequireAuth, etc.)
- **API**: Endpoints API principaux appelés (estimé)

## Routes Publiques

| Route | Page Component | Guard | API Calls (Est.) |
|-------|---------------|-------|------------------|
| `/` | `Home` | Public | - |
| `/home` | `Home` | Public | - |
| `/aides` | `Aides` | Public | `GET /api/aides`, `/api/taxonomy` |
| `/aides/:slug` | `AideDetail` | Public | `GET /api/aides` |
| `/aidedetail`, `/aide/view` | `AideDetail` | Public | (Redirections/Alias) |
| `/categories/:slug` | `Aides` | Public | `GET /api/aides` |
| `/situations/:slug` | `Aides` | Public | `GET /api/aides` |
| `/demarches` | `Demarches` | Public | `GET /api/demarches` |
| `/demarches/:slug` | `DemarcheDetail` | Public | `GET /api/demarches` |
| `/demarches/view` | `DemarcheDetail` | Public | (Alias) |
| `/structures` | `Annuaire` | Public | `GET /api/structures` |
| `/structures/:slug` | `StructureDetail` | Public | `GET /api/structures` |
| `/structures/view` | `StructureDetail` | Public | (Alias) |
| `/annuaire` | `Redirect -> /structures` | Public | - |
| `/actualites` | `Actualites` | Public | `GET /api/actualites` |
| `/actualites/:slug` | `ActualiteDetail` | Public | `GET /api/actualites` |
| `/actualites/view` | `ActualiteDetail` | Public | (Alias) |
| `/bonnes-pratiques` | `Guides` | Public | `GET /api/guides` |
| `/bonnes-pratiques/:slug` | `GuideDetail` | Public | `GET /api/guides` |
| `/outils` | `Tools` | Public | `GET /api/tools` |
| `/outils/:slug` | `ToolDetail` | Public | `GET /api/tools` |
| `/dispositifs` | `Dispositifs` | Public | `GET /api/dispositifs` |
| `/accessibilite` | `Accessibilite` | Public | - |
| `/apropos` | `APropos` | Public | - |
| `/contact` | `Contact` | Public | `POST /api/public/messages` |
| `/confidentialite` | `Confidentialite` | Public | - |
| `/cookies` | `Cookies` | Public | - |
| `/mentionslegales` | `MentionsLegales` | Public | - |
| `/sources` | `Sources` | Public | - |
| `/sourcesmethode` | `SourcesMethode` | Public | - |
| `/impact` | `Impact` | Public | - |
| `/notre-mission` | `Mission` | Public | - |
| `/notre-methode` | `Method` | Public | - |
| `/securite-et-rgpd` | `Security` | Public | - |
| `/partenaires` | `Partners` | Public | - |
| `/proposer-une-structure` | `SuggestStructure` | Public | `POST /api/public/suggest-structure` |
| `/dossier-subventions` | `SubventionDossier` | Public | - |
| `/appointmentrequest` | `AppointmentRequest` | Public | `GET /api/public/availability`, `POST /api/booking/create` |
| `/r/:token/messages` | `BeneficiaryMessages` | Public (Token) | `GET/POST /api/public/messages` |

## Espace Pro (`/pro`)

Layout spécifique: `ProLayout`

| Route | Page Component | Guard | Notes |
|-------|---------------|-------|-------|
| `/pro` | `Navigate -> dashboard` | - | - |
| `/pro/login` | `ProLogin` | Public | Auth Pro |
| `/pro/register` | `ProRegister` | Public | Inscription |
| `/pro/forgot-password` | `ProForgotPassword` | Public | Recupération |
| `/pro/reset-password` | `ProResetPassword` | Public | Reset |
| `/pro/dashboard` | `ProDashboard` | ProAuth | Dashboard |
| `/pro/services` | `ProServices` | ProAuth | Gestion Services |
| `/pro/team` | `ProTeam` | ProAuth | Gestion Équipe |
| `/pro/structure` | `ProStructure` | ProAuth | Gestion Structure |
| `/pro/appointments` | `ProAppointments` | ProAuth | Liste RDV |
| `/pro/appointments/:id` | `ProAppointmentDetail` | ProAuth | Détail RDV |

## Espace Admin (`/admin`)

| Route | Page Component | Guard | API Calls (Est.) |
|-------|---------------|-------|------------------|
| `/admin/login` | `AdminLogin` | Public | Auth Admin |
| `/admin` | `Navigate -> /adminaides` | - | - |
| `/adminaides` | `AdminAides` | AdminRoute | `GET /api/aides` (CRUD) |
| `/adminaideedit` | `AdminAideEdit` | AdminRoute | `PUT /api/aides` |
| `/admindemarches` | `AdminDemarches` | RequireAuth | `GET /api/demarches` |
| `/admindemarcheedit` | `AdminDemarcheEdit` | RequireAuth | `PUT /api/demarches` |
| `/adminstructures` | `AdminStructures` | RequireAuth | `GET /api/structures` |
| `/adminappointments` | `AdminAppointments` | RequireAuth | `GET /api/admin/appointments` |
| `/adminmessages` | `AdminMessages` | AdminRoute | `GET /api/admin/messages` |
| `/admin/review` | `AdminReview` | AdminRoute | Review Queue |
| `/admin/inbox` | `AdminInbox` | AdminRoute | Admin Inbox |
| `/admin/runs` | `AdminRuns` | AdminRoute | Cron Logs |
| `/adminsources` | `AdminSources` | AdminRoute / RequireAuth | RSS Config |
| `/adminguidesync` | `AdminGuideSync` | AdminRoute | Sync Guides |
| `/adminsync` | `AdminSync` | RequireAuth | Pipeline Status |
| `/adminrecentsyncs` | `AdminRecentSyncs` | AdminRoute / RequireAuth | Sync Logs |
| `/admintestsync` | `AdminTestSync` | RequireAuth | Test Pipeline |

## Routes Techniques / Dev

| Route | Page Component | Guard | Notes |
|-------|---------------|-------|-------|
| `/sentry-test` | `SentryTest` | Public | Debug Sentry |
| `/__sentry_test` | `SentryTestPage` | Public | Debug (Vercel check) |
| `/login/pro` | `LoginPro` | Dev (Cond.) | Legacy Login (si `VITE_DEV_LOGIN_ENABLED`) |
| `*` | `NotFound` | Public | 404 Page |

## Notes d'analyse
- **Doublon Routes Admin**: Certaines routes comme `/adminsources` et `/adminrecentsyncs` sont définies deux fois avec des guards différents (`AdminRoute` vs `RequireAuth`). Le premier match gagne (React Router), donc `AdminRoute` est appliqué.
- **Legacy**: `/login/pro` semble être une ancienne route de login conservée pour le dev, tandis que `/pro/login` est la nouvelle route officielle.
- **Orphelins**: Le fichier `src/pages/Accessibility.jsx` n'est pas utilisé (la route `/accessibilite` pointe vers `Accessibilite.jsx`).

---
*Généré automatiquement le: $(date +%Y-%m-%d)*
