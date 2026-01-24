import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        release: import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_GIT_COMMIT_SHA,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
