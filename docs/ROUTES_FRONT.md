# Routes Frontend

Ce document liste les routes définies dans l'application React (`src/pages/index.jsx`).

## 1. Routes Publiques

Accessibles à tous (visiteurs, SEO). Layout standard.

| Route | Page Component | Rôle | API Calls Principaux |
| :--- | :--- | :--- | :--- |
| `/` | `Home` | Accueil | - |
| `/login` | `Login` | Connexion (legacy/beneficiaire) | `auth/login` |
| `/aides` | `Aides` | Liste des aides (recherche) | `aides`, `taxonomy` |
| `/aides/:slug` | `AideDetail` | Détail d'une aide | `aides/:slug` |
| `/demarches` | `Demarches` | Liste des démarches | `demarches`, `taxonomy` |
| `/demarches/:slug` | `DemarcheDetail` | Détail d'une démarche | `demarches/:slug` |
| `/annuaire` | `Annuaire` | Liste des structures | `structures`, `geocoder` |
| `/structures/:slug` | `StructureDetail` | Détail d'une structure | `structures/:slug` |
| `/actualites` | `Actualites` | Liste des actualités | `actualites` |
| `/actualites/:slug` | `ActualiteDetail` | Détail d'une actualité | `actualites/:slug` |
| `/bonnes-pratiques` | `Guides` | Guides / Bonnes pratiques | `guides` |
| `/bonnes-pratiques/:slug` | `GuideDetail` | Détail guide | `guides/:slug` |
| `/outils` | `Tools` | Outils | `tools` |
| `/outils/:slug` | `ToolDetail` | Détail outil | `tools/:slug` |
| `/dispositifs` | `Dispositifs` | Dispositifs | `dispositifs` |
| `/dispositifs/:slug` | `DispositifDetail` | Détail dispositif | `dispositifs/:slug` |
| `/ressources` | `Ressources` | Ressources doc | `ressources` |
| `/ressources/:slug` | `RessourceDetail` | Détail ressource | `ressources/:slug` |
| `/proposer-une-structure` | `SuggestStructure` | Suggérer un ajout | `public/suggest-structure` |
| `/contact` | `Contact` | Page contact | `public/messages` |
| `/accessibilite` | `Accessibilite` | Accessibilité | - |
| `/mentions-legales` | `MentionsLegales` | Mentions légales | - |
| `/politique-confidentialite` | `Confidentialite` | RGPD | - |
| `/cookies` | `Cookies` | Gestion cookies | - |
| `/a-propos` | `APropos` | À propos | - |
| `/notre-mission` | `Mission` | Mission | - |
| `/notre-methode` | `Method` | Méthode | - |
| `/sources` | `Sources` | Sources des données | `config/sources` |
| `/impact` | `Impact` | Statistiques d'impact | `public/stats` |
| `/partenaires` | `Partners` | Liste partenaires | - |
| `/status` | `Status` | Statut service | `health` |

## 2. Routes Rendez-vous (Public)

Parcours de prise de RDV par un usager.

| Route | Page Component | Rôle | API Calls |
| :--- | :--- | :--- | :--- |
| `/rdv/:structureSlug` | `PublicRdvEntry` | Landing prise de RDV | `public/availability` |
| `/appointments/request` | `AppointmentRequest` | Formulaire demande | `booking/create` |
| `/appointments/cancel/:token` | `AppointmentCancel` | Annulation RDV | `booking/cancel` |
| `/appointments/reschedule/:token` | `AppointmentReschedule` | Modification RDV | `booking/reschedule` |
| `/r/:token/messages` | `BeneficiaryMessages` | Messagerie bénéficiaire | `public/messages` |

## 3. Routes Pro (`/pro`)

Espace réservé aux professionnels (Authentifié JWT). Layout `ProLayout`.

| Route | Page Component | Rôle | API Calls |
| :--- | :--- | :--- | :--- |
| `/pro/login` | `ProLogin` | Connexion Pro | `pro/auth/login` |
| `/pro/register` | `ProRegister` | Inscription Pro | `pro/auth/register` |
| `/pro/dashboard` | `ProDashboard` | Tableau de bord | `pro/me`, `stats` |
| `/pro/rdv/agenda` | `ProAppointments` | Agenda RDV | `pro/appointments` |
| `/pro/rdv/disponibilites` | `ProAvailability` | Gestion créneaux | `pro/availability` |
| `/pro/rdv/services` | `ProServices` | Gestion services | `pro/services` |
| `/pro/messages` | `ProMessages` | Messagerie Pro | `pro/messages` |
| `/pro/team` | `ProTeam` | Gestion équipe | `pro/team` |
| `/pro/structure` | `ProStructure` | Gestion structure | `pro/structure` |

## 4. Routes Admin (`/admin`)

Espace administration (Token statique ou Session). Layout `AdminGuard`.

| Route | Page Component | Rôle | API Calls |
| :--- | :--- | :--- | :--- |
| `/admin/login` | `AdminLogin` | Login Admin | `auth/login` |
| `/admin/aides` | `AdminAides` | CRUD Aides | `admin/aides` |
| `/admin/demarches` | `AdminDemarches` | CRUD Démarches | `admin/demarches` |
| `/admin/structures` | `AdminStructures` | CRUD Structures | `admin/structures` |
| `/admin/appointments` | `AdminAppointments` | Liste globale RDV | `admin/appointments` |
| `/admin/sync` | `AdminSync` | Pipelines Synchro | `cron/pipeline` |
| `/admin/runs` | `AdminRuns` | Historique Jobs | `admin/runs` |
| `/admin/inbox` | `AdminInbox` | Boîte réception | `admin/inbox` |
| `/admin/review-queue` | `AdminReviewQueue` | File de révision | `admin/review-queue` |
| `/admin/observability` | `AdminObservability` | Monitoring | `monitor/*` |
