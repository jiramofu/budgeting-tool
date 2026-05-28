/**
 * Frontend Monitoring Service
 * Integrates Google Analytics 4, Datadog RUM, and Web Vitals
 */

/**
 * Initialize Google Analytics 4
 */
export const initGA4 = () => {
  if (typeof window === 'undefined') return;

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA4_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', process.env.REACT_APP_GA4_ID, {
    page_path: window.location.pathname,
  });
};

/**
 * Track page view
 */
export const trackPageView = (pageName: string) => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'page_view', {
    page_title: pageName,
    page_path: window.location.pathname,
  });
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams: Record<string, any>
) => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', eventName, eventParams);
};

/**
 * Track Phase 9c feature metrics
 */
export const trackPhase9cMetric = (
  featureName: string,
  metricValue: number,
  metricType: 'duration' | 'count' | 'gauge'
) => {
  trackEvent('phase9c_metric', {
    feature: featureName,
    value: metricValue,
    type: metricType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Web Vitals tracking (Core Web Vitals)
 */
export const trackWebVitals = () => {
  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        trackEvent('web_vital_lcp', {
          value: (entry as any).renderTime || (entry as any).loadTime,
          rating: getVitalRating((entry as any).renderTime || (entry as any).loadTime, [2500, 4000]),
        });
      }
    }
  });
  observer.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay (FID) via Web Vitals API
  if ('PerformanceEventTiming' in window) {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingDuration;
        trackEvent('web_vital_fid', {
          value: fid,
          rating: getVitalRating(fid, [100, 300]),
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }

  // Cumulative Layout Shift (CLS)
  const clsObserver = new PerformanceObserver((list) => {
    let clsValue = 0;
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    trackEvent('web_vital_cls', {
      value: clsValue,
      rating: getVitalRating(clsValue, [0.1, 0.25]),
    });
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
};

/**
 * Get rating for Web Vitals (good, needs improvement, poor)
 */
const getVitalRating = (value: number, thresholds: number[]): string => {
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
};

/**
 * Performance monitoring for Phase 9c features
 */
export class Phase9cPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  start(featureName: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMeasurement(featureName, duration);
      return duration;
    };
  }

  private recordMeasurement(featureName: string, duration: number) {
    if (!this.measurements.has(featureName)) {
      this.measurements.set(featureName, []);
    }
    this.measurements.get(featureName)!.push(duration);

    trackPhase9cMetric(featureName, duration, 'duration');
  }

  getAverageDuration(featureName: string): number {
    const measurements = this.measurements.get(featureName) || [];
    if (measurements.length === 0) return 0;
    return measurements.reduce((a, b) => a + b) / measurements.length;
  }

  getMetrics() {
    const metrics: Record<string, any> = {};
    for (const [name, measurements] of this.measurements.entries()) {
      metrics[name] = {
        average: this.getAverageDuration(name),
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        count: measurements.length,
      };
    }
    return metrics;
  }
}

/**
 * User interaction tracking
 */
export const trackUserInteraction = (
  componentName: string,
  actionType: string
) => {
  trackEvent('user_interaction', {
    component: componentName,
    action: actionType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error tracking
 */
export const trackError = (
  errorName: string,
  errorMessage: string,
  context?: Record<string, any>
) => {
  trackEvent('application_error', {
    error_name: errorName,
    error_message: errorMessage,
    ...context,
    timestamp: new Date().toISOString(),
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${errorName}] ${errorMessage}`, context);
  }
};

export default {
  initGA4,
  trackPageView,
  trackEvent,
  trackPhase9cMetric,
  trackWebVitals,
  Phase9cPerformanceMonitor,
  trackUserInteraction,
  trackError,
};
