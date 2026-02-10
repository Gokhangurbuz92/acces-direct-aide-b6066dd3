# Routes Frontend (SPA)

Source de vérité : `src/pages/index.jsx`

## 1. Routes Publiques

**Layout** : `src/pages/Layout.jsx` (Standard)
**Guard** : Aucun (Public)

| Route | Page Component | API Calls Attendus | Description |
|---|---|---|---|
| `/` | `Home` | `public/stats` | Page d'accueil |
| `/aides` | `Aides` | `aides`, `taxonomy` | Liste des aides (avec filtres) |
| `/aides/:slug` | `AideDetail` | `aides/:slug` | Détail d'une aide |
| `/demarches` | `Demarches` | `demarches`, `taxonomy` | Liste des démarches |
| `/demarches/:slug` | `DemarcheDetail` | `demarches/:slug` | Détail d'une démarche |
| `/structures`, `/annuaire` | `Annuaire` | `structures` | Liste des structures |
| `/structures/:slug` | `StructureDetail` | `structures/:slug` | Détail d'une structure |
| `/actualites` | `Actualites` | `actualites` | Liste des actualités |
| `/actualites/:slug` | `ActualiteDetail` | `actualites/:slug` | Détail d'une actualité |
| `/dispositifs` | `Dispositifs` | `dispositifs` | Liste des dispositifs |
| `/dispositifs/:slug` | `DispositifDetail` | `dispositifs/:slug` | Détail d'un dispositif |
| `/ressources` | `Ressources` | `ressources` | Liste des ressources |
| `/ressources/:slug` | `RessourceDetail` | `ressources/:slug` | Détail d'une ressource |
| `/bonnes-pratiques` | `Guides` | `guides` | Liste des guides |
| `/bonnes-pratiques/:slug` | `GuideDetail` | `guides/:slug` | Détail d'un guide |
| `/outils` | `Tools` | `tools` | Liste des outils |
| `/outils/:slug` | `ToolDetail` | `tools/:slug` | Détail d'un outil |
| `/appointments/request` | `AppointmentRequest` | `appointments`, `availability` | Prise de RDV |
| `/proposer-une-structure` | `SuggestStructure` | `public/suggest-structure` | Formulaire suggestion |
| `/dossier-subventions` | `SubventionDossier` | - | Info dossier subvention |
| `/contact` | `Contact` | `public/messages` | Page de contact |
| `/accessibilite` | `Accessibilite` | - | Déclaration d'accessibilité |
| `/mentions-legales` | `MentionsLegales` | - | Mentions légales |
| `/confidentialite` | `Confidentialite` | `public/consent` | Politique de confidentialité |
| `/cookies` | `Cookies` | `public/consent` | Gestion des cookies |
| `/a-propos` | `APropos` | - | À propos |
| `/notre-mission` | `Mission` | - | Mission |
| `/notre-methode` | `Method` | - | Méthode |
| `/impact` | `Impact` | - | Impact |
| `/sources` | `Sources` | - | Sources des données |
| `/sourcesmethode` | `SourcesMethode` | - | Sources & Méthode |
| `/securite-et-rgpd` | `Security` | - | Sécurité et RGPD |
| `/partenaires` | `Partners` | - | Partenaires |
| `/styleguide/branding` | `StyleguideBranding` | - | Guide de style |
| `/r/:token/messages` | `BeneficiaryMessages` | `public/messages` | Messagerie bénéficiaire |

## 2. Espace Pro

**Layout** : `src/pages/pro/ProLayout.jsx`
**Guard** : Authentification Pro (via `RequireAuth` ou logique interne)

| Route | Page Component | API Calls Attendus | Description |
|---|---|---|---|
| `/pro/login` | `Login` | `auth/login` | Connexion Pro |
| `/pro/register` | `Register` | `pro/register` | Inscription Pro |
| `/pro/forgot-password` | `ForgotPassword` | `pro/auth/forgot-password` | Mot de passe oublié |
| `/pro/reset-password` | `ResetPassword` | `pro/auth/reset-password` | Réinitialisation MDP |
| `/pro/dashboard` | `Dashboard` | `pro/me`, `stats` | Tableau de bord |
| `/pro/appointments` | `Appointments` | `pro/appointments` | Liste des RDV |
| `/pro/appointments/:id` | `AppointmentDetail` | `pro/appointments/:id` | Détail RDV |
| `/pro/structure` | `Structure` | `pro/structure` | Gestion structure |
| `/pro/team` | `Team` | `pro/team` | Gestion équipe |
| `/pro/services` | `Services` | `pro/services` | Gestion services |
| `/pro/availability` | `Availability` | `pro/availability` | Gestion disponibilités |

## 3. Espace Admin

**Layout** : `src/pages/Layout.jsx` (Standard)
**Guard** : `AdminGuard` (sauf Login)

| Route | Page Component | Guard | API Calls Attendus | Description |
|---|---|---|---|---|
| `/admin/login` | `AdminLogin` | - | `auth/login` | Connexion Admin |
| `/admin/aides` | `AdminAides` | Oui | `aides` (admin) | CRUD Aides |
| `/admin/aides/:id` | `AdminAideEdit` | Oui | `aides/:id` | Édition Aide |
| `/admin/demarches` | `AdminDemarches` | Oui | `demarches` (admin) | CRUD Démarches |
| `/admin/demarches/:id` | `AdminDemarcheEdit` | Oui | `demarches/:id` | Édition Démarche |
| `/admin/structures` | `AdminStructures` | Oui | `structures` (admin) | CRUD Structures |
| `/admin/appointments` | `AdminAppointments` | Oui | `admin/appointments` | Gestion RDV Global |
| `/admin/inbox` | `AdminInbox` | Oui | `admin/inbox` | Boîte de réception |
| `/admin/runs` | `AdminRuns` | Oui | `admin/runs` | Historique jobs (Cron) |
| `/admin/sync` | `AdminSync` | Oui | `cron/pipeline` | Synchronisation |
| `/admin/sync/test` | `AdminTestSync` | Oui | `admin/actions` | Test Synchronisation |
| `/admin/sync/recent` | `AdminRecentSyncs` | Oui | `admin/runs` | Logs de synchro |
| `/admin/sources` | `AdminSources` | Oui | `admin/sources` | Sources de données |
| `/admin/messages` | `AdminMessages` | Oui | `admin/messages` | Messages |
| `/admin/review` | `AdminReview` | Oui | `admin/review` | Revue contenu |
| `/admin/guides/sync` | `AdminGuideSync` | Oui | `guides` | Synchro guides |
| `/admin/health` | `Health` | Oui | `health` | Santé système |
