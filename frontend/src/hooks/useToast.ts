import { useContext } from 'react';
import { ToastContext } from '../components/ui/toast/ToastProvider';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    success: (message: string, duration: number = 5000) =>
      context.addToast({ type: 'success', message, duration }),
    error: (message: string, duration: number = 5000) =>
      context.addToast({ type: 'error', message, duration }),
    warning: (message: string, duration: number = 5000) =>
      context.addToast({ type: 'warning', message, duration }),
    info: (message: string, duration: number = 5000) =>
      context.addToast({ type: 'info', message, duration }),
    removeToast: context.removeToast,
    clearAll: context.clearAll,
  };
};
