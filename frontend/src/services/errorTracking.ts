import { apiClient } from './api';

/**
 * Client-side error tracking service
 * Logs errors to the backend for monitoring and alerting
 */
export class ErrorTrackingService {
  static logError(
    error: Error | string,
    context: string = 'unknown',
    additionalData?: Record<string, any>
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${context}]`, errorMessage, additionalData);
    }

    // Send to backend
    apiClient.post('/errors/log-client-error', {
      message: errorMessage,
      stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...additionalData,
    }).catch(err => {
      console.error('Failed to log error to backend:', err);
    });
  }

  static logSignupError(error: Error | string, details?: Record<string, any>): void {
    this.logError(error, 'signup', details);
  }

  static logLoginError(error: Error | string, details?: Record<string, any>): void {
    this.logError(error, 'login', details);
  }

  static logAPIError(error: any, endpoint: string): void {
    const message = error.response?.data?.error || error.message || 'Unknown API error';
    this.logError(message, `api:${endpoint}`, {
      status: error.response?.status,
      endpoint,
    });
  }

  // Set up global error handler
  static initGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, 'uncaughtError', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason?.message || String(event.reason),
        'unhandledRejection'
      );
    });
  }
}
