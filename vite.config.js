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
        // Chunking "pro" : on isole les gros blocs stables
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React core
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          // Router
          if (id.includes("/react-router/") || id.includes("/react-router-dom/")) {
            return "vendor-router";
          }

          // UI kits (Radix, etc.)
          if (
            id.includes("/@radix-ui/") ||
            id.includes("/cmdk/") ||
            id.includes("/class-variance-authority/") ||
            id.includes("/tailwind-merge/") ||
            id.includes("/lucide-react/")
          ) {
            return "vendor-ui";
          }

          // Date/time libs
          if (id.includes("/date-fns/") || id.includes("/dayjs/") || id.includes("/luxon/")) {
            return "vendor-dates";
          }

          // Validation
          if (id.includes("/zod/")) {
            return "vendor-zod";
          }

          // Observabilité
          if (id.includes("/@sentry/")) {
            return "vendor-sentry";
          }

          // Maps (si utilisé)
          if (id.includes("/leaflet/") || id.includes("/mapbox/") || id.includes("/@mapbox/")) {
            return "vendor-maps";
          }

          // Firebase (si utilisé)
          if (id.includes("/firebase/")) {
            return "vendor-firebase";
          }

          // Le reste (node_modules)
          return "vendor";
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