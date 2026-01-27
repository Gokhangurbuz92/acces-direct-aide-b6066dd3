import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from "@sentry/vite-plugin"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }) : null
  ],
  define: {
    'import.meta.env.VITE_GIT_COMMIT_SHA': JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_GIT_COMMIT_SHA || 'dev'),
  },
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    // Explicitly exclude e2e and playwright specs
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.vercel', 'e2e', '**/*.spec.js'],
  },
})