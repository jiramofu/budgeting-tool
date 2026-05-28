import React, { Component, ReactNode, ReactElement } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * React Error Boundary component
 * Catches errors in child components and displays fallback UI
 * Allows graceful error handling without page crashes
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-600/20 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-50 text-center mb-2">
                Something went wrong
              </h1>

              <p className="text-slate-400 text-center mb-6">
                We encountered an unexpected error. Try refreshing the page or going back to the dashboard.
              </p>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <p className="text-xs text-slate-400 font-mono mt-2 whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.resetError}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
