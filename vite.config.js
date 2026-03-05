import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { config as dotenvConfig } from "dotenv";

function apiMiddlewarePlugin() {
  let apiEntry = null;
  let apiEntryPromise = null;
  let envLoaded = false;

  async function loadApiEntry() {
    if (!envLoaded) {
      // Ensure server-side handlers have access to non-VITE_* env vars during `vite` dev/e2e runs.
      // (Some modules throw at import-time if critical secrets are missing.)
      dotenvConfig({ path: ".env.local", override: false, quiet: true });
      dotenvConfig({ path: ".env", override: false, quiet: true });
      envLoaded = true;
    }

    if (apiEntry) return apiEntry;
    if (!apiEntryPromise) {
      apiEntryPromise = import("./api/index.js").then((mod) => {
        apiEntry = mod.default;
        return apiEntry;
      });
    }
    return apiEntryPromise;
  }

  return {
    name: "accesdirectaide-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!(url.startsWith("/api") || url === "/robots.txt" || url === "/sitemap.xml")) {
          return next();
        }

        // Vercel-style helpers expected by handlers.
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          if (!res.headersSent) res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
          return res;
        };
        res.send = (data) => {
          res.end(data);
          return res;
        };

        // Add req.query and parse JSON bodies for non-upload routes.
        try {
          const parsed = new URL(url, `http://${req.headers.host || "localhost"}`);
          req.query = Object.fromEntries(parsed.searchParams);

          const isUpload = parsed.pathname === "/api/upload";
          const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method || "");
          if (!isUpload && hasBody) {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const bodyStr = Buffer.concat(chunks).toString("utf8");
            try {
              req.body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch {
              req.body = {};
            }
          }

          const handler = await loadApiEntry();
          await handler(req, res);
        } catch (error) {
          // If the handler already wrote a response, don't double-send.
          if (!res.headersSent) {
            res.status(500).json({
              error: "Dev API Error",
              message: String(error?.message || error),
            });
          } else {
            res.end();
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    apiMiddlewarePlugin(),
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Sentry (check first to avoid conflicts)
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }

          // React core (react, react-dom, scheduler) - must be before react-router
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // React Router (separate from react core to avoid circular deps)
          if (id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/router')) {
            return 'react-router-vendor';
          }

          // Pro-only ecosystem (lazy-loaded, only needed on Pro/Admin pages)
          if (id.includes('node_modules/react-day-picker') ||
            id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/react-resizable-panels')) {
            return 'pro-ecosystem';
          }

          // React ecosystem (react-query, react-helmet, react-hook-form, etc.)
          if (id.includes('node_modules/@tanstack/react-query') ||
            id.includes('node_modules/@tanstack/query-core') ||
            id.includes('node_modules/react-helmet-async') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform')) {
            return 'react-ecosystem';
          }

          // Framer Motion (lazy-loaded, only used by ChatWidget)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // UI libraries (radix-ui, lucide, etc.)
          if (id.includes('node_modules/@radix-ui') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/cmdk') ||
            id.includes('node_modules/vaul') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/embla-carousel') ||
            id.includes('node_modules/@floating-ui') ||
            id.includes('node_modules/aria-hidden') ||
            id.includes('node_modules/react-remove-scroll')) {
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

          // Charts and visualization (recharts + d3 transitive deps)
          if (id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory') ||
            id.includes('node_modules/internmap') ||
            id.includes('node_modules/delaunator')) {
            return 'charts-vendor';
          }

          // PDF libraries (very heavy, lazy load or split)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/dompurify')) {
            return 'pdf-vendor';
          }

          // Crypto / E2EE (tweetnacl, crypto-js, nacl-util)
          if (id.includes('node_modules/tweetnacl') ||
            id.includes('node_modules/crypto-js') ||
            id.includes('node_modules/nacl')) {
            return 'crypto-vendor';
          }

          // QR code rendering
          if (id.includes('node_modules/qrcode') ||
            id.includes('node_modules/react-qr-code') ||
            id.includes('node_modules/qr.js')) {
            return 'qr-vendor';
          }

          // Icons (lucide-react tree-shaken output)
          if (id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/lucide')) {
            return 'icon-vendor';
          }

          // Radix UI primitives
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }

          // Command palette / search
          if (id.includes('node_modules/cmdk') ||
            id.includes('node_modules/@tanstack')) {
            return 'search-vendor';
          }

          // Other node_modules (catch-all for remaining dependencies)
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },

  test: {
    globals: true,
    environment: "node",
    // DB-backed integration tests share a single Postgres schema.
    // Running files concurrently makes the suite flaky (race conditions / non-deterministic state).
    fileParallelism: false,
    maxWorkers: 1,
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist", ".vercel", "e2e", "**/*.spec.js", "**/*.spec.ts"],
    setupFiles: ["./tests/setup-env.js"],
  },
});
