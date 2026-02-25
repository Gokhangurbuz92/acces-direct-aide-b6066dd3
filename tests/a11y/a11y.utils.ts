import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function expectNoA11yIssues(page: Page, options?: any) {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const filtered = accessibilityScanResults.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    if (filtered.length > 0) {
        console.error(`Found ${filtered.length} a11y violations (critical/serious):`);
        filtered.forEach((v) => {
            console.error(`- [${v.impact}] ${v.id}: ${v.description}`);
            v.nodes.forEach((node) => {
                console.error(`  - Target: ${node.target.join(', ')}`);
                console.error(`    Failure: ${node.failureSummary}`);
            });
        });
    }

    expect(filtered, "A11y violations (critical/serious)").toEqual([]);
}
