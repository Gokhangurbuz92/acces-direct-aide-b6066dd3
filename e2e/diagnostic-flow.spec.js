import { test, expect } from '@playwright/test';

/**
 * E2E tests for the diagnostic flow (OpenFisca integration).
 *
 * These tests navigate through the 5-step wizard on /orientation,
 * mock the /api/diagnostic endpoint response, and verify:
 * - Wizard step progression
 * - Result cards rendering
 * - FALC toggle functionality
 * - CTA links to aides/demarches pages
 *
 * The API is mocked to ensure tests run in CI without OpenFisca dependency.
 */

// --- Mock responses for /api/diagnostic ---

const MOCK_RESPONSE_CELIBATAIRE = {
    period: '2026-02',
    rights: [
        {
            code: 'rsa',
            label: 'RSA (Revenu de solidarité active)',
            eligible: true,
            amount: 635.71,
            explain: "D'après votre situation, vous pourriez bénéficier du RSA.",
            explain_falc: '📋 Résumé\nLe RSA, c\'est de l\'argent versé chaque mois.',
            next_steps: [
                { type: 'aide', slug: 'rsa' },
                { type: 'demarche', slug: 'demande-rsa' },
            ],
            category: 'minimum_social',
        },
        {
            code: 'prime_activite',
            label: "Prime d'activité",
            eligible: false,
            amount: 0,
            explain: 'Vos revenus ne correspondent pas.',
            explain_falc: '📋 Résumé\nVous ne pouvez pas recevoir la Prime d\'activité.',
            next_steps: [],
            category: 'complement_revenus',
        },
        {
            code: 'apl',
            label: 'APL (Aide personnalisée au logement)',
            eligible: true,
            amount: 295.05,
            explain: "Vous pourriez bénéficier de l'APL.",
            explain_falc: '📋 Résumé\nL\'APL, c\'est une aide pour payer moins cher votre loyer.',
            next_steps: [
                { type: 'aide', slug: 'apl' },
                { type: 'demarche', slug: 'demande-aide-logement' },
            ],
            category: 'logement',
        },
        {
            code: 'aide_logement',
            label: 'Aide au logement (tous types)',
            eligible: true,
            amount: 295.05,
            explain: "Vous pourriez bénéficier d'une aide au logement.",
            explain_falc: '📋 Résumé\nVous pouvez recevoir une aide pour votre logement.',
            next_steps: [{ type: 'aide', slug: 'aide-logement' }],
            category: 'logement',
        },
    ],
    meta: {
        source: 'openfisca',
        engineVersion: 'france-latest',
        requestId: 'diag_test_001',
        duration_ms: 350,
    },
};

const MOCK_RESPONSE_SALARIE = {
    period: '2026-02',
    rights: [
        {
            code: 'rsa',
            label: 'RSA (Revenu de solidarité active)',
            eligible: false,
            amount: 0,
            explain: 'Vos revenus dépassent le plafond du RSA.',
            explain_falc: '📋 Résumé\nVous ne pouvez pas recevoir le RSA.',
            next_steps: [],
            category: 'minimum_social',
        },
        {
            code: 'prime_activite',
            label: "Prime d'activité",
            eligible: true,
            amount: 180.42,
            explain: "Vous pourriez bénéficier de la Prime d'activité.",
            explain_falc: "📋 Résumé\nLa Prime d'activité, c'est de l'argent en plus.",
            next_steps: [
                { type: 'aide', slug: 'prime-activite' },
                { type: 'demarche', slug: 'demande-prime-activite' },
            ],
            category: 'complement_revenus',
        },
        {
            code: 'apl',
            label: 'APL (Aide personnalisée au logement)',
            eligible: false,
            amount: 0,
            explain: "L'APL ne semble pas applicable.",
            explain_falc: "📋 Résumé\nVous ne pouvez pas recevoir l'APL.",
            next_steps: [],
            category: 'logement',
        },
        {
            code: 'aide_logement',
            label: 'Aide au logement (tous types)',
            eligible: false,
            amount: 0,
            explain: 'Aucune aide au logement applicable.',
            explain_falc: '📋 Résumé\nPas d\'aide au logement pour vous.',
            next_steps: [],
            category: 'logement',
        },
    ],
    meta: {
        source: 'openfisca',
        engineVersion: 'france-latest',
        requestId: 'diag_test_002',
        duration_ms: 280,
    },
};

const MOCK_RESPONSE_COUPLE = {
    period: '2026-02',
    rights: [
        {
            code: 'rsa',
            label: 'RSA (Revenu de solidarité active)',
            eligible: true,
            amount: 450.00,
            explain: "D'après votre situation, vous pourriez bénéficier du RSA.",
            explain_falc: '📋 Résumé\nVous pouvez peut-être recevoir le RSA.',
            next_steps: [
                { type: 'aide', slug: 'rsa' },
                { type: 'demarche', slug: 'demande-rsa' },
            ],
            category: 'minimum_social',
        },
        {
            code: 'prime_activite',
            label: "Prime d'activité",
            eligible: false,
            amount: 0,
            explain: 'Non applicable.',
            explain_falc: '📋 Résumé\nNon applicable.',
            next_steps: [],
            category: 'complement_revenus',
        },
        {
            code: 'apl',
            label: 'APL (Aide personnalisée au logement)',
            eligible: true,
            amount: 340.00,
            explain: "Vous pourriez bénéficier de l'APL.",
            explain_falc: "📋 Résumé\nVous pouvez peut-être recevoir l'APL.",
            next_steps: [
                { type: 'aide', slug: 'apl' },
                { type: 'demarche', slug: 'demande-aide-logement' },
            ],
            category: 'logement',
        },
        {
            code: 'aide_logement',
            label: 'Aide au logement (tous types)',
            eligible: true,
            amount: 340.00,
            explain: "Vous pourriez bénéficier d'une aide au logement.",
            explain_falc: '📋 Résumé\nVous pouvez recevoir une aide logement.',
            next_steps: [{ type: 'aide', slug: 'aide-logement' }],
            category: 'logement',
        },
    ],
    meta: {
        source: 'openfisca',
        engineVersion: 'france-latest',
        requestId: 'diag_test_003',
        duration_ms: 400,
    },
};

// --- Helper: fill wizard steps 1–4 (need, territory, profile, urgency) ---

async function fillWizardSteps1To4(page) {
    // Step 1: Need — click "logement"
    const needBtn = page.locator('button', { hasText: /logement/i }).first();
    await needBtn.waitFor({ state: 'visible', timeout: 10000 });
    await needBtn.click();

    // Step 2: Territory — type postal code and continue
    const territoryInput = page.locator('input[type="text"], input[type="search"]').first();
    await territoryInput.waitFor({ state: 'visible', timeout: 5000 });
    await territoryInput.fill('67000');
    // Click first suggestion if present, or continue button
    const continueBtn2 = page.locator('button', { hasText: /continuer|suivant/i }).first();
    await continueBtn2.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    if (await continueBtn2.isVisible()) {
        await continueBtn2.click();
    }

    // Step 3: Profile — select a profile option and continue
    const profileBtn = page.locator('button[role="radio"]').first();
    await profileBtn.waitFor({ state: 'visible', timeout: 5000 });
    await profileBtn.click();
    const continueBtn3 = page.locator('button', { hasText: /continuer|suivant/i }).first();
    await continueBtn3.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    if (await continueBtn3.isVisible()) {
        await continueBtn3.click();
    }

    // Step 4: Urgency — select option and continue
    const urgencyBtn = page.locator('button[role="radio"]').first();
    await urgencyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await urgencyBtn.click();
    const continueBtn4 = page.locator('button', { hasText: /continuer|suivant/i }).first();
    await continueBtn4.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    if (await continueBtn4.isVisible()) {
        await continueBtn4.click();
    }
}

// --- Helper: fill Step 5 (diagnostic data) ---

async function fillDiagnosticStep(page, { birthDate, salary, unemployment, rent, charges, housingStatus }) {
    // Birth date
    const dateInput = page.locator('#diag-birthdate');
    await dateInput.waitFor({ state: 'visible', timeout: 5000 });
    await dateInput.fill(birthDate);

    // Salary
    if (salary !== undefined) {
        await page.locator('#diag-salary').fill(String(salary));
    }

    // Unemployment
    if (unemployment !== undefined) {
        await page.locator('#diag-unemployment').fill(String(unemployment));
    }

    // Rent
    if (rent !== undefined) {
        await page.locator('#diag-rent').fill(String(rent));
    }

    // Charges
    if (charges !== undefined) {
        await page.locator('#diag-charges').fill(String(charges));
    }

    // Housing status
    const housingBtn = page.locator(`button[role="radio"]`, { hasText: new RegExp(housingStatus, 'i') });
    await housingBtn.click();

    // Submit
    const submitBtn = page.locator('button', { hasText: /calculer mes droits/i });
    await submitBtn.click();
}

// ========================
// TEST SCENARIOS
// ========================

test.describe('Diagnostic Flow — OpenFisca Integration', () => {

    test('Scénario A — Célibataire sans revenus', async ({ page }) => {
        // Mock /api/diagnostic
        await page.route('**/api/diagnostic', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_RESPONSE_CELIBATAIRE),
                });
            } else {
                await route.continue();
            }
        });

        // Also mock /api/recommendations to prevent real API calls
        await page.route('**/api/recommendations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ items: [] }),
            });
        });

        await page.goto('/orientation');

        // Fill wizard steps 1–4
        await fillWizardSteps1To4(page);

        // Step 5: Diagnostic data
        await fillDiagnosticStep(page, {
            birthDate: '1992-06-15',
            salary: 0,
            unemployment: 0,
            rent: 520,
            charges: 50,
            housingStatus: 'Locataire',
        });

        // Verify results — eligible rights should appear
        const rsaCard = page.locator('text=RSA');
        await rsaCard.waitFor({ state: 'visible', timeout: 10000 });

        // Verify amount displayed
        await expect(page.locator('text=635,71')).toBeVisible();

        // Verify eligible count header
        await expect(page.locator('text=/droits auxquels/i')).toBeVisible();

        // Verify FALC toggle exists
        const falcBtn = page.locator('button', { hasText: /FALC/i }).first();
        await expect(falcBtn).toBeVisible();

        // Click FALC toggle and verify text changes
        await falcBtn.click();
        await expect(page.locator('text=Résumé').first()).toBeVisible();

        // Toggle back to standard
        await page.locator('button', { hasText: /texte standard/i }).first().click();

        // Verify CTA links
        const aideCta = page.locator('a[href="/aides/rsa"]');
        await expect(aideCta).toBeVisible();

        // Verify meta info
        await expect(page.locator('text=diag_test_001')).toBeVisible();
    });

    test('Scénario B — Salarié', async ({ page }) => {
        await page.route('**/api/diagnostic', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_RESPONSE_SALARIE),
                });
            } else {
                await route.continue();
            }
        });

        await page.route('**/api/recommendations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ items: [] }),
            });
        });

        await page.goto('/orientation');
        await fillWizardSteps1To4(page);

        await fillDiagnosticStep(page, {
            birthDate: '1990-03-20',
            salary: 1200,
            unemployment: 0,
            rent: 600,
            charges: 80,
            housingStatus: 'Locataire',
        });

        // Prime d'activité should be eligible
        const primeCard = page.locator("text=Prime d'activité");
        await primeCard.waitFor({ state: 'visible', timeout: 10000 });

        // Verify amount
        await expect(page.locator('text=180,42')).toBeVisible();

        // RSA should be in non-eligible section
        await expect(page.locator('text=/non applicables/i')).toBeVisible();

        // CTA for prime activité
        const demarcheCta = page.locator('a[href="/demarches/demande-prime-activite"]');
        await expect(demarcheCta).toBeVisible();
    });

    test('Scénario C — Couple + enfants (V1 single adult, no crash)', async ({ page }) => {
        await page.route('**/api/diagnostic', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_RESPONSE_COUPLE),
                });
            } else {
                await route.continue();
            }
        });

        await page.route('**/api/recommendations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ items: [] }),
            });
        });

        await page.goto('/orientation');
        await fillWizardSteps1To4(page);

        await fillDiagnosticStep(page, {
            birthDate: '1985-11-10',
            salary: 0,
            unemployment: 400,
            rent: 700,
            charges: 100,
            housingStatus: 'Locataire HLM',
        });

        // Should not crash — results should appear
        const resultsHeader = page.locator('text=/vos droits estimés/i');
        await resultsHeader.waitFor({ state: 'visible', timeout: 10000 });

        // Should show eligible rights
        await expect(page.locator('text=RSA')).toBeVisible();
        await expect(page.locator('text=450')).toBeVisible();

        // FALC toggle should work
        const falcBtn = page.locator('button', { hasText: /FALC/i }).first();
        await falcBtn.click();
        await expect(page.locator('text=Résumé').first()).toBeVisible();

        // Recommencer button should work
        const restartBtn = page.locator('button', { hasText: /recommencer/i });
        await expect(restartBtn).toBeVisible();
    });

    test('Gestion erreur — OpenFisca indisponible', async ({ page }) => {
        await page.route('**/api/diagnostic', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'OPENFISCA_UNAVAILABLE',
                        message: 'Le service de calcul est temporairement indisponible.',
                    }),
                });
            } else {
                await route.continue();
            }
        });

        await page.route('**/api/recommendations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ items: [] }),
            });
        });

        await page.goto('/orientation');
        await fillWizardSteps1To4(page);

        await fillDiagnosticStep(page, {
            birthDate: '1992-06-15',
            salary: 0,
            unemployment: 0,
            rent: 520,
            charges: 50,
            housingStatus: 'Locataire',
        });

        // Error message should appear
        const errorMsg = page.locator('text=/indisponible|erreur/i');
        await errorMsg.waitFor({ state: 'visible', timeout: 10000 });

        // Retry button should be visible
        const retryBtn = page.locator('button', { hasText: /réessayer/i });
        await expect(retryBtn).toBeVisible();

        // Recommencer button should be visible
        const restartBtn = page.locator('button', { hasText: /recommencer/i });
        await expect(restartBtn).toBeVisible();
    });
});
