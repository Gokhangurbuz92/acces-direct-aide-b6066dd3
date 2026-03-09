# 📖 WIKI VISUEL - Accès Direct Aide

Bienvenue dans le Wiki Visuel du projet **Accès Direct Aide**. Ce document présente l'architecture globale, le modèle de données principal, et le parcours utilisateur clé de l'application.

## 🌍 Présentation du Projet

**Accès Direct Aide** a pour but de simplifier, centraliser et sécuriser l'accès à l'information et à l'accompagnement social, avec une philosophie **Zero-Knowledge** (chiffrement de bout en bout).

Le projet s'adresse à deux publics :
1. **Les Citoyens (Bénéficiaires) :** Recherchent des aides (traduites en FALC par l'IA), prennent rendez-vous et échangent des documents de manière sécurisée sans compte classique (Passeport/Token).
2. **Les Professionnels (Structures Sociales, Agents) :** Utilisent un espace dédié (Espace Pro) pour gérer leur disponibilité, accepter des rendez-vous (en présentiel ou visioconférence avec Jitsi), réaliser des rapports d'impact et communiquer de manière chiffrée.

Le système est construit en mode **Serverless** sur **Vercel** avec un backend **Node.js/Prisma** et une base **PostgreSQL**. L'IA (OpenAI/Gemini) motorise la Boussole Sociale (RAG) et la simplification FALC.

---

## 1. Diagramme d'Architecture Globale

Ce schéma illustre la connexion entre le Frontend, le Backend (Vercel), la Base de données et les principales API externes.

```mermaid
graph TD
    %% Définition des acteurs
    Citoyen[🧑‍💻 Usager / Citoyen]
    Pro[🏢 Espace Pro / Agent]

    %% Frontend & Backend
    subgraph "Vercel Cloud (Serverless)"
        FrontendUI[🖥️ Frontend React / Vite]
        BackendAPI[⚙️ Backend API Node.js]
    end

    %% BDD & Cache
    subgraph "Persistance"
        DB[(🗄️ PostgreSQL / Prisma)]
        Cache[(⚡ Redis / KV)]
    end

    %% API Externes
    subgraph "API Externes"
        AI_OpenAI[🧠 OpenAI / Gemini API]
        Storage_S3[📁 AWS S3 / R2]
        Mail[📧 Mailjet / Outlook API]
        Video_Jitsi[📹 Jitsi Meet API]
    end

    %% Connexions
    Citoyen -->|Navigue & Cherche| FrontendUI
    Pro -->|Gère RDV & Services| FrontendUI
    
    FrontendUI <-->|Requêtes HTTP / REST| BackendAPI
    
    BackendAPI <-->|Requêtes ORM| DB
    BackendAPI <-->|Rate Limit / Cache| Cache
    
    %% Intégrations
    BackendAPI -->|Génération FALC & RAG| AI_OpenAI
    BackendAPI -->|Upload Sécurisé| Storage_S3
    BackendAPI -->|Notifications Email| Mail
    BackendAPI -->|Génération Visioconférence| Video_Jitsi

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef external fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef storage fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    
    class AI_OpenAI,Storage_S3,Mail,Video_Jitsi external;
    class DB,Cache storage;
```

---

## 2. Modèle de Base de Données Principal (ER Diagram)

Voici le modèle de données simplifié (Entity-Relationship) représentant les entités fondamentales extraites du fichier `schema.prisma`.

```mermaid
erDiagram
    STRUCTURE ||--o{ PRO_USER : emploie
    STRUCTURE ||--o{ APPOINTMENT : accueille
    STRUCTURE ||--o{ PRO_RDV_SERVICE : propose
    CITIZEN_USER ||--o{ APPOINTMENT : demande
    PRO_USER ||--o{ APPOINTMENT : gere
    PRO_RDV_SERVICE ||--o{ APPOINTMENT : concerne
    CITIZEN_USER ||--o{ RDV_CONVERSATION : participe
    PRO_USER ||--o{ RDV_CONVERSATION : participe
    APPOINTMENT ||--|| RDV_CONVERSATION : a_pour_fil_de_discussion
    
    AIDE }o--o{ AID_CATEGORY : appartient
    AIDE }o--o{ LIFE_SITUATION : cible
    
    STRUCTURE {
        String id PK
        String nom
        String type_structure
        String statut
        Boolean is_pro_enabled
    }
    
    PRO_USER {
        String id PK
        String email
        String role
        String structureId FK
    }
    
    CITIZEN_USER {
        String id PK
        String email
        String phone
    }
    
    PRO_RDV_SERVICE {
        String id PK
        String name
        Int durationMinutes
        String structureId FK
    }
    
    APPOINTMENT {
        String id PK
        DateTime startAt
        DateTime endAt
        String status
        String structureId FK
        String serviceId FK
        String citizenUserId FK
        String createdByProUserId FK
    }
    
    AIDE {
        String id PK
        String titre
        String statut
        String summary_falc
        String category_code
    }
    
    DEMARCHE {
        String id PK
        String titre
        String lien_officiel
    }
    
    ACTUALITE {
        String id PK
        String titre
        DateTime date_publication
    }
```

---

## 3. Parcours Utilisateur : Prise de Rendez-vous (Sequence Diagram)

Ce diagramme illustre le flux lorsqu'un Usager Citoyen prend un rendez-vous (classique ou visio) avec une structure Pro.

```mermaid
sequenceDiagram
    actor Usager as Citoyen
    participant Front as Frontend (React)
    participant API as Backend (Vercel API)
    participant DB as Base de Données (PostgreSQL)
    participant Mail as API Mail / Notif
    actor Pro as Agent (Espace Pro)

    Usager->>Front: Sélectionne une Structure, un Service et un Créneau
    Front->>Front: Valide les informations saisies
    Front->>API: POST /api/appointments (Demande de RDV)
    
    API->>DB: Vérification des conflits / disponibilités du Pro
    activate DB
    DB-->>API: Disponibilité OK
    deactivate DB
    
    API->>DB: Création de l'entité Appointment (status: booked/requested)
    activate DB
    DB-->>API: Appointment créé
    deactivate DB
    
    opt Si Visioconférence (Jitsi)
        API->>API: Génération du visioRoomId
        API->>DB: Mise à jour Appointment avec visioRoomId
    end
    
    API->>Mail: Envoi de confirmation à l'Usager (avec Token/Passeport)
    API->>Mail: Notification au Pro (Nouvelle demande)
    
    API-->>Front: Succès (RDV confirmé/en attente)
    Front-->>Usager: Affichage de la page de confirmation
    
    Pro->>Front: Se connecte à l'Espace Pro
    Front->>API: GET /api/pro/appointments
    API->>DB: Récupère les RDV
    DB-->>API: Retourne les RDV
    API-->>Front: Affiche le nouveau RDV sur l'agenda
    Front-->>Pro: Visualise et prépare le RDV
```
