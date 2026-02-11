# Routes Frontend (SPA)

Ce document recense les routes définies dans `src/pages/index.jsx` et leur politique d'accès.

## Routes Publiques
| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `Home.jsx` | Page d'accueil |
| `/aides` | `Aides.jsx` | Moteur de recherche des aides |
| `/aides/:slug` | `AideDetail.jsx` | Détail d'une aide |
| `/demarches` | `Demarches.jsx` | Liste des démarches |
| `/demarches/:slug` | `DemarcheDetail.jsx` | Détail d'une démarche |
| `/annuaire` | `Annuaire.jsx` | Annuaire des structures |
| `/structures/:slug` | `StructureDetail.jsx` | Détail d'une structure |
| `/actualites` | `Actualites.jsx` | Liste des actualités |
| `/actualites/:slug` | `ActualiteDetail.jsx` | Détail d'une actualité |
| `/bonnes-pratiques` | `Guides.jsx` | Guides méthodologiques |
| `/bonnes-pratiques/:slug` | `GuideDetail.jsx` | Détail d'un guide |
| `/outils` | `Tools.jsx` | Outils pratiques |
| `/outils/:slug` | `ToolDetail.jsx` | Détail d'un outil |
| `/dispositifs` | `Dispositifs.jsx` | Liste des dispositifs |
| `/dispositifs/:slug` | `DispositifDetail.jsx` | Détail d'un dispositif |
| `/ressources` | `Ressources.jsx` | Ressources documentaires |
| `/ressources/:slug` | `RessourceDetail.jsx` | Détail d'une ressource |
| `/appointments/request` | `AppointmentRequest.jsx` | Prise de rendez-vous (Public) |
| `/mentions-legales` | `MentionsLegales.jsx` | Mentions légales |
| `/confidentialite` | `Confidentialite.jsx` | Politique de confidentialité |
| `/cookies` | `Cookies.jsx` | Gestion des cookies |
| `/accessibilite` | `Accessibilite.jsx` | Déclaration d'accessibilité |
| `/contact` | `Contact.jsx` | Formulaire de contact |
| `/proposer-une-structure` | `SuggestStructure.jsx` | Suggérer un ajout |

## Routes Pro (`/pro`)
Nécessite une authentification Pro (Token).
| Route | Composant | Description |
|-------|-----------|-------------|
| `/pro/login` | `pro/Login.jsx` | Connexion Pro |
| `/pro/dashboard` | `pro/Dashboard.jsx` | Tableau de bord |
| `/pro/appointments` | `pro/Appointments.jsx` | Gestion des RDV |
| `/pro/appointments/:id` | `pro/AppointmentDetail.jsx` | Détail RDV |
| `/pro/structure` | `pro/Structure.jsx` | Édition structure |
| `/pro/team` | `pro/Team.jsx` | Gestion équipe |

## Routes Admin (`/admin`)
Protégées par `AdminGuard` (Admin Only).
| Route | Composant | Description |
|-------|-----------|-------------|
| `/admin/login` | `AdminLogin.jsx` | Connexion Admin |
| `/admin/aides` | `AdminAides.jsx` | Gestion des aides |
| `/admin/structures` | `AdminStructures.jsx` | Gestion des structures |
| `/admin/demarches` | `AdminDemarches.jsx` | Gestion des démarches |
| `/admin/appointments` | `AdminAppointments.jsx` | Supervision RDV |
| `/admin/sync` | `AdminSync.jsx` | Pilotage synchronisations |
| `/admin/runs` | `admin/Runs.jsx` | Logs des crons |
| `/admin/inbox` | `admin/Inbox.jsx` | Boîte de réception |

## Pages Orphelines / Drafts
Ces pages sont présentes dans le code source mais non routées actuellement.
- `src/pages/AideDetailBlueprintTrust.jsx`
- `src/pages/BlueprintTrustDemo.jsx`
- `src/pages/HomeBlueprintTrust.jsx`
- `src/pages/admin/AdminReports.jsx`
