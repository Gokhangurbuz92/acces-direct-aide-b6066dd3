import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    // Integration tests share a single DB — parallel file execution causes
    // race conditions (e.g. afterEach deleting all rows from Aide table).
    fileParallelism: false,
    testTimeout: 30000,
    exclude: [
      'node_modules/**',
      'dist/**',
      // Playwright E2E tests — must be run with `npx playwright test`
      'e2e/**',
      // Playwright a11y tests
      'tests/a11y/**',
      // Component tests using @testing-library (need jsdom environment per-file)
      'tests/components/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
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
