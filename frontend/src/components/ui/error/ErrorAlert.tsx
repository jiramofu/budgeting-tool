import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  className?: string;
  details?: string;
}

/**
 * Inline error alert component for displaying error messages
 * Can auto-dismiss or be manually closed
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  title = 'Error',
  onDismiss,
  autoClose = false,
  autoCloseDuration = 5000,
  className = '',
  details,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-lg
        bg-red-900/20 border border-red-700/50 backdrop-blur-sm
        animate-in fade-in slide-in-from-top-2 duration-300
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-red-300 mb-1">{title}</h3>
        <p className="text-sm text-red-200 break-words">{message}</p>

        {/* Expandable details */}
        {details && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-red-300 hover:text-red-200 underline"
            >
              {isExpanded ? 'Hide' : 'Show'} details
            </button>

            {isExpanded && (
              <div className="mt-2 p-3 bg-slate-900/50 rounded border border-red-700/30 overflow-auto max-h-48">
                <p className="text-xs text-red-200 font-mono whitespace-pre-wrap break-words">
                  {details}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors flex-shrink-0"
        aria-label="Dismiss error"
        title="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ErrorAlert;
