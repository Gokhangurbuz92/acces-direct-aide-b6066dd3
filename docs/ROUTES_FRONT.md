# Routes Frontend

Ce document liste les routes définies dans `src/pages/index.jsx` (Router principal).

## Public

| Route | Page Component | Notes |
|---|---|---|
| `/` | `Home` | |
| `/a-propos` | `APropos` | |
| `/accessibilite` | `Accessibilite` | |
| `/actualites` | `Actualites` | |
| `/actualites/view` | `ActualiteDetail` | |
| `/actualites/:slug` | `ActualiteDetail` | |
| `/aidedetail` | `AideDetail` | |
| `/aide/view` | `AideDetail` | |
| `/aides/view` | `AideDetail` | |
| `/aide/:slug` | `LegacyAideRedirect` | Redirects to `/aides/:slug` |
| `/aides/:slug` | `AideDetail` | |
| `/aides` | `Aides` | |
| `/categories/:slug` | `Aides` | |
| `/situations/:slug` | `Aides` | |
| `/annuaire` | `Annuaire` | |
| `/structures` | `Navigate` | Redirects to `/annuaire` |
| `/structures/view` | `StructureDetail` | |
| `/structures/:slug` | `StructureDetail` | |
| `/confidentialite` | `Confidentialite` | |
| `/contact` | `Contact` | |
| `/cookies` | `Cookies` | |
| `/demarches/view` | `DemarcheDetail` | |
| `/demarches/:slug` | `DemarcheDetail` | |
| `/demarches` | `Demarches` | |
| `/orientation` | `Orientation` | |
| `/home` | `Navigate` | Redirects to `/` |
| `/mentions-legales` | `MentionsLegales` | |
| `/sourcesmethode` | `SourcesMethode` | |
| `/sentry-test` | `SentryTest` | |
| `/r/:token/messages` | `BeneficiaryMessages` | |
| `/bonnes-pratiques` | `Guides` | |
| `/bonnes-pratiques/:slug` | `GuideDetail` | |
| `/outils` | `Tools` | |
| `/outils/:slug` | `ToolDetail` | |
| `/dispositifs` | `Dispositifs` | |
| `/dispositifs/:slug` | `DispositifDetail` | |
| `/dispositifs/view` | `DispositifDetail` | |
| `/ressources` | `Ressources` | |
| `/ressources/:slug` | `RessourceDetail` | |
| `/ressources/view` | `RessourceDetail` | |
| `/impact` | `Impact` | |
| `/notre-mission` | `Mission` | |
| `/notre-methode` | `Method` | |
| `/sources` | `Sources` | |
| `/securite-et-rgpd` | `Security` | |
| `/partenaires` | `Partners` | |
| `/proposer-une-structure` | `SuggestStructure` | |
| `/dossier-subventions` | `SubventionDossier` | |
| `/styleguide/branding` | `StyleguideBranding` | |
| `/appointments/request` | `AppointmentRequest` | |
| `/appointments/cancel/:token` | `AppointmentCancel` | |
| `/appointments/reschedule/:token` | `AppointmentReschedule` | |
| `/login/pro` | `LoginPro` | Only if `VITE_DEV_LOGIN_ENABLED` is true |

## Admin (Protected by `AdminGuard`)

| Route | Page Component |
|---|---|
| `/admin/login` | `AdminLogin` |
| `/admin/health` | `AdminHealth` |
| `/admin/inbox` | `AdminInbox` |
| `/admin/runs` | `AdminRuns` |
| `/admin/aides/:id` | `AdminAideEdit` |
| `/admin/aides` | `AdminAides` |
| `/admin` | `Navigate` (to `/admin/aides`) |
| `/admin/guides/sync` | `AdminGuideSync` |
| `/admin/messages` | `AdminMessages` |
| `/admin/review` | `AdminReview` |
| `/admin/sync/recent` | `AdminRecentSyncs` |
| `/admin/sources` | `AdminSources` |
| `/admin/sync` | `AdminSync` |
| `/admin/sync/test` | `AdminTestSync` |
| `/admin/appointments` | `AdminAppointments` |
| `/admin/structures` | `AdminStructures` |
| `/admin/demarches` | `AdminDemarches` |
| `/admin/demarches/:id` | `AdminDemarcheEdit` |

## Pro (Protected by `ProLayout` / Auth)

All routes prefixed with `/pro`.

| Route | Page Component |
|---|---|
| `/pro/login` | `ProLogin` |
| `/pro/register` | `ProRegister` |
| `/pro/forgot-password` | `ProForgotPassword` |
| `/pro/reset-password` | `ProResetPassword` |
| `/pro/dashboard` | `ProDashboard` |
| `/pro/services` | `ProServices` |
| `/pro/team` | `ProTeam` |
| `/pro/structure` | `ProStructure` |
| `/pro/appointments` | `ProAppointments` |
| `/pro/appointments/:id` | `ProAppointmentDetail` |
