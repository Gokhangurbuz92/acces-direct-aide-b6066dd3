import crypto from 'node:crypto';
import { relations, sql } from 'drizzle-orm'
import { boolean, doublePrecision, foreignKey, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, vector } from 'drizzle-orm/pg-core'

export const ContentType = pgEnum('ContentType', ['AIDE', 'DEMARCHE', 'STRUCTURE', 'ACTUALITE'])

export const ReportReason = pgEnum('ReportReason', ['LIEN_MORT', 'HORAIRES_FAUX', 'INFO_FAUSSE', 'INFO_OBSOLETE', 'AUTRE'])

export const ReportStatus = pgEnum('ReportStatus', ['NEW', 'IN_PROGRESS', 'FIXED', 'REJECTED'])

export const AidCategoryCode = pgEnum('AidCategoryCode', ['LOGEMENT', 'SANTE', 'HANDICAP', 'EMPLOI', 'FAMILLE', 'ETUDES', 'MOBILITE', 'ENERGIE', 'ALIMENTATION', 'JUSTICE', 'NUMERIQUE', 'AUTRE'])

export const AidStatus = pgEnum('AidStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const IngestJobStatus = pgEnum('IngestJobStatus', ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'])

export const RdvBookingMode = pgEnum('RdvBookingMode', ['IN_PERSON', 'VIDEO', 'BOTH'])

export const SourceDocument = pgTable('SourceDocument', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	source_url: text('source_url'),
	fetched_at: timestamp('fetched_at', { precision: 3 }).notNull().defaultNow(),
	content_hash: text('content_hash'),
	raw_content: text('raw_content'),
	metadata: jsonb('metadata')
});

export const Aide = pgTable('Aide', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').unique(),
	titre: text('titre').notNull(),
	categorie: text('categorie'),
	est_urgent: boolean('est_urgent').notNull().default(false),
	territoires: text('territoires').array().notNull().default(sql`'{}'`),
	date_verification: timestamp('date_verification', { precision: 3 }),
	delai_indicatif: text('delai_indicatif'),
	cest_quoi: text('cest_quoi'),
	pour_qui: text('pour_qui'),
	ce_que_ca_aide: text('ce_que_ca_aide'),
	documents_necessaires: text('documents_necessaires').array().notNull().default(sql`'{}'`),
	etapes: jsonb('etapes'),
	ou_demander: text('ou_demander'),
	lien_demande: text('lien_demande'),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	quality_score: integer('quality_score').notNull().default(0),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	mots_cles: text('mots_cles').array().notNull().default(sql`'{}'`),
	summary_falc: text('summary_falc'),
	audiences: text('audiences').array().notNull().default(sql`'{}'`),
	conditions_falc: text('conditions_falc'),
	departements: text('departements').array().notNull().default(sql`'{}'`),
	montant_falc: text('montant_falc'),
	situations_vie: text('situations_vie').array().notNull().default(sql`'{}'`),
	structures_links: text('structures_links').array().notNull().default(sql`'{}'`),
	categoryId: text('categoryId'),
	providerName: text('providerName'),
	providerType: text('providerType'),
	sourceId: text('sourceId'),
	source_name: text('source_name'),
	source_url: text('source_url'),
	title: text('title'),
	description: text('description'),
	content: text('content'),
	category_code: AidCategoryCode('category_code').notNull().default("AUTRE"),
	status_code: AidStatus('status_code').notNull().default("DRAFT"),
	eligibility: jsonb('eligibility'),
	financials: jsonb('financials'),
	citations: jsonb('citations'),
	qa_score: integer('qa_score').notNull().default(0),
	qa_report: jsonb('qa_report'),
	source_org: text('source_org'),
	source_hash: text('source_hash'),
	last_checked: timestamp('last_checked', { precision: 3 }),
	geo_scope: text('geo_scope'),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	region_codes: text('region_codes').array().notNull().default(sql`'{}'`),
	department_codes: text('department_codes').array().notNull().default(sql`'{}'`),
	insee_codes: text('insee_codes').array().notNull().default(sql`'{}'`),
	content_hash: text('content_hash'),
	theme: text('theme'),
	sub_theme: text('sub_theme'),
	apply_url: text('apply_url'),
	source_last_modified: timestamp('source_last_modified', { precision: 3 }),
	fetched_at: timestamp('fetched_at', { precision: 3 }),
	montant_max: text('montant_max'),
	echelon_territorial: text('echelon_territorial'),
	code_insee_territoire: text('code_insee_territoire'),
	lien_demarche: text('lien_demarche'),
	source_donnee: text('source_donnee'),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_document_id: text('source_document_id'),
	externalId: text('externalId').unique(),
	// pgvector: 768 dimensions to match gemini-embedding-001 model
	embedding: vector('embedding', { dimensions: 768 }),
}, (Aide) => ({
	'Aide_category_fkey': foreignKey({
		name: 'Aide_category_fkey',
		columns: [Aide.categoryId],
		foreignColumns: [AidCategory.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Aide_source_fkey': foreignKey({
		name: 'Aide_source_fkey',
		columns: [Aide.sourceId],
		foreignColumns: [AidSource.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Aide_sourceDocument_fkey': foreignKey({
		name: 'Aide_sourceDocument_fkey',
		columns: [Aide.source_document_id],
		foreignColumns: [SourceDocument.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	// HNSW index for fast cosine similarity search (pgvector)
	'Aide_embedding_hnsw_idx': index('Aide_embedding_hnsw_idx')
		.using('hnsw', Aide.embedding.op('vector_cosine_ops')),
}));

export const AidCategory = pgTable('AidCategory', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull()
});

export const LifeSituation = pgTable('LifeSituation', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull()
});

export const Situation = pgTable('Situation', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	label: text('label').notNull(),
	description: text('description'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const AidSituation = pgTable('AidSituation', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	aidId: text('aidId').notNull(),
	situationId: text('situationId').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
}, (AidSituation) => ({
	'AidSituation_aid_fkey': foreignKey({
		name: 'AidSituation_aid_fkey',
		columns: [AidSituation.aidId],
		foreignColumns: [Aide.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'AidSituation_situation_fkey': foreignKey({
		name: 'AidSituation_situation_fkey',
		columns: [AidSituation.situationId],
		foreignColumns: [Situation.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'AidSituation_aidId_situationId_unique_idx': uniqueIndex('AidSituation_aidId_situationId_key')
		.on(AidSituation.aidId, AidSituation.situationId)
}));

export const AidSource = pgTable('AidSource', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	kind: text('kind'),
	baseUrl: text('baseUrl'),
	license: text('license'),
	refreshPolicy: text('refreshPolicy'),
	lastRunAt: timestamp('lastRunAt', { precision: 3 }),
	lastStatus: text('lastStatus')
});

export const Structure = pgTable('Structure', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	nom: text('nom').notNull(),
	type_structure: text('type_structure'),
	accessibilite_pmr: boolean('accessibilite_pmr').default(false).notNull(),
	description_courte: text('description_courte'),
	adresse: text('adresse'),
	code_postal: text('code_postal'),
	ville: text('ville'),
	departement: text('departement'),
	telephone: text('telephone'),
	email: text('email'),
	site_web: text('site_web'),
	horaires: text('horaires'),
	services: text('services').array().notNull(),
	publics_accueillis: text('publics_accueillis').array().notNull(),
	date_verification: timestamp('date_verification', { precision: 3 }),
	categories_aidees: text('categories_aidees').array().notNull(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
	status: text('status').notNull().default("actif"),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	mots_cles: text('mots_cles').array().notNull().default(sql`'{}'`),
	slug: text('slug').unique(),
	summary_falc: text('summary_falc'),
	is_pro_enabled: boolean('is_pro_enabled').default(false).notNull(),
	settings_json: jsonb('settings_json').default("{}"),
	auto_publish: boolean('auto_publish').default(false).notNull(),
	geoloc_status: text('geoloc_status'),
	import_batch: text('import_batch'),
	import_status: text('import_status').notNull().default("pending"),
	last_sync: timestamp('last_sync', { precision: 3 }).notNull().defaultNow(),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	quality_score: integer('quality_score').notNull().default(50),
	raw_data_hash: text('raw_data_hash').unique(),
	siret: text('siret').unique(),
	source_id: text('source_id'),
	source_url: text('source_url'),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	region_codes: text('region_codes').array().notNull().default(sql`'{}'`),
	department_codes: text('department_codes').array().notNull().default(sql`'{}'`),
	insee_codes: text('insee_codes').array().notNull().default(sql`'{}'`),
	content_hash: text('content_hash'),
	type_finess: text('type_finess'),
	numero_finess: text('numero_finess').unique(),
	rna_id: text('rna_id').unique(),
	source_annuaire: text('source_annuaire'),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_last_modified: timestamp('source_last_modified', { precision: 3 }),
	source_document_id: text('source_document_id')
}, (Structure) => ({
	'Structure_sourceDocument_fkey': foreignKey({
		name: 'Structure_sourceDocument_fkey',
		columns: [Structure.source_document_id],
		foreignColumns: [SourceDocument.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Demarche = pgTable('Demarche', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	titre: text('titre').notNull(),
	categorie: text('categorie'),
	description_courte: text('description_courte'),
	delai: text('delai'),
	cout: text('cout'),
	date_verification: timestamp('date_verification', { precision: 3 }),
	pour_qui: text('pour_qui'),
	documents_necessaires: text('documents_necessaires').array().notNull().default(sql`'{}'`),
	etapes: jsonb('etapes'),
	ou_faire: text('ou_faire'),
	lien_officiel: text('lien_officiel'),
	sources: jsonb('sources'),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	quality_score: integer('quality_score').notNull().default(0),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	mots_cles: text('mots_cles').array().notNull().default(sql`'{}'`),
	slug: text('slug').unique(),
	summary_falc: text('summary_falc'),
	audiences: text('audiences').array().notNull().default(sql`'{}'`),
	departements: text('departements').array().notNull().default(sql`'{}'`),
	categoryId: text('categoryId'),
	public_cible: text('public_cible'),
	contenu_detaille: text('contenu_detaille'),
	lien_teleservice: text('lien_teleservice'),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	region_codes: text('region_codes').array().notNull().default(sql`'{}'`),
	department_codes: text('department_codes').array().notNull().default(sql`'{}'`),
	insee_codes: text('insee_codes').array().notNull().default(sql`'{}'`),
	content_hash: text('content_hash'),
	source_url: text('source_url'),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_last_modified: timestamp('source_last_modified', { precision: 3 }),
	source_document_id: text('source_document_id')
}, (Demarche) => ({
	'Demarche_category_fkey': foreignKey({
		name: 'Demarche_category_fkey',
		columns: [Demarche.categoryId],
		foreignColumns: [AidCategory.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Demarche_sourceDocument_fkey': foreignKey({
		name: 'Demarche_sourceDocument_fkey',
		columns: [Demarche.source_document_id],
		foreignColumns: [SourceDocument.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Actualite = pgTable('Actualite', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	titre: text('titre').notNull(),
	contenu: text('contenu'),
	date_publication: timestamp('date_publication', { precision: 3 }).notNull().defaultNow(),
	image_url: text('image_url'),
	lien_url: text('lien_url'),
	source: text('source'),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	canonical_url: text('canonical_url').unique(),
	category: text('category').default("actualite"),
	dedupe_hash: text('dedupe_hash'),
	fetched_at: timestamp('fetched_at', { precision: 3 }),
	guid: text('guid'),
	key_points_falc: text('key_points_falc').array().notNull(),
	slug: text('slug').unique(),
	source_id: text('source_id'),
	source_name: text('source_name'),
	summary_falc: text('summary_falc'),
	territoire: text('territoire').default("FRANCE"),
	auto_publish: boolean('auto_publish').notNull().default(false),
	categorie: text('categorie').default("general"),
	departements: text('departements').array().notNull(),
	est_important: boolean('est_important').notNull().default(false),
	falc_status: text('falc_status').notNull().default("pending"),
	ingest_batch: text('ingest_batch'),
	quality_score: integer('quality_score').notNull().default(0),
	raw_data_hash: text('raw_data_hash').unique(),
	raw_payload_json: jsonb('raw_payload_json'),
	resume: text('resume'),
	score_fiabilite: integer('score_fiabilite').notNull(),
	source_nom: text('source_nom'),
	source_url: text('source_url'),
	tags: text('tags').array().notNull(),
	type_actu: text('type_actu').default("info"),
	url: text('url'),
	source_document_id: text('source_document_id')
}, (Actualite) => ({
	'Actualite_sourceDocument_fkey': foreignKey({
		name: 'Actualite_sourceDocument_fkey',
		columns: [Actualite.source_document_id],
		foreignColumns: [SourceDocument.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ImportLog = pgTable('ImportLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	run_id: text('run_id'),
	source_name: text('source_name').notNull(),
	status: text('status').notNull(),
	items_total: integer('items_total').notNull(),
	items_new: integer('items_new').notNull(),
	items_updated: integer('items_updated').notNull(),
	items_skipped: integer('items_skipped').notNull(),
	duration_ms: integer('duration_ms'),
	logs: jsonb('logs'),
	error_count: integer('error_count').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
});

export const CronRun = pgTable('CronRun', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	job: text('job').notNull(),
	status: text('status').notNull(),
	trigger: text('trigger'),
	skipReason: text('skipReason'),
	startedAt: timestamp('startedAt', { precision: 3 }).notNull().defaultNow(),
	finishedAt: timestamp('finishedAt', { precision: 3 }),
	durationMs: integer('durationMs'),
	requestId: text('requestId'),
	vercelEnv: text('vercelEnv'),
	release: text('release'),
	metrics: jsonb('metrics'),
	errorSample: text('errorSample'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull()
});

export const ReviewQueueItem = pgTable('ReviewQueueItem', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	entityType: text('entityType').notNull(),
	entityId: text('entityId').notNull(),
	entitySlug: text('entitySlug'),
	title: text('title'),
	reason: text('reason').notNull(),
	severity: text('severity').notNull(),
	status: text('status').notNull(),
	details: jsonb('details'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ReviewQueueItem) => ({
	'ReviewQueueItem_entityType_entityId_reason_status_unique_idx': uniqueIndex('ReviewQueueItem_entityType_entityId_reason_status_key')
		.on(ReviewQueueItem.entityType, ReviewQueueItem.entityId, ReviewQueueItem.reason, ReviewQueueItem.status)
}));

export const RssSource = pgTable('RssSource', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	feed_url: text('feed_url').notNull().unique(),
	domain: text('domain').notNull(),
	trust_level: text('trust_level').notNull().default("OFFICIAL"),
	enabled: boolean('enabled').notNull().default(true),
	last_run_at: timestamp('last_run_at', { precision: 3 }),
	etag: text('etag'),
	last_modified: text('last_modified'),
	error_count: integer('error_count').notNull(),
	last_error: text('last_error'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const UpdateLog = pgTable('UpdateLog', {
	id: serial('id').notNull().primaryKey(),
	ran_at: timestamp('ran_at', { precision: 3 }).notNull().defaultNow(),
	status: text('status').notNull(),
	duration_ms: integer('duration_ms'),
	items_fetched_count: integer('items_fetched_count').notNull(),
	items_created_count: integer('items_created_count').notNull(),
	items_updated_count: integer('items_updated_count').notNull(),
	items_skipped_count: integer('items_skipped_count').notNull(),
	errors: text('errors').array().notNull(),
	source_name: text('source_name'),
	is_dry_run: boolean('is_dry_run').notNull()
});

export const IngestJob = pgTable('IngestJob', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	source: text('source').notNull(),
	status: IngestJobStatus('status').notNull().default("PENDING"),
	payload: jsonb('payload'),
	result: jsonb('result'),
	error_message: text('error_message'),
	started_at: timestamp('started_at', { precision: 3 }),
	finished_at: timestamp('finished_at', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const Source = pgTable('Source', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	type: text('type').notNull(),
	url: text('url'),
	status: text('status').notNull().default("actif"),
	trust_level: text('trust_level'),
	last_sync: timestamp('last_sync', { precision: 3 })
});

export const AdminUser = pgTable('AdminUser', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	role: text('role').notNull().default("admin"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	failedLoginAttempts: integer('failedLoginAttempts').notNull(),
	lastLogin: timestamp('lastLogin', { precision: 3 }),
	lockoutUntil: timestamp('lockoutUntil', { precision: 3 }),
	mfaSecret: text('mfaSecret'),
	mfaIv: text('mfaIv'),
	mfaEnabled: boolean('mfaEnabled').notNull()
});

export const CitizenUser = pgTable('CitizenUser', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	emailVerifiedAt: timestamp('emailVerifiedAt', { precision: 3 }),
	phone: text('phone'),
	phoneVerifiedAt: timestamp('phoneVerifiedAt', { precision: 3 }),
	notificationEmailEnabled: boolean('notificationEmailEnabled').notNull().default(true),
	failedLoginAttempts: integer('failedLoginAttempts').notNull().default(0),
	lockoutUntil: timestamp('lockoutUntil', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const AuthToken = pgTable('AuthToken', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('userId').notNull(),
	type: text('type').notNull(),
	tokenHash: text('tokenHash').notNull().unique(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	usedAt: timestamp('usedAt', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
}, (AuthToken) => ({
	'AuthToken_user_fkey': foreignKey({
		name: 'AuthToken_user_fkey',
		columns: [AuthToken.userId],
		foreignColumns: [CitizenUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const AuditLog = pgTable('AuditLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	action: text('action').notNull(),
	actor: text('actor'),
	target: text('target'),
	details: jsonb('details'),
	timestamp: timestamp('timestamp', { precision: 3 }).notNull().defaultNow(),
	ip: text('ip'),
	actor_id: text('actor_id'),
	entity: text('entity'),
	entity_id: text('entity_id'),
	ip_hash: text('ip_hash')
});

export const ProUser = pgTable('ProUser', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull(),
	password_hash: text('password_hash').notNull(),
	role: text('role').notNull(),
	status: text('status').notNull().default("pending"),
	structureId: text('structureId').notNull(),
	notificationEmailEnabled: boolean('notificationEmailEnabled').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	mfa_enabled: boolean('mfa_enabled').notNull().default(false),
	mfa_secret: text('mfa_secret')
}, (ProUser) => ({
	'ProUser_structure_fkey': foreignKey({
		name: 'ProUser_structure_fkey',
		columns: [ProUser.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'ProUser_structureId_email_unique_idx': uniqueIndex('ProUser_structureId_email_key')
		.on(ProUser.structureId, ProUser.email)
}));

// [LEGACY] Service table removed — replaced by ProRdvService

export const ProRdvService = pgTable('ProRdvService', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull(),
	name: text('name').notNull(),
	durationMinutes: integer('durationMinutes').notNull(),
	bufferBeforeMinutes: integer('bufferBeforeMinutes').notNull().default(0),
	bufferAfterMinutes: integer('bufferAfterMinutes').notNull().default(0),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ProRdvService) => ({
	'ProRdvService_structure_fkey': foreignKey({
		name: 'ProRdvService_structure_fkey',
		columns: [ProRdvService.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ProAvailabilityRule = pgTable('ProAvailabilityRule', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull(),
	weekday: integer('weekday').notNull(),
	startTime: text('startTime').notNull(),
	endTime: text('endTime').notNull(),
	timezone: text('timezone').notNull().default("Europe/Paris"),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ProAvailabilityRule) => ({
	'ProAvailabilityRule_structure_fkey': foreignKey({
		name: 'ProAvailabilityRule_structure_fkey',
		columns: [ProAvailabilityRule.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ProAppointment = pgTable('ProAppointment', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull(),
	serviceId: text('serviceId').notNull(),
	startAt: timestamp('startAt', { precision: 3 }).notNull(),
	endAt: timestamp('endAt', { precision: 3 }).notNull(),
	status: text('status').notNull().default("booked"),
	beneficiaryName: text('beneficiaryName').notNull(),
	beneficiaryPhone: text('beneficiaryPhone'),
	notes: text('notes'),
	createdByProUserId: text('createdByProUserId'),
	citizenUserId: text('citizenUserId'),
	citizenEmailSnapshot: text('citizenEmailSnapshot'),
	idempotencyKey: text('idempotencyKey'),
	cancelledAt: timestamp('cancelledAt', { precision: 3 }),
	cancelledBy: text('cancelledBy'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	visioRoomId: text('visioRoomId'),
	visioEnabled: boolean('visioEnabled').notNull().default(false),
	visioStartedAt: timestamp('visioStartedAt', { precision: 3 })
}, (ProAppointment) => ({
	'ProAppointment_createdByProUser_fkey': foreignKey({
		name: 'ProAppointment_createdByProUser_fkey',
		columns: [ProAppointment.createdByProUserId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('set null')
		.onUpdate('cascade'),
	'ProAppointment_citizenUser_fkey': foreignKey({
		name: 'ProAppointment_citizenUser_fkey',
		columns: [ProAppointment.citizenUserId],
		foreignColumns: [CitizenUser.id]
	})
		.onDelete('set null')
		.onUpdate('cascade'),
	'ProAppointment_service_fkey': foreignKey({
		name: 'ProAppointment_service_fkey',
		columns: [ProAppointment.serviceId],
		foreignColumns: [ProRdvService.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'ProAppointment_structure_fkey': foreignKey({
		name: 'ProAppointment_structure_fkey',
		columns: [ProAppointment.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'ProAppointment_citizenUserId_idempotencyKey_unique_idx': uniqueIndex('ProAppointment_citizenUserId_idempotencyKey_key')
		.on(ProAppointment.citizenUserId, ProAppointment.idempotencyKey)
}));

export const RdvConversation = pgTable('RdvConversation', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	appointmentId: text('appointmentId').notNull().unique(),
	structureId: text('structureId').notNull(),
	citizenUserId: text('citizenUserId').notNull(),
	lastMessageAt: timestamp('lastMessageAt', { precision: 3 }).notNull().defaultNow(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (RdvConversation) => ({
	'RdvConversation_appointment_fkey': foreignKey({
		name: 'RdvConversation_appointment_fkey',
		columns: [RdvConversation.appointmentId],
		foreignColumns: [ProAppointment.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'RdvConversation_structure_fkey': foreignKey({
		name: 'RdvConversation_structure_fkey',
		columns: [RdvConversation.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'RdvConversation_citizenUser_fkey': foreignKey({
		name: 'RdvConversation_citizenUser_fkey',
		columns: [RdvConversation.citizenUserId],
		foreignColumns: [CitizenUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const RdvConversationMessage = pgTable('RdvConversationMessage', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	conversationId: text('conversationId').notNull(),
	senderType: text('senderType').notNull(),
	senderCitizenUserId: text('senderCitizenUserId'),
	senderProUserId: text('senderProUserId'),
	body: text('body').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
}, (RdvConversationMessage) => ({
	'RdvConversationMessage_conversation_fkey': foreignKey({
		name: 'RdvConversationMessage_conversation_fkey',
		columns: [RdvConversationMessage.conversationId],
		foreignColumns: [RdvConversation.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'RdvConversationMessage_senderCitizenUser_fkey': foreignKey({
		name: 'RdvConversationMessage_senderCitizenUser_fkey',
		columns: [RdvConversationMessage.senderCitizenUserId],
		foreignColumns: [CitizenUser.id]
	})
		.onDelete('set null')
		.onUpdate('cascade'),
	'RdvConversationMessage_senderProUser_fkey': foreignKey({
		name: 'RdvConversationMessage_senderProUser_fkey',
		columns: [RdvConversationMessage.senderProUserId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('set null')
		.onUpdate('cascade')
}));

export const RdvNotificationLog = pgTable('RdvNotificationLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	kind: text('kind').notNull().default("MESSAGE_EMAIL"),
	conversationId: text('conversationId').notNull(),
	messageId: text('messageId').notNull(),
	recipientType: text('recipientType').notNull(),
	sentAt: timestamp('sentAt', { precision: 3 }).notNull().defaultNow()
}, (RdvNotificationLog) => ({
	'RdvNotificationLog_conversation_fkey': foreignKey({
		name: 'RdvNotificationLog_conversation_fkey',
		columns: [RdvNotificationLog.conversationId],
		foreignColumns: [RdvConversation.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'RdvNotificationLog_message_fkey': foreignKey({
		name: 'RdvNotificationLog_message_fkey',
		columns: [RdvNotificationLog.messageId],
		foreignColumns: [RdvConversationMessage.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'RdvNotificationLog_messageId_recipientType_unique_idx': uniqueIndex('RdvNotificationLog_messageId_recipientType_key')
		.on(RdvNotificationLog.messageId, RdvNotificationLog.recipientType)
}));

export const ProTimeOff = pgTable('ProTimeOff', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull(),
	startAt: timestamp('startAt', { precision: 3 }).notNull(),
	endAt: timestamp('endAt', { precision: 3 }).notNull(),
	reason: text('reason'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ProTimeOff) => ({
	'ProTimeOff_structure_fkey': foreignKey({
		name: 'ProTimeOff_structure_fkey',
		columns: [ProTimeOff.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const StructureRdvSettings = pgTable('StructureRdvSettings', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull().unique(),
	isPublished: boolean('isPublished').notNull(),
	bookingMode: RdvBookingMode('bookingMode').notNull().default("IN_PERSON"),
	contactEmail: text('contactEmail'),
	contactPhone: text('contactPhone'),
	publishedAt: timestamp('publishedAt', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (StructureRdvSettings) => ({
	'StructureRdvSettings_structure_fkey': foreignKey({
		name: 'StructureRdvSettings_structure_fkey',
		columns: [StructureRdvSettings.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Invitation = pgTable('Invitation', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureId: text('structureId').notNull(),
	email: text('email').notNull(),
	role: text('role').notNull(),
	token: text('token').notNull().unique(),
	expires_at: timestamp('expires_at', { precision: 3 }).notNull(),
	used_at: timestamp('used_at', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
}, (Invitation) => ({
	'Invitation_structure_fkey': foreignKey({
		name: 'Invitation_structure_fkey',
		columns: [Invitation.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ConsentLog = pgTable('ConsentLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	policy_version: text('policy_version').notNull(),
	policy_hash: text('policy_hash').notNull(),
	subject_type: text('subject_type').notNull(),
	subject_id: text('subject_id').notNull(),
	created_at: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
});

// [LEGACY] Availability, Beneficiary, Appointment, Message, Attachment tables removed
// Replaced by ProAvailabilityRule, ProAppointment, RdvConversation, RdvConversationMessage

export const Guide = pgTable('Guide', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	titre: text('titre').notNull(),
	resume_falc: text('resume_falc'),
	contenu_json: jsonb('contenu_json'),
	categorie: text('categorie'),
	publics: text('publics').array().notNull(),
	contexte: text('contexte').array().notNull(),
	mots_cles: text('mots_cles').array().notNull(),
	sources_urls: text('sources_urls').array().notNull(),
	statut: text('statut').notNull().default("brouillon"),
	published_at: timestamp('published_at', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const ToolboxItem = pgTable('ToolboxItem', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	titre: text('titre').notNull(),
	resume_falc: text('resume_falc'),
	type: text('type').notNull(),
	categorie: text('categorie'),
	publics: text('publics').array().notNull(),
	url_download: text('url_download'),
	contenu_html: text('contenu_html'),
	statut: text('statut').notNull().default("brouillon"),
	published_at: timestamp('published_at', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const PartnershipRequest = pgTable('PartnershipRequest', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	structureName: text('structureName').notNull(),
	city: text('city'),
	type: text('type'),
	website: text('website').notNull(),
	email: text('email').notNull(),
	message: text('message'),
	status: text('status').notNull().default("pending"),
	consent: boolean('consent').notNull(),
	ip_hash: text('ip_hash'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const EntityVersion = pgTable('EntityVersion', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	entity_type: text('entity_type').notNull(),
	entity_id: text('entity_id').notNull(),
	snapshot_json: jsonb('snapshot_json').notNull(),
	reason: text('reason'),
	actor_email: text('actor_email'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
});

export const Dispositif = pgTable('Dispositif', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').unique(),
	titre: text('titre').notNull(),
	description_falc: text('description_falc'),
	public: text('public').array().notNull(),
	departement: text('departement'),
	montant: text('montant'),
	liens: jsonb('liens'),
	status: text('status').notNull().default("actif"),
	statut: text('statut').notNull().default("brouillon"),
	published_at: timestamp('published_at', { precision: 3 }),
	summary_falc: text('summary_falc'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	content_hash: text('content_hash'),
	source_url: text('source_url'),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_last_modified: timestamp('source_last_modified', { precision: 3 }),
	source_document_id: text('source_document_id')
}, (Dispositif) => ({
	'Dispositif_sourceDocument_fkey': foreignKey({
		name: 'Dispositif_sourceDocument_fkey',
		columns: [Dispositif.source_document_id],
		foreignColumns: [SourceDocument.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const SourceSnapshot = pgTable('SourceSnapshot', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	entity_type: text('entity_type').notNull(),
	entity_id: text('entity_id').notNull(),
	fetched_at: timestamp('fetched_at', { precision: 3 }).notNull().defaultNow(),
	raw_excerpt: text('raw_excerpt'),
	content_hash: text('content_hash'),
	http_status: integer('http_status'),
	final_url: text('final_url'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
});

export const ResourceAccessibility = pgTable('ResourceAccessibility', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	type: text('type').notNull(),
	content: text('content'),
	source_url: text('source_url'),
	territory_scope: text('territory_scope'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
	status: text('status').notNull().default("draft"),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_last_modified: timestamp('source_last_modified', { precision: 3 })
});

export const ContentReport = pgTable('ContentReport', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	contentType: ContentType('contentType').notNull(),
	contentId: text('contentId').notNull(),
	reason: ReportReason('reason').notNull(),
	message: text('message'),
	pageUrl: text('pageUrl'),
	reporterEmail: text('reporterEmail'),
	status: ReportStatus('status').notNull().default("NEW"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const SyncRun = pgTable('SyncRun', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	source_id: text('source_id'),
	status: text('status').notNull(),
	started_at: timestamp('started_at', { precision: 3 }).notNull().defaultNow(),
	ended_at: timestamp('ended_at', { precision: 3 }),
	error: text('error'),
	stats: jsonb('stats'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const ConversationLog = pgTable('ConversationLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	message: text('message').notNull(),
	intent: text('intent'),
	searchMode: text('searchMode').notNull().default("rag"),
	sourceCount: integer('sourceCount').notNull(),
	sessionId: text('sessionId'),
	metadata: jsonb('metadata'),
	rating: integer('rating'),
	userComment: text('userComment')
});

export const SharedDiagnostic = pgTable('SharedDiagnostic', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	situation: jsonb('situation').notNull(),
	results: jsonb('results').notNull(),
	viewCount: integer('viewCount').notNull()
});

export const ProNotification = pgTable('ProNotification', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('userId').notNull(),
	structureId: text('structureId').notNull(),
	type: text('type').notNull(),
	title: text('title').notNull(),
	message: text('message').notNull(),
	readAt: timestamp('readAt', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	metadata: jsonb('metadata')
}, (ProNotification) => ({
	'ProNotification_user_fkey': foreignKey({
		name: 'ProNotification_user_fkey',
		columns: [ProNotification.userId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ProOutlookToken = pgTable('ProOutlookToken', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('userId').notNull().unique(),
	email: text('email'),
	accessTokenEnc: text('accessTokenEnc').notNull(),
	refreshTokenEnc: text('refreshTokenEnc').notNull(),
	iv: text('iv').notNull(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	scope: text('scope'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ProOutlookToken) => ({
	'ProOutlookToken_user_fkey': foreignKey({
		name: 'ProOutlookToken_user_fkey',
		columns: [ProOutlookToken.userId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ProAuditLog = pgTable('ProAuditLog', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	proUserId: text('proUserId').notNull(),
	action: text('action').notNull(),
	entityType: text('entityType'),
	entityId: text('entityId'),
	metadata: jsonb('metadata'),
	structureId: text('structureId').notNull()
}, (ProAuditLog) => ({
	'ProAuditLog_proUser_fkey': foreignKey({
		name: 'ProAuditLog_proUser_fkey',
		columns: [ProAuditLog.proUserId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

// [LEGACY] ProMessage table removed — System C eradicated (dead code, replaced by RdvConversationMessage)

export const UserConsent = pgTable('UserConsent', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	citizenId: text('citizenId').notNull(),
	structureId: text('structureId').notNull(),
	purpose: text('purpose').notNull(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	ipAddress: text('ipAddress')
});

export const AideToLifeSituation = pgTable('_AideToLifeSituation', {
	LifeSituationId: text('A').notNull(),
	AideId: text('B').notNull()
}, (AideToLifeSituation) => ({
	'_AideToLifeSituation_LifeSituation_fkey': foreignKey({
		name: '_AideToLifeSituation_LifeSituation_fkey',
		columns: [AideToLifeSituation.LifeSituationId],
		foreignColumns: [LifeSituation.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'_AideToLifeSituation_Aide_fkey': foreignKey({
		name: '_AideToLifeSituation_Aide_fkey',
		columns: [AideToLifeSituation.AideId],
		foreignColumns: [Aide.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

// ═══════════════════════════════════════════════════════════════════
// CITIZEN SEARCH MVP — Taxonomy, ProProfile & Junction Tables
// ═══════════════════════════════════════════════════════════════════

export const NeedCategory = pgTable('NeedCategory', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull(),
	description: text('description'),
	icon: text('icon'),
	color: text('color'),
	keywords: text('keywords').array().notNull().default(sql`'{}'`),
	sortOrder: integer('sortOrder').notNull().default(0),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const AudienceCategory = pgTable('AudienceCategory', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull(),
	sortOrder: integer('sortOrder').notNull().default(0),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const ModalityType = pgTable('ModalityType', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull(),
	icon: text('icon'),
	sortOrder: integer('sortOrder').notNull().default(0),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
});

export const ProProfile = pgTable('ProProfile', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	proUserId: text('proUserId').notNull().unique(),
	displayName: text('displayName'),
	jobTitle: text('jobTitle'),
	descriptionPublic: text('descriptionPublic'),
	photoUrl: text('photoUrl'),
	isPubliclyVisible: boolean('isPubliclyVisible').notNull().default(false),
	acceptsNewClients: boolean('acceptsNewClients').notNull().default(true),
	contactMode: text('contactMode').notNull().default('both'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull()
}, (ProProfile) => ({
	'ProProfile_proUser_fkey': foreignKey({
		name: 'ProProfile_proUser_fkey',
		columns: [ProProfile.proUserId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

// ── Junction Tables ──────────────────────────────────────────────

export const StructureNeed = pgTable('StructureNeed', {
	structureId: text('structureId').notNull(),
	needCategoryId: text('needCategoryId').notNull()
}, (StructureNeed) => ({
	'StructureNeed_pk': uniqueIndex('StructureNeed_pk').on(StructureNeed.structureId, StructureNeed.needCategoryId),
	'StructureNeed_structure_fkey': foreignKey({
		name: 'StructureNeed_structure_fkey',
		columns: [StructureNeed.structureId],
		foreignColumns: [Structure.id]
	}).onDelete('cascade').onUpdate('cascade'),
	'StructureNeed_need_fkey': foreignKey({
		name: 'StructureNeed_need_fkey',
		columns: [StructureNeed.needCategoryId],
		foreignColumns: [NeedCategory.id]
	}).onDelete('cascade').onUpdate('cascade')
}));

export const StructureAudience = pgTable('StructureAudience', {
	structureId: text('structureId').notNull(),
	audienceCategoryId: text('audienceCategoryId').notNull()
}, (StructureAudience) => ({
	'StructureAudience_pk': uniqueIndex('StructureAudience_pk').on(StructureAudience.structureId, StructureAudience.audienceCategoryId),
	'StructureAudience_structure_fkey': foreignKey({
		name: 'StructureAudience_structure_fkey',
		columns: [StructureAudience.structureId],
		foreignColumns: [Structure.id]
	}).onDelete('cascade').onUpdate('cascade'),
	'StructureAudience_audience_fkey': foreignKey({
		name: 'StructureAudience_audience_fkey',
		columns: [StructureAudience.audienceCategoryId],
		foreignColumns: [AudienceCategory.id]
	}).onDelete('cascade').onUpdate('cascade')
}));

export const StructureModality = pgTable('StructureModality', {
	structureId: text('structureId').notNull(),
	modalityTypeId: text('modalityTypeId').notNull()
}, (StructureModality) => ({
	'StructureModality_pk': uniqueIndex('StructureModality_pk').on(StructureModality.structureId, StructureModality.modalityTypeId),
	'StructureModality_structure_fkey': foreignKey({
		name: 'StructureModality_structure_fkey',
		columns: [StructureModality.structureId],
		foreignColumns: [Structure.id]
	}).onDelete('cascade').onUpdate('cascade'),
	'StructureModality_modality_fkey': foreignKey({
		name: 'StructureModality_modality_fkey',
		columns: [StructureModality.modalityTypeId],
		foreignColumns: [ModalityType.id]
	}).onDelete('cascade').onUpdate('cascade')
}));

export const ProProfileNeed = pgTable('ProProfileNeed', {
	proProfileId: text('proProfileId').notNull(),
	needCategoryId: text('needCategoryId').notNull()
}, (ProProfileNeed) => ({
	'ProProfileNeed_pk': uniqueIndex('ProProfileNeed_pk').on(ProProfileNeed.proProfileId, ProProfileNeed.needCategoryId),
	'ProProfileNeed_profile_fkey': foreignKey({
		name: 'ProProfileNeed_profile_fkey',
		columns: [ProProfileNeed.proProfileId],
		foreignColumns: [ProProfile.id]
	}).onDelete('cascade').onUpdate('cascade'),
	'ProProfileNeed_need_fkey': foreignKey({
		name: 'ProProfileNeed_need_fkey',
		columns: [ProProfileNeed.needCategoryId],
		foreignColumns: [NeedCategory.id]
	}).onDelete('cascade').onUpdate('cascade')
}));

export const ProProfileAudience = pgTable('ProProfileAudience', {
	proProfileId: text('proProfileId').notNull(),
	audienceCategoryId: text('audienceCategoryId').notNull()
}, (ProProfileAudience) => ({
	'ProProfileAudience_pk': uniqueIndex('ProProfileAudience_pk').on(ProProfileAudience.proProfileId, ProProfileAudience.audienceCategoryId),
	'ProProfileAudience_profile_fkey': foreignKey({
		name: 'ProProfileAudience_profile_fkey',
		columns: [ProProfileAudience.proProfileId],
		foreignColumns: [ProProfile.id]
	}).onDelete('cascade').onUpdate('cascade'),
	'ProProfileAudience_audience_fkey': foreignKey({
		name: 'ProProfileAudience_audience_fkey',
		columns: [ProProfileAudience.audienceCategoryId],
		foreignColumns: [AudienceCategory.id]
	}).onDelete('cascade').onUpdate('cascade')
}));

// ═══════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════

export const SourceDocumentRelations = relations(SourceDocument, ({ many }) => ({
	aides: many(Aide, {
		relationName: 'AideToSourceDocument'
	}),
	structures: many(Structure, {
		relationName: 'SourceDocumentToStructure'
	}),
	dispositifs: many(Dispositif, {
		relationName: 'DispositifToSourceDocument'
	}),
	demarches: many(Demarche, {
		relationName: 'DemarcheToSourceDocument'
	}),
	actualites: many(Actualite, {
		relationName: 'ActualiteToSourceDocument'
	})
}));

export const AideRelations = relations(Aide, ({ one, many }) => ({
	category: one(AidCategory, {
		relationName: 'AidCategoryToAide',
		fields: [Aide.categoryId],
		references: [AidCategory.id]
	}),
	source: one(AidSource, {
		relationName: 'AidSourceToAide',
		fields: [Aide.sourceId],
		references: [AidSource.id]
	}),
	situations: many(AideToLifeSituation, {
		relationName: 'AideToAideToLifeSituation'
	}),
	aidSituations: many(AidSituation, {
		relationName: 'AidSituationToAide'
	}),
	sourceDocument: one(SourceDocument, {
		relationName: 'AideToSourceDocument',
		fields: [Aide.source_document_id],
		references: [SourceDocument.id]
	})
}));

export const AidCategoryRelations = relations(AidCategory, ({ many }) => ({
	aides: many(Aide, {
		relationName: 'AidCategoryToAide'
	}),
	demarches: many(Demarche, {
		relationName: 'DemarcheToCategory'
	})
}));

export const LifeSituationRelations = relations(LifeSituation, ({ many }) => ({
	aides: many(AideToLifeSituation, {
		relationName: 'LifeSituationToAideToLifeSituation'
	}),
	demarches: many(Demarche, {
		relationName: 'DemarcheToSituation'
	})
}));

export const SituationRelations = relations(Situation, ({ many }) => ({
	aidRelations: many(AidSituation, {
		relationName: 'AidSituationToSituation'
	})
}));

export const AidSituationRelations = relations(AidSituation, ({ one }) => ({
	aid: one(Aide, {
		relationName: 'AidSituationToAide',
		fields: [AidSituation.aidId],
		references: [Aide.id]
	}),
	situation: one(Situation, {
		relationName: 'AidSituationToSituation',
		fields: [AidSituation.situationId],
		references: [Situation.id]
	})
}));

export const AidSourceRelations = relations(AidSource, ({ many }) => ({
	aides: many(Aide, {
		relationName: 'AidSourceToAide'
	})
}));

export const StructureRelations = relations(Structure, ({ one, many }) => ({
	sourceDocument: one(SourceDocument, {
		relationName: 'SourceDocumentToStructure',
		fields: [Structure.source_document_id],
		references: [SourceDocument.id]
	}),
	invitations: many(Invitation, {
		relationName: 'InvitationToStructure'
	}),
	proUsers: many(ProUser, {
		relationName: 'ProUserToStructure'
	}),
	proRdvServices: many(ProRdvService, {
		relationName: 'ProRdvServiceToStructure'
	}),
	proRdvRules: many(ProAvailabilityRule, {
		relationName: 'ProAvailabilityRuleToStructure'
	}),
	proRdvSlots: many(ProAppointment, {
		relationName: 'ProAppointmentToStructure'
	}),
	proRdvTimeOffs: many(ProTimeOff, {
		relationName: 'ProTimeOffToStructure'
	}),
	rdvSettings: many(StructureRdvSettings, {
		relationName: 'StructureToStructureRdvSettings'
	}),
	rdvConversations: many(RdvConversation, {
		relationName: 'RdvConversationToStructure'
	}),
	// Citizen Search MVP
	needs: many(StructureNeed, {
		relationName: 'StructureToStructureNeed'
	}),
	audiences: many(StructureAudience, {
		relationName: 'StructureToStructureAudience'
	}),
	modalities: many(StructureModality, {
		relationName: 'StructureToStructureModality'
	})
}));

export const DemarcheRelations = relations(Demarche, ({ one, many }) => ({
	category: one(AidCategory, {
		relationName: 'DemarcheToCategory',
		fields: [Demarche.categoryId],
		references: [AidCategory.id]
	}),
	situations: many(LifeSituation, {
		relationName: 'DemarcheToSituation'
	}),
	sourceDocument: one(SourceDocument, {
		relationName: 'DemarcheToSourceDocument',
		fields: [Demarche.source_document_id],
		references: [SourceDocument.id]
	})
}));

export const ActualiteRelations = relations(Actualite, ({ one }) => ({
	sourceDocument: one(SourceDocument, {
		relationName: 'ActualiteToSourceDocument',
		fields: [Actualite.source_document_id],
		references: [SourceDocument.id]
	})
}));

export const CitizenUserRelations = relations(CitizenUser, ({ many }) => ({
	authTokens: many(AuthToken, {
		relationName: 'AuthTokenToCitizenUser'
	}),
	proAppointments: many(ProAppointment, {
		relationName: 'ProAppointmentCitizenUser'
	}),
	rdvConversations: many(RdvConversation, {
		relationName: 'CitizenUserToRdvConversation'
	}),
	rdvMessagesSent: many(RdvConversationMessage, {
		relationName: 'RdvMessageSenderCitizen'
	})
}));

export const AuthTokenRelations = relations(AuthToken, ({ one }) => ({
	user: one(CitizenUser, {
		relationName: 'AuthTokenToCitizenUser',
		fields: [AuthToken.userId],
		references: [CitizenUser.id]
	})
}));

export const ProUserRelations = relations(ProUser, ({ many, one }) => ({

	proAppointmentsCreated: many(ProAppointment, {
		relationName: 'ProAppointmentCreatedBy'
	}),
	rdvMessagesSent: many(RdvConversationMessage, {
		relationName: 'RdvMessageSenderPro'
	}),
	notifications: many(ProNotification, {
		relationName: 'ProNotificationToProUser'
	}),
	outlookToken: many(ProOutlookToken, {
		relationName: 'ProOutlookTokenToProUser'
	}),
	proAuditLogs: many(ProAuditLog, {
		relationName: 'ProAuditLogToProUser'
	}),
	structure: one(Structure, {
		relationName: 'ProUserToStructure',
		fields: [ProUser.structureId],
		references: [Structure.id]
	}),
	// Citizen Search MVP
	proProfile: one(ProProfile, {
		relationName: 'ProUserToProProfile',
		fields: [ProUser.id],
		references: [ProProfile.proUserId]
	})
}));

// [LEGACY] ServiceRelations removed

export const ProRdvServiceRelations = relations(ProRdvService, ({ many, one }) => ({
	appointments: many(ProAppointment, {
		relationName: 'ProAppointmentToProRdvService'
	}),
	structure: one(Structure, {
		relationName: 'ProRdvServiceToStructure',
		fields: [ProRdvService.structureId],
		references: [Structure.id]
	})
}));

export const ProAvailabilityRuleRelations = relations(ProAvailabilityRule, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'ProAvailabilityRuleToStructure',
		fields: [ProAvailabilityRule.structureId],
		references: [Structure.id]
	})
}));

export const ProAppointmentRelations = relations(ProAppointment, ({ one, many }) => ({
	createdByProUser: one(ProUser, {
		relationName: 'ProAppointmentCreatedBy',
		fields: [ProAppointment.createdByProUserId],
		references: [ProUser.id]
	}),
	citizenUser: one(CitizenUser, {
		relationName: 'ProAppointmentCitizenUser',
		fields: [ProAppointment.citizenUserId],
		references: [CitizenUser.id]
	}),
	service: one(ProRdvService, {
		relationName: 'ProAppointmentToProRdvService',
		fields: [ProAppointment.serviceId],
		references: [ProRdvService.id]
	}),
	structure: one(Structure, {
		relationName: 'ProAppointmentToStructure',
		fields: [ProAppointment.structureId],
		references: [Structure.id]
	}),
	conversation: many(RdvConversation, {
		relationName: 'ProAppointmentToRdvConversation'
	})
}));

export const RdvConversationRelations = relations(RdvConversation, ({ one, many }) => ({
	appointment: one(ProAppointment, {
		relationName: 'ProAppointmentToRdvConversation',
		fields: [RdvConversation.appointmentId],
		references: [ProAppointment.id]
	}),
	structure: one(Structure, {
		relationName: 'RdvConversationToStructure',
		fields: [RdvConversation.structureId],
		references: [Structure.id]
	}),
	citizenUser: one(CitizenUser, {
		relationName: 'CitizenUserToRdvConversation',
		fields: [RdvConversation.citizenUserId],
		references: [CitizenUser.id]
	}),
	messages: many(RdvConversationMessage, {
		relationName: 'RdvConversationToRdvConversationMessage'
	}),
	notifications: many(RdvNotificationLog, {
		relationName: 'RdvConversationToRdvNotificationLog'
	})
}));

export const RdvConversationMessageRelations = relations(RdvConversationMessage, ({ one, many }) => ({
	conversation: one(RdvConversation, {
		relationName: 'RdvConversationToRdvConversationMessage',
		fields: [RdvConversationMessage.conversationId],
		references: [RdvConversation.id]
	}),
	senderCitizenUser: one(CitizenUser, {
		relationName: 'RdvMessageSenderCitizen',
		fields: [RdvConversationMessage.senderCitizenUserId],
		references: [CitizenUser.id]
	}),
	senderProUser: one(ProUser, {
		relationName: 'RdvMessageSenderPro',
		fields: [RdvConversationMessage.senderProUserId],
		references: [ProUser.id]
	}),
	notifications: many(RdvNotificationLog, {
		relationName: 'RdvConversationMessageToRdvNotificationLog'
	})
}));

export const RdvNotificationLogRelations = relations(RdvNotificationLog, ({ one }) => ({
	conversation: one(RdvConversation, {
		relationName: 'RdvConversationToRdvNotificationLog',
		fields: [RdvNotificationLog.conversationId],
		references: [RdvConversation.id]
	}),
	message: one(RdvConversationMessage, {
		relationName: 'RdvConversationMessageToRdvNotificationLog',
		fields: [RdvNotificationLog.messageId],
		references: [RdvConversationMessage.id]
	})
}));

export const ProTimeOffRelations = relations(ProTimeOff, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'ProTimeOffToStructure',
		fields: [ProTimeOff.structureId],
		references: [Structure.id]
	})
}));

export const StructureRdvSettingsRelations = relations(StructureRdvSettings, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'StructureToStructureRdvSettings',
		fields: [StructureRdvSettings.structureId],
		references: [Structure.id]
	})
}));

export const InvitationRelations = relations(Invitation, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'InvitationToStructure',
		fields: [Invitation.structureId],
		references: [Structure.id]
	})
}));

// [LEGACY] AvailabilityRelations, BeneficiaryRelations, AppointmentRelations,
// MessageRelations, AttachmentRelations removed — superseded by Pro/Rdv equivalents

export const DispositifRelations = relations(Dispositif, ({ one }) => ({
	sourceDocument: one(SourceDocument, {
		relationName: 'DispositifToSourceDocument',
		fields: [Dispositif.source_document_id],
		references: [SourceDocument.id]
	})
}));

export const ProNotificationRelations = relations(ProNotification, ({ one }) => ({
	user: one(ProUser, {
		relationName: 'ProNotificationToProUser',
		fields: [ProNotification.userId],
		references: [ProUser.id]
	})
}));

export const ProOutlookTokenRelations = relations(ProOutlookToken, ({ one }) => ({
	user: one(ProUser, {
		relationName: 'ProOutlookTokenToProUser',
		fields: [ProOutlookToken.userId],
		references: [ProUser.id]
	})
}));

export const ProAuditLogRelations = relations(ProAuditLog, ({ one }) => ({
	proUser: one(ProUser, {
		relationName: 'ProAuditLogToProUser',
		fields: [ProAuditLog.proUserId],
		references: [ProUser.id]
	})
}));

export const AideToLifeSituationRelations = relations(AideToLifeSituation, ({ one }) => ({
	LifeSituation: one(LifeSituation, {
		relationName: 'LifeSituationToAideToLifeSituation',
		fields: [AideToLifeSituation.LifeSituationId],
		references: [LifeSituation.id]
	}),
	Aide: one(Aide, {
		relationName: 'AideToAideToLifeSituation',
		fields: [AideToLifeSituation.AideId],
		references: [Aide.id]
	})
}));

// ── Citizen Search MVP Relations ─────────────────────────────────

export const NeedCategoryRelations = relations(NeedCategory, ({ many }) => ({
	structureNeeds: many(StructureNeed, {
		relationName: 'NeedCategoryToStructureNeed'
	}),
	proProfileNeeds: many(ProProfileNeed, {
		relationName: 'NeedCategoryToProProfileNeed'
	})
}));

export const AudienceCategoryRelations = relations(AudienceCategory, ({ many }) => ({
	structureAudiences: many(StructureAudience, {
		relationName: 'AudienceCategoryToStructureAudience'
	}),
	proProfileAudiences: many(ProProfileAudience, {
		relationName: 'AudienceCategoryToProProfileAudience'
	})
}));

export const ModalityTypeRelations = relations(ModalityType, ({ many }) => ({
	structureModalities: many(StructureModality, {
		relationName: 'ModalityTypeToStructureModality'
	})
}));

export const ProProfileRelations = relations(ProProfile, ({ one, many }) => ({
	proUser: one(ProUser, {
		relationName: 'ProUserToProProfile',
		fields: [ProProfile.proUserId],
		references: [ProUser.id]
	}),
	needs: many(ProProfileNeed, {
		relationName: 'ProProfileToProProfileNeed'
	}),
	audiences: many(ProProfileAudience, {
		relationName: 'ProProfileToProProfileAudience'
	})
}));

export const StructureNeedRelations = relations(StructureNeed, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'StructureToStructureNeed',
		fields: [StructureNeed.structureId],
		references: [Structure.id]
	}),
	needCategory: one(NeedCategory, {
		relationName: 'NeedCategoryToStructureNeed',
		fields: [StructureNeed.needCategoryId],
		references: [NeedCategory.id]
	})
}));

export const StructureAudienceRelations = relations(StructureAudience, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'StructureToStructureAudience',
		fields: [StructureAudience.structureId],
		references: [Structure.id]
	}),
	audienceCategory: one(AudienceCategory, {
		relationName: 'AudienceCategoryToStructureAudience',
		fields: [StructureAudience.audienceCategoryId],
		references: [AudienceCategory.id]
	})
}));

export const StructureModalityRelations = relations(StructureModality, ({ one }) => ({
	structure: one(Structure, {
		relationName: 'StructureToStructureModality',
		fields: [StructureModality.structureId],
		references: [Structure.id]
	}),
	modalityType: one(ModalityType, {
		relationName: 'ModalityTypeToStructureModality',
		fields: [StructureModality.modalityTypeId],
		references: [ModalityType.id]
	})
}));

export const ProProfileNeedRelations = relations(ProProfileNeed, ({ one }) => ({
	proProfile: one(ProProfile, {
		relationName: 'ProProfileToProProfileNeed',
		fields: [ProProfileNeed.proProfileId],
		references: [ProProfile.id]
	}),
	needCategory: one(NeedCategory, {
		relationName: 'NeedCategoryToProProfileNeed',
		fields: [ProProfileNeed.needCategoryId],
		references: [NeedCategory.id]
	})
}));

export const ProProfileAudienceRelations = relations(ProProfileAudience, ({ one }) => ({
	proProfile: one(ProProfile, {
		relationName: 'ProProfileToProProfileAudience',
		fields: [ProProfileAudience.proProfileId],
		references: [ProProfile.id]
	}),
	audienceCategory: one(AudienceCategory, {
		relationName: 'AudienceCategoryToProProfileAudience',
		fields: [ProProfileAudience.audienceCategoryId],
		references: [AudienceCategory.id]
	})
}));

// ─── AI Metrics ─────────────────────────────────────────────────────────────
export const AiMetric = pgTable('AiMetric', {
	id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	type: text('type').notNull(),           // chat, discovery, scheduler, hive-scan, falc
	model: text('model').notNull(),         // gemini-2.0-flash
	promptTokens: integer('prompt_tokens').notNull().default(0),
	completionTokens: integer('completion_tokens').notNull().default(0),
	totalTokens: integer('total_tokens').notNull().default(0),
	latencyMs: integer('latency_ms').notNull().default(0),
	success: boolean('success').notNull().default(true),
	circuitBreakerOpen: boolean('circuit_breaker_open').notNull().default(false),
	errorMessage: text('error_message'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
});