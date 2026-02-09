import { sentryRef } from "./sentryRef";

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  // STRICT: Prod only (Vercel Preview builds are technically "production" mode in Vite)
  // We rely on VITE_DEPLOY_ENV (injected) or fallback to MODE.
  const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV || import.meta.env.MODE;

  if (DEPLOY_ENV !== 'production') return;

  try {
    const Sentry = await import("@sentry/react");

    Sentry.init({
      dsn,
      release: import.meta.env.VITE_GIT_COMMIT_SHA,
      environment: DEPLOY_ENV,
      
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],

      // Conservative defaults for Prod
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 0.1,

      tracePropagationTargets: [
        "accesdirectaide.fr",
        "www.accesdirectaide.fr",
      ],
    });

    sentryRef.current = Sentry;
  } catch (error) {
    console.error("Failed to load Sentry", error);
  }
}