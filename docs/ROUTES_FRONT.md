# Cartographie des Routes Frontend

Ce document recense les routes définies dans `src/pages/index.jsx` et les pages correspondantes.

## Pages Publiques (Site)

| Route (URL) | Page Component | Rôle | API Calls Attendus |
|---|---|---|---|
| `/` | `Home` | Accueil | - |
| `/home` | `Home` | Accueil | - |
| `/aides` | `Aides` | Liste des aides | `/api/aides`, `/api/taxonomy` |
| `/categories/:slug` | `Aides` | Liste aides filtrée | `/api/aides` |
| `/situations/:slug` | `Aides` | Liste aides filtrée | `/api/aides` |
| `/aides/:slug` | `AideDetail` | Détail d'une aide | `/api/aides?slug=:slug` |
| `/demarches` | `Demarches` | Liste démarches | `/api/demarches` |
| `/demarches/:slug` | `DemarcheDetail` | Détail démarche | `/api/demarches?slug=:slug` |
| `/structures` | `Annuaire` | Liste structures | `/api/structures` |
| `/structures/:slug` | `StructureDetail` | Détail structure | `/api/structures?slug=:slug` |
| `/annuaire` | `Annuaire` (Redirect) | Alias structures | - |
| `/actualites` | `Actualites` | Liste actualités | `/api/actualites` |
| `/actualites/:slug` | `ActualiteDetail` | Détail actualité | `/api/actualites?slug=:slug` |
| `/bonnes-pratiques` | `Guides` | Liste guides | `/api/guides` |
| `/bonnes-pratiques/:slug` | `GuideDetail` | Détail guide | `/api/guides?slug=:slug` |
| `/outils` | `Tools` | Liste outils | `/api/tools` |
| `/outils/:slug` | `ToolDetail` | Détail outil | `/api/tools?slug=:slug` |
| `/dispositifs` | `Dispositifs` | Liste dispositifs | `/api/dispositifs` |
| `/proposer-une-structure` | `SuggestStructure` | Formulaire suggestion | `/api/public/suggest-structure` |
| `/contact` | `Contact` | Page contact | `/api/public/messages` |
| `/accessibilite` | `Accessibilite` | Déclaration accessibilité | - |
| `/mentions-legales` | `MentionsLegales` | Mentions légales | - |
| `/confidentialite` | `Confidentialite` | Politique confidentialité | `/api/public/consent` |
| `/cookies` | `Cookies` | Gestion cookies | `/api/public/consent` |
| `/a-propos` | `APropos` | À propos | - |
| `/impact` | `Impact` | Page Impact | - |
| `/notre-mission` | `Mission` | Mission | - |
| `/notre-methode` | `Method` | Méthode | - |
| `/sources` | `Sources` | Sources données | - |
| `/sourcesmethode` | `SourcesMethode` | Sources & Méthode | - |
| `/partenaires` | `Partners` | Partenaires | - |
| `/securite-et-rgpd` | `Security` | Sécurité | - |
| `/dossier-subventions` | `SubventionDossier` | Info subventions | - |

## Espace Rendez-vous (Public)

| Route (URL) | Page Component | Rôle | API Calls Attendus |
|---|---|---|---|
| `/appointmentrequest` | `AppointmentRequest` | Demande de RDV | `/api/public/appointments`, `/api/public/availability` |
| `/appointments` | `AppointmentRequest` (via API) | Création RDV | `/api/appointments` |

## Espace Pro

| Route (URL) | Page Component | Rôle | API Calls Attendus |
|---|---|---|---|
| `/pro/login` | `ProLogin` | Connexion Pro | `/api/pro/auth/login` |
| `/pro/register` | `ProRegister` | Inscription Pro | `/api/pro/auth/register` |
| `/pro/dashboard` | `ProDashboard` | Tableau de bord | `/api/pro/me`, `/api/public/stats` |
| `/pro/appointments` | `ProAppointments` | Gestion RDV | `/api/pro/appointments` |
| `/pro/appointments/:id` | `ProAppointmentDetail` | Détail RDV | `/api/pro/appointments` |
| `/pro/availability` | `ProAvailability` | Disponibilités | `/api/pro/availability` |
| `/pro/services` | `ProServices` | Services proposés | `/api/pro/services` |
| `/pro/team` | `ProTeam` | Gestion équipe | `/api/pro/team` |
| `/pro/structure` | `ProStructure` | Info structure | `/api/pro/structure` |
| `/login/pro` | `LoginPro` | Alias (Dev/Legacy) | - |

## Admin (Back-office)

| Route (URL) | Page Component | Rôle |
|---|---|---|
| `/admin/login` | `AdminLogin` | Connexion Admin |
| `/adminaides` | `AdminAides` | Gestion Aides |
| `/adminaideedit` | `AdminAideEdit` | Édition Aide |
| `/admindemarches` | `AdminDemarches` | Gestion Démarches |
| `/admindemarcheedit` | `AdminDemarcheEdit` | Édition Démarche |
| `/adminstructures` | `AdminStructures` | Gestion Structures |
| `/adminappointments` | `AdminAppointments` | Gestion RDV (Admin) |
| `/adminsources` | `AdminSources` | Sources RSS |
| `/adminsync` | `AdminSync` | Synchronisation |
| `/adminrecentsyncs` | `AdminRecentSyncs` | Logs synchro |
| `/adminguidesync` | `AdminGuideSync` | Sync Guides |
| `/adminmessages` | `AdminMessages` | Messagerie Admin |
| `/admin/inbox` | `AdminInbox` | Boîte réception |
| `/admin/runs` | `AdminRuns` | Historique Cron |
| `/admin/review` | `AdminReview` | Revue contenu |

## Autres / Tech

| Route (URL) | Page Component | Rôle |
|---|---|---|
| `/sentry-test` | `SentryTest` | Test Sentry |
| `/r/:token/messages` | `BeneficiaryMessages` | Messagerie Bénéficiaire |
| `*` | `NotFound` | 404 |
