import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      })
      : null,
  ].filter(Boolean),

  define: {
    "import.meta.env.VITE_GIT_COMMIT_SHA": JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VITE_GIT_COMMIT_SHA ||
      "dev"
    ),
  },

  server: {
    allowedHosts: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },

  build: {
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? "hidden" : true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core (react, react-dom, react-router)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // UI libraries (radix-ui, lucide, framer-motion, etc.)
          if (id.includes('node_modules/@radix-ui') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/cmdk') ||
              id.includes('node_modules/vaul') ||
              id.includes('node_modules/sonner') ||
              id.includes('node_modules/embla-carousel')) {
            return 'ui-vendor';
          }
          
          // Utilities (date-fns, zod, clsx, etc.)
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/zod') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/@sindresorhus/slugify')) {
            return 'utils-vendor';
          }
          
          // React ecosystem (react-query, react-helmet, react-hook-form, etc.)
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/react-helmet-async') ||
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/react-day-picker') ||
              id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/react-resizable-panels')) {
            return 'react-ecosystem';
          }
          
          // Charts and visualization
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          
          // Sentry
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }
          
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },

  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist", ".vercel", "e2e", "**/*.spec.js"],
    setupFiles: ["./tests/setup-env.js"],
  },
});
