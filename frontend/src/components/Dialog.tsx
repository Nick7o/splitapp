import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

let activeScrollLocks = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

const lockBodyScroll = () => {
  if (typeof document === 'undefined') {
    return () => undefined;
  }

  if (activeScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  activeScrollLocks += 1;

  return () => {
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);

    if (activeScrollLocks === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      previousBodyOverflow = '';
      previousHtmlOverflow = '';
    }
  };
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
};

interface DialogShellProps {
  children: React.ReactNode;
  titleId?: string;
  descriptionId?: string;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
}

export const DialogShell: React.FC<DialogShellProps> = ({
  children,
  titleId,
  descriptionId,
  onClose,
  closeOnBackdrop = true,
  overlayClassName = '',
  panelClassName = '',
}) => {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(lockBodyScroll, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    window.setTimeout(() => {
      const focusTarget = getFocusableElements(panelRef.current)[0] ?? panelRef.current;

      if (focusTarget && !panelRef.current?.contains(document.activeElement)) {
        focusTarget.focus();
      }
    }, 0);

    return () => {
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const dialog = (
    <div
      className={`fixed inset-0 z-[180] flex items-stretch justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4 ${overlayClassName}`}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`app-dialog-panel motion-dialog w-full overflow-y-auto ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
};

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  tone?: 'default' | 'danger';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  busy = false,
  tone = 'default',
}) => {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  const isDanger = tone === 'danger';

  return (
    <DialogShell
      titleId={titleId}
      descriptionId={descriptionId}
      onClose={busy ? () => undefined : onClose}
      panelClassName="max-w-md p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDanger ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary-fixed'}`}>
          <span className="material-symbols-outlined" aria-hidden="true">
            {isDanger ? 'warning' : 'help'}
          </span>
        </div>
        <div className="min-w-0">
          <h2 id={titleId} className="font-headline text-2xl font-bold leading-tight text-on-surface">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm font-medium leading-relaxed text-on-surface-variant">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="app-button-secondary" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={isDanger ? 'app-button-danger' : 'app-button-primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? (
            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          ) : null}
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
};
