import * as Sentry from "@sentry/react";
import { type Router } from "@tanstack/react-router";

export const initSentry = (router: Router<any, any>) => {
  Sentry.init({
    enabled: import.meta.env.PROD,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 1.0,
    // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};
