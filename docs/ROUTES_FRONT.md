# Documentation des Routes Frontend

Ce document liste toutes les routes définies dans l'application React (`src/pages/index.jsx`).
Il sert de référence pour le développement et les tests E2E.

## 1. Routes Publiques

Accessibles à tous les utilisateurs.

| Route | Page / Composant | API Calls Principaux | Notes |
|---|---|---|---|
| `/` | `Home` | `/api/public/stats` | Page d'accueil |
| `/login` | `Login` | - | Entrée de connexion unifiée (admin/pro, noindex) |
| `/aides` | `Aides` | `/api/aides`, `/api/taxonomy` | Recherche aides |
| `/aides/:slug` | `AideDetail` | `/api/aides/:slug` | Détail aide |
| `/status` | `Status` | `/api/monitor/data-quality`, `/api/monitor/ingestion-freshness` | Statut public (noindex) |
| `/demarches` | `Demarches` | `/api/demarches` | Liste démarches |
| `/demarches/:slug` | `DemarcheDetail` | `/api/demarches/:slug` | Détail démarche |
| `/annuaire` | `Annuaire` | `/api/structures` | Liste structures |
| `/structures/:slug` | `StructureDetail` | `/api/structures/:slug` | Détail structure |
| `/rdv/:structureSlug` | `PublicRdvEntry` | `/api/structures/:slug`, `/api/auth/me` | Entrée publique RDV (redirige vers auth si non connecté) |
| `/rdv/:structureSlug/services` | `PublicRdvEntry` | `/api/structures/:slug`, `/api/auth/me` | Étape choix service |
| `/rdv/:structureSlug/creneaux` | `PublicRdvEntry` | `/api/structures/:slug`, `/api/auth/me` | Étape créneaux |
| `/auth/login` | `AuthRdvAccess` | - | Portail connexion RDV public (noindex) |
| `/auth/signup` | `AuthRdvAccess` | - | Portail inscription RDV public (noindex) |
| `/actualites` | `Actualites` | `/api/actualites` | Liste actualités |
| `/actualites/:slug` | `ActualiteDetail` | `/api/actualites/:slug` | Détail actualité |
| `/bonnes-pratiques` | `Guides` | `/api/guides` | Liste guides |
| `/bonnes-pratiques/:slug` | `GuideDetail` | `/api/guides/:slug` | Détail guide |
| `/outils` | `Tools` | `/api/tools` | Liste outils |
| `/outils/:slug` | `ToolDetail` | `/api/tools/:slug` | Détail outil |
| `/dispositifs` | `Dispositifs` | `/api/dispositifs` | Liste dispositifs |
| `/dispositifs/:slug` | `DispositifDetail` | `/api/dispositifs/:slug` | Détail dispositif |
| `/ressources` | `Ressources` | `/api/ressources` | Liste ressources |
| `/ressources/:slug` | `RessourceDetail` | `/api/ressources/:slug` | Détail ressource |
| `/orientation` | `Orientation` | - | Orientation |
| `/recherche` | `Recherche` | `/api/search` | Recherche globale |
| `/a-propos` | `APropos` | - | Statique |
| `/accessibilite` | `Accessibilite` | - | Statique |
| `/mentions-legales` | `MentionsLegales` | - | Statique |
| `/confidentialite` | `Confidentialite` | - | Statique |
| `/cookies` | `Cookies` | - | Gestion cookies |
| `/contact` | `Contact` | `/api/public/messages` | Formulaire contact |
| `/impact` | `Impact` | - | Statique |
| `/notre-mission` | `Mission` | - | Statique |
| `/notre-methode` | `Method` | - | Statique |
| `/sources` | `Sources` | - | Statique |
| `/sourcesmethode` | `SourcesMethode` | - | Statique |
| `/securite-et-rgpd` | `Security` | - | Statique |
| `/partenaires` | `Partners` | - | Statique |
| `/proposer-une-structure` | `SuggestStructure` | `/api/public/suggest-structure` | Formulaire |
| `/dossier-subventions` | `SubventionDossier` | - | Statique |
| `/appointments/request` | `AppointmentRequest` | `/api/public/appointments` | Legacy prise RDV |
| `/appointments/cancel/:token` | `AppointmentCancel` | `/api/public/appointments/cancel` | Annulation RDV |
| `/appointments/reschedule/:token` | `AppointmentReschedule` | - | Replanification RDV |
| `/r/:token/messages` | `BeneficiaryMessages` | `/api/public/messages` | Messagerie bénéficiaire |
| `/styleguide/branding` | `StyleguideBranding` | - | Guide de style |

## 2. Espace Pro (`/pro`)

Nécessite une authentification professionnelle (JWT Pro uniquement).
`ProGuard` redirige vers `/login?mode=pro` si la session Pro est absente/invalide.
Routes imbriquées sous le layout `ProLayout`.

| Route | Page / Composant | API Calls Principaux | Notes |
|---|---|---|---|
| `/pro/login` | `ProLogin` | `/api/pro/auth/login` | Connexion |
| `/pro/register` | `ProRegister` | `/api/pro/auth/register` | Inscription |
| `/pro/forgot-password` | `ProForgotPassword` | `/api/pro/auth/forgot-password` | Mot de passe oublié |
| `/pro/reset-password` | `ProResetPassword` | `/api/pro/auth/reset-password` | Reset mot de passe |
| `/pro/dashboard` | `ProDashboard` | `/api/pro/me` | Tableau de bord (Protégé par `ProGuard`) |
| `/pro/rdv` | `ProRdvLayout` | `/api/monitor/pro-rdv` | Shell RDV Pro + banner readiness (Protégé par `ProGuard`) |
| `/pro/rdv/services` | `ProServices` | `/api/pro/services` | Gestion services RDV (Protégé par `ProGuard`) |
| `/pro/rdv/disponibilites` | `ProAvailability` | `/api/pro/availability` | Gestion disponibilites (Protégé par `ProGuard`) |
| `/pro/rdv/agenda` | `ProAppointments` | `/api/pro/appointments` | Agenda RDV (Protégé par `ProGuard`) |
| `/pro/rdv/new` | `ProRdvNew` | `/api/pro/slots`, `/api/pro/appointments` | Creation RDV (Protégé par `ProGuard`) |
| `/pro/rdv/absences` | `ProRdvAbsences` | `/api/pro/timeoff` | Gestion absences (Protégé par `ProGuard`) |
| `/pro/services` | `Navigate` -> `/pro/rdv/services` | `/api/pro/services` | Alias legacy |
| `/pro/team` | `ProTeam` | `/api/pro/team` | Gestion équipe (Protégé par `ProGuard`) |
| `/pro/structure` | `ProStructure` | `/api/pro/structure` | Gestion structure (Protégé par `ProGuard`) |
| `/pro/appointments` | `Navigate` -> `/pro/rdv/agenda` | `/api/pro/appointments` | Alias legacy |
| `/pro/appointments/:id` | `ProAppointmentDetail` | `/api/pro/appointments/:id` | Détail RDV (Protégé par `ProGuard`) |
| `/pro/availability` | `Navigate` -> `/pro/rdv/disponibilites` | `/api/pro/availability` | Alias legacy |
| `/login/pro` | `LoginPro` | - | Legacy / Dev only |

## 3. Administration (`/admin`)

Protégé par `AdminGuard` (token statique admin ou session admin JWT).
Les credentials Pro ne donnent pas acces aux routes `/admin`.

| Route | Page / Composant | API Calls Principaux | Notes |
|---|---|---|---|
| `/admin/login` | `AdminLogin` | `/api/auth/login` | Connexion Admin |
| `/admin/aides` | `AdminAides` | `/api/aides` | CRUD Aides |
| `/admin/aides/:id` | `AdminAideEdit` | `/api/aides/:id` | Édition Aide |
| `/admin/demarches` | `AdminDemarches` | `/api/demarches` | CRUD Démarches |
| `/admin/demarches/:id` | `AdminDemarcheEdit` | `/api/demarches/:id` | Édition Démarche |
| `/admin/structures` | `AdminStructures` | `/api/structures` | CRUD Structures |
| `/admin/appointments` | `AdminAppointments` | `/api/admin/appointments` | Gestion RDV Admin |
| `/admin/messages` | `AdminMessages` | `/api/admin/messages` | Modération messages |
| `/admin/review` | `AdminReview` | `/api/admin/validate-publication` | Revue contenu |
| `/admin/sources` | `AdminSources` | - | Gestion sources |
| `/admin/sync` | `AdminSync` | `/api/cron/pipeline` | État synchro |
| `/admin/sync/recent` | `AdminRecentSyncs` | `/api/admin/cron-runs` | Logs synchro |
| `/admin/sync/test` | `AdminTestSync` | `/api/admin/actions` | Test synchro |
| `/admin/guides/sync` | `AdminGuideSync` | `/api/guides` | Sync guides |
| `/admin/inbox` | `AdminInbox` | `/api/admin/inbox` | Boîte réception |
| `/admin/health` | `AdminHealth` | `/api/health` | État santé |
| `/admin/observability` | `AdminObservability` | - | Métriques |
| `/admin/runs` | `AdminRuns` | `/api/admin/runs` | Historique runs |
| `/admin/review-queue` | `AdminReviewQueue` | `/api/admin/review-queue`, `/api/admin/review-queue/scan`, `/api/admin/review-queue/bulk` | Revue data quality + triage de masse |

## 4. Legacy & Redirects

Routes maintenues pour la compatibilité (SEO, anciens liens).

| Route | Cible | Notes |
|---|---|---|
| `/aide/:slug` | `/aides/:slug` | |
| `/structures` | `/annuaire` | |
| `/adminaides` | `/admin/aides` | |
| `/adminstructures` | `/admin/structures` | |
| `/adminappointments` | `/admin/appointments` | |
| `/admindemarches` | `/admin/demarches` | |
| `/AideDetail` | `/aides/:slug` | Via `/aidedetail` |
| `/StructureDetail` | `/annuaire` | |
| `/DemarcheDetail` | `/demarches` | |

---
*Généré automatiquement à partir de `src/pages/index.jsx`.*
