# Blueprint Stratégique et Rapport d'Architecture : Remédiation et Mise à l'Échelle de la Plateforme Acces-Direct-Aide

## Résumé Exécutif et Contexte d'Ingénierie
La plateforme Acces-Direct-Aide représente une initiative d'infrastructure numérique critique, conçue pour connecter les citoyens français en situation de vulnérabilité avec des travailleurs sociaux dévoués. Initié par une expertise métier plutôt que par une ingénierie technique traditionnelle, ce projet tire parti de systèmes avancés d'intelligence artificielle pour combler le fossé en matière de développement logiciel complexe. La proposition de valeur fondamentale de la plateforme repose sur une planification de rendez-vous fluide et sans mot de passe, une messagerie cryptée à divulgation nulle (Zero-Knowledge) pour les dossiers sensibles, et une interface assistée par l'intelligence artificielle Gemini pour optimiser la charge administrative des travailleurs sociaux.

Cependant, l'environnement de production actuel subit des défaillances catastrophiques qui empêchent les opérations fondamentales. L'architecture de l'application souffre de mauvaises configurations de déploiement sévères et d'erreurs de gestion d'état critiques. Les utilisateurs sont bloqués de manière permanente par des erreurs d'hydratation se traduisant par un état de chargement infini (loading skeleton) dans l'environnement de production. De plus, le schéma de la base de données ne parvient pas à migrer correctement lors des compilations Vercel, et la logique de planification des rendez-vous est fondamentalement défectueuse.

Ce rapport de recherche exhaustif et ce plan de gestion de projet fournissent l'architecture de base, les protocoles de triage et la feuille de route stratégique nécessaires pour sauver et faire évoluer la plateforme Acces-Direct-Aide. En s'appuyant massivement sur l'écosystème de l'agent IA Google Antigravity et sa vaste bibliothèque de compétences autonomes (skills), ce document permet aux fondateurs non techniques d'orchestrer une refonte architecturale complexe, d'exécuter une correction de bogues chirurgicale et d'établir une application résiliente et prête pour la production.

## Document d'Exigences Produit (PRD)

Le Document d'Exigences Produit (Product Requirements Document) établit la portée définitive, les spécifications fonctionnelles et les paradigmes d'interaction utilisateur pour la plateforme Acces-Direct-Aide. Il sert de source de vérité absolue pour toutes les tâches de développement pilotées par l'intelligence artificielle et exécutées via l'assistant Antigravity. Il est impératif que les agents autonomes disposent de ce contexte sociologique et technique pour ne pas dévier des normes de sécurité strictes imposées par la nature du projet.

### Vision de la Plateforme et Objectifs Fondamentaux
L'objectif principal d'Acces-Direct-Aide est d'éliminer les frictions technologiques et psychologiques généralement associées à l'accès aux services sociaux. Les populations vulnérables sont souvent confrontées à des barrières numériques, à une surcharge cognitive et à de profondes inquiétudes quant à la confidentialité lorsqu'elles cherchent de l'aide. La plateforme atténue ces problèmes en supprimant les barrières d'authentification traditionnelles, en garantissant une confidentialité cryptographique absolue pour les communications et en réduisant la charge administrative des travailleurs sociaux afin qu'ils puissent se concentrer sur un accompagnement centré sur l'humain. Le mandat architectural exige le maintien de la pile technologique moderne existante, à savoir React et Tailwind pour l'interface utilisateur, Prisma pour l'orchestration de la base de données et Vercel pour le déploiement en périphérie (Edge), tout en renforçant le système contre les vulnérabilités de production actuelles.

### Personas Cibles et Paradigmes Comportementaux
La compréhension de la base d'utilisateurs est essentielle pour définir les contraintes opérationnelles et les seuils de sécurité du système. La plateforme dessert trois catégories d'utilisateurs distinctes, chacune ayant des exigences et des niveaux de compétence technique uniques. L'agent IA Antigravity devra concevoir les interfaces et les flux de données en respectant scrupuleusement ces profils.

| Catégorie de Persona | Caractéristiques Cognitives et Techniques | Exigences Systémiques Spécifiques | Attente en Matière de Confidentialité et de Sécurité |
| :--- | :--- | :--- | :--- |
| **Le Citoyen Vulnérable** | Subit une charge cognitive élevée due au stress, utilise potentiellement des appareils mobiles anciens ou partagés, manque de sophistication technique et peut avoir une connectivité internet précaire. | Nécessite une entrée sans mot de passe (liens magiques par SMS ou e-mail), un accès immédiat aux interfaces de planification sans friction, et des temps de chargement ultra-rapides. | Anonymat absolu et assurance mathématique que les difficultés personnelles ne peuvent être interceptées ou divulguées par des tiers. |
| **Le Travailleur Social** | Gère un volume de cas très élevé, subit une fatigue administrative chronique, et nécessite un accès rapide aux historiques chronologiques des dossiers. | Exige un tableau de bord à haute densité d'informations, une synthèse assistée par l'IA des messages des citoyens, et une vue de calendrier unifiée et réactive. | Nécessite des clés de déchiffrement à divulgation nulle (Zero-Knowledge) pour accéder aux dossiers exclusivement sur son client local authentifié. |
| **L'Administrateur Système** | Supervise la santé de la plateforme, gère l'intégration des travailleurs sociaux et surveille la consommation des ressources de l'infrastructure Vercel. | Nécessite des tableaux de bord de télémétrie, des journaux d'audit (excluant strictement le contenu chiffré), et des commandes de configuration du système. | Opère sous des frontières de conformité strictes ; ne doit en aucun cas avoir un accès technique au texte brut des communications citoyen-travailleur. |

### Spécifications Fonctionnelles Fondamentales
L'ensemble des fonctionnalités de la plateforme est conçu autour de la sécurité, de l'accessibilité et de l'augmentation par l'intelligence artificielle. Les spécifications suivantes décrivent la logique requise pour les modules principaux, qui devront être codés par l'agent Antigravity.

#### Module d'Authentification sans Mot de Passe et de Planification
Les paradigmes traditionnels de nom d'utilisateur et de mot de passe représentent un point d'abandon significatif pour les individus en crise. La plateforme utilise un flux d'authentification sans mot de passe reposant sur des jetons cryptographiques à usage unique, sécurisés et livrés via un e-mail ou un SMS (Magic Links). En cliquant sur le lien magique, le système doit établir une session sécurisée et diriger immédiatement le citoyen vers l'interface de planification des rendez-vous, contournant ainsi toute barrière mémorielle.

Le système de planification actuellement défectueux doit être entièrement remanié pour prendre en charge une logique temporelle complexe. Le schéma de la base de données Prisma doit tenir compte de la disponibilité des travailleurs sociaux, de la normalisation des fuseaux horaires (spécifiquement l'heure d'Europe centrale, CET, pour la démographie française) et de la prévention stricte des doubles réservations (concurrency booking). L'interface doit présenter les créneaux horaires disponibles de manière intuitive, en se mettant à jour dynamiquement en fonction des verrouillages de base de données en temps réel pour empêcher les collisions lors de la prise de rendez-vous simultanée par plusieurs citoyens.

#### Messagerie Chiffrée à Divulgation Nulle (Zero-Knowledge)
Compte tenu de l'extrême sensibilité des discussions liées à l'aide sociale, le chiffrement standard de la base de données au repos (at-rest encryption) fourni par les hébergeurs cloud est notoirement insuffisant. La plateforme requiert une véritable architecture à divulgation nulle (Zero-Knowledge ou ZK). Les messages doivent être chiffrés directement sur l'appareil client du citoyen à l'aide d'une clé publique associée à son travailleur social assigné. Le serveur, hébergé sur Vercel, agit simplement comme un relais passif, stockant la charge utile (payload) chiffrée au sein de la base de données PostgreSQL gérée par Prisma.

Le processus de déchiffrement s'effectue strictement dans la mémoire du navigateur du travailleur social lors de l'authentification, en utilisant sa clé privée stockée localement ou dérivée de manière sécurisée. Cette architecture garantit que, même en cas de violation totale des serveurs Vercel ou d'exfiltration de la base de données Neon, le contenu en texte clair des dossiers reste mathématiquement inaccessible aux acteurs malveillants, aux gouvernements, et même aux administrateurs du système Acces-Direct-Aide.

#### Intégration et Augmentation de l'IA Gemini
Le moteur d'intelligence artificielle Gemini sert de copilote actif pour le travailleur social, visant à réduire le fardeau administratif. Pour maintenir la posture de sécurité à divulgation nulle, l'intégration de l'IA doit opérer dans des limites structurelles strictes. Lorsqu'un travailleur social déchiffre un fil de discussion sur son client local, il peut autoriser explicitement la transmission du texte déchiffré à l'API Gemini pour traitement.

L'IA est chargée de générer des résumés psychologiques concis, d'identifier les facteurs de risque immédiats (par exemple, les mentions d'automutilation, de violence domestique ou de dénuement financier extrême) et de rédiger des modèles de réponse empathiques et juridiquement conformes. Le système ne doit en aucun cas transmettre automatiquement des charges utiles chiffrées ou en clair au modèle d'IA sans le consentement explicite de l'utilisateur et le déchiffrement local préalable. Cette isolation garantit la souveraineté des données.

---

## Plan Architectural et Stratégie Technique

L'architecture technique d'Acces-Direct-Aide s'appuie sur un écosystème moderne et sans serveur (serverless). Cependant, l'implémentation actuelle souffre de défauts d'intégration sévères qui paralysent la production. Cette section définit l'architecture cible requise pour stabiliser la plateforme et fournit le cadre conceptuel nécessaire à l'utilisation efficace de l'agent Antigravity.

### Topologie du Système et Flux de Données
La plateforme est construite sur React, avec un déploiement sur le réseau Edge de Vercel, qui offre une diffusion de contenu mondiale avec une latence minimale, mais introduit des contraintes très spécifiques concernant les limites d'exécution, le contexte d'exécution V8, et la mise en cache agressive des dépendances.

La persistance des données est gérée par une base de données PostgreSQL Serverless hébergée chez Neon, entièrement orchestrée via le mappeur objet-relationnel (ORM) Prisma. L'utilisation de Neon offre une gestion native du regroupement de connexions (connection pooling) et une ramification instantanée (branching), ce qui est extrêmement avantageux pour les environnements sans serveur où les fonctions Vercel s'allument et s'éteignent rapidement. Cependant, la nature apatride (stateless) des fonctions Vercel Edge exige des stratégies spécifiques de génération du client Prisma pour s'assurer que l'application maintient une connexion persistante à la base de données sans épuiser les limites de connexion ou référencer des binaires de schéma obsolètes.

L'architecture système s'articule autour de quatre nœuds principaux : l'interface client (citoyen et travailleur social) construite en React et Tailwind, l'hébergement Vercel exécutant l'API Node.js et le client Prisma, la couche de base de données gérée par Neon Serverless Postgres, et les services externes incluant l'API Gemini et le fournisseur de liens magiques. Une distinction cruciale réside dans les flux de données pour respecter la sécurité Zero-Knowledge. Les connexions illustrent le trafic chiffré circulant du client vers Vercel puis vers la base Neon, garantissant que Vercel ne stocke et ne traite que des textes inintelligibles. Le trafic en texte clair n'existe que localement sur le client de l'utilisateur, et ne circule de manière sélective qu'entre le client du travailleur social et l'API Gemini, et ce, uniquement après une action volontaire de décryptage.

### Gestion et Déploiement

- Déploiement CI/CD via **GitHub Actions** pour le linting (ESLint, Prettier) et les tests End-to-End (Playwright).
- Hébergement sur **Vercel** avec exploitation de la technologie **Vercel Edge Functions** pour le middleware de routage et d'authentification rapide.
- **`npm run audit`** ou `node scripts/system-audit.js` permet à l'administrateur de vérifier rapidement l'état d'intégrité de l'environnement (Variables, Prisma, Logs, Build).

## Télémétrie et Performance
L'application intègre `@vercel/analytics` et `@vercel/speed-insights` embarqués pour un suivi *Privacy-First* des métriques Core Web Vitals, évitant ainsi le recours à des SDK Trackers imposants. Le projet limite volontairement son empreinte carbone et la taille de ses bundles (`Lazy Loading` systématique).

### Erreurs d'Hydratation et Mises en Cache
Les échecs d'hydratation actuels, qui bloquent les utilisateurs sur des squelettes de chargement, indiquent une discordance critique entre le HTML rendu par le serveur (SSG/SSR via Vite) et l'arborescence React générée côté client, ou un problème de chunks JavaScript introuvables.
Toute logique qui s'appuie sur des API spécifiques au navigateur, telles que l'objet window, le localStorage, ou le formatage complexe de la date et de l'heure dépendant du fuseau horaire local de l'utilisateur, doit être encapsulée dans des hooks useEffect pour garantir qu'elles ne s'exécutent qu'après la fin de la phase d'hydratation initiale.

---

## Plan de Priorisation : Triage Critique et Remédiation

La plateforme Acces-Direct-Aide est actuellement paralysée par des bogues de production interconnectés. Ce plan de triage dissèque les causes profondes des défaillances et fournit la logique procédurale précise que l'agent Antigravity doit exécuter pour restaurer les fonctionnalités de base.

### Priorité 1 : Erreurs d'Hydratation et le Verrouillage du Squelette de Chargement
La défaillance la plus visible et la plus critique est le blocage de l'application qui enferme les utilisateurs dans un état de squelette de chargement (loading skeleton) infini dans l'environnement de production.

**Protocole de Remédiation pour l'Agent Antigravity :**
- Audit exhaustif des composants React (hooks `useEffect`, gestion d'état asynchrone).
- Encapsulation des APIs spécifiques au navigateur.
- Ajout de la directive `suppressHydrationWarning` partout où le rendu asynchrone est inévitable (ex: détection du device, dates locales).

### Priorité 2 : Migration Prisma sur Vercel et Défaillances du Client Obsolète
Processus de compilation Vercel réussit souvent en apparence, mais l'application en production plante lors de la tentative d'interaction avec la base de données PostgreSQL Neon. Erreurs de type "outdated Prisma Client" (client Prisma obsolète) ou tables requises manquantes.
Analyse de la Cause Profonde : Vercel met en cache node_modules. Les migrations ne sont pas appliquées à la DB distante.

**Protocole de Remédiation pour l'Agent Antigravity / Fondateur :**
- Ajouter un script personnalisé : `"postinstall": "prisma generate"` dans le package.json.
- Le fondateur modifiera sur Vercel la commande de compilation par défaut par (via `vercel.json` ou UI) : `npx prisma generate && npx prisma migrate deploy && vite build` (adapté pour Vite).

### Priorité 3 : Refactorisation du Système de Planification des Rendez-vous
Le système actuel de planification est défectueux (données temporelles, fuseaux horaires, conflits de concurrence).

**Protocole de Remédiation pour l'Agent Antigravity :**
- Ré-architecture du Schéma Prisma : Redéfinir le modèle Appointment avec startTime, endTime, workerId, et citizenId indexés.
- Logique de Prévention de Concurrence : Transactions Prisma pour éviter les doubles réservations.
- Normalisation des Fuseaux Horaires : Stockage strict en UTC universel, reconversion en CET (Europe/Paris) uniquement côté client.

---

## Plan d'Action (Feuille de Route)

La remédiation, la stabilisation et la mise à l'échelle de la plateforme Acces-Direct-Aide seront exécutées selon un calendrier rigide de 8 semaines, utilisant l'orchestrateur IA Antigravity pour exécuter le travail technique lourd de refactorisation du code.

### Phase 1 : Stabilisation Immédiate de la Plateforme (Semaines 1 - 2)
- **Semaine 1 : Hydratation & Loading.** Audit complet des composants clients. Encapsulation des appels API spécifiques au navigateur dans des hooks `useEffect` et application de `suppressHydrationWarning` pour éliminer le verrouillage sur le squelette de chargement.
- **Semaine 2 : Pipeline de base de données.** Réécriture du manifeste `package.json` pour inclure le hook `postinstall prisma generate` et mise à jour de la commande de build Vercel.

### Phase 2 : Refactorisation Architecturale (Semaines 3 - 4)
- **Semaine 3 : Base de données Rendez-vous.** Refonte totale du schéma de la base de données `Appointment` et `Message` pour imposer une intégrité relationnelle stricte (UTC et prévention de concurrence).
- **Semaine 4 : Authentification.** Durcissement des Magic Links (à usage unique, fenêtres d'expiration courtes).

### Phase 3 : Durcissement de la Sécurité et Intégration de l'IA (Semaines 5 - 6)
- **Semaine 5 : Zero-Knowledge.** Vérification formelle du flux de données chiffrées client-serveur (API WebCrypto).
- **Semaine 6 : Copilote Gemini.** Déploiement de l'API Gemini spécifiquement dans l'environnement client authentifié du travailleur social (analyse post-déchiffrement uniquement).

### Phase 4 : Optimisation et Transfert de Connaissances (Semaines 7 - 8)
- **Semaine 7 : Edge & Télémétrie.** Optimisation pour le réseau Edge et intégration de télémétrie minimale respectueuse de la vie privée.
- **Semaine 8 : Documentation.** Utilisation des compétences Antigravity pour générer des scripts automatisés garantissant la maintenabilité pérenne du projet.
