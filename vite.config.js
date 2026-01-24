import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from "@sentry/vite-plugin"
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/robots.txt': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }

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
})
