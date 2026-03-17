import { test, expect } from './fixtures.js';

async function mockStatusEndpoints(page, options = {}) {
  const dataQualityStatus = options.dataQualityStatus ?? 200;
  const ingestionStatus = options.ingestionStatus ?? 200;

  await page.route('**/api/monitor/data-quality', async (route) => {
    await route.fulfill({
      status: dataQualityStatus,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
      body: JSON.stringify({
        ok: dataQualityStatus === 200,
        requestId: 'rq-dq-1',
        metrics: {
          openTotal: dataQualityStatus === 200 ? 10 : 520,
          openP0: dataQualityStatus === 200 ? 2 : 30,
          openP1: dataQualityStatus === 200 ? 8 : 490,
        },
        thresholds: { openTotalMax: 500, openP0Max: 25 },
        ...(dataQualityStatus === 200 ? {} : { error: 'unavailable' }),
      }),
    });
  });

  await page.route('**/api/monitor/ingestion-freshness', async (route) => {
    await route.fulfill({
      status: ingestionStatus,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
      body: JSON.stringify({
        ok: ingestionStatus === 200,
        requestId: 'rq-ing-1',
        state: ingestionStatus === 200 ? 'fresh' : 'stale',
        latestFetchedAt: '2026-03-10T10:00:00.000Z',
        ageHours: ingestionStatus === 200 ? 2 : 96,
        thresholdHours: 48,
        ...(ingestionStatus === 200 ? {} : { error: 'unavailable' }),
      }),
    });
  });
}

test.describe('P8-G status page', () => {
  test('renders both monitor cards and keeps page noindex', async ({ page }) => {
    await mockStatusEndpoints(page, { dataQualityStatus: 200, ingestionStatus: 200 });

    const responsesPromise = Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/monitor/data-quality')),
      page.waitForResponse((response) => response.url().includes('/api/monitor/ingestion-freshness')),
    ]);

    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    const [dqResponse, ingestResponse] = await responsesPromise;

    await expect(page.locator('[data-testid="status-data-quality-card"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="status-ingestion-card"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="status-last-checked"]')).toContainText('Last checked:', { timeout: 15000 });
    await expect(page.locator('head meta[name="robots"]').last()).toHaveAttribute(
      'content',
      /noindex,\s*nofollow/i,
    );

    expect(dqResponse.status()).toBe(200);
    expect(dqResponse.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(dqResponse.headers()['cache-control']).toContain('no-store');

    expect(ingestResponse.status()).toBe(200);
    expect(ingestResponse.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(ingestResponse.headers()['cache-control']).toContain('no-store');
  });

  test('renders KO state when monitor endpoints are degraded', async ({ page }) => {
    await mockStatusEndpoints(page, { dataQualityStatus: 503, ingestionStatus: 503 });
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Wait for KO content to render instead of waitForResponse
    await expect(page.locator('[data-testid="status-data-quality-card"]')).toContainText('KO', { timeout: 15000 });
    await expect(page.locator('[data-testid="status-ingestion-card"]')).toContainText('KO', { timeout: 15000 });
  });
});
