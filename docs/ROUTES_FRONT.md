# Routes Frontend

Ce document liste toutes les routes définies dans `src/pages/index.jsx`.

## Publiques (Site vitrine & Accès direct)

| Route | Page Component | API Calls Attendus | Notes |
| :--- | :--- | :--- | :--- |
| `/` | `Home` | `public/stats.js` | Accueil |
| `/aides` | `Aides` | `aides.js`, `taxonomy.js` | Liste des aides |
| `/aides/:slug` | `AideDetail` | `aides.js` | Détail aide |
| `/demarches` | `Demarches` | `demarches.js` | Liste démarches |
| `/demarches/:slug` | `DemarcheDetail` | `demarches.js` | Détail démarche |
| `/annuaire` | `Annuaire` | `structures.js` | Liste structures |
| `/structures/:slug` | `StructureDetail` | `structures.js` | Détail structure |
| `/actualites` | `Actualites` | `actualites.js` | Liste actualités |
| `/actualites/:slug` | `ActualiteDetail` | `actualites.js` | Détail actualité |
| `/bonnes-pratiques` | `Guides` | `guides.js` | Liste guides |
| `/bonnes-pratiques/:slug` | `GuideDetail` | `guides.js` | Détail guide |
| `/outils` | `Tools` | `tools.js` | Liste outils |
| `/outils/:slug` | `ToolDetail` | `tools.js` | Détail outil |
| `/dispositifs` | `Dispositifs` | `dispositifs/index.js` | Liste dispositifs |
| `/dispositifs/:slug` | `DispositifDetail` | `dispositifs/index.js` | Détail dispositif |
| `/ressources` | `Ressources` | `ressources.js` | Liste ressources |
| `/ressources/:slug` | `RessourceDetail` | `ressources.js` | Détail ressource |
| `/recherche` | `Recherche` | `search.js` | Recherche globale |
| `/orientation` | `Orientation` | - | Page d'orientation |
| `/impact` | `Impact` | - | Page statique |
| `/notre-mission` | `Mission` | - | Page statique |
| `/notre-methode` | `Method` | - | Page statique |
| `/sources` | `Sources` | - | Page statique |
| `/sourcesmethode` | `SourcesMethode` | - | Page statique |
| `/securite-et-rgpd` | `Security` | - | Page statique |
| `/partenaires` | `Partners` | - | Page statique |
| `/proposer-une-structure` | `SuggestStructure` | `public/suggest-structure.js` | Formulaire |
| `/dossier-subventions` | `SubventionDossier` | - | Page statique |
| `/status` | `Status` | `health.js` | Status page |
| `/a-propos` | `APropos` | - | Page statique |
| `/accessibilite` | `Accessibilite` | - | Page statique |
| `/mentions-legales` | `MentionsLegales` | - | Page statique |
| `/politique-confidentialite` | `Confidentialite` | - | Page statique |
| `/cookies` | `Cookies` | - | Page statique |
| `/contact` | `Contact` | `public/messages.js` | Formulaire contact |
| `/styleguide/branding` | `StyleguideBranding` | - | Interne dev |
| `/sentry-test` | `SentryTest` | `sentry-test.js` | Debug |

## RDV Public (Appointment System)

| Route | Page Component | API Calls Attendus | Notes |
| :--- | :--- | :--- | :--- |
| `/appointments/request` | `AppointmentRequest` | `booking/create.js` | Prise de RDV |
| `/appointments/cancel/:token` | `AppointmentCancel` | `booking/cancel.js` | Annulation |
| `/appointments/reschedule/:token` | `AppointmentReschedule` | `booking/reschedule.js` | Report |
| `/rdv/:structureSlug` | `PublicRdvEntry` | `public/availability.js` | Landing RDV structure |

## Auth & Compte (Bénéficiaire)

| Route | Page Component | Guard | Notes |
| :--- | :--- | :--- | :--- |
| `/login` | `Login` | - | Login générique |
| `/auth/login` | `AuthRdvAccess` | - | Login RDV |
| `/auth/signup` | `AuthRdvAccess` | - | Inscription |
| `/auth/verify-email` | `AuthVerifyEmail` | - | Vérification email |
| `/auth/forgot` | `AuthForgotPassword` | - | Mot de passe oublié |
| `/auth/reset` | `AuthResetPassword` | - | Reset mot de passe |
| `/compte/messages` | `CompteMessages` | Auth | Messagerie |
| `/compte/messages/:conversationId` | `CompteMessageThread` | Auth | Conversation |
| `/r/:token/messages` | `BeneficiaryMessages` | Token | Accès messages par lien magique |

## Espace Pro

| Route | Page Component | Guard | Notes |
| :--- | :--- | :--- | :--- |
| `/pro` | `ProDashboard` | ProGuard | Dashboard |
| `/pro/login` | `ProLogin` | - | Login Pro |
| `/pro/register` | `ProRegister` | - | Inscription Pro |
| `/pro/forgot-password` | `ProForgotPassword` | - | MDP oublié Pro |
| `/pro/reset-password` | `ProResetPassword` | - | Reset MDP Pro |
| `/pro/rdv/agenda` | `ProAppointments` | ProGuard | Agenda RDV |
| `/pro/rdv/disponibilites` | `ProAvailability` | ProGuard | Gestion dispos |
| `/pro/rdv/services` | `ProServices` | ProGuard | Gestion services |
| `/pro/rdv/new` | `ProRdvNew` | ProGuard | Création RDV manuel |
| `/pro/messages` | `ProMessages` | ProGuard | Messagerie Pro |
| `/pro/team` | `ProTeam` | ProGuard | Gestion équipe |
| `/pro/structure` | `ProStructure` | ProGuard | Profil structure |

## Admin (Back-office)

| Route | Page Component | Guard | Notes |
| :--- | :--- | :--- | :--- |
| `/admin/login` | `AdminLogin` | - | Login Admin |
| `/admin/aides` | `AdminAides` | AdminGuard | CRUD Aides |
| `/admin/aides/:id` | `AdminAideEdit` | AdminGuard | Edit Aide |
| `/admin/demarches` | `AdminDemarches` | AdminGuard | CRUD Démarches |
| `/admin/demarches/:id` | `AdminDemarcheEdit` | AdminGuard | Edit Démarche |
| `/admin/structures` | `AdminStructures` | AdminGuard | CRUD Structures |
| `/admin/appointments` | `AdminAppointments` | AdminGuard | Admin RDV |
| `/admin/messages` | `AdminMessages` | AdminGuard | Admin Messages |
| `/admin/sources` | `AdminSources` | AdminGuard | Gestion sources RSS |
| `/admin/sync` | `AdminSync` | AdminGuard | Pilotage sync |
| `/admin/runs` | `AdminRuns` | AdminGuard | Historique jobs |
| `/admin/health` | `AdminHealth` | AdminGuard | Santé système |
| `/admin/observability` | `AdminObservability` | AdminGuard | Métriques |
| `/admin/review-queue` | `AdminReviewQueue` | AdminGuard | Modération |
