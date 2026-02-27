import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant?: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; containerClass: string }
> = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    containerClass: 'border-l-4 border-l-emerald-500',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-red-400" />,
    containerClass: 'border-l-4 border-l-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    containerClass: 'border-l-4 border-l-amber-500',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-400" />,
    containerClass: 'border-l-4 border-l-blue-500',
  },
};

export function Toast({
  variant = 'info',
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = variantConfig[variant];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 glass-surface rounded-xl p-4 min-w-[320px] max-w-md',
        'transition-all duration-200',
        config.containerClass,
        isVisible ? 'animate-slide-in opacity-100' : 'opacity-0 translate-x-2',
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">{title}</p>
        {message && <p className="text-sm text-gray-400 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 200);
        }}
        className="flex-shrink-0 p-1 rounded-md text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast container for stacking toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {children}
    </div>
  );
}
