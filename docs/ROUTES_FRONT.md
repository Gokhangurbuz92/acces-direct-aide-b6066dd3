# Cartographie des Routes Front-End

Ce document recense l'ensemble des routes définies dans l'application (`src/pages/index.jsx`).

## 1. Routes Publiques (Layout: `Layout.jsx`)

| Route | Page Component | API attendue (Principale) | Notes |
|---|---|---|---|
| `/` | `Home.jsx` | `public/stats.js` (optionnel) | Accueil |
| `/a-propos` | `APropos.jsx` | - | Statique |
| `/accessibilite` | `Accessibilite.jsx` | - | Statique |
| `/actualites` | `Actualites.jsx` | `actualites.js` | Liste des actualités |
| `/actualites/:slug` | `ActualiteDetail.jsx` | `actualites.js` | Détail actualité |
| `/aides` | `Aides.jsx` | `aides.js`, `taxonomy.js` | Liste des aides |
| `/aides/:slug` | `AideDetail.jsx` | `aides.js` | Détail aide |
| `/demarches` | `Demarches.jsx` | `demarches.js` | Liste démarches |
| `/demarches/:slug` | `DemarcheDetail.jsx` | `demarches.js` | Détail démarche |
| `/structures` | `Annuaire.jsx` | `structures.js` | Annuaire (Liste) |
| `/structures/:slug` | `StructureDetail.jsx` | `structures.js` | Détail structure |
| `/dispositifs` | `Dispositifs.jsx` | `dispositifs/index.js` | Liste dispositifs |
| `/dispositifs/:slug` | `DispositifDetail.jsx` | `dispositifs/index.js` | Détail dispositif |
| `/bonnes-pratiques` | `Guides.jsx` | `guides.js` | Liste guides |
| `/bonnes-pratiques/:slug` | `GuideDetail.jsx` | `guides.js` | Détail guide |
| `/outils` | `Tools.jsx` | `tools.js` | Liste outils |
| `/outils/:slug` | `ToolDetail.jsx` | `tools.js` | Détail outil |
| `/contact` | `Contact.jsx` | `public/messages.js` | Formulaire contact |
| `/appointmentrequest` | `AppointmentRequest.jsx` | `booking/create.js`, `public/availability.js` | Prise de RDV |
| `/proposer-une-structure` | `SuggestStructure.jsx` | `public/suggest-structure.js` | Suggestion |
| `/mentions-legales` | `MentionsLegales.jsx` | - | Légal |
| `/confidentialite` | `Confidentialite.jsx` | - | Légal |
| `/cookies` | `Cookies.jsx` | - | Légal |
| `/securite-et-rgpd` | `Security.jsx` | - | Sécurité |
| `/notre-mission` | `Mission.jsx` | - | Statique |
| `/notre-methode` | `Method.jsx` | - | Statique |
| `/sources` | `Sources.jsx` | - | Statique |
| `/impact` | `Impact.jsx` | - | Statique |
| `/partenaires` | `Partners.jsx` | - | Statique |
| `/dossier-subventions` | `SubventionDossier.jsx` | - | Statique |
| `/r/:token/messages` | `BeneficiaryMessages.jsx` | `public/messages.js` | Messagerie bénéficiaire |
| `/sentry-test` | `SentryTestPage.jsx` | `sentry-test.js` | Debug Sentry |

## 2. Espace Pro (Layout: `ProLayout.jsx`)
Routes préfixées par `/pro`.

| Route | Page Component | Guard | API attendue |
|---|---|---|---|
| `/pro/login` | `pro/Login.jsx` | Public | `auth/login.js` |
| `/pro/register` | `pro/Register.jsx` | Public | `pro/invite.js` |
| `/pro/forgot-password` | `pro/ForgotPassword.jsx` | Public | `pro/auth/forgot-password.js` |
| `/pro/reset-password` | `pro/ResetPassword.jsx` | Public | `pro/auth/reset-password.js` |
| `/pro/dashboard` | `pro/Dashboard.jsx` | `RequireAuth` | `pro/me.js` |
| `/pro/services` | `pro/Services.jsx` | `RequireAuth` | `pro/services.js` |
| `/pro/team` | `pro/Team.jsx` | `RequireAuth` | `pro/team.js` |
| `/pro/structure` | `pro/Structure.jsx` | `RequireAuth` | `pro/structure.js` |
| `/pro/appointments` | `pro/Appointments.jsx` | `RequireAuth` | `pro/appointments/list.js` |
| `/pro/appointments/:id` | `pro/AppointmentDetail.jsx` | `RequireAuth` | `pro/appointments/details.js` |

## 3. Administration (Layout: `Layout.jsx` + `AdminGuard`)
Routes préfixées par `/admin` (sauf alias).

| Route | Page Component | API attendue | Notes |
|---|---|---|---|
| `/admin/login` | `AdminLogin.jsx` | `auth/login.js` | Login Admin |
| `/adminaides` | `AdminAides.jsx` | `aides.js` | CRUD Aides |
| `/adminaideedit` | `AdminAideEdit.jsx` | `aides.js` | Edit Aide |
| `/admindemarches` | `AdminDemarches.jsx` | `demarches.js` | CRUD Démarches |
| `/admindemarcheedit` | `AdminDemarcheEdit.jsx` | `demarches.js` | Edit Démarche |
| `/adminstructures` | `AdminStructures.jsx` | `structures.js` | CRUD Structures |
| `/adminappointments` | `AdminAppointments.jsx` | `booking/pro` | RDV Admin |
| `/adminmessages` | `AdminMessages.jsx` | `public/messages.js` | Messagerie Admin |
| `/adminsources` | `AdminSources.jsx` | `cron/ingest-rss.js` | Sources RSS |
| `/adminsync` | `AdminSync.jsx` | `cron/pipeline.js` | Sync Pipelines |
| `/adminrecentsyncs` | `AdminRecentSyncs.jsx` | `admin/runs.js` | Logs Sync |
| `/admintestsync` | `AdminTestSync.jsx` | `admin/actions.js` | Test Sync |
| `/adminguidesync` | `AdminGuideSync.jsx` | `guides.js` | Sync Guides |
| `/admin/inbox` | `admin/Inbox.jsx` | `admin/inbox.js` | Inbox |
| `/admin/runs` | `admin/Runs.jsx` | `admin/runs.js` | Cron Runs |
| `/admin/review` | `AdminReview.jsx` | `admin` | Review |

## 4. Redirections & Compatibilité

| Source | Cible |
|---|---|
| `/annuaire` | `/structures` |
| `/admin` | `/adminaides` |
| `/aidedetail` | `/aidedetail` (Legacy?) |
| `/StructureDetail` | `/annuaire` |
| `/DemarcheDetail` | `/demarches` |

## 5. Pages Orphelines détectées
Aucune page orpheline détectée dans `src/pages/`.
`SourcesMethode.jsx` est routé sur `/sourcesmethode`.
