import React from 'react';
import { useContext } from 'react';
import { ToastContext } from './ToastProvider';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);

  if (!context || context.toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-auto"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {context.toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-4 fade-in duration-300"
        >
          <Toast toast={toast} onClose={() => context.removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
