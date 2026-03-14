--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: AidCategoryCode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AidCategoryCode" AS ENUM (
    'LOGEMENT',
    'SANTE',
    'HANDICAP',
    'EMPLOI',
    'FAMILLE',
    'ETUDES',
    'MOBILITE',
    'ENERGIE',
    'ALIMENTATION',
    'JUSTICE',
    'NUMERIQUE',
    'AUTRE'
);


ALTER TYPE public."AidCategoryCode" OWNER TO postgres;

--
-- Name: AidStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AidStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."AidStatus" OWNER TO postgres;

--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContentType" AS ENUM (
    'AIDE',
    'DEMARCHE',
    'STRUCTURE',
    'ACTUALITE'
);


ALTER TYPE public."ContentType" OWNER TO postgres;

--
-- Name: IngestJobStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IngestJobStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'ERROR'
);


ALTER TYPE public."IngestJobStatus" OWNER TO postgres;

--
-- Name: RdvBookingMode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RdvBookingMode" AS ENUM (
    'IN_PERSON',
    'VIDEO',
    'BOTH'
);


ALTER TYPE public."RdvBookingMode" OWNER TO postgres;

--
-- Name: ReportReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportReason" AS ENUM (
    'LIEN_MORT',
    'HORAIRES_FAUX',
    'INFO_FAUSSE',
    'INFO_OBSOLETE',
    'AUTRE'
);


ALTER TYPE public."ReportReason" OWNER TO postgres;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'FIXED',
    'REJECTED'
);


ALTER TYPE public."ReportStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Actualite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Actualite" (
    id text NOT NULL,
    titre text NOT NULL,
    contenu text,
    date_publication timestamp(3) without time zone DEFAULT now() NOT NULL,
    image_url text,
    lien_url text,
    source text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    "updatedBy" text,
    commentaire_statut text,
    published_at timestamp(3) without time zone,
    canonical_url text,
    category text DEFAULT 'actualite'::text,
    dedupe_hash text,
    fetched_at timestamp(3) without time zone,
    guid text,
    key_points_falc text[] NOT NULL,
    slug text,
    source_id text,
    source_name text,
    summary_falc text,
    territoire text DEFAULT 'FRANCE'::text,
    auto_publish boolean DEFAULT false NOT NULL,
    categorie text DEFAULT 'general'::text,
    departements text[] NOT NULL,
    est_important boolean DEFAULT false NOT NULL,
    falc_status text DEFAULT 'pending'::text NOT NULL,
    ingest_batch text,
    quality_score integer DEFAULT 0 NOT NULL,
    raw_data_hash text,
    raw_payload_json jsonb,
    resume text,
    score_fiabilite integer NOT NULL,
    source_nom text,
    source_url text,
    tags text[] NOT NULL,
    type_actu text DEFAULT 'info'::text,
    url text,
    source_document_id text
);


ALTER TABLE public."Actualite" OWNER TO postgres;

--
-- Name: AdminUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminUser" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "failedLoginAttempts" integer NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "lockoutUntil" timestamp(3) without time zone,
    "mfaSecret" text,
    "mfaIv" text,
    "mfaEnabled" boolean NOT NULL
);


ALTER TABLE public."AdminUser" OWNER TO postgres;

--
-- Name: AidCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AidCategory" (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL
);


ALTER TABLE public."AidCategory" OWNER TO postgres;

--
-- Name: AidSituation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AidSituation" (
    id text NOT NULL,
    "aidId" text NOT NULL,
    "situationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."AidSituation" OWNER TO postgres;

--
-- Name: AidSource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AidSource" (
    id text NOT NULL,
    name text NOT NULL,
    kind text,
    "baseUrl" text,
    license text,
    "refreshPolicy" text,
    "lastRunAt" timestamp(3) without time zone,
    "lastStatus" text
);


ALTER TABLE public."AidSource" OWNER TO postgres;

--
-- Name: Aide; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Aide" (
    id text NOT NULL,
    slug text,
    titre text NOT NULL,
    categorie text,
    est_urgent boolean DEFAULT false NOT NULL,
    territoires text[] DEFAULT '{}'::text[] NOT NULL,
    date_verification timestamp(3) without time zone,
    delai_indicatif text,
    cest_quoi text,
    pour_qui text,
    ce_que_ca_aide text,
    documents_necessaires text[] DEFAULT '{}'::text[] NOT NULL,
    etapes jsonb,
    ou_demander text,
    lien_demande text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    "updatedBy" text,
    quality_score integer DEFAULT 0 NOT NULL,
    commentaire_statut text,
    published_at timestamp(3) without time zone,
    mots_cles text[] DEFAULT '{}'::text[] NOT NULL,
    summary_falc text,
    audiences text[] DEFAULT '{}'::text[] NOT NULL,
    conditions_falc text,
    departements text[] DEFAULT '{}'::text[] NOT NULL,
    montant_falc text,
    situations_vie text[] DEFAULT '{}'::text[] NOT NULL,
    structures_links text[] DEFAULT '{}'::text[] NOT NULL,
    "categoryId" text,
    "providerName" text,
    "providerType" text,
    "sourceId" text,
    source_name text,
    source_url text,
    title text,
    description text,
    content text,
    category_code public."AidCategoryCode" DEFAULT 'AUTRE'::public."AidCategoryCode" NOT NULL,
    status_code public."AidStatus" DEFAULT 'DRAFT'::public."AidStatus" NOT NULL,
    eligibility jsonb,
    financials jsonb,
    citations jsonb,
    qa_score integer DEFAULT 0 NOT NULL,
    qa_report jsonb,
    source_org text,
    source_hash text,
    last_checked timestamp(3) without time zone,
    geo_scope text,
    source_url_exact text,
    territory_scope text,
    region_codes text[] DEFAULT '{}'::text[] NOT NULL,
    department_codes text[] DEFAULT '{}'::text[] NOT NULL,
    insee_codes text[] DEFAULT '{}'::text[] NOT NULL,
    content_hash text,
    theme text,
    sub_theme text,
    apply_url text,
    source_last_modified timestamp(3) without time zone,
    fetched_at timestamp(3) without time zone,
    montant_max text,
    echelon_territorial text,
    code_insee_territoire text,
    lien_demarche text,
    source_donnee text,
    retrieved_at timestamp(3) without time zone,
    last_checked_at timestamp(3) without time zone,
    source_document_id text,
    "externalId" text,
    embedding public.vector(768)
);


ALTER TABLE public."Aide" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    actor text,
    target text,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT now() NOT NULL,
    ip text,
    actor_id text,
    entity text,
    entity_id text,
    ip_hash text
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: AuthToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuthToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."AuthToken" OWNER TO postgres;

--
-- Name: CitizenUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CitizenUser" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "emailVerifiedAt" timestamp(3) without time zone,
    phone text,
    "phoneVerifiedAt" timestamp(3) without time zone,
    "notificationEmailEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CitizenUser" OWNER TO postgres;

--
-- Name: ConsentLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConsentLog" (
    id text NOT NULL,
    policy_version text NOT NULL,
    policy_hash text NOT NULL,
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."ConsentLog" OWNER TO postgres;

--
-- Name: ContentReport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContentReport" (
    id text NOT NULL,
    "contentType" public."ContentType" NOT NULL,
    "contentId" text NOT NULL,
    reason public."ReportReason" NOT NULL,
    message text,
    "pageUrl" text,
    "reporterEmail" text,
    status public."ReportStatus" DEFAULT 'NEW'::public."ReportStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ContentReport" OWNER TO postgres;

--
-- Name: ConversationLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConversationLog" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    message text NOT NULL,
    intent text,
    "searchMode" text DEFAULT 'rag'::text NOT NULL,
    "sourceCount" integer NOT NULL,
    "sessionId" text,
    metadata jsonb,
    rating integer,
    "userComment" text
);


ALTER TABLE public."ConversationLog" OWNER TO postgres;

--
-- Name: CronRun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CronRun" (
    id text NOT NULL,
    job text NOT NULL,
    status text NOT NULL,
    trigger text,
    "skipReason" text,
    "startedAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "durationMs" integer,
    "requestId" text,
    "vercelEnv" text,
    release text,
    metrics jsonb,
    "errorSample" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CronRun" OWNER TO postgres;

--
-- Name: Demarche; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Demarche" (
    id text NOT NULL,
    titre text NOT NULL,
    categorie text,
    description_courte text,
    delai text,
    cout text,
    date_verification timestamp(3) without time zone,
    pour_qui text,
    documents_necessaires text[] DEFAULT '{}'::text[] NOT NULL,
    etapes jsonb,
    ou_faire text,
    lien_officiel text,
    sources jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    "updatedBy" text,
    quality_score integer DEFAULT 0 NOT NULL,
    commentaire_statut text,
    published_at timestamp(3) without time zone,
    mots_cles text[] DEFAULT '{}'::text[] NOT NULL,
    slug text,
    summary_falc text,
    audiences text[] DEFAULT '{}'::text[] NOT NULL,
    departements text[] DEFAULT '{}'::text[] NOT NULL,
    "categoryId" text,
    public_cible text,
    contenu_detaille text,
    lien_teleservice text,
    source_url_exact text,
    territory_scope text,
    region_codes text[] DEFAULT '{}'::text[] NOT NULL,
    department_codes text[] DEFAULT '{}'::text[] NOT NULL,
    insee_codes text[] DEFAULT '{}'::text[] NOT NULL,
    content_hash text,
    source_url text,
    retrieved_at timestamp(3) without time zone,
    last_checked_at timestamp(3) without time zone,
    source_last_modified timestamp(3) without time zone,
    source_document_id text
);


ALTER TABLE public."Demarche" OWNER TO postgres;

--
-- Name: Dispositif; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dispositif" (
    id text NOT NULL,
    slug text,
    titre text NOT NULL,
    description_falc text,
    public text[] NOT NULL,
    departement text,
    montant text,
    liens jsonb,
    status text DEFAULT 'actif'::text NOT NULL,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    published_at timestamp(3) without time zone,
    summary_falc text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    source_url_exact text,
    territory_scope text,
    content_hash text,
    source_url text,
    retrieved_at timestamp(3) without time zone,
    last_checked_at timestamp(3) without time zone,
    source_last_modified timestamp(3) without time zone,
    source_document_id text
);


ALTER TABLE public."Dispositif" OWNER TO postgres;

--
-- Name: EntityVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EntityVersion" (
    id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    snapshot_json jsonb NOT NULL,
    reason text,
    actor_email text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."EntityVersion" OWNER TO postgres;

--
-- Name: Guide; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Guide" (
    id text NOT NULL,
    slug text NOT NULL,
    titre text NOT NULL,
    resume_falc text,
    contenu_json jsonb,
    categorie text,
    publics text[] NOT NULL,
    contexte text[] NOT NULL,
    mots_cles text[] NOT NULL,
    sources_urls text[] NOT NULL,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    published_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Guide" OWNER TO postgres;

--
-- Name: ImportLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ImportLog" (
    id text NOT NULL,
    run_id text,
    source_name text NOT NULL,
    status text NOT NULL,
    items_total integer NOT NULL,
    items_new integer NOT NULL,
    items_updated integer NOT NULL,
    items_skipped integer NOT NULL,
    duration_ms integer,
    logs jsonb,
    error_count integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."ImportLog" OWNER TO postgres;

--
-- Name: IngestJob; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IngestJob" (
    id text NOT NULL,
    source text NOT NULL,
    status public."IngestJobStatus" DEFAULT 'PENDING'::public."IngestJobStatus" NOT NULL,
    payload jsonb,
    result jsonb,
    error_message text,
    started_at timestamp(3) without time zone,
    finished_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IngestJob" OWNER TO postgres;

--
-- Name: Invitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invitation" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Invitation" OWNER TO postgres;

--
-- Name: LifeSituation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LifeSituation" (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL
);


ALTER TABLE public."LifeSituation" OWNER TO postgres;

--
-- Name: PartnershipRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PartnershipRequest" (
    id text NOT NULL,
    "structureName" text NOT NULL,
    city text,
    type text,
    website text NOT NULL,
    email text NOT NULL,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    consent boolean NOT NULL,
    ip_hash text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PartnershipRequest" OWNER TO postgres;

--
-- Name: ProAppointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProAppointment" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    "serviceId" text NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'booked'::text NOT NULL,
    "beneficiaryName" text NOT NULL,
    "beneficiaryPhone" text,
    notes text,
    "createdByProUserId" text,
    "citizenUserId" text,
    "citizenEmailSnapshot" text,
    "idempotencyKey" text,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "visioRoomId" text,
    "visioEnabled" boolean DEFAULT false NOT NULL,
    "visioStartedAt" timestamp(3) without time zone
);


ALTER TABLE public."ProAppointment" OWNER TO postgres;

--
-- Name: ProAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProAuditLog" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "proUserId" text NOT NULL,
    action text NOT NULL,
    "entityType" text,
    "entityId" text,
    metadata jsonb,
    "structureId" text NOT NULL
);


ALTER TABLE public."ProAuditLog" OWNER TO postgres;

--
-- Name: ProAvailabilityRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProAvailabilityRule" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    weekday integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    timezone text DEFAULT 'Europe/Paris'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProAvailabilityRule" OWNER TO postgres;

--
-- Name: ProNotification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProNotification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "structureId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


ALTER TABLE public."ProNotification" OWNER TO postgres;

--
-- Name: ProOutlookToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProOutlookToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    email text,
    "accessTokenEnc" text NOT NULL,
    "refreshTokenEnc" text NOT NULL,
    iv text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    scope text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProOutlookToken" OWNER TO postgres;

--
-- Name: ProRdvService; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProRdvService" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    name text NOT NULL,
    "durationMinutes" integer NOT NULL,
    "bufferBeforeMinutes" integer DEFAULT 0 NOT NULL,
    "bufferAfterMinutes" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProRdvService" OWNER TO postgres;

--
-- Name: ProTimeOff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProTimeOff" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProTimeOff" OWNER TO postgres;

--
-- Name: ProUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProUser" (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "structureId" text NOT NULL,
    "notificationEmailEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret text
);


ALTER TABLE public."ProUser" OWNER TO postgres;

--
-- Name: RdvConversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RdvConversation" (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    "structureId" text NOT NULL,
    "citizenUserId" text NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RdvConversation" OWNER TO postgres;

--
-- Name: RdvConversationMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RdvConversationMessage" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderType" text NOT NULL,
    "senderCitizenUserId" text,
    "senderProUserId" text,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."RdvConversationMessage" OWNER TO postgres;

--
-- Name: RdvNotificationLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RdvNotificationLog" (
    id text NOT NULL,
    kind text DEFAULT 'MESSAGE_EMAIL'::text NOT NULL,
    "conversationId" text NOT NULL,
    "messageId" text NOT NULL,
    "recipientType" text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."RdvNotificationLog" OWNER TO postgres;

--
-- Name: ResourceAccessibility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceAccessibility" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    content text,
    source_url text,
    territory_scope text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    retrieved_at timestamp(3) without time zone,
    last_checked_at timestamp(3) without time zone,
    source_last_modified timestamp(3) without time zone
);


ALTER TABLE public."ResourceAccessibility" OWNER TO postgres;

--
-- Name: ReviewQueueItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReviewQueueItem" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "entitySlug" text,
    title text,
    reason text NOT NULL,
    severity text NOT NULL,
    status text NOT NULL,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReviewQueueItem" OWNER TO postgres;

--
-- Name: RssSource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RssSource" (
    id text NOT NULL,
    name text NOT NULL,
    feed_url text NOT NULL,
    domain text NOT NULL,
    trust_level text DEFAULT 'OFFICIAL'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    last_run_at timestamp(3) without time zone,
    etag text,
    last_modified text,
    error_count integer NOT NULL,
    last_error text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RssSource" OWNER TO postgres;

--
-- Name: SharedDiagnostic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SharedDiagnostic" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    situation jsonb NOT NULL,
    results jsonb NOT NULL,
    "viewCount" integer NOT NULL
);


ALTER TABLE public."SharedDiagnostic" OWNER TO postgres;

--
-- Name: Situation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Situation" (
    id text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Situation" OWNER TO postgres;

--
-- Name: Source; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Source" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    url text,
    status text DEFAULT 'actif'::text NOT NULL,
    trust_level text,
    last_sync timestamp(3) without time zone
);


ALTER TABLE public."Source" OWNER TO postgres;

--
-- Name: SourceDocument; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SourceDocument" (
    id text NOT NULL,
    source_url text,
    fetched_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    content_hash text,
    raw_content text,
    metadata jsonb
);


ALTER TABLE public."SourceDocument" OWNER TO postgres;

--
-- Name: SourceSnapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SourceSnapshot" (
    id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    fetched_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    raw_excerpt text,
    content_hash text,
    http_status integer,
    final_url text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."SourceSnapshot" OWNER TO postgres;

--
-- Name: Structure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Structure" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    nom text NOT NULL,
    type_structure text,
    accessibilite_pmr boolean DEFAULT false NOT NULL,
    description_courte text,
    adresse text,
    code_postal text,
    ville text,
    departement text,
    telephone text,
    email text,
    site_web text,
    horaires text,
    services text[] NOT NULL,
    publics_accueillis text[] NOT NULL,
    date_verification timestamp(3) without time zone,
    categories_aidees text[] NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'actif'::text NOT NULL,
    commentaire_statut text,
    published_at timestamp(3) without time zone,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    "updatedBy" text,
    mots_cles text[] DEFAULT '{}'::text[] NOT NULL,
    slug text,
    summary_falc text,
    is_pro_enabled boolean DEFAULT false NOT NULL,
    settings_json jsonb DEFAULT '{}'::jsonb,
    auto_publish boolean DEFAULT false NOT NULL,
    geoloc_status text,
    import_batch text,
    import_status text DEFAULT 'pending'::text NOT NULL,
    last_sync timestamp(3) without time zone DEFAULT now() NOT NULL,
    latitude double precision,
    longitude double precision,
    quality_score integer DEFAULT 50 NOT NULL,
    raw_data_hash text,
    siret text,
    source_id text,
    source_url text,
    source_url_exact text,
    territory_scope text,
    region_codes text[] DEFAULT '{}'::text[] NOT NULL,
    department_codes text[] DEFAULT '{}'::text[] NOT NULL,
    insee_codes text[] DEFAULT '{}'::text[] NOT NULL,
    content_hash text,
    type_finess text,
    numero_finess text,
    rna_id text,
    source_annuaire text,
    retrieved_at timestamp(3) without time zone,
    last_checked_at timestamp(3) without time zone,
    source_last_modified timestamp(3) without time zone,
    source_document_id text
);


ALTER TABLE public."Structure" OWNER TO postgres;

--
-- Name: StructureRdvSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StructureRdvSettings" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    "isPublished" boolean NOT NULL,
    "bookingMode" public."RdvBookingMode" DEFAULT 'IN_PERSON'::public."RdvBookingMode" NOT NULL,
    "contactEmail" text,
    "contactPhone" text,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StructureRdvSettings" OWNER TO postgres;

--
-- Name: SyncRun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SyncRun" (
    id text NOT NULL,
    source_id text,
    status text NOT NULL,
    started_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    ended_at timestamp(3) without time zone,
    error text,
    stats jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SyncRun" OWNER TO postgres;

--
-- Name: ToolboxItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ToolboxItem" (
    id text NOT NULL,
    slug text NOT NULL,
    titre text NOT NULL,
    resume_falc text,
    type text NOT NULL,
    categorie text,
    publics text[] NOT NULL,
    url_download text,
    contenu_html text,
    statut text DEFAULT 'brouillon'::text NOT NULL,
    published_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ToolboxItem" OWNER TO postgres;

--
-- Name: UpdateLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UpdateLog" (
    id integer NOT NULL,
    ran_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    duration_ms integer,
    items_fetched_count integer NOT NULL,
    items_created_count integer NOT NULL,
    items_updated_count integer NOT NULL,
    items_skipped_count integer NOT NULL,
    errors text[] NOT NULL,
    source_name text,
    is_dry_run boolean NOT NULL
);


ALTER TABLE public."UpdateLog" OWNER TO postgres;

--
-- Name: UpdateLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UpdateLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UpdateLog_id_seq" OWNER TO postgres;

--
-- Name: UpdateLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UpdateLog_id_seq" OWNED BY public."UpdateLog".id;


--
-- Name: UserConsent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserConsent" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "citizenId" text NOT NULL,
    "structureId" text NOT NULL,
    purpose text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "ipAddress" text
);


ALTER TABLE public."UserConsent" OWNER TO postgres;

--
-- Name: _AideToLifeSituation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_AideToLifeSituation" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_AideToLifeSituation" OWNER TO postgres;

--
-- Name: UpdateLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UpdateLog" ALTER COLUMN id SET DEFAULT nextval('public."UpdateLog_id_seq"'::regclass);


--
-- Data for Name: Actualite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Actualite" (id, titre, contenu, date_publication, image_url, lien_url, source, "updatedAt", statut, "updatedBy", commentaire_statut, published_at, canonical_url, category, dedupe_hash, fetched_at, guid, key_points_falc, slug, source_id, source_name, summary_falc, territoire, auto_publish, categorie, departements, est_important, falc_status, ingest_batch, quality_score, raw_data_hash, raw_payload_json, resume, score_fiabilite, source_nom, source_url, tags, type_actu, url, source_document_id) FROM stdin;
\.


--
-- Data for Name: AdminUser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminUser" (id, email, password, role, "createdAt", "updatedAt", "failedLoginAttempts", "lastLogin", "lockoutUntil", "mfaSecret", "mfaIv", "mfaEnabled") FROM stdin;
\.


--
-- Data for Name: AidCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AidCategory" (id, slug, label) FROM stdin;
\.


--
-- Data for Name: AidSituation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AidSituation" (id, "aidId", "situationId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AidSource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AidSource" (id, name, kind, "baseUrl", license, "refreshPolicy", "lastRunAt", "lastStatus") FROM stdin;
\.


--
-- Data for Name: Aide; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Aide" (id, slug, titre, categorie, est_urgent, territoires, date_verification, delai_indicatif, cest_quoi, pour_qui, ce_que_ca_aide, documents_necessaires, etapes, ou_demander, lien_demande, "updatedAt", statut, "updatedBy", quality_score, commentaire_statut, published_at, mots_cles, summary_falc, audiences, conditions_falc, departements, montant_falc, situations_vie, structures_links, "categoryId", "providerName", "providerType", "sourceId", source_name, source_url, title, description, content, category_code, status_code, eligibility, financials, citations, qa_score, qa_report, source_org, source_hash, last_checked, geo_scope, source_url_exact, territory_scope, region_codes, department_codes, insee_codes, content_hash, theme, sub_theme, apply_url, source_last_modified, fetched_at, montant_max, echelon_territorial, code_insee_territoire, lien_demarche, source_donnee, retrieved_at, last_checked_at, source_document_id, "externalId", embedding) FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, action, actor, target, details, "timestamp", ip, actor_id, entity, entity_id, ip_hash) FROM stdin;
\.


--
-- Data for Name: AuthToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuthToken" (id, "userId", type, "tokenHash", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: CitizenUser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CitizenUser" (id, email, "passwordHash", "emailVerifiedAt", phone, "phoneVerifiedAt", "notificationEmailEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConsentLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConsentLog" (id, policy_version, policy_hash, subject_type, subject_id, created_at) FROM stdin;
\.


--
-- Data for Name: ContentReport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContentReport" (id, "contentType", "contentId", reason, message, "pageUrl", "reporterEmail", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConversationLog" (id, "createdAt", message, intent, "searchMode", "sourceCount", "sessionId", metadata, rating, "userComment") FROM stdin;
\.


--
-- Data for Name: CronRun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CronRun" (id, job, status, trigger, "skipReason", "startedAt", "finishedAt", "durationMs", "requestId", "vercelEnv", release, metrics, "errorSample", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Demarche; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Demarche" (id, titre, categorie, description_courte, delai, cout, date_verification, pour_qui, documents_necessaires, etapes, ou_faire, lien_officiel, sources, "updatedAt", statut, "updatedBy", quality_score, commentaire_statut, published_at, mots_cles, slug, summary_falc, audiences, departements, "categoryId", public_cible, contenu_detaille, lien_teleservice, source_url_exact, territory_scope, region_codes, department_codes, insee_codes, content_hash, source_url, retrieved_at, last_checked_at, source_last_modified, source_document_id) FROM stdin;
\.


--
-- Data for Name: Dispositif; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dispositif" (id, slug, titre, description_falc, public, departement, montant, liens, status, statut, published_at, summary_falc, "createdAt", "updatedAt", source_url_exact, territory_scope, content_hash, source_url, retrieved_at, last_checked_at, source_last_modified, source_document_id) FROM stdin;
\.


--
-- Data for Name: EntityVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EntityVersion" (id, entity_type, entity_id, snapshot_json, reason, actor_email, "createdAt") FROM stdin;
\.


--
-- Data for Name: Guide; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Guide" (id, slug, titre, resume_falc, contenu_json, categorie, publics, contexte, mots_cles, sources_urls, statut, published_at, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ImportLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ImportLog" (id, run_id, source_name, status, items_total, items_new, items_updated, items_skipped, duration_ms, logs, error_count, "createdAt") FROM stdin;
\.


--
-- Data for Name: IngestJob; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IngestJob" (id, source, status, payload, result, error_message, started_at, finished_at, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Invitation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invitation" (id, "structureId", email, role, token, expires_at, used_at, "createdAt") FROM stdin;
\.


--
-- Data for Name: LifeSituation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LifeSituation" (id, slug, label) FROM stdin;
\.


--
-- Data for Name: PartnershipRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PartnershipRequest" (id, "structureName", city, type, website, email, message, status, consent, ip_hash, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProAppointment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProAppointment" (id, "structureId", "serviceId", "startAt", "endAt", status, "beneficiaryName", "beneficiaryPhone", notes, "createdByProUserId", "citizenUserId", "citizenEmailSnapshot", "idempotencyKey", "cancelledAt", "cancelledBy", "createdAt", "updatedAt", "visioRoomId", "visioEnabled", "visioStartedAt") FROM stdin;
\.


--
-- Data for Name: ProAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProAuditLog" (id, "createdAt", "proUserId", action, "entityType", "entityId", metadata, "structureId") FROM stdin;
\.


--
-- Data for Name: ProAvailabilityRule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProAvailabilityRule" (id, "structureId", weekday, "startTime", "endTime", timezone, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProNotification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProNotification" (id, "userId", "structureId", type, title, message, "readAt", "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: ProOutlookToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProOutlookToken" (id, "userId", email, "accessTokenEnc", "refreshTokenEnc", iv, "expiresAt", scope, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProRdvService; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProRdvService" (id, "structureId", name, "durationMinutes", "bufferBeforeMinutes", "bufferAfterMinutes", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProTimeOff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProTimeOff" (id, "structureId", "startAt", "endAt", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProUser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProUser" (id, email, password_hash, role, status, "structureId", "notificationEmailEnabled", "createdAt", "updatedAt", mfa_enabled, mfa_secret) FROM stdin;
\.


--
-- Data for Name: RdvConversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RdvConversation" (id, "appointmentId", "structureId", "citizenUserId", "lastMessageAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RdvConversationMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RdvConversationMessage" (id, "conversationId", "senderType", "senderCitizenUserId", "senderProUserId", body, "createdAt") FROM stdin;
\.


--
-- Data for Name: RdvNotificationLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RdvNotificationLog" (id, kind, "conversationId", "messageId", "recipientType", "sentAt") FROM stdin;
\.


--
-- Data for Name: ResourceAccessibility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceAccessibility" (id, slug, title, type, content, source_url, territory_scope, "createdAt", "updatedAt", status, retrieved_at, last_checked_at, source_last_modified) FROM stdin;
\.


--
-- Data for Name: ReviewQueueItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReviewQueueItem" (id, "entityType", "entityId", "entitySlug", title, reason, severity, status, details, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RssSource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RssSource" (id, name, feed_url, domain, trust_level, enabled, last_run_at, etag, last_modified, error_count, last_error, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SharedDiagnostic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SharedDiagnostic" (id, "createdAt", "expiresAt", situation, results, "viewCount") FROM stdin;
\.


--
-- Data for Name: Situation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Situation" (id, code, label, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Source; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Source" (id, name, type, url, status, trust_level, last_sync) FROM stdin;
\.


--
-- Data for Name: SourceDocument; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SourceDocument" (id, source_url, fetched_at, content_hash, raw_content, metadata) FROM stdin;
\.


--
-- Data for Name: SourceSnapshot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SourceSnapshot" (id, entity_type, entity_id, fetched_at, raw_excerpt, content_hash, http_status, final_url, "createdAt") FROM stdin;
\.


--
-- Data for Name: Structure; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Structure" (id, "createdAt", nom, type_structure, accessibilite_pmr, description_courte, adresse, code_postal, ville, departement, telephone, email, site_web, horaires, services, publics_accueillis, date_verification, categories_aidees, "updatedAt", status, commentaire_statut, published_at, statut, "updatedBy", mots_cles, slug, summary_falc, is_pro_enabled, settings_json, auto_publish, geoloc_status, import_batch, import_status, last_sync, latitude, longitude, quality_score, raw_data_hash, siret, source_id, source_url, source_url_exact, territory_scope, region_codes, department_codes, insee_codes, content_hash, type_finess, numero_finess, rna_id, source_annuaire, retrieved_at, last_checked_at, source_last_modified, source_document_id) FROM stdin;
\.


--
-- Data for Name: StructureRdvSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StructureRdvSettings" (id, "structureId", "isPublished", "bookingMode", "contactEmail", "contactPhone", "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SyncRun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SyncRun" (id, source_id, status, started_at, ended_at, error, stats, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ToolboxItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ToolboxItem" (id, slug, titre, resume_falc, type, categorie, publics, url_download, contenu_html, statut, published_at, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UpdateLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UpdateLog" (id, ran_at, status, duration_ms, items_fetched_count, items_created_count, items_updated_count, items_skipped_count, errors, source_name, is_dry_run) FROM stdin;
\.


--
-- Data for Name: UserConsent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserConsent" (id, "createdAt", "citizenId", "structureId", purpose, "expiresAt", "ipAddress") FROM stdin;
\.


--
-- Data for Name: _AideToLifeSituation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_AideToLifeSituation" ("A", "B") FROM stdin;
\.


--
-- Name: UpdateLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UpdateLog_id_seq"', 1, false);


--
-- Name: Actualite Actualite_canonical_url_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actualite"
    ADD CONSTRAINT "Actualite_canonical_url_unique" UNIQUE (canonical_url);


--
-- Name: Actualite Actualite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actualite"
    ADD CONSTRAINT "Actualite_pkey" PRIMARY KEY (id);


--
-- Name: Actualite Actualite_raw_data_hash_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actualite"
    ADD CONSTRAINT "Actualite_raw_data_hash_unique" UNIQUE (raw_data_hash);


--
-- Name: Actualite Actualite_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actualite"
    ADD CONSTRAINT "Actualite_slug_unique" UNIQUE (slug);


--
-- Name: AdminUser AdminUser_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminUser"
    ADD CONSTRAINT "AdminUser_email_unique" UNIQUE (email);


--
-- Name: AdminUser AdminUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminUser"
    ADD CONSTRAINT "AdminUser_pkey" PRIMARY KEY (id);


--
-- Name: AidCategory AidCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidCategory"
    ADD CONSTRAINT "AidCategory_pkey" PRIMARY KEY (id);


--
-- Name: AidCategory AidCategory_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidCategory"
    ADD CONSTRAINT "AidCategory_slug_unique" UNIQUE (slug);


--
-- Name: AidSituation AidSituation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidSituation"
    ADD CONSTRAINT "AidSituation_pkey" PRIMARY KEY (id);


--
-- Name: AidSource AidSource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidSource"
    ADD CONSTRAINT "AidSource_pkey" PRIMARY KEY (id);


--
-- Name: Aide Aide_externalId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_externalId_unique" UNIQUE ("externalId");


--
-- Name: Aide Aide_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_pkey" PRIMARY KEY (id);


--
-- Name: Aide Aide_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_slug_unique" UNIQUE (slug);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AuthToken AuthToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuthToken"
    ADD CONSTRAINT "AuthToken_pkey" PRIMARY KEY (id);


--
-- Name: AuthToken AuthToken_tokenHash_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuthToken"
    ADD CONSTRAINT "AuthToken_tokenHash_unique" UNIQUE ("tokenHash");


--
-- Name: CitizenUser CitizenUser_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CitizenUser"
    ADD CONSTRAINT "CitizenUser_email_unique" UNIQUE (email);


--
-- Name: CitizenUser CitizenUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CitizenUser"
    ADD CONSTRAINT "CitizenUser_pkey" PRIMARY KEY (id);


--
-- Name: ConsentLog ConsentLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsentLog"
    ADD CONSTRAINT "ConsentLog_pkey" PRIMARY KEY (id);


--
-- Name: ContentReport ContentReport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContentReport"
    ADD CONSTRAINT "ContentReport_pkey" PRIMARY KEY (id);


--
-- Name: ConversationLog ConversationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationLog"
    ADD CONSTRAINT "ConversationLog_pkey" PRIMARY KEY (id);


--
-- Name: CronRun CronRun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CronRun"
    ADD CONSTRAINT "CronRun_pkey" PRIMARY KEY (id);


--
-- Name: Demarche Demarche_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Demarche"
    ADD CONSTRAINT "Demarche_pkey" PRIMARY KEY (id);


--
-- Name: Demarche Demarche_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Demarche"
    ADD CONSTRAINT "Demarche_slug_unique" UNIQUE (slug);


--
-- Name: Dispositif Dispositif_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispositif"
    ADD CONSTRAINT "Dispositif_pkey" PRIMARY KEY (id);


--
-- Name: Dispositif Dispositif_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispositif"
    ADD CONSTRAINT "Dispositif_slug_unique" UNIQUE (slug);


--
-- Name: EntityVersion EntityVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EntityVersion"
    ADD CONSTRAINT "EntityVersion_pkey" PRIMARY KEY (id);


--
-- Name: Guide Guide_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Guide"
    ADD CONSTRAINT "Guide_pkey" PRIMARY KEY (id);


--
-- Name: Guide Guide_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Guide"
    ADD CONSTRAINT "Guide_slug_unique" UNIQUE (slug);


--
-- Name: ImportLog ImportLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ImportLog"
    ADD CONSTRAINT "ImportLog_pkey" PRIMARY KEY (id);


--
-- Name: IngestJob IngestJob_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IngestJob"
    ADD CONSTRAINT "IngestJob_pkey" PRIMARY KEY (id);


--
-- Name: Invitation Invitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_pkey" PRIMARY KEY (id);


--
-- Name: Invitation Invitation_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_token_unique" UNIQUE (token);


--
-- Name: LifeSituation LifeSituation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LifeSituation"
    ADD CONSTRAINT "LifeSituation_pkey" PRIMARY KEY (id);


--
-- Name: LifeSituation LifeSituation_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LifeSituation"
    ADD CONSTRAINT "LifeSituation_slug_unique" UNIQUE (slug);


--
-- Name: PartnershipRequest PartnershipRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PartnershipRequest"
    ADD CONSTRAINT "PartnershipRequest_pkey" PRIMARY KEY (id);


--
-- Name: ProAppointment ProAppointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAppointment"
    ADD CONSTRAINT "ProAppointment_pkey" PRIMARY KEY (id);


--
-- Name: ProAuditLog ProAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAuditLog"
    ADD CONSTRAINT "ProAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ProAvailabilityRule ProAvailabilityRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAvailabilityRule"
    ADD CONSTRAINT "ProAvailabilityRule_pkey" PRIMARY KEY (id);


--
-- Name: ProNotification ProNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProNotification"
    ADD CONSTRAINT "ProNotification_pkey" PRIMARY KEY (id);


--
-- Name: ProOutlookToken ProOutlookToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProOutlookToken"
    ADD CONSTRAINT "ProOutlookToken_pkey" PRIMARY KEY (id);


--
-- Name: ProOutlookToken ProOutlookToken_userId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProOutlookToken"
    ADD CONSTRAINT "ProOutlookToken_userId_unique" UNIQUE ("userId");


--
-- Name: ProRdvService ProRdvService_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProRdvService"
    ADD CONSTRAINT "ProRdvService_pkey" PRIMARY KEY (id);


--
-- Name: ProTimeOff ProTimeOff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProTimeOff"
    ADD CONSTRAINT "ProTimeOff_pkey" PRIMARY KEY (id);


--
-- Name: ProUser ProUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProUser"
    ADD CONSTRAINT "ProUser_pkey" PRIMARY KEY (id);


--
-- Name: RdvConversationMessage RdvConversationMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversationMessage"
    ADD CONSTRAINT "RdvConversationMessage_pkey" PRIMARY KEY (id);


--
-- Name: RdvConversation RdvConversation_appointmentId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversation"
    ADD CONSTRAINT "RdvConversation_appointmentId_unique" UNIQUE ("appointmentId");


--
-- Name: RdvConversation RdvConversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversation"
    ADD CONSTRAINT "RdvConversation_pkey" PRIMARY KEY (id);


--
-- Name: RdvNotificationLog RdvNotificationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvNotificationLog"
    ADD CONSTRAINT "RdvNotificationLog_pkey" PRIMARY KEY (id);


--
-- Name: ResourceAccessibility ResourceAccessibility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceAccessibility"
    ADD CONSTRAINT "ResourceAccessibility_pkey" PRIMARY KEY (id);


--
-- Name: ResourceAccessibility ResourceAccessibility_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceAccessibility"
    ADD CONSTRAINT "ResourceAccessibility_slug_unique" UNIQUE (slug);


--
-- Name: ReviewQueueItem ReviewQueueItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewQueueItem"
    ADD CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY (id);


--
-- Name: RssSource RssSource_feed_url_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RssSource"
    ADD CONSTRAINT "RssSource_feed_url_unique" UNIQUE (feed_url);


--
-- Name: RssSource RssSource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RssSource"
    ADD CONSTRAINT "RssSource_pkey" PRIMARY KEY (id);


--
-- Name: SharedDiagnostic SharedDiagnostic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedDiagnostic"
    ADD CONSTRAINT "SharedDiagnostic_pkey" PRIMARY KEY (id);


--
-- Name: Situation Situation_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Situation"
    ADD CONSTRAINT "Situation_code_unique" UNIQUE (code);


--
-- Name: Situation Situation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Situation"
    ADD CONSTRAINT "Situation_pkey" PRIMARY KEY (id);


--
-- Name: SourceDocument SourceDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SourceDocument"
    ADD CONSTRAINT "SourceDocument_pkey" PRIMARY KEY (id);


--
-- Name: SourceSnapshot SourceSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SourceSnapshot"
    ADD CONSTRAINT "SourceSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: Source Source_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Source"
    ADD CONSTRAINT "Source_pkey" PRIMARY KEY (id);


--
-- Name: StructureRdvSettings StructureRdvSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StructureRdvSettings"
    ADD CONSTRAINT "StructureRdvSettings_pkey" PRIMARY KEY (id);


--
-- Name: StructureRdvSettings StructureRdvSettings_structureId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StructureRdvSettings"
    ADD CONSTRAINT "StructureRdvSettings_structureId_unique" UNIQUE ("structureId");


--
-- Name: Structure Structure_numero_finess_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_numero_finess_unique" UNIQUE (numero_finess);


--
-- Name: Structure Structure_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_pkey" PRIMARY KEY (id);


--
-- Name: Structure Structure_raw_data_hash_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_raw_data_hash_unique" UNIQUE (raw_data_hash);


--
-- Name: Structure Structure_rna_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_rna_id_unique" UNIQUE (rna_id);


--
-- Name: Structure Structure_siret_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_siret_unique" UNIQUE (siret);


--
-- Name: Structure Structure_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_slug_unique" UNIQUE (slug);


--
-- Name: SyncRun SyncRun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SyncRun"
    ADD CONSTRAINT "SyncRun_pkey" PRIMARY KEY (id);


--
-- Name: ToolboxItem ToolboxItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ToolboxItem"
    ADD CONSTRAINT "ToolboxItem_pkey" PRIMARY KEY (id);


--
-- Name: ToolboxItem ToolboxItem_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ToolboxItem"
    ADD CONSTRAINT "ToolboxItem_slug_unique" UNIQUE (slug);


--
-- Name: UpdateLog UpdateLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UpdateLog"
    ADD CONSTRAINT "UpdateLog_pkey" PRIMARY KEY (id);


--
-- Name: UserConsent UserConsent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_pkey" PRIMARY KEY (id);


--
-- Name: AidSituation_aidId_situationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AidSituation_aidId_situationId_key" ON public."AidSituation" USING btree ("aidId", "situationId");


--
-- Name: Aide_embedding_hnsw_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Aide_embedding_hnsw_idx" ON public."Aide" USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: ProAppointment_citizenUserId_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProAppointment_citizenUserId_idempotencyKey_key" ON public."ProAppointment" USING btree ("citizenUserId", "idempotencyKey");


--
-- Name: ProUser_structureId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProUser_structureId_email_key" ON public."ProUser" USING btree ("structureId", email);


--
-- Name: RdvNotificationLog_messageId_recipientType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RdvNotificationLog_messageId_recipientType_key" ON public."RdvNotificationLog" USING btree ("messageId", "recipientType");


--
-- Name: ReviewQueueItem_entityType_entityId_reason_status_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ReviewQueueItem_entityType_entityId_reason_status_key" ON public."ReviewQueueItem" USING btree ("entityType", "entityId", reason, status);


--
-- Name: Actualite Actualite_sourceDocument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actualite"
    ADD CONSTRAINT "Actualite_sourceDocument_fkey" FOREIGN KEY (source_document_id) REFERENCES public."SourceDocument"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AidSituation AidSituation_aid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidSituation"
    ADD CONSTRAINT "AidSituation_aid_fkey" FOREIGN KEY ("aidId") REFERENCES public."Aide"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AidSituation AidSituation_situation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AidSituation"
    ADD CONSTRAINT "AidSituation_situation_fkey" FOREIGN KEY ("situationId") REFERENCES public."Situation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Aide Aide_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_category_fkey" FOREIGN KEY ("categoryId") REFERENCES public."AidCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Aide Aide_sourceDocument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_sourceDocument_fkey" FOREIGN KEY (source_document_id) REFERENCES public."SourceDocument"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Aide Aide_source_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Aide"
    ADD CONSTRAINT "Aide_source_fkey" FOREIGN KEY ("sourceId") REFERENCES public."AidSource"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuthToken AuthToken_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuthToken"
    ADD CONSTRAINT "AuthToken_user_fkey" FOREIGN KEY ("userId") REFERENCES public."CitizenUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Demarche Demarche_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Demarche"
    ADD CONSTRAINT "Demarche_category_fkey" FOREIGN KEY ("categoryId") REFERENCES public."AidCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Demarche Demarche_sourceDocument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Demarche"
    ADD CONSTRAINT "Demarche_sourceDocument_fkey" FOREIGN KEY (source_document_id) REFERENCES public."SourceDocument"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dispositif Dispositif_sourceDocument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispositif"
    ADD CONSTRAINT "Dispositif_sourceDocument_fkey" FOREIGN KEY (source_document_id) REFERENCES public."SourceDocument"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invitation Invitation_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invitation"
    ADD CONSTRAINT "Invitation_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProAppointment ProAppointment_citizenUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAppointment"
    ADD CONSTRAINT "ProAppointment_citizenUser_fkey" FOREIGN KEY ("citizenUserId") REFERENCES public."CitizenUser"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProAppointment ProAppointment_createdByProUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAppointment"
    ADD CONSTRAINT "ProAppointment_createdByProUser_fkey" FOREIGN KEY ("createdByProUserId") REFERENCES public."ProUser"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProAppointment ProAppointment_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAppointment"
    ADD CONSTRAINT "ProAppointment_service_fkey" FOREIGN KEY ("serviceId") REFERENCES public."ProRdvService"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProAppointment ProAppointment_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAppointment"
    ADD CONSTRAINT "ProAppointment_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProAuditLog ProAuditLog_proUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAuditLog"
    ADD CONSTRAINT "ProAuditLog_proUser_fkey" FOREIGN KEY ("proUserId") REFERENCES public."ProUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProAvailabilityRule ProAvailabilityRule_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProAvailabilityRule"
    ADD CONSTRAINT "ProAvailabilityRule_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProNotification ProNotification_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProNotification"
    ADD CONSTRAINT "ProNotification_user_fkey" FOREIGN KEY ("userId") REFERENCES public."ProUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProOutlookToken ProOutlookToken_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProOutlookToken"
    ADD CONSTRAINT "ProOutlookToken_user_fkey" FOREIGN KEY ("userId") REFERENCES public."ProUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProRdvService ProRdvService_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProRdvService"
    ADD CONSTRAINT "ProRdvService_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProTimeOff ProTimeOff_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProTimeOff"
    ADD CONSTRAINT "ProTimeOff_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProUser ProUser_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProUser"
    ADD CONSTRAINT "ProUser_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvConversationMessage RdvConversationMessage_conversation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversationMessage"
    ADD CONSTRAINT "RdvConversationMessage_conversation_fkey" FOREIGN KEY ("conversationId") REFERENCES public."RdvConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvConversationMessage RdvConversationMessage_senderCitizenUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversationMessage"
    ADD CONSTRAINT "RdvConversationMessage_senderCitizenUser_fkey" FOREIGN KEY ("senderCitizenUserId") REFERENCES public."CitizenUser"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RdvConversationMessage RdvConversationMessage_senderProUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversationMessage"
    ADD CONSTRAINT "RdvConversationMessage_senderProUser_fkey" FOREIGN KEY ("senderProUserId") REFERENCES public."ProUser"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RdvConversation RdvConversation_appointment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversation"
    ADD CONSTRAINT "RdvConversation_appointment_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."ProAppointment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvConversation RdvConversation_citizenUser_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversation"
    ADD CONSTRAINT "RdvConversation_citizenUser_fkey" FOREIGN KEY ("citizenUserId") REFERENCES public."CitizenUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvConversation RdvConversation_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvConversation"
    ADD CONSTRAINT "RdvConversation_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvNotificationLog RdvNotificationLog_conversation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvNotificationLog"
    ADD CONSTRAINT "RdvNotificationLog_conversation_fkey" FOREIGN KEY ("conversationId") REFERENCES public."RdvConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RdvNotificationLog RdvNotificationLog_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RdvNotificationLog"
    ADD CONSTRAINT "RdvNotificationLog_message_fkey" FOREIGN KEY ("messageId") REFERENCES public."RdvConversationMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StructureRdvSettings StructureRdvSettings_structure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StructureRdvSettings"
    ADD CONSTRAINT "StructureRdvSettings_structure_fkey" FOREIGN KEY ("structureId") REFERENCES public."Structure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Structure Structure_sourceDocument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Structure"
    ADD CONSTRAINT "Structure_sourceDocument_fkey" FOREIGN KEY (source_document_id) REFERENCES public."SourceDocument"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AideToLifeSituation _AideToLifeSituation_Aide_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_AideToLifeSituation"
    ADD CONSTRAINT "_AideToLifeSituation_Aide_fkey" FOREIGN KEY ("B") REFERENCES public."Aide"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AideToLifeSituation _AideToLifeSituation_LifeSituation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_AideToLifeSituation"
    ADD CONSTRAINT "_AideToLifeSituation_LifeSituation_fkey" FOREIGN KEY ("A") REFERENCES public."LifeSituation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

