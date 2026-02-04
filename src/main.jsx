import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'
import '@/styles/tokens.css'
import '@/index.css'
import * as Sentry from "@sentry/react";

const SENTRY_ENABLED = Boolean(import.meta.env.VITE_SENTRY_DSN);

// ✅ Distinguish Preview vs Prod (because MODE can be "production" in both)
const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV || (import.meta.env.DEV ? "development" : "production");
const IS_PROD = DEPLOY_ENV === "production";
const IS_PREVIEW = DEPLOY_ENV === "preview";

if (SENTRY_ENABLED) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        release: import.meta.env.VITE_GIT_COMMIT_SHA,
        environment: DEPLOY_ENV, // ✅ better than MODE

        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],

        // ✅ Budget-friendly: prod low, preview higher (debug), dev highest
        tracesSampleRate: IS_PROD ? 0.1 : (IS_PREVIEW ? 0.5 : 1.0),
        replaysSessionSampleRate: IS_PROD ? 0.01 : (IS_PREVIEW ? 0.1 : 0.1),
        replaysOnErrorSampleRate: IS_PROD ? 0.1 : 1.0,

        tracePropagationTargets: [
            "localhost",
            "accesdirectaide.fr",
            "www.accesdirectaide.fr",
            /^https:\/\/.*\.vercel\.app/,
        ],
    });
}

// Wrap App with Sentry Profiler if enabled
const Root = SENTRY_ENABLED
    ? Sentry.withProfiler(App)
    : App;

ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <Root />
    </ErrorBoundary>
)