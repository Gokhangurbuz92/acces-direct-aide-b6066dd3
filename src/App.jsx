import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from "@/lib/queryClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from 'react';

// Lazy-load analytics — not critical for first paint
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics }))
);
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((mod) => ({ default: mod.SpeedInsights }))
);

function App({ url }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Pages url={url} />
          <Suspense fallback={null}>
            <Analytics mode={'production'} />
            <SpeedInsights />
          </Suspense>
          <Toaster />
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

