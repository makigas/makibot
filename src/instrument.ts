import * as Sentry from "@sentry/node";

Sentry.init({
  enableLogs: true,
  enableMetrics: true,
  integrations: [Sentry.nodeRuntimeMetricsIntegration()],
});
