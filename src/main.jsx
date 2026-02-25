import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'
import '@/styles/tokens.css'
import '@/index.css'
import { initSentry } from '@/observability/initSentry'

import { ThemeProvider } from '@/components/providers/ThemeProvider.tsx'

// Initialize Sentry asynchronously (non-blocking)
void initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </ErrorBoundary>
)