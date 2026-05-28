import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Sentry Configuration for Backend Error Tracking
 * Captures and logs errors, performance issues, and custom events
 */

export const initSentry = (app: any) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    beforeSend(event, hint) {
      // Filter out certain errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Don't report 404s by default
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
      }
      return event;
    },
  });

  // Attach Sentry middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
};

export const attachErrorHandler = (app: any) => {
  // Error handler middleware
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only handle 5xx errors
        if (error.status === 500) {
          return true;
        }
        return false;
      },
    })
  );
};

/**
 * Custom event tracking
 */
export const capturePhase9cEvent = (
  eventName: string,
  data: Record<string, any>
) => {
  Sentry.captureMessage(`Phase9c: ${eventName}`, {
    level: 'info',
    extra: {
      phase: 'Phase 9c',
      feature: data.feature,
      duration: data.duration,
      status: data.status,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Performance monitoring
 */
export const measureFeaturePerformance = (
  featureName: string,
  startTime: number,
  endTime: number
) => {
  const duration = endTime - startTime;
  const targets: Record<string, number> = {
    toastAppearance: 100,
    skeletonAnimation: 2000,
    tooltipDelay: 300,
    shortcutResponse: 50,
    favoritesWrite: 50,
    darkModeSwitch: 200,
  };

  const target = targets[featureName];
  const status = duration <= target ? 'success' : 'slow';

  capturePhase9cEvent(`${featureName}_performance`, {
    feature: featureName,
    duration,
    target,
    status,
  });

  if (status === 'slow') {
    console.warn(
      `⚠️ ${featureName} took ${duration}ms (target: ${target}ms)`
    );
  }
};

/**
 * Error rate tracking
 */
export const trackErrorRate = () => {
  let errorCount = 0;
  let totalRequests = 0;

  return {
    recordRequest: () => {
      totalRequests++;
    },
    recordError: () => {
      errorCount++;
      const rate = (errorCount / totalRequests) * 100;

      if (rate > 5) {
        Sentry.captureMessage('Critical error rate detected', {
          level: 'error',
          extra: { errorRate: rate, errorCount, totalRequests },
        });
      }
    },
    getRate: () => (errorCount / totalRequests) * 100,
  };
};

export default Sentry;
