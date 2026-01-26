# Cartographie des Routes Front-End

Ce document liste l'ensemble des routes définies dans `src/pages/index.jsx`, leur page associée, le layout, et les règles de sécurité.

| Route | Page Component | Layout | Guard / Auth | Notes |
|-------|---------------|--------|--------------|-------|
| `/` | `Home` | Public | - | Page d'accueil |
| `/home` | `Home` | Public | - | Alias |
| `/aides` | `Aides` | Public | - | Liste des aides |
| `/aides/:slug` | `AideDetail` | Public | - | Détail d'une aide |
| `/categories/:slug` | `Aides` | Public | - | Filtre aides par catégorie |
| `/situations/:slug` | `Aides` | Public | - | Filtre aides par situation |
| `/demarches` | `Demarches` | Public | - | Liste des démarches |
| `/demarches/:slug` | `DemarcheDetail` | Public | - | Détail d'une démarche |
| `/structures` | `Annuaire` | Public | - | Annuaire des structures |
| `/structures/:slug` | `StructureDetail` | Public | - | Détail d'une structure |
| `/annuaire` | `Annuaire` | Public | - | Redirige vers `/structures` |
| `/actualites` | `Actualites` | Public | - | Liste des actualités |
| `/actualites/:slug` | `ActualiteDetail` | Public | - | Détail d'une actualité |
| `/bonnes-pratiques` | `Guides` | Public | - | Guides / Bonnes pratiques |
| `/bonnes-pratiques/:slug` | `GuideDetail` | Public | - | Détail guide |
| `/outils` | `Tools` | Public | - | Outils |
| `/outils/:slug` | `ToolDetail` | Public | - | Détail outil |
| `/dispositifs` | `Dispositifs` | Public | - | Liste dispositifs |
| `/dispositifs/:slug` | `DispositifDetail` | Public | - | Détail dispositif |
| `/appointmentrequest` | `AppointmentRequest` | Public | - | Prise de RDV public |
| `/proposer-une-structure` | `SuggestStructure` | Public | - | Formulaire suggestion |
| `/contact` | `Contact` | Public | - | Page contact |
| `/apropos` | `APropos` | Public | - | À propos |
| `/accessibilite` | `Accessibilite` | Public | - | Déclaration accessibilité |
| `/mentionslegales` | `MentionsLegales` | Public | - | Mentions légales |
| `/confidentialite` | `Confidentialite` | Public | - | Politique de confidentialité |
| `/cookies` | `Cookies` | Public | - | Gestion cookies |
| `/impact` | `Impact` | Public | - | Page Impact |
| `/notre-mission` | `Mission` | Public | - | Page Mission |
| `/notre-methode` | `Method` | Public | - | Page Méthode |
| `/sources` | `Sources` | Public | - | Page Sources |
| `/sourcesmethode` | `SourcesMethode` | Public | - | Legacy ? |
| `/securite-et-rgpd` | `Security` | Public | - | Page Sécurité |
| `/partenaires` | `Partners` | Public | - | Page Partenaires |
| `/dossier-subventions` | `SubventionDossier` | Public | - | Dossier Subventions |
| `/r/:token/messages` | `BeneficiaryMessages` | Public | Token | Messagerie bénéficiaire (FALC) |
| `/pro/login` | `ProLogin` | ProLayout | - | Login Espace Pro |
| `/pro/register` | `ProRegister` | ProLayout | - | Inscription Pro |
| `/pro/dashboard` | `ProDashboard` | ProLayout | Pro Auth | Dashboard Pro |
| `/pro/services` | `ProServices` | ProLayout | Pro Auth | Services Pro |
| `/pro/team` | `ProTeam` | ProLayout | Pro Auth | Équipe Pro |
| `/pro/structure` | `ProStructure` | ProLayout | Pro Auth | Structure Pro |
| `/pro/appointments` | `ProAppointments` | ProLayout | Pro Auth | RDV Pro |
| `/admin/login` | `AdminLogin` | Public | - | Login Admin |
| `/admin/inbox` | `AdminInbox` | Public | AdminRoute | Boîte de réception Admin |
| `/admin/runs` | `AdminRuns` | Public | AdminRoute | Logs Cron |
| `/adminaides` | `AdminAides` | Public | AdminRoute | Gestion Aides |
| `/adminaideedit` | `AdminAideEdit` | Public | AdminRoute | Édition Aide |
| `/admindemarches` | `AdminDemarches` | Public | RequireAuth | Gestion Démarches |
| `/adminstructures` | `AdminStructures` | Public | RequireAuth | Gestion Structures |
| `/adminappointments` | `AdminAppointments` | Public | RequireAuth | Gestion RDV Admin |
| `/adminsync` | `AdminSync` | Public | RequireAuth | Synchro pipeline |
| `/admin/review` | `AdminReview` | Public | AdminRoute | Revue contenu |
| `/sentry-test` | `SentryTest` | Public | - | Test Sentry |

**Note**: Les routes Admin utilisent `AdminRoute` ou `RequireAuth` qui vérifient l'authentification via `apiClient.auth.getUser()`.
