import { relations, sql } from 'drizzle-orm'
import { boolean, doublePrecision, foreignKey, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const ContentType = pgEnum('ContentType', ['AIDE', 'DEMARCHE', 'STRUCTURE', 'ACTUALITE'])

export const ReportReason = pgEnum('ReportReason', ['LIEN_MORT', 'HORAIRES_FAUX', 'INFO_FAUSSE', 'INFO_OBSOLETE', 'AUTRE'])

export const ReportStatus = pgEnum('ReportStatus', ['NEW', 'IN_PROGRESS', 'FIXED', 'REJECTED'])

export const AidCategoryCode = pgEnum('AidCategoryCode', ['LOGEMENT', 'SANTE', 'HANDICAP', 'EMPLOI', 'FAMILLE', 'ETUDES', 'MOBILITE', 'ENERGIE', 'ALIMENTATION', 'JUSTICE', 'NUMERIQUE', 'AUTRE'])

export const AidStatus = pgEnum('AidStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const IngestJobStatus = pgEnum('IngestJobStatus', ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'])

export const RdvBookingMode = pgEnum('RdvBookingMode', ['IN_PERSON', 'VIDEO', 'BOTH'])

export const SourceDocument = pgTable('SourceDocument', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	source_url: text('source_url'),
	fetched_at: timestamp('fetched_at', { precision: 3 }).notNull().defaultNow(),
	content_hash: text('content_hash'),
	raw_content: text('raw_content'),
	metadata: jsonb('metadata')
});

export const Aide = pgTable('Aide', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	slug: text('slug').unique(),
	titre: text('titre').notNull(),
	categorie: text('categorie'),
	est_urgent: boolean('est_urgent').notNull(),
	territoires: text('territoires').array().notNull(),
	date_verification: timestamp('date_verification', { precision: 3 }),
	delai_indicatif: text('delai_indicatif'),
	cest_quoi: text('cest_quoi'),
	pour_qui: text('pour_qui'),
	ce_que_ca_aide: text('ce_que_ca_aide'),
	documents_necessaires: text('documents_necessaires').array().notNull(),
	etapes: jsonb('etapes'),
	ou_demander: text('ou_demander'),
	lien_demande: text('lien_demande'),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	quality_score: integer('quality_score').notNull(),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	mots_cles: text('mots_cles').array().notNull(),
	summary_falc: text('summary_falc'),
	audiences: text('audiences').array().notNull(),
	conditions_falc: text('conditions_falc'),
	departements: text('departements').array().notNull(),
	montant_falc: text('montant_falc'),
	situations_vie: text('situations_vie').array().notNull(),
	structures_links: text('structures_links').array().notNull(),
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
	qa_score: integer('qa_score').notNull(),
	qa_report: jsonb('qa_report'),
	source_org: text('source_org'),
	source_hash: text('source_hash'),
	last_checked: timestamp('last_checked', { precision: 3 }),
	geo_scope: text('geo_scope'),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	region_codes: text('region_codes').array().notNull(),
	department_codes: text('department_codes').array().notNull(),
	insee_codes: text('insee_codes').array().notNull(),
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
	externalId: text('externalId').unique()
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
		.onUpdate('cascade')
}));

export const AidCategory = pgTable('AidCategory', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull()
});

export const LifeSituation = pgTable('LifeSituation', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	slug: text('slug').notNull().unique(),
	label: text('label').notNull()
});

export const Situation = pgTable('Situation', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	code: text('code').notNull().unique(),
	label: text('label').notNull(),
	description: text('description'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const AidSituation = pgTable('AidSituation', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	name: text('name').notNull(),
	kind: text('kind'),
	baseUrl: text('baseUrl'),
	license: text('license'),
	refreshPolicy: text('refreshPolicy'),
	lastRunAt: timestamp('lastRunAt', { precision: 3 }),
	lastStatus: text('lastStatus')
});

export const Structure = pgTable('Structure', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	nom: text('nom').notNull(),
	type_structure: text('type_structure'),
	accessibilite_pmr: boolean('accessibilite_pmr').notNull(),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	status: text('status').notNull().default("actif"),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	mots_cles: text('mots_cles').array().notNull(),
	slug: text('slug').unique(),
	summary_falc: text('summary_falc'),
	is_pro_enabled: boolean('is_pro_enabled').notNull(),
	settings_json: jsonb('settings_json').default("{}"),
	auto_publish: boolean('auto_publish').notNull(),
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
	region_codes: text('region_codes').array().notNull(),
	department_codes: text('department_codes').array().notNull(),
	insee_codes: text('insee_codes').array().notNull(),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	titre: text('titre').notNull(),
	categorie: text('categorie'),
	description_courte: text('description_courte'),
	delai: text('delai'),
	cout: text('cout'),
	date_verification: timestamp('date_verification', { precision: 3 }),
	pour_qui: text('pour_qui'),
	documents_necessaires: text('documents_necessaires').array().notNull(),
	etapes: jsonb('etapes'),
	ou_faire: text('ou_faire'),
	lien_officiel: text('lien_officiel'),
	sources: jsonb('sources'),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	statut: text('statut').notNull().default("brouillon"),
	updatedBy: text('updatedBy'),
	quality_score: integer('quality_score').notNull(),
	commentaire_statut: text('commentaire_statut'),
	published_at: timestamp('published_at', { precision: 3 }),
	mots_cles: text('mots_cles').array().notNull(),
	slug: text('slug').unique(),
	summary_falc: text('summary_falc'),
	audiences: text('audiences').array().notNull(),
	departements: text('departements').array().notNull(),
	categoryId: text('categoryId'),
	public_cible: text('public_cible'),
	contenu_detaille: text('contenu_detaille'),
	lien_teleservice: text('lien_teleservice'),
	source_url_exact: text('source_url_exact'),
	territory_scope: text('territory_scope'),
	region_codes: text('region_codes').array().notNull(),
	department_codes: text('department_codes').array().notNull(),
	insee_codes: text('insee_codes').array().notNull(),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	titre: text('titre').notNull(),
	contenu: text('contenu'),
	date_publication: timestamp('date_publication', { precision: 3 }).notNull().defaultNow(),
	image_url: text('image_url'),
	lien_url: text('lien_url'),
	source: text('source'),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
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
	auto_publish: boolean('auto_publish').notNull(),
	categorie: text('categorie').default("general"),
	departements: text('departements').array().notNull(),
	est_important: boolean('est_important').notNull(),
	falc_status: text('falc_status').notNull().default("pending"),
	ingest_batch: text('ingest_batch'),
	quality_score: integer('quality_score').notNull(),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const ReviewQueueItem = pgTable('ReviewQueueItem', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	entityType: text('entityType').notNull(),
	entityId: text('entityId').notNull(),
	entitySlug: text('entitySlug'),
	title: text('title'),
	reason: text('reason').notNull(),
	severity: text('severity').notNull(),
	status: text('status').notNull(),
	details: jsonb('details'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
}, (ReviewQueueItem) => ({
	'ReviewQueueItem_entityType_entityId_reason_status_unique_idx': uniqueIndex('ReviewQueueItem_entityType_entityId_reason_status_key')
		.on(ReviewQueueItem.entityType, ReviewQueueItem.entityId, ReviewQueueItem.reason, ReviewQueueItem.status)
}));

export const RssSource = pgTable('RssSource', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	source: text('source').notNull(),
	status: IngestJobStatus('status').notNull().default("PENDING"),
	payload: jsonb('payload'),
	result: jsonb('result'),
	error_message: text('error_message'),
	started_at: timestamp('started_at', { precision: 3 }),
	finished_at: timestamp('finished_at', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const Source = pgTable('Source', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	name: text('name').notNull(),
	type: text('type').notNull(),
	url: text('url'),
	status: text('status').notNull().default("actif"),
	trust_level: text('trust_level'),
	last_sync: timestamp('last_sync', { precision: 3 })
});

export const AdminUser = pgTable('AdminUser', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	role: text('role').notNull().default("admin"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	failedLoginAttempts: integer('failedLoginAttempts').notNull(),
	lastLogin: timestamp('lastLogin', { precision: 3 }),
	lockoutUntil: timestamp('lockoutUntil', { precision: 3 }),
	mfaSecret: text('mfaSecret'),
	mfaIv: text('mfaIv'),
	mfaEnabled: boolean('mfaEnabled').notNull()
});

export const CitizenUser = pgTable('CitizenUser', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	emailVerifiedAt: timestamp('emailVerifiedAt', { precision: 3 }),
	phone: text('phone'),
	phoneVerifiedAt: timestamp('phoneVerifiedAt', { precision: 3 }),
	notificationEmailEnabled: boolean('notificationEmailEnabled').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const AuthToken = pgTable('AuthToken', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	email: text('email').notNull(),
	password_hash: text('password_hash').notNull(),
	role: text('role').notNull(),
	status: text('status').notNull().default("pending"),
	structureId: text('structureId').notNull(),
	notificationEmailEnabled: boolean('notificationEmailEnabled').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	mfa_enabled: boolean('mfa_enabled').notNull(),
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

export const Service = pgTable('Service', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	slug: text('slug').notNull(),
	name: text('name').notNull(),
	description_falc: text('description_falc'),
	duration_minutes: integer('duration_minutes'),
	modes: jsonb('modes'),
	required_docs: text('required_docs').array().notNull(),
	audiences: text('audiences').array().notNull(),
	is_active: boolean('is_active').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
}, (Service) => ({
	'Service_structure_fkey': foreignKey({
		name: 'Service_structure_fkey',
		columns: [Service.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Service_structureId_slug_unique_idx': uniqueIndex('Service_structureId_slug_key')
		.on(Service.structureId, Service.slug)
}));

export const ProRdvService = pgTable('ProRdvService', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	name: text('name').notNull(),
	durationMinutes: integer('durationMinutes').notNull(),
	bufferBeforeMinutes: integer('bufferBeforeMinutes').notNull(),
	bufferAfterMinutes: integer('bufferAfterMinutes').notNull(),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	weekday: integer('weekday').notNull(),
	startTime: text('startTime').notNull(),
	endTime: text('endTime').notNull(),
	timezone: text('timezone').notNull().default("Europe/Paris"),
	isActive: boolean('isActive').notNull().default(true),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	visioRoomId: text('visioRoomId'),
	visioEnabled: boolean('visioEnabled').notNull(),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	appointmentId: text('appointmentId').notNull().unique(),
	structureId: text('structureId').notNull(),
	citizenUserId: text('citizenUserId').notNull(),
	lastMessageAt: timestamp('lastMessageAt', { precision: 3 }).notNull().defaultNow(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	startAt: timestamp('startAt', { precision: 3 }).notNull(),
	endAt: timestamp('endAt', { precision: 3 }).notNull(),
	reason: text('reason'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull().unique(),
	isPublished: boolean('isPublished').notNull(),
	bookingMode: RdvBookingMode('bookingMode').notNull().default("IN_PERSON"),
	contactEmail: text('contactEmail'),
	contactPhone: text('contactPhone'),
	publishedAt: timestamp('publishedAt', { precision: 3 }),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	policy_version: text('policy_version').notNull(),
	policy_hash: text('policy_hash').notNull(),
	subject_type: text('subject_type').notNull(),
	subject_id: text('subject_id').notNull(),
	created_at: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
});

export const Availability = pgTable('Availability', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	proId: text('proId'),
	slots_json: jsonb('slots_json').notNull().default("{}"),
	exceptions_json: jsonb('exceptions_json').notNull().default("[]"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
}, (Availability) => ({
	'Availability_pro_fkey': foreignKey({
		name: 'Availability_pro_fkey',
		columns: [Availability.proId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Availability_structure_fkey': foreignKey({
		name: 'Availability_structure_fkey',
		columns: [Availability.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Availability_structureId_proId_unique_idx': uniqueIndex('Availability_structureId_proId_key')
		.on(Availability.structureId, Availability.proId)
}));

export const Beneficiary = pgTable('Beneficiary', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	contact_encrypted: text('contact_encrypted').notNull(),
	contact_hash: text('contact_hash').notNull(),
	first_name_encrypted: text('first_name_encrypted'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
});

export const Appointment = pgTable('Appointment', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	structureId: text('structureId').notNull(),
	serviceId: text('serviceId').notNull(),
	proId: text('proId'),
	beneficiaryId: text('beneficiaryId').notNull(),
	status: text('status').notNull().default("requested"),
	start_at: timestamp('start_at', { precision: 3 }).notNull(),
	end_at: timestamp('end_at', { precision: 3 }).notNull(),
	timezone: text('timezone').notNull().default("Europe/Paris"),
	mode: text('mode').notNull(),
	lock_expires_at: timestamp('lock_expires_at', { precision: 3 }),
	cancel_token_hash: text('cancel_token_hash'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	access_token_hash: text('access_token_hash'),
	metadata: jsonb('metadata').default("{}")
}, (Appointment) => ({
	'Appointment_beneficiary_fkey': foreignKey({
		name: 'Appointment_beneficiary_fkey',
		columns: [Appointment.beneficiaryId],
		foreignColumns: [Beneficiary.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Appointment_pro_fkey': foreignKey({
		name: 'Appointment_pro_fkey',
		columns: [Appointment.proId],
		foreignColumns: [ProUser.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Appointment_service_fkey': foreignKey({
		name: 'Appointment_service_fkey',
		columns: [Appointment.serviceId],
		foreignColumns: [Service.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Appointment_structure_fkey': foreignKey({
		name: 'Appointment_structure_fkey',
		columns: [Appointment.structureId],
		foreignColumns: [Structure.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Message = pgTable('Message', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	appointmentId: text('appointmentId').notNull(),
	sender: text('sender').notNull(),
	content_encrypted: text('content_encrypted').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	read_at: timestamp('read_at', { precision: 3 })
}, (Message) => ({
	'Message_appointment_fkey': foreignKey({
		name: 'Message_appointment_fkey',
		columns: [Message.appointmentId],
		foreignColumns: [Appointment.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Attachment = pgTable('Attachment', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	messageId: text('messageId').notNull(),
	filename_encrypted: text('filename_encrypted').notNull(),
	mime_type: text('mime_type').notNull(),
	size_bytes: integer('size_bytes').notNull(),
	storage_key: text('storage_key').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
}, (Attachment) => ({
	'Attachment_message_fkey': foreignKey({
		name: 'Attachment_message_fkey',
		columns: [Attachment.messageId],
		foreignColumns: [Message.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Guide = pgTable('Guide', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const ToolboxItem = pgTable('ToolboxItem', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const PartnershipRequest = pgTable('PartnershipRequest', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const EntityVersion = pgTable('EntityVersion', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	entity_type: text('entity_type').notNull(),
	entity_id: text('entity_id').notNull(),
	snapshot_json: jsonb('snapshot_json').notNull(),
	reason: text('reason'),
	actor_email: text('actor_email'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow()
});

export const Dispositif = pgTable('Dispositif', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	type: text('type').notNull(),
	content: text('content'),
	source_url: text('source_url'),
	territory_scope: text('territory_scope'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
	status: text('status').notNull().default("draft"),
	retrieved_at: timestamp('retrieved_at', { precision: 3 }),
	last_checked_at: timestamp('last_checked_at', { precision: 3 }),
	source_last_modified: timestamp('source_last_modified', { precision: 3 })
});

export const ContentReport = pgTable('ContentReport', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	contentType: ContentType('contentType').notNull(),
	contentId: text('contentId').notNull(),
	reason: ReportReason('reason').notNull(),
	message: text('message'),
	pageUrl: text('pageUrl'),
	reporterEmail: text('reporterEmail'),
	status: ReportStatus('status').notNull().default("NEW"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const SyncRun = pgTable('SyncRun', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	source_id: text('source_id'),
	status: text('status').notNull(),
	started_at: timestamp('started_at', { precision: 3 }).notNull().defaultNow(),
	ended_at: timestamp('ended_at', { precision: 3 }),
	error: text('error'),
	stats: jsonb('stats'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const ConversationLog = pgTable('ConversationLog', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	situation: jsonb('situation').notNull(),
	results: jsonb('results').notNull(),
	viewCount: integer('viewCount').notNull()
});

export const ProNotification = pgTable('ProNotification', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	userId: text('userId').notNull().unique(),
	email: text('email'),
	accessTokenEnc: text('accessTokenEnc').notNull(),
	refreshTokenEnc: text('refreshTokenEnc').notNull(),
	iv: text('iv').notNull(),
	expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
	scope: text('scope'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
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
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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

export const ProMessage = pgTable('ProMessage', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	conversationId: text('conversationId').notNull(),
	senderId: text('senderId').notNull(),
	contentEncrypted: text('contentEncrypted').notNull(),
	iv: text('iv').notNull(),
	readAt: timestamp('readAt', { precision: 3 })
});

export const UserConsent = pgTable('UserConsent', {
	id: text('id').notNull().primaryKey().default(sql`uuid()`),
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
	appointments: many(Appointment, {
		relationName: 'AppointmentToStructure'
	}),
	availabilities: many(Availability, {
		relationName: 'AvailabilityToStructure'
	}),
	invitations: many(Invitation, {
		relationName: 'InvitationToStructure'
	}),
	proUsers: many(ProUser, {
		relationName: 'ProUserToStructure'
	}),
	proServices: many(Service, {
		relationName: 'ServiceToStructure'
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
	appointments: many(Appointment, {
		relationName: 'AppointmentToProUser'
	}),
	availability: many(Availability, {
		relationName: 'AvailabilityToProUser'
	}),
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
	})
}));

export const ServiceRelations = relations(Service, ({ many, one }) => ({
	appointments: many(Appointment, {
		relationName: 'AppointmentToService'
	}),
	structure: one(Structure, {
		relationName: 'ServiceToStructure',
		fields: [Service.structureId],
		references: [Structure.id]
	})
}));

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

export const AvailabilityRelations = relations(Availability, ({ one }) => ({
	pro: one(ProUser, {
		relationName: 'AvailabilityToProUser',
		fields: [Availability.proId],
		references: [ProUser.id]
	}),
	structure: one(Structure, {
		relationName: 'AvailabilityToStructure',
		fields: [Availability.structureId],
		references: [Structure.id]
	})
}));

export const BeneficiaryRelations = relations(Beneficiary, ({ many }) => ({
	appointments: many(Appointment, {
		relationName: 'AppointmentToBeneficiary'
	})
}));

export const AppointmentRelations = relations(Appointment, ({ one, many }) => ({
	beneficiary: one(Beneficiary, {
		relationName: 'AppointmentToBeneficiary',
		fields: [Appointment.beneficiaryId],
		references: [Beneficiary.id]
	}),
	pro: one(ProUser, {
		relationName: 'AppointmentToProUser',
		fields: [Appointment.proId],
		references: [ProUser.id]
	}),
	service: one(Service, {
		relationName: 'AppointmentToService',
		fields: [Appointment.serviceId],
		references: [Service.id]
	}),
	structure: one(Structure, {
		relationName: 'AppointmentToStructure',
		fields: [Appointment.structureId],
		references: [Structure.id]
	}),
	messages: many(Message, {
		relationName: 'AppointmentToMessage'
	})
}));

export const MessageRelations = relations(Message, ({ many, one }) => ({
	attachments: many(Attachment, {
		relationName: 'AttachmentToMessage'
	}),
	appointment: one(Appointment, {
		relationName: 'AppointmentToMessage',
		fields: [Message.appointmentId],
		references: [Appointment.id]
	})
}));

export const AttachmentRelations = relations(Attachment, ({ one }) => ({
	message: one(Message, {
		relationName: 'AttachmentToMessage',
		fields: [Attachment.messageId],
		references: [Message.id]
	})
}));

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