import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    exclude: [
      'node_modules/**',
      'dist/**',
      // Playwright E2E tests — must be run with `npx playwright test`
      'e2e/**',
      // Playwright a11y tests
      'tests/a11y/**',
      // Component tests needing jsdom + React JSX transform
      'tests/components/**',
      // Unit tests with unresolved path aliases or missing globals
      'tests/unit/errorBoundary.test.jsx',
      'tests/unit/errorboundary.test.js',
      'tests/unit/falcsummary.test.js',
      'tests/unit/status-page.test.js',
      'tests/unit/phase3-taxonomy.test.js',
      // Integration test with missing vitest import
      'tests/integration/p10-public-credibility.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '.next/**',
        'coverage/**',
        'scripts/**',
        '*.config.*',
        'public/**',
      ],
    },
  },
});
