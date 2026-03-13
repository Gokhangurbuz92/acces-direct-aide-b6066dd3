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

      // 👇 Filtre Zero-Knowledge (PII Scrubbing)
      beforeSend(event) {
        // 1. Anonymisation stricte de l'identité du citoyen/pro
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          if (event.user.id) event.user.id = "[MASQUÉ-RGPD]";
        }
        
        // 2. Nettoyage absolu de la requête HTTP
        if (event.request) {
          if (event.request.url && event.request.url.includes('?')) {
            event.request.url = event.request.url.split('?')[0] + '?pii=scrubbed';
          }
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-forwarded-for'];
          }
        }

        // 3. Sécurité Back-end : Empêcher la fuite des variables d'environnement
        if (event.contexts && event.contexts.runtime) {
          delete event.contexts.runtime.env;
        }

        return event;
      },
    });

    sentryRef.current = Sentry;
  } catch (error) {
    if (import.meta.env.DEV) console.error("Failed to load Sentry", error);
  }
}
