import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * ⚖️ SUITE RGPD — Accès Direct Aide
 *
 * 1. Génère le registre des activités de traitement (Article 30 RGPD)
 * 2. Exporte les données d'un utilisateur (Droit à la portabilité, Article 20)
 *
 * Usage:
 *   node scripts/gdpr-suite.mjs                  → Génère le registre
 *   node scripts/gdpr-suite.mjs export <userId>   → Exporte les données d'un utilisateur
 */

// ─── Registre de traitement (Article 30) ─────────────

const REGISTRE = {
    organisme: 'Accès Direct Aide',
    dpo_contact: 'dpo@accesdirectaide.fr',
    date_mise_a_jour: new Date().toISOString().split('T')[0],
    traitements: [
        {
            nom: 'Gestion des comptes citoyens',
            finalite: 'Création et gestion des comptes utilisateurs citoyens',
            base_legale: 'Consentement (Article 6.1.a)',
            categories_donnees: ['Email', 'Mot de passe (hashé)', 'Numéro de téléphone (optionnel)'],
            categories_personnes: ['Citoyens bénéficiaires'],
            destinataires: ['Équipe technique Accès Direct Aide'],
            duree_conservation: '3 ans après la dernière activité, puis suppression via cron GDPR purge',
            mesures_securite: 'Chiffrement AES-256-GCM, hashage bcrypt, JWT avec révocation',
        },
        {
            nom: 'Diagnostic social (simulateur OpenFisca)',
            finalite: 'Estimation des droits sociaux des citoyens',
            base_legale: 'Consentement (Article 6.1.a)',
            categories_donnees: ['Revenus', 'Situation logement', 'Composition foyer', 'Date de naissance'],
            categories_personnes: ['Citoyens bénéficiaires'],
            destinataires: ['Aucun — traitement local uniquement'],
            duree_conservation: 'Données non stockées côté serveur (traitement éphémère)',
            mesures_securite: 'Données traitées en mémoire, aucune persistance',
        },
        {
            nom: 'Assistant IA conversationnel',
            finalite: 'Orientation vers les aides sociales via chatbot IA',
            base_legale: 'Intérêt légitime (Article 6.1.f)',
            categories_donnees: ['Messages texte (tronqués à 500 caractères)', 'Intent détecté'],
            categories_personnes: ['Citoyens bénéficiaires'],
            destinataires: ['Google Gemini API (sous-traitant)'],
            duree_conservation: 'Logs de conversation conservés 1 an',
            mesures_securite: 'PII blocking (NIR/IBAN/CB), filtre de sortie avec disclaimer, rate limiting',
        },
        {
            nom: 'Espace professionnel & rendez-vous',
            finalite: 'Mise en relation citoyen — travailleur social',
            base_legale: 'Exécution du contrat (Article 6.1.b)',
            categories_donnees: ['Identité pro', 'Agendas', 'Messages chiffrés', 'Emails citoyens'],
            categories_personnes: ['Travailleurs sociaux', 'Citoyens bénéficiaires'],
            destinataires: ['Équipe technique Accès Direct Aide'],
            duree_conservation: 'Durée de la relation contractuelle + 2 ans',
            mesures_securite: 'Vault Zero-Knowledge pour messages, RBAC par structure, audit logs',
        },
        {
            nom: 'Ingestion de données publiques',
            finalite: 'Actualisation de la base d\'aides, structures et actualités',
            base_legale: 'Intérêt légitime (Article 6.1.f)',
            categories_donnees: ['Données publiques open-data (aides, structures, actualités)'],
            categories_personnes: ['Aucune personne physique'],
            destinataires: ['Base de données interne'],
            duree_conservation: 'Mise à jour continue, pas de données personnelles',
            mesures_securite: 'Pipeline lock distribué, monitoring heartbeat',
        },
    ],
    sous_traitants: [
        { nom: 'Vercel Inc.', role: 'Hébergement', localisation: 'USA (SCCs)', dpa: 'Oui' },
        { nom: 'Neon Inc.', role: 'Base de données PostgreSQL', localisation: 'USA/EU', dpa: 'Oui' },
        { nom: 'Upstash', role: 'Cache Redis / Rate limiting', localisation: 'EU', dpa: 'Oui' },
        { nom: 'Google (Gemini AI)', role: 'Modèle IA conversationnel', localisation: 'USA (SCCs)', dpa: 'Oui' },
        { nom: 'Sentry', role: 'Monitoring erreurs (PII scrubbed)', localisation: 'USA', dpa: 'Oui' },
    ],
    droits_exercables: [
        'Droit d\'accès (Article 15)',
        'Droit de rectification (Article 16)',
        'Droit à l\'effacement (Article 17) — via cron GDPR purge',
        'Droit à la portabilité (Article 20) — via script gdpr-suite.mjs export',
        'Droit d\'opposition (Article 21)',
    ],
};

function generateRegistre() {
    const outputPath = path.join(__dirname, '..', 'REGISTRE_RGPD.json');
    fs.writeFileSync(outputPath, JSON.stringify(REGISTRE, null, 2), 'utf-8');
    console.log(`✅ Registre RGPD généré : ${outputPath}`);
    console.log(`   ${REGISTRE.traitements.length} traitements documentés`);
    console.log(`   ${REGISTRE.sous_traitants.length} sous-traitants déclarés`);
}

// ─── Export données utilisateur (Article 20) ─────────

async function exportUserData(userId) {
    console.log(`📡 Export des données pour l'utilisateur : ${userId}`);

    // Dynamic import to avoid loading DB at module level
    const { db } = await import('../src/db/index.js');
    const { CitizenUser, ConversationLog, ProAppointment } = await import('../src/db/schema.js');
    const { eq } = await import('drizzle-orm');

    // 1. Profil
    const user = await db.query.CitizenUser.findFirst({
        where: eq(CitizenUser.id, userId),
        columns: { id: true, email: true, first_name: true, last_name: true, phone: true, createdAt: true },
    });

    if (!user) {
        console.error(`❌ Utilisateur ${userId} introuvable`);
        process.exit(1);
    }

    // 2. Conversations IA (tronquées)
    const conversations = await db.query.ConversationLog.findMany({
        where: eq(ConversationLog.userId, userId),
        columns: { id: true, message: true, intent: true, createdAt: true },
    });

    // 3. Rendez-vous
    const appointments = await db.query.ProAppointment.findMany({
        where: eq(ProAppointment.citizenUserId, userId),
        columns: { id: true, startAt: true, endAt: true, status: true, createdAt: true },
    });

    const exportData = {
        export_date: new Date().toISOString(),
        user_id: userId,
        profile: user,
        conversations: conversations.map(c => ({
            ...c,
            message: c.message ? '[CONTENU_TRONQUÉ]' : null,
        })),
        appointments,
    };

    const exportDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const exportPath = path.join(exportDir, `export_${userId}_${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`✅ Export terminé : ${exportPath}`);
    console.log(`   Profil: ${user.email}`);
    console.log(`   Conversations: ${conversations.length}`);
    console.log(`   Rendez-vous: ${appointments.length}`);
}

// ─── CLI ──────────────────────────────────────────────

const [,, command, userId] = process.argv;

if (command === 'export' && userId) {
    exportUserData(userId).catch(err => {
        console.error('❌ Erreur export:', err.message);
        process.exit(1);
    });
} else {
    generateRegistre();
}
