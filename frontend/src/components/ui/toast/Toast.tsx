import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast } from '../../hooks/useToast';

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

const toastConfig = {
  success: {
    bg: 'bg-green-900/90',
    border: 'border-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-700',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-700',
    icon: Info,
    iconColor: 'text-blue-400',
  },
};

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onClose }) => {
  const config = toastConfig[toast.type];
  const IconComponent = config.icon;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        ${config.bg} ${config.border}
        animate-in slide-in-from-right-4 fade-in duration-300
      `}
      role="status"
      aria-live="polite"
      aria-label={`${toast.type}: ${toast.message}`}
    >
      <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <p className="text-sm font-medium text-slate-50 flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastComponent;
