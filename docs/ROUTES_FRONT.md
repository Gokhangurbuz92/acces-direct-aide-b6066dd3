# Routes Frontend

Liste des routes définies dans `src/pages/index.jsx` (React Router).

## 1. Publiques

| Route | Page / Composant | API Calls attendus | Notes |
| ----- | ---------------- | ------------------ | ----- |
| `/` | `Home.jsx` | - | Page d'accueil |
| `/aides` | `Aides.jsx` | `_handlers/aides.js` | Liste des aides |
| `/aides/:slug` | `AideDetail.jsx` | `_handlers/aides.js` | Détail d'une aide |
| `/demarches` | `Demarches.jsx` | `_handlers/demarches.js` | Liste des démarches |
| `/demarches/:slug` | `DemarcheDetail.jsx` | `_handlers/demarches.js` | Détail d'une démarche |
| `/structures` (et `/annuaire`) | `Annuaire.jsx` | `_handlers/structures.js` | Annuaire des structures |
| `/structures/:slug` | `StructureDetail.jsx` | `_handlers/structures.js` | Détail d'une structure |
| `/actualites` | `Actualites.jsx` | `_handlers/actualites.js` | Liste des actualités |
| `/actualites/:slug` | `ActualiteDetail.jsx` | `_handlers/actualites.js` | Détail d'une actualité |
| `/bonnes-pratiques` | `Guides.jsx` | `_handlers/guides.js` | Guides / Bonnes pratiques |
| `/bonnes-pratiques/:slug` | `GuideDetail.jsx` | `_handlers/guides.js` | Détail guide |
| `/outils` | `Tools.jsx` | `_handlers/tools.js` | Outils numériques |
| `/outils/:slug` | `ToolDetail.jsx` | `_handlers/tools.js` | Détail outil |
| `/dispositifs` | `Dispositifs.jsx` | `_handlers/dispositifs/index.js` | Dispositifs |
| `/dispositifs/:slug` | `DispositifDetail.jsx` | `_handlers/dispositifs/index.js` | Détail dispositif |
| `/appointments/request` | `AppointmentRequest.jsx` | `_handlers/booking/create.js` | **Prise de RDV** |
| `/proposer-une-structure` | `SuggestStructure.jsx` | `_handlers/public/suggest-structure.js` | Formulaire suggestion |
| `/contact` | `Contact.jsx` | - | Page contact |
| `/accessibilite` | `Accessibilite.jsx` | - | Déclaration accessibilité |
| `/mentions-legales` | `MentionsLegales.jsx` | - | Mentions légales |
| `/confidentialite` | `Confidentialite.jsx` | - | Politique de confidentialité |
| `/cookies` | `Cookies.jsx` | - | Gestion des cookies |
| `/a-propos` | `APropos.jsx` | - | À propos |
| `/impact` | `Impact.jsx` | - | Page Impact |
| `/notre-mission` | `Mission.jsx` | - | Mission |
| `/notre-methode` | `Method.jsx` | - | Méthode |
| `/sources` | `Sources.jsx` | - | Sources de données |
| `/sourcesmethode` | `SourcesMethode.jsx` | - | Sources & Méthode (Legacy ?) |
| `/securite-et-rgpd` | `Security.jsx` | - | Sécurité |
| `/partenaires` | `Partners.jsx` | - | Partenaires |
| `/dossier-subventions` | `SubventionDossier.jsx` | - | Dossier subvention |
| `/r/:token/messages` | `BeneficiaryMessages.jsx` | `_handlers/public/messages.js` | Messagerie bénéficiaire |

## 2. Espace Pro (`/pro`)

| Route | Page / Composant | Notes |
| ----- | ---------------- | ----- |
| `/pro/login` | `pro/Login.jsx` | Connexion |
| `/pro/register` | `pro/Register.jsx` | Inscription |
| `/pro/dashboard` | `pro/Dashboard.jsx` | Tableau de bord |
| `/pro/appointments` | `pro/Appointments.jsx` | Liste RDV |
| `/pro/appointments/:id` | `pro/AppointmentDetail.jsx` | Détail RDV |
| `/pro/availability` | `pro/Availability.jsx` | Gestion disponibilités |
| `/pro/structure` | `pro/Structure.jsx` | Édition structure |
| `/pro/services` | `pro/Services.jsx` | Services proposés |
| `/pro/team` | `pro/Team.jsx` | Gestion équipe |

## 3. Admin (`/admin`)

Toutes les routes admin sont protégées par `AdminGuard`.

| Route | Page / Composant | Notes |
| ----- | ---------------- | ----- |
| `/admin/login` | `AdminLogin.jsx` | Connexion Admin |
| `/adminaides` | `AdminAides.jsx` | CRUD Aides |
| `/adminaideedit` | `AdminAideEdit.jsx` | Édition Aide |
| `/admindemarches` | `AdminDemarches.jsx` | CRUD Démarches |
| `/admindemarcheedit` | `AdminDemarcheEdit.jsx` | Édition Démarche |
| `/adminstructures` | `AdminStructures.jsx` | CRUD Structures |
| `/adminappointments` | `AdminAppointments.jsx` | CRUD RDV |
| `/admin/inbox` | `admin/Inbox.jsx` | Boîte de réception |
| `/admin/runs` | `admin/Runs.jsx` | Historique Jobs/Cron |
| `/admin/review` | `AdminReview.jsx` | Revue contenu |
| `/adminsync` | `AdminSync.jsx` | Pipelines synchro |
