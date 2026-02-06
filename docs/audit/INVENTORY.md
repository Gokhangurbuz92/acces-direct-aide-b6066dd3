# INVENTORY - Inventaire Détaillé du Projet AccesDirectAide

**Date**: 2026-02-06  
**Auditeur**: Blackbox Remote Code  
**Commit**: 566137e

---

## 1. STATISTIQUES GLOBALES

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| **Handlers API** | 70 | Fichiers dans `/api/_handlers` |
| **Pages Frontend** | 69 | Fichiers dans `/src/pages` |
| **Composants React** | 73 | Fichiers dans `/src/components` |
| **Modèles Prisma** | 28 | Modèles dans `schema.prisma` |
| **Jobs Cron** | 5 | Handlers dans `/api/_handlers/cron` |
| **Scripts Utilitaires** | 80+ | Scripts dans `/scripts` |
| **Tests** | 28 fichiers | 126 tests au total |
| **Dépendances** | 957 | Packages npm installés |

---

## 2. ROUTES API (70 handlers)

### 2.1 Routes Publiques (pas d'auth)

#### Aides
- `GET /api/aides` - Liste des aides (filtres, pagination, recherche)
  - Handler: `api/_handlers/aides.js`
  - Filtres: statut, urgence, departement, public, theme, slug, id
  - Pagination: page, limit (default: 20)
  - Tri: -created_date, -published_at

#### Démarches
- `GET /api/demarches` - Liste des démarches
  - Handler: `api/_handlers/demarches.js`
  - Filtres: statut, categorie, departement, slug, id

#### Structures (Annuaire)
- `GET /api/structures` - Liste des structures
  - Handler: `api/_handlers/structures.js`
  - Filtres: statut, type, departement, ville, services, slug, id
  - Géolocalisation: latitude, longitude, radius

#### Actualités
- `GET /api/actualites` - Liste des actualités (RSS)
  - Handler: `api/_handlers/actualites.js`
  - Filtres: statut, categorie, departement
  - Pagination: page, limit

#### Dispositifs
- `GET /api/dispositifs` - Liste des dispositifs locaux
  - Handler: `api/_handlers/dispositifs/*.js`
  - Filtres: statut, departement, public

#### Guides & Ressources
- `GET /api/guides` - Liste des guides pratiques
  - Handler: `api/_handlers/guides.js`
- `GET /api/tools` - Boîte à outils
  - Handler: `api/_handlers/tools.js`
- `GET /api/ressources` - Ressources diverses
  - Handler: `api/_handlers/ressources.js`

#### Taxonomie & Métadonnées
- `GET /api/categories` - Catégories d'aides/démarches
  - Handler: `api/_handlers/categories.js`
- `GET /api/taxonomy` - Taxonomie complète
  - Handler: `api/_handlers/taxonomy.js`

#### SEO & Robots
- `GET /api/sitemap.xml` - Sitemap dynamique
  - Handler: `api/sitemap.js`
- `GET /api/robots.txt` - Robots.txt dynamique
  - Handler: `api/robots.js`

#### Health & Version
- `GET /api/health` - Health check
  - Handler: `api/_handlers/health.js`
- `GET /api/version` - Version de l'application
  - Handler: `api/_handlers/version.js`

#### Rendez-vous (Public)
- `POST /api/appointments` - Demande de RDV (public)
  - Handler: `api/_handlers/public/appointments/create.js`
  - Body: structureId, serviceId, startAt, email, firstName, mode
- `GET /api/appointments/:id` - Détail RDV (avec access_token)
  - Handler: `api/_handlers/public/appointments/get.js`
- `POST /api/appointments/:id/cancel` - Annuler RDV (avec cancel_token)
  - Handler: `api/_handlers/public/appointments/cancel.js`

#### Booking (Disponibilités)
- `GET /api/booking/availability` - Disponibilités structure
  - Handler: `api/_handlers/booking/availability.js`
- `GET /api/booking/services` - Services structure
  - Handler: `api/_handlers/booking/services.js`

### 2.2 Routes Admin (auth: ADMIN_TOKEN ou JWT admin)

#### Auth Admin
- `POST /api/auth/admin/login` - Login admin
  - Handler: `api/_handlers/auth/admin/login.js`
  - Body: email, password
  - Response: JWT token

#### Gestion Aides
- `GET /api/admin/aides` - Liste aides (admin)
  - Handler: `api/_handlers/admin/aides/list.js`
- `GET /api/admin/aides/:id` - Détail aide (admin)
  - Handler: `api/_handlers/admin/aides/get.js`
- `PUT /api/admin/aides/:id` - Éditer aide
  - Handler: `api/_handlers/admin/aides/update.js`
- `POST /api/admin/aides` - Créer aide
  - Handler: `api/_handlers/admin/aides/create.js`
- `DELETE /api/admin/aides/:id` - Supprimer aide
  - Handler: `api/_handlers/admin/aides/delete.js`

#### Gestion Démarches
- `GET /api/admin/demarches` - Liste démarches (admin)
  - Handler: `api/_handlers/admin/demarches/list.js`
- `PUT /api/admin/demarches/:id` - Éditer démarche
  - Handler: `api/_handlers/admin/demarches/update.js`

#### Gestion Structures
- `GET /api/admin/structures` - Liste structures (admin)
  - Handler: `api/_handlers/admin/structures/list.js`
- `PUT /api/admin/structures/:id` - Éditer structure
  - Handler: `api/_handlers/admin/structures/update.js`

#### Gestion RDV
- `GET /api/admin/appointments` - Liste RDV (admin)
  - Handler: `api/_handlers/admin/appointments/list.js`
- `PUT /api/admin/appointments/:id` - Éditer RDV
  - Handler: `api/_handlers/admin/appointments/update.js`

#### Messagerie Admin
- `GET /api/admin/messages` - Liste messages (admin)
  - Handler: `api/_handlers/admin/messages/list.js`

#### Synchronisation & Ingestion
- `POST /api/admin/sync` - Déclencher ingestion manuelle
  - Handler: `api/_handlers/admin/sync.js`
  - Query: source (structures, aides, rss), mode (smoke, full)
- `GET /api/admin/sync/recent` - Logs d'ingestion récents
  - Handler: `api/_handlers/admin/sync/recent.js`

#### RGPD & Privacy
- `POST /api/admin/privacy/gdpr/purge` - Purge RGPD manuelle
  - Handler: `api/_handlers/admin/privacy/gdpr.js`

### 2.3 Routes Pro (auth: JWT pro)

#### Auth Pro
- `POST /api/auth/pro/login` - Login pro
  - Handler: `api/_handlers/auth/pro/login.js`
  - Body: email, password
  - Response: JWT token
- `POST /api/auth/pro/register` - Inscription pro
  - Handler: `api/_handlers/auth/pro/register.js`
- `POST /api/auth/pro/forgot-password` - Mot de passe oublié
  - Handler: `api/_handlers/auth/pro/forgot-password.js`
- `POST /api/auth/pro/reset-password` - Réinitialiser mot de passe
  - Handler: `api/_handlers/auth/pro/reset-password.js`

#### Gestion Structure (Pro)
- `GET /api/pro/structure` - Infos structure du pro
  - Handler: `api/_handlers/pro/structure/get.js`
- `PUT /api/pro/structure` - Éditer structure
  - Handler: `api/_handlers/pro/structure/update.js`

#### Gestion Équipe (Pro)
- `GET /api/pro/team` - Liste équipe
  - Handler: `api/_handlers/pro/team/list.js`
- `POST /api/pro/team/invite` - Inviter membre
  - Handler: `api/_handlers/pro/team/invite.js`
- `DELETE /api/pro/team/:id` - Supprimer membre
  - Handler: `api/_handlers/pro/team/delete.js`

#### Gestion Services (Pro)
- `GET /api/pro/services` - Liste services
  - Handler: `api/_handlers/pro/services/list.js`
- `POST /api/pro/services` - Créer service
  - Handler: `api/_handlers/pro/services/create.js`
- `PUT /api/pro/services/:id` - Éditer service
  - Handler: `api/_handlers/pro/services/update.js`
- `DELETE /api/pro/services/:id` - Supprimer service
  - Handler: `api/_handlers/pro/services/delete.js`

#### Gestion Disponibilités (Pro)
- `GET /api/pro/availability` - Disponibilités du pro
  - Handler: `api/_handlers/pro/availability/get.js`
- `PUT /api/pro/availability` - Éditer disponibilités
  - Handler: `api/_handlers/pro/availability/update.js`

#### Gestion RDV (Pro)
- `GET /api/pro/appointments` - Liste RDV de la structure
  - Handler: `api/_handlers/pro/appointments/list.js`
- `PUT /api/pro/appointments/:id` - Éditer RDV (statut, notes)
  - Handler: `api/_handlers/pro/appointments/update.js`

#### Messagerie (Pro)
- `GET /api/pro/inbox` - Boîte de réception pro
  - Handler: `api/_handlers/pro/inbox/list.js`
- `POST /api/pro/messages` - Envoyer message
  - Handler: `api/_handlers/pro/messages/send.js`
- `POST /api/pro/messages/:id/read` - Marquer message lu
  - Handler: `api/_handlers/pro/messages/read.js`

#### Upload & Download (Pro)
- `POST /api/upload` - Upload fichier (pièce jointe)
  - Handler: `api/_handlers/upload.js`
- `GET /api/download/:key` - Télécharger fichier
  - Handler: `api/_handlers/download.js`

### 2.4 Routes Cron (auth: CRON_SECRET)

#### Pipeline d'Ingestion
- `POST /api/cron/pipeline` - Pipeline d'ingestion générique
  - Handler: `api/_handlers/cron/pipeline.js`
  - Query: source (structures, aides, rss), mode (smoke, full), limit
  - Cron: Toutes les heures (0 * * * *)
  - Fonctionnalités:
    - Ingestion structures (Alsace, Grand Est)
    - Ingestion aides (sources externes)
    - Ingestion actualités (RSS)
    - Déduplication via hash
    - Logs structurés (UpdateLog, ImportLog)
    - Anti silent failure (502 si fetchMs=0 et errors=[])

#### Ingestion Structures
- `POST /api/cron/ingest-structures` - Ingestion structures dédiée
  - Handler: `api/_handlers/cron/ingest-structures.js`
  - Cron: Dimanche à 2h (0 2 * * 0)
  - Sources: Soliguide API, CSV locaux

#### Purge RGPD
- `POST /api/cron/gdpr-purge` - Purge données RGPD
  - Handler: `api/_handlers/cron/gdpr-purge.js`
  - Cron: Non configuré (manuel ou à ajouter)
  - Fonctionnalités:
    - Suppression RDV anciens (>2 ans)
    - Suppression messages anciens (>2 ans)
    - Suppression bénéficiaires orphelins

#### Vérification Liens
- `POST /api/cron/link-check` - Vérification liens sources
  - Handler: `api/_handlers/cron/link-check.js`
  - Cron: Non configuré (manuel ou à ajouter)
  - Fonctionnalités:
    - Vérifier source_url de chaque aide/démarche/structure
    - Détecter liens morts (404, 500)
    - Mettre à jour last_checked_at

#### Purge Générique
- `POST /api/cron/purge` - Purge données génériques
  - Handler: `api/_handlers/cron/purge.js`
  - Cron: Non configuré (manuel ou à ajouter)

### 2.5 Routes Dev (auth: ALLOW_DEV_TOOLS=true)

- `GET /__dev/*` - Outils de développement
  - Handler: `api/__dev/*.js`
  - Exemples: logs, db inspect, test data

---

## 3. PAGES FRONTEND (69 pages)

### 3.1 Portail Public (Pages Principales)

#### Accueil & Navigation
- `/` - Home (accueil)
  - Composant: `src/pages/Home.jsx`
  - Fonctionnalités: Hero, recherche rapide, catégories, actualités récentes

#### Aides
- `/aides` - Liste des aides
  - Composant: `src/pages/Aides.jsx`
  - Fonctionnalités: Filtres (urgence, localisation, public, thème), pagination, recherche
- `/aides/:slug` - Détail d'une aide
  - Composant: `src/pages/AideDetail.jsx`
  - Fonctionnalités: Conditions, montants, étapes, documents, sources, FALC

#### Démarches
- `/demarches` - Liste des démarches
  - Composant: `src/pages/Demarches.jsx`
  - Fonctionnalités: Filtres (catégorie, localisation), pagination
- `/demarches/:slug` - Détail d'une démarche
  - Composant: `src/pages/DemarcheDetail.jsx`
  - Fonctionnalités: Étapes, documents, liens officiels, FALC

#### Annuaire (Structures)
- `/annuaire` - Annuaire des structures
  - Composant: `src/pages/Annuaire.jsx`
  - Fonctionnalités: Carte interactive, filtres (type, services, localisation), liste
- `/annuaire/:slug` - Détail d'une structure
  - Composant: `src/pages/StructureDetail.jsx`
  - Fonctionnalités: Horaires, services, contact, accessibilité, RDV

#### Actualités
- `/actualites` - Liste des actualités
  - Composant: `src/pages/Actualites.jsx`
  - Fonctionnalités: Pagination, filtres (catégorie, date)
- `/actualites/:slug` - Détail d'une actualité
  - Composant: `src/pages/ActualiteDetail.jsx`
  - Fonctionnalités: Contenu, source, FALC

#### Dispositifs
- `/dispositifs` - Liste des dispositifs locaux
  - Composant: `src/pages/Dispositifs.jsx`
  - Fonctionnalités: Filtres (département, public)
- `/dispositifs/:slug` - Détail d'un dispositif
  - Composant: `src/pages/DispositifDetail.jsx`
  - Fonctionnalités: Description, montant, liens

#### Guides & Ressources
- `/guides` - Liste des guides pratiques
  - Composant: `src/pages/Guides.jsx`
- `/guides/:slug` - Détail d'un guide
  - Composant: `src/pages/GuideDetail.jsx`
- `/ressources` - Ressources diverses
  - Composant: `src/pages/Ressources.jsx`
- `/ressources/:slug` - Détail d'une ressource
  - Composant: `src/pages/RessourceDetail.jsx`
- `/outils` - Boîte à outils
  - Composant: `src/pages/Tools.jsx`
- `/outils/:slug` - Détail d'un outil
  - Composant: `src/pages/ToolDetail.jsx`

### 3.2 Pages Légales & Info

- `/a-propos` - À propos
  - Composant: `src/pages/APropos.jsx`
- `/contact` - Contact
  - Composant: `src/pages/Contact.jsx`
- `/confidentialite` - Politique de confidentialité
  - Composant: `src/pages/Confidentialite.jsx`
- `/mentions-legales` - Mentions légales
  - Composant: `src/pages/MentionsLegales.jsx`
- `/cookies` - Politique cookies
  - Composant: `src/pages/Cookies.jsx`
- `/accessibilite` - Déclaration d'accessibilité
  - Composant: `src/pages/Accessibilite.jsx`
- `/securite` - Sécurité & données
  - Composant: `src/pages/Security.jsx`
- `/mission` - Mission & valeurs
  - Composant: `src/pages/Mission.jsx`
- `/methode` - Méthode & sources
  - Composant: `src/pages/Method.jsx`
- `/impact` - Impact & statistiques
  - Composant: `src/pages/Impact.jsx`
- `/partenaires` - Partenaires
  - Composant: `src/pages/Partners.jsx`
- `/sources` - Sources de données
  - Composant: `src/pages/Sources.jsx`
- `/sources-methode` - Méthodologie sources
  - Composant: `src/pages/SourcesMethode.jsx`

### 3.3 Espace Pro (Professionnels)

#### Auth Pro
- `/pro/login` - Login pro
  - Composant: `src/pages/LoginPro.jsx`
- `/pro/register` - Inscription pro
  - Composant: `src/pages/Register.jsx`
- `/pro/forgot-password` - Mot de passe oublié
  - Composant: `src/pages/ForgotPassword.jsx`
- `/pro/reset-password` - Réinitialiser mot de passe
  - Composant: `src/pages/ResetPassword.jsx`

#### Dashboard Pro
- `/pro/dashboard` - Tableau de bord pro
  - Composant: `src/pages/pro/Dashboard.jsx`
  - Layout: `src/pages/pro/ProLayout.jsx`

#### Gestion Structure
- `/pro/structure` - Gestion structure
  - Composant: `src/pages/pro/Structure.jsx`
  - Fonctionnalités: Éditer infos, horaires, services, accessibilité

#### Gestion Équipe
- `/pro/team` - Gestion équipe
  - Composant: `src/pages/pro/Team.jsx`
  - Fonctionnalités: Inviter membres, gérer rôles, supprimer

#### Gestion Services
- `/pro/services` - Gestion services
  - Composant: `src/pages/pro/Services.jsx`
  - Fonctionnalités: Créer, éditer, supprimer services

#### Gestion RDV
- `/pro/appointments` - Gestion RDV
  - Composant: `src/pages/pro/Appointments.jsx`
  - Fonctionnalités: Liste RDV, filtres (statut, date), détail, annulation
- `/pro/appointments/:id` - Détail RDV
  - Composant: `src/pages/pro/AppointmentDetail.jsx`

#### Messagerie Pro
- `/pro/inbox` - Boîte de réception pro
  - Composant: `src/pages/pro/Inbox.jsx`
  - Fonctionnalités: Liste conversations, envoyer message, pièces jointes

### 3.4 Espace Admin (Administrateurs)

#### Auth Admin
- `/admin/login` - Login admin
  - Composant: `src/pages/AdminLogin.jsx`

#### Dashboard Admin
- `/admin/dashboard` - Tableau de bord admin
  - Composant: `src/pages/admin/Dashboard.jsx`

#### Gestion Aides
- `/admin/aides` - Liste aides (admin)
  - Composant: `src/pages/AdminAides.jsx`
  - Fonctionnalités: Filtres, recherche, statuts, qualité
- `/admin/aides/:id` - Éditer aide
  - Composant: `src/pages/AdminAideEdit.jsx`
  - Fonctionnalités: Formulaire complet, validation, FALC, sources

#### Gestion Démarches
- `/admin/demarches` - Liste démarches (admin)
  - Composant: `src/pages/AdminDemarches.jsx`
- `/admin/demarches/:id` - Éditer démarche
  - Composant: `src/pages/AdminDemarcheEdit.jsx`

#### Gestion Structures
- `/admin/structures` - Liste structures (admin)
  - Composant: `src/pages/AdminStructures.jsx`
  - Fonctionnalités: Filtres, statuts, géolocalisation

#### Gestion RDV
- `/admin/appointments` - Liste RDV (admin)
  - Composant: `src/pages/AdminAppointments.jsx`
  - Fonctionnalités: Tous les RDV, filtres, statuts

#### Messagerie Admin
- `/admin/messages` - Messagerie admin
  - Composant: `src/pages/AdminMessages.jsx`
  - Fonctionnalités: Modération, surveillance

#### Synchronisation & Ingestion
- `/admin/sync` - Synchronisation données
  - Composant: `src/pages/AdminSync.jsx`
  - Fonctionnalités: Déclencher ingestion, voir logs
- `/admin/sync/test` - Test synchronisation
  - Composant: `src/pages/AdminTestSync.jsx`
- `/admin/sync/recent` - Logs récents
  - Composant: `src/pages/AdminRecentSyncs.jsx`
- `/admin/sync/guides` - Synchronisation guides
  - Composant: `src/pages/AdminGuideSync.jsx`

#### Gestion Sources
- `/admin/sources` - Gestion sources de données
  - Composant: `src/pages/AdminSources.jsx`
  - Fonctionnalités: Ajouter, éditer, désactiver sources

#### Review & Qualité
- `/admin/review` - Review contenu
  - Composant: `src/pages/AdminReview.jsx`
  - Fonctionnalités: Valider contenu, quality_score

#### Runs & Logs
- `/admin/runs` - Logs d'exécution
  - Composant: `src/pages/admin/Runs.jsx`

### 3.5 Pages Publiques Spéciales

#### Rendez-vous (Public)
- `/rdv/:structureSlug` - Demande de RDV
  - Composant: `src/pages/AppointmentRequest.jsx`
  - Fonctionnalités: Sélection service, créneau, formulaire, confirmation

#### Messagerie Bénéficiaire (Public)
- `/messages/:accessToken` - Messagerie bénéficiaire (magic link)
  - Composant: `src/pages/BeneficiaryMessages.jsx`
  - Fonctionnalités: Voir messages, répondre, pièces jointes (sans login)

#### Partenariat
- `/partenaires/suggerer` - Suggérer une structure partenaire
  - Composant: `src/pages/SuggestStructure.jsx`
  - Fonctionnalités: Formulaire, consentement RGPD

#### Subventions (Expérimental)
- `/subventions/dossier` - Dossier de subvention
  - Composant: `src/pages/SubventionDossier.jsx`

### 3.6 Pages Système

- `/404` - Page non trouvée
  - Composant: `src/pages/NotFound.jsx`
- `/sentry-test` - Test Sentry
  - Composant: `src/pages/SentryTestPage.jsx`
- `/styleguide` - Guide de style (dev)
  - Composant: `src/pages/StyleguideBranding.jsx`

---

## 4. COMPOSANTS REACT (73 composants)

### 4.1 Composants UI (Design System)

**Localisation**: `src/design/ui/`

Composants Radix UI (accessibles):
- `accordion.jsx` - Accordéon
- `alert.jsx` - Alerte
- `alert-dialog.jsx` - Dialogue d'alerte
- `aspect-ratio.jsx` - Ratio d'aspect
- `avatar.jsx` - Avatar
- `badge.jsx` - Badge
- `button.jsx` - Bouton
- `card.jsx` - Carte
- `checkbox.jsx` - Case à cocher
- `collapsible.jsx` - Collapsible
- `command.jsx` - Palette de commandes
- `context-menu.jsx` - Menu contextuel
- `dialog.jsx` - Dialogue
- `dropdown-menu.jsx` - Menu déroulant
- `form.jsx` - Formulaire (react-hook-form)
- `hover-card.jsx` - Carte au survol
- `input.jsx` - Champ de saisie
- `input-otp.jsx` - OTP input
- `label.jsx` - Label
- `menubar.jsx` - Barre de menu
- `navigation-menu.jsx` - Menu de navigation
- `popover.jsx` - Popover
- `progress.jsx` - Barre de progression
- `radio-group.jsx` - Groupe radio
- `scroll-area.jsx` - Zone de défilement
- `select.jsx` - Sélecteur
- `separator.jsx` - Séparateur
- `sheet.jsx` - Panneau latéral
- `skeleton.jsx` - Skeleton loader
- `slider.jsx` - Curseur
- `switch.jsx` - Interrupteur
- `table.jsx` - Tableau
- `tabs.jsx` - Onglets
- `textarea.jsx` - Zone de texte
- `toast.jsx` - Toast (notifications)
- `toggle.jsx` - Toggle
- `toggle-group.jsx` - Groupe toggle
- `tooltip.jsx` - Info-bulle

### 4.2 Composants Métier

**Localisation**: `src/components/`

#### Navigation & Layout
- `Header.jsx` - En-tête principal
- `Footer.jsx` - Pied de page
- `Sidebar.jsx` - Barre latérale
- `Breadcrumb.jsx` - Fil d'Ariane
- `MobileNav.jsx` - Navigation mobile

#### Cartes & Listes
- `AideCard.jsx` - Carte aide
- `DemarcheCard.jsx` - Carte démarche
- `StructureCard.jsx` - Carte structure
- `ActualiteCard.jsx` - Carte actualité
- `DispositifCard.jsx` - Carte dispositif

#### Filtres & Recherche
- `FilterBar.jsx` - Barre de filtres
- `SearchBar.jsx` - Barre de recherche
- `FilterChip.jsx` - Chip de filtre
- `SortDropdown.jsx` - Menu tri

#### Formulaires
- `FormField.jsx` - Champ de formulaire
- `FormError.jsx` - Erreur de formulaire
- `FormSuccess.jsx` - Succès de formulaire
- `FileUpload.jsx` - Upload fichier
- `DatePicker.jsx` - Sélecteur de date
- `TimePicker.jsx` - Sélecteur d'heure

#### Affichage Contenu
- `MarkdownRenderer.jsx` - Rendu Markdown
- `FalcSummary.jsx` - Résumé FALC
- `SourceLink.jsx` - Lien source
- `TagList.jsx` - Liste de tags
- `EmptyState.jsx` - État vide
- `LoadingSpinner.jsx` - Spinner de chargement
- `ErrorBoundary.jsx` - Boundary d'erreur

#### RDV & Booking
- `AvailabilityCalendar.jsx` - Calendrier disponibilités
- `TimeSlotPicker.jsx` - Sélecteur créneau
- `AppointmentCard.jsx` - Carte RDV
- `AppointmentStatus.jsx` - Statut RDV

#### Messagerie
- `ChatWindow.jsx` - Fenêtre de chat
- `MessageBubble.jsx` - Bulle de message
- `MessageInput.jsx` - Champ de message
- `AttachmentPreview.jsx` - Aperçu pièce jointe

#### Admin
- `AdminTable.jsx` - Tableau admin
- `StatusBadge.jsx` - Badge statut
- `QualityScore.jsx` - Score qualité
- `SyncStatus.jsx` - Statut synchronisation

#### SEO & Meta
- `SEO.jsx` - Composant SEO (react-helmet-async)
- `JsonLd.jsx` - Structured data JSON-LD

#### Accessibilité
- `SkipToContent.jsx` - Lien "Aller au contenu"
- `ScreenReaderOnly.jsx` - Texte lecteur d'écran

---

## 5. MODÈLES PRISMA (28 modèles)

### 5.1 Modèles Portail Public (10 modèles)

1. **Aide** - Aides sociales
2. **AidCategory** - Catégories d'aides
3. **LifeSituation** - Situations de vie
4. **AidSource** - Sources d'aides
5. **Demarche** - Démarches administratives
6. **Structure** - Structures (annuaire)
7. **Actualite** - Actualités (RSS)
8. **Dispositif** - Dispositifs locaux
9. **Guide** - Guides pratiques
10. **ToolboxItem** - Outils (boîte à outils)

### 5.2 Modèles Système RDV (8 modèles)

11. **ProUser** - Professionnels
12. **Service** - Services proposés
13. **Invitation** - Invitations équipe
14. **Availability** - Disponibilités
15. **Beneficiary** - Bénéficiaires
16. **Appointment** - Rendez-vous
17. **Message** - Messages
18. **Attachment** - Pièces jointes

### 5.3 Modèles Admin & Audit (5 modèles)

19. **AdminUser** - Comptes admin
20. **AuditLog** - Logs d'audit
21. **EntityVersion** - Versioning entités
22. **SourceSnapshot** - Snapshots sources
23. **ConsentLog** - Logs consentement RGPD

### 5.4 Modèles Ingestion (5 modèles)

24. **ImportLog** - Logs d'import
25. **UpdateLog** - Logs de mise à jour
26. **RssSource** - Sources RSS
27. **Source** - Sources génériques
28. **PartnershipRequest** - Demandes partenariat
29. **ResourceAccessibility** - Ressources accessibilité

---

## 6. JOBS CRON (5 jobs)

### 6.1 Jobs Configurés (vercel.json)

1. **Pipeline d'Ingestion** (`/api/cron/pipeline`)
   - Schedule: `0 * * * *` (toutes les heures)
   - Handler: `api/_handlers/cron/pipeline.js`
   - Fonctionnalités: Ingestion structures, aides, actualités (RSS)

2. **Ingestion Structures** (`/api/cron/ingest-structures`)
   - Schedule: `0 2 * * 0` (dimanche à 2h)
   - Handler: `api/_handlers/cron/ingest-structures.js`
   - Fonctionnalités: Ingestion structures Alsace/Grand Est

### 6.2 Jobs Non Configurés (à ajouter)

3. **Purge RGPD** (`/api/cron/gdpr-purge`)
   - Handler: `api/_handlers/cron/gdpr-purge.js`
   - Recommandation: `0 3 * * 0` (dimanche à 3h)

4. **Vérification Liens** (`/api/cron/link-check`)
   - Handler: `api/_handlers/cron/link-check.js`
   - Recommandation: `0 4 * * 1` (lundi à 4h)

5. **Purge Générique** (`/api/cron/purge`)
   - Handler: `api/_handlers/cron/purge.js`
   - Recommandation: `0 5 * * 0` (dimanche à 5h)

---

## 7. SCRIPTS UTILITAIRES (80+ scripts)

### 7.1 Scripts de Seed

- `seed-aides-with-taxonomy.js` - Seed aides avec taxonomie
- `seed-demarches.ts` - Seed démarches
- `seed-lot3-data.js` à `seed-lot7-data.js` - Seed par lot
- `seed-minimum-aides.js` - Seed aides minimales
- `seed-minimum-demarches.js` - Seed démarches minimales
- `seed-minimum-structures.js` - Seed structures minimales
- `seed-rss-sources.js` - Seed sources RSS
- `seed-taxonomy.js` - Seed taxonomie
- `seed-structures-extra.ts` - Seed structures supplémentaires
- `populate-database.js` - Population DB complète

### 7.2 Scripts de Vérification

- `verify-actualites.js` - Vérifier actualités
- `verify-admin-noindex.js` - Vérifier noindex admin
- `verify-content-population.js` - Vérifier population contenu
- `verify-dns.sh` - Vérifier DNS
- `verify-env.js` - Vérifier variables d'environnement
- `verify-handler-imports.js` - Vérifier imports handlers
- `verify-imports.js` - Vérifier imports généraux
- `verify-lot2.js` à `verify-lot9a-routes.js` - Vérifier lots fonctionnels
- `verify-rdv.js` - Vérifier système RDV
- `verify-robots.js` - Vérifier robots.txt
- `verify-rollback.js` - Vérifier rollback
- `verify-seo.js` - Vérifier SEO
- `verify-sitemap.js` - Vérifier sitemap
- `verify-staging.sh` - Vérifier staging
- `verify_messaging.js` - Vérifier messagerie
- `verify_prod_pipeline.sh` - Vérifier pipeline prod
- `final_verify.sh` - Vérification finale

### 7.3 Scripts d'Ingestion & Import

- `import-csv.js` - Import CSV générique
- `import-structures-alsace.js` - Import structures Alsace
- `test-alsace-ingest.js` - Test ingestion Alsace
- `test-ingest-aids.js` - Test ingestion aides
- `test-news-pipeline.js` - Test pipeline actualités
- `trigger-ingestion.js` - Déclencher ingestion manuelle

### 7.4 Scripts de Sécurité & Admin

- `create-admin.js` - Créer compte admin
- `create-pro-admin.js` - Créer compte pro admin
- `debug-security.mjs` - Debug sécurité
- `security-check.js` - Vérification sécurité
- `test-admin-security.js` - Test sécurité admin
- `guard-no-legacy-key.sh` - Guard clés legacy
- `guard-prisma.js` - Guard Prisma

### 7.5 Scripts de Test

- `smoke-test.js` - Smoke test
- `smoke-prod.sh` - Smoke test prod
- `test-ratelimit.js` - Test rate limiting
- `test-robots-logic.js` - Test robots.txt
- `test-sitemap-logic.js` - Test sitemap
- `test-sitemap-handler.test.js` - Test handler sitemap

### 7.6 Scripts de Maintenance

- `backfill-slugs.js` - Backfill slugs
- `backup_aides.js` - Backup aides
- `check_cp0_db.js` - Check DB CP0
- `check_cp1_slugs.js` - Check slugs CP1
- `check-imports.js` - Check imports
- `enable-unaccent.js` - Activer unaccent Postgres
- `fix_extensions.py` - Fix extensions fichiers
- `fix_imports.py` - Fix imports
- `generate-build-info.js` - Générer build info
- `generate-repo-map.sh` - Générer carte repo
- `unset-slug.js` - Unset slugs

### 7.7 Scripts de Développement

- `dev-demo-setup.js` - Setup démo dev
- `ci-healthcheck.js` - Healthcheck CI
- `healthcheck_prod.sh` - Healthcheck prod
- `reproduce_issue_legacy.js` - Reproduire issue legacy

---

## 8. TESTS (28 fichiers, 126 tests)

### 8.1 Tests Unitaires (10 fichiers)

- `tests/unit/jsonld.test.js` (10 tests) - Tests JSON-LD
- `tests/unit/queryState.test.js` (13 tests) - Tests query state
- `tests/unit/ingestion.test.js` (7 tests) - Tests ingestion
- `tests/unit/crypto.test.js` (6 tests) - Tests crypto
- `tests/unit/falcsummary.test.js` (9 tests) - Tests FALC
- `tests/unit/taxonomy.test.js` (3 tests) - Tests taxonomie
- `tests/unit/errorboundary.test.js` (5 tests) - Tests error boundary
- `tests/unit/errorBoundary.test.jsx` (6 tests) - Tests error boundary (JSX)
- `tests/unit/pipeline.test.js` (1 test) - Tests pipeline
- `tests/slug.test.js` (7 tests) - Tests slugs

### 8.2 Tests d'Intégration API (10 fichiers)

- `tests/integration/api.test.js` (6 tests) - Tests API généraux
- `tests/integration/api_slug.test.js` (3 tests) - Tests API slug
- `tests/integration/api_head.test.js` (1 test) - Tests API HEAD
- `tests/integration/aides_v2.test.js` (4 tests) - Tests aides V2
- `tests/integration/actualites.test.js` (3 tests) - Tests actualités
- `tests/integration/ressources.test.js` (6 tests) - Tests ressources
- `tests/integration/rateLimit.test.js` (2 tests) - Tests rate limiting
- `tests/integration/url_consistency.test.js` (1 test) - Tests cohérence URL
- `tests/integration/pipeline_routing.test.js` (10 tests) - Tests routing pipeline
- `api/_handlers/cron/pipeline.test.js` (2 tests) - Tests pipeline cron

### 8.3 Tests de Sécurité (4 fichiers)

- `tests/auth_crossing.test.js` (4 tests) - Tests crossing auth
- `api/tests/admin-security.test.js` (1 test) - Tests sécurité admin
- `api/tests/rbac.test.js` (4 tests) - Tests RBAC
- `api/_handlers/admin/privacy/gdpr.test.js` (4 tests) - Tests RGPD

### 8.4 Tests Infrastructure (4 fichiers)

- `tests/sitemap.test.js` (1 test) - Tests sitemap
- `scripts/test-sitemap-handler.test.js` (3 tests) - Tests handler sitemap
- `api/lib/search-query.test.js` (2 tests) - Tests search query
- `api/_handlers/cron/pipeline.regression.test.js` (2 tests) - Tests régression pipeline

---

## 9. DÉPENDANCES (957 packages)

### 9.1 Dépendances Production (60 packages)

**Frontend Core**:
- react 18.2.0
- react-dom 18.2.0
- react-router-dom 7.2.0
- @tanstack/react-query 5.90.16

**UI Components**:
- @radix-ui/* (30+ packages)
- lucide-react 0.475.0
- framer-motion 12.4.7
- embla-carousel-react 8.5.2
- recharts 2.15.1

**Forms & Validation**:
- react-hook-form 7.54.2
- @hookform/resolvers 4.1.2
- zod 3.24.2

**Styling**:
- tailwindcss 3.4.17 (devDep)
- tailwind-merge 3.0.2
- tailwindcss-animate 1.0.7
- class-variance-authority 0.7.1
- clsx 2.1.1

**Backend Core**:
- @prisma/client 5.22.0
- @vercel/edge 1.2.2
- @vercel/kv 3.0.0
- undici 7.18.2

**Auth & Security**:
- jsonwebtoken 9.0.3
- bcryptjs 3.0.3
- (crypto natif Node.js pour AES-256-GCM)

**Rate Limiting**:
- @upstash/ratelimit 2.0.8
- @upstash/redis 1.36.1

**Observabilité**:
- @sentry/node 10.34.0
- @sentry/react 10.34.0
- pino 10.3.0

**Storage**:
- @aws-sdk/client-s3 3.980.0
- @aws-sdk/s3-request-presigner 3.980.0

**Utilities**:
- date-fns 3.6.0
- @sindresorhus/slugify 3.0.0
- busboy 1.6.0
- dotenv 17.2.3
- inquirer 13.2.0

**Content**:
- react-markdown 10.1.0
- remark-gfm 4.0.1
- rehype-raw 7.0.0
- rss-parser 3.13.0

**SEO**:
- react-helmet-async 2.0.5

**Themes**:
- next-themes 0.4.4

**AI** (optionnel):
- openai 6.16.0

### 9.2 Dépendances Développement (20 packages)

**Build Tools**:
- vite 6.1.0
- @vitejs/plugin-react 4.3.4
- @sentry/vite-plugin 4.7.0

**TypeScript**:
- typescript 5.9.3
- @types/node 22.13.5
- @types/react 18.2.66
- @types/react-dom 18.2.22
- tsx 4.21.0

**Linting**:
- eslint 9.19.0
- @eslint/js 9.19.0
- eslint-plugin-react 7.37.4
- eslint-plugin-react-hooks 5.0.0
- eslint-plugin-react-refresh 0.4.18
- globals 15.14.0

**Database**:
- prisma 5.22.0

**Testing**:
- vitest 4.0.18
- @playwright/test 1.58.0
- playwright 1.58.0

**Styling**:
- tailwindcss 3.4.17
- postcss 8.5.3
- autoprefixer 10.4.20

**Deployment**:
- @flydotio/dockerfile 0.7.4

---

## 10. CONFIGURATION & FICHIERS CLÉS

### 10.1 Configuration Build & Dev

- `package.json` - Dépendances, scripts npm
- `vite.config.js` - Configuration Vite
- `vercel.json` - Configuration Vercel (routes, cron, headers)
- `tsconfig.typecheck.json` - Configuration TypeScript (typecheck only)
- `jsconfig.json` - Configuration JavaScript (IDE)

### 10.2 Configuration Qualité

- `eslint.config.js` - Configuration ESLint
- `.gitignore` - Fichiers ignorés Git

### 10.3 Configuration Styling

- `tailwind.config.js` - Configuration Tailwind CSS
- `postcss.config.js` - Configuration PostCSS
- `components.json` - Configuration shadcn/ui

### 10.4 Configuration Database

- `prisma/schema.prisma` - Schéma Prisma
- `prisma/migrations/` - Migrations SQL
- `prisma/seed.js` - Seed data

### 10.5 Configuration Tests

- `playwright.config.js` - Configuration Playwright (E2E)
- (Vitest configuré dans vite.config.js)

### 10.6 Configuration CI/CD

- `.github/workflows/ci.yml` - GitHub Actions CI

### 10.7 Configuration Environnement

- `.env.example` - Variables d'environnement (template)
- `.env` - Variables d'environnement (local, non committé)

### 10.8 Documentation

- `README.md` - Documentation principale
- `docs/` - Documentation détaillée
  - `docs/audit/` - Dossier d'audit (ce document)
  - `docs/roadmap/` - Roadmaps techniques
  - `docs/spec/` - Spécifications
  - `docs/INFRASTRUCTURE.md` - Infrastructure
  - `docs/VERCEL_MIGRATION_GUIDE.md` - Guide migration Vercel

---

## 11. OBSERVATIONS & RECOMMANDATIONS

### 11.1 Points Forts

✅ **Architecture modulaire**: Handlers API bien séparés, composants React réutilisables
✅ **Tests complets**: 126 tests couvrant unitaire, intégration, sécurité
✅ **Design system robuste**: Radix UI + Tailwind CSS + shadcn/ui
✅ **Sécurité de base**: JWT, bcrypt, AES-256-GCM, headers sécurisés
✅ **Accessibilité**: Composants accessibles (Radix UI), FALC
✅ **SEO**: Sitemap, robots.txt, meta tags
✅ **Observabilité**: Sentry, logs structurés (pino)
✅ **Rate limiting**: Upstash Redis + fallback mémoire
✅ **Ingestion**: Pipeline robuste, déduplication, logs

### 11.2 Points à Améliorer

⚠️ **Documentation**: Manque de documentation centralisée des scripts, composants, API
⚠️ **TypeScript**: Typecheck limité aux E2E, pas de vérification du code source principal
⚠️ **Coverage**: Pas de mesure de couverture de tests
⚠️ **Feature flags**: Pas de système de feature flags (nécessaire pour V2)
⚠️ **Outlook sync**: Pas encore implémenté (V2)
⚠️ **RGPD**: Documentation à compléter (minimisation, logs)
⚠️ **CI**: Pas de service Postgres en CI (tests en mémoire)

---

**FIN DE L'INVENTAIRE**

Ce document complète `BASELINE.md` et sera utilisé comme référence pour les phases suivantes.
