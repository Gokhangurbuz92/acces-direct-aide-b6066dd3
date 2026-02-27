/**
 * pdf-generator.js
 *
 * Génère un Passeport Social ADA — document PDF professionnel
 * regroupant la situation déclarée et les résultats du diagnostic OpenFisca.
 *
 * 100% client-side, zéro appel API, zéro dépendance serveur.
 * jspdf is loaded lazily to keep it out of the initial bundle.
 */

const PRIMARY = [79, 70, 229];     // Indigo-600
const EMERALD = [5, 150, 105];     // Emerald-600
const SLATE = [100, 116, 139];     // Slate-500
const DARK = [15, 23, 42];         // Slate-900

const HOUSING_LABELS = {
    tenant: 'Locataire',
    tenant_hlm: 'Locataire HLM',
    owner: 'Propriétaire',
    free: 'Hébergé(e) gratuitement',
    homeless: 'Sans domicile fixe',
};

const EMPLOYMENT_LABELS = {
    'salarié': 'Salarié',
    'sans_emploi': 'Sans emploi / Recherche',
    'indépendant': 'Indépendant',
    'retraité': 'Retraité',
    'étudiant': 'Étudiant',
};

/**
 * Generates a professional PDF "Passeport Social" from the diagnostic results.
 *
 * @param {Object} situation - The user's declared situation
 * @param {Object} results - The OpenFisca diagnostic results { rights, period, meta }
 */
export async function generateSocialPassport(situation, results) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleDateString('fr-FR');
    const rights = results?.rights || [];
    const eligibleRights = rights.filter(r => r.eligible && r.amount > 0);
    const totalMonthly = eligibleRights.reduce((sum, r) => sum + (r.amount || 0), 0);

    // ═══════════════════════════════════════════════════
    // HEADER — Bandeau indigo
    // ═══════════════════════════════════════════════════
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 42, 'F');

    // Accent bar
    doc.setFillColor(...EMERALD);
    doc.rect(0, 42, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PASSEPORT SOCIAL ADA', 20, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Accès Direct Aide — Estimation des droits sociaux', 20, 26);
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 255);
    doc.text(`Document généré le ${timestamp} — Simulation non opposable`, 20, 34);

    // Ref number top right
    doc.setFontSize(7);
    doc.setTextColor(180, 190, 240);
    const ref = `REF-${Date.now().toString(36).toUpperCase()}`;
    doc.text(ref, 190, 34, { align: 'right' });

    let y = 56;

    // ═══════════════════════════════════════════════════
    // SECTION 1 — Ma Situation Déclarée
    // ═══════════════════════════════════════════════════
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('MA SITUATION DÉCLARÉE', 20, y);
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;

    const infoRows = [
        ['Date de naissance', situation.birthDate || 'Non précisée'],
        ['Salaire net mensuel', `${Number(situation.salary) || 0} €`],
        ['Alloc. chômage', `${Number(situation.unemployment) || 0} €`],
        ['Loyer mensuel', `${Number(situation.rent) || 0} €`],
        ['Charges locatives', `${Number(situation.charges) || 0} €`],
        ['Statut logement', HOUSING_LABELS[situation.housingStatus] || situation.housingStatus || 'Non précisé'],
        ['Composition du foyer', `${situation.householdSize || 1} personne(s)`],
        ['Code postal', situation.zipCode || 'Non précisé'],
        ['Statut professionnel', EMPLOYMENT_LABELS[situation.employmentStatus] || situation.employmentStatus || 'Non précisé'],
    ];

    doc.setFontSize(10);
    for (const [label, value] of infoRows) {
        // Alternate row background
        if ((infoRows.indexOf([label, value]) % 2) === 0) {
            // skip — we'll use manual zebra
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE);
        doc.text(label, 24, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(value, 100, y);
        y += 7;
    }

    y += 8;

    // ═══════════════════════════════════════════════════
    // SECTION 2 — Estimation des Droits (OpenFisca)
    // ═══════════════════════════════════════════════════
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text('ESTIMATION DES DROITS', 20, y);
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;

    if (eligibleRights.length > 0) {
        for (const right of eligibleRights) {
            // Card background
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, y - 5, 170, 16, 2, 2, 'F');

            // Green accent left
            doc.setFillColor(...EMERALD);
            doc.rect(20, y - 5, 3, 16, 'F');

            // Label
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...DARK);
            doc.text(right.label, 28, y + 5);

            // Amount
            doc.setFontSize(12);
            doc.setTextColor(...EMERALD);
            doc.text(`+${right.amount.toLocaleString('fr-FR')} € / mois`, 185, y + 5, { align: 'right' });

            y += 20;

            // Page break if needed
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
        }

        // Total bar
        y += 5;
        doc.setFillColor(...EMERALD);
        doc.roundedRect(100, y, 90, 14, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`TOTAL : ${totalMonthly.toLocaleString('fr-FR')} € / mois`, 145, y + 9, { align: 'center' });

        y += 25;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...SLATE);
        doc.text('Aucune éligibilité immédiate détectée pour les aides majeures.', 20, y);
        y += 15;
    }

    // Non-eligible rights (if any, just list them)
    const nonEligibleRights = rights.filter(r => !r.eligible);
    if (nonEligibleRights.length > 0 && y < 240) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...SLATE);
        doc.text('Droits probablement non applicables :', 20, y);
        y += 6;
        for (const right of nonEligibleRights) {
            doc.text(`  • ${right.label} — 0 €`, 24, y);
            y += 5;
            if (y > 260) break;
        }
        y += 5;
    }

    // ═══════════════════════════════════════════════════
    // SECTION 3 — Prochaines Étapes
    // ═══════════════════════════════════════════════════
    if (y > 230) {
        doc.addPage();
        y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text('PROCHAINES ÉTAPES', 20, y);
    y += 3;
    doc.line(20, y, 190, y);
    y += 9;

    const steps = [
        '1. Apportez ce document à votre assistant social (CAF, MSA, CCAS).',
        '2. Effectuez une demande officielle pour chaque aide éligible.',
        '3. Préparez vos justificatifs : avis d\'imposition, attestation de logement.',
        '4. Conservez ce passeport comme référence pour vos démarches.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    for (const step of steps) {
        doc.text(step, 24, y);
        y += 6;
    }

    // ═══════════════════════════════════════════════════
    // FOOTER — Disclaimer légal
    // ═══════════════════════════════════════════════════
    const footerY = 272;
    doc.setDrawColor(220, 220, 220);
    doc.line(20, footerY - 5, 190, footerY - 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    const disclaimer = 'Ce document est une simulation basée sur le moteur de calcul OpenFisca. ' +
        'Il ne constitue pas un accord de versement ni une décision administrative. ' +
        'Pour faire valoir vos droits, effectuez une demande auprès des organismes compétents (CAF, MSA, CPAM).';
    const lines = doc.splitTextToSize(disclaimer, 170);
    doc.text(lines, 20, footerY);

    // Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text('ADA • Accès Direct Aide', 190, 290, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(180, 180, 180);
    doc.text(ref, 20, 290);

    // ═══════════════════════════════════════════════════
    // PAGE 2 — Lettre de Motivation Sociale (template)
    // ═══════════════════════════════════════════════════
    doc.addPage();
    y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text('COURRIER TYPE — DEMANDE D\'AIDE SOCIALE', 20, y);
    y += 3;
    doc.setFillColor(...PRIMARY);
    doc.rect(20, y, 170, 1, 'F');
    y += 15;

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(`À [Ville], le ${timestamp}`, 130, y, { align: 'left' });
    y += 15;

    // Sender
    doc.text('[Votre Prénom NOM]', 20, y);
    y += 5;
    doc.text('[Votre adresse]', 20, y);
    y += 5;
    doc.text(`[${situation.zipCode || '00000'}] [Ville]`, 20, y);
    y += 15;

    // Recipient
    doc.setFont('helvetica', 'bold');
    doc.text('À l\'attention de :', 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('[CAF / MSA / CCAS de votre département]', 20, y);
    y += 15;

    // Object
    doc.setFont('helvetica', 'bold');
    doc.text('Objet : Demande de droits sociaux', 20, y);
    y += 10;

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const bodyParts = [
        'Madame, Monsieur,',
        '',
        'Suite à une simulation effectuée via la plateforme Accès Direct Aide,',
        'je me permets de vous adresser ce courrier afin de solliciter l\'examen',
        'de ma situation au regard des aides sociales auxquelles je pourrais prétendre.',
        '',
        `Ma situation actuelle est la suivante :`,
        `  • Statut professionnel : ${EMPLOYMENT_LABELS[situation.employmentStatus] || 'Non précisé'}`,
        `  • Revenus mensuels : ${(Number(situation.salary) || 0) + (Number(situation.unemployment) || 0)} €`,
        `  • Logement : ${HOUSING_LABELS[situation.housingStatus] || 'Non précisé'} (loyer : ${Number(situation.rent) || 0} €)`,
        `  • Composition du foyer : ${situation.householdSize || 1} personne(s)`,
        '',
    ];

    if (eligibleRights.length > 0) {
        bodyParts.push('D\'après cette simulation, je pourrais être éligible aux aides suivantes :');
        for (const right of eligibleRights) {
            bodyParts.push(`  • ${right.label} : environ ${right.amount.toLocaleString('fr-FR')} € / mois`);
        }
        bodyParts.push('');
    }

    bodyParts.push(
        'Je vous serais reconnaissant(e) de bien vouloir examiner mon dossier',
        'et de m\'informer des démarches à effectuer pour constituer une demande officielle.',
        '',
        'Je reste à votre disposition pour tout complément d\'information',
        'et vous joins en annexe le Passeport Social ADA détaillant ma simulation.',
        '',
        'Dans l\'attente de votre réponse, veuillez agréer, Madame, Monsieur,',
        'l\'expression de mes salutations distinguées.',
        '',
        '',
        '[Signature]',
    );

    for (const line of bodyParts) {
        doc.text(line, 20, y);
        y += 5.5;
        if (y > 275) {
            doc.addPage();
            y = 20;
        }
    }

    // Footer on page 2
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text('Annexe : Passeport Social ADA (page 1)', 20, 285);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text('ADA • Accès Direct Aide', 190, 285, { align: 'right' });

    // ═══════════════════════════════════════════════════
    // SAVE
    // ═══════════════════════════════════════════════════
    const safeDate = timestamp.replace(/\//g, '-');
    doc.save(`Passeport-Social-ADA-${safeDate}.pdf`);
}
