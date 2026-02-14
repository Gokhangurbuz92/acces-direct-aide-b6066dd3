import { sentryRef } from "./sentryRef";
import { frontendEnv } from "@/config/env";

export async function initSentry() {
  const dsn = frontendEnv.sentry.dsn;
  if (!dsn) return;

  // STRICT: Prod only (Vercel Preview builds are technically "production" mode in Vite)
  // We rely on VITE_DEPLOY_ENV (injected) or fallback to MODE.
  const DEPLOY_ENV = frontendEnv.runtime.deployEnv;

  if (DEPLOY_ENV !== 'production') return;

  try {
    const Sentry = await import("@sentry/react");

    Sentry.init({
      dsn,
      release: frontendEnv.runtime.gitCommitSha,
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
