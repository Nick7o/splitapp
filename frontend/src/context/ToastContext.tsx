import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext, type ToastVariant, type ToastOptions } from './toast';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const variantClasses: Record<ToastVariant, { container: string; icon: string }> = {
  success: {
    container: 'border-primary-fixed/30 bg-primary/18 text-primary-fixed',
    icon: 'check_circle',
  },
  error: {
    container: 'border-error/40 bg-error/16 text-error',
    icon: 'error',
  },
  info: {
    container: 'border-secondary/35 bg-secondary/14 text-secondary',
    icon: 'info',
  },
};

const createToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    window.clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = createToastId();
    const toast: Toast = {
      id,
      message,
      variant: options?.variant ?? 'info',
    };

    setToasts((current) => [...current.slice(-3), toast]);
    timersRef.current[id] = window.setTimeout(() => dismissToast(id), options?.durationMs ?? 4200);
    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    Object.values(timersRef.current).forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[200] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-96">
        {toasts.map((toast) => {
          const classes = variantClasses[toast.variant];

          return (
            <div
              key={toast.id}
              className={`motion-slide-down pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_18px_46px_rgba(2,6,23,0.34)] backdrop-blur-xl ${classes.container}`}
              role={toast.variant === 'error' ? 'alert' : 'status'}
            >
              <span className="material-symbols-outlined mt-0.5 text-lg" aria-hidden="true">{classes.icon}</span>
              <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
              <button
                type="button"
                className="rounded-lg p-1 text-current/75 transition hover:bg-white/10 hover:text-current focus:outline-none focus:ring-2 focus:ring-current/40"
                onClick={() => dismissToast(toast.id)}
                aria-label="Close notification"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
