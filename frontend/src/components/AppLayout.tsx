import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
  onBack?: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
  contentClassName?: string;
  showBottomNav?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  actions,
  backTo,
  onBack,
  children,
  maxWidthClassName = 'max-w-screen-xl',
  contentClassName = '',
  showBottomNav = true,
}) => {
  const navigate = useNavigate();
  const canGoBack = Boolean(backTo || onBack);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backTo) {
      navigate(backTo);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface font-body antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-surface/95 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl md:left-24">
        <div className={`mx-auto flex h-16 w-full ${maxWidthClassName} items-center justify-between gap-4 px-4 sm:px-6 md:px-8`}>
          <div className="flex min-w-0 items-center gap-3">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="app-icon-button shrink-0"
                aria-label="Go back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <h1 className="truncate font-headline text-xl font-bold tracking-wide text-on-surface sm:text-2xl">
              {title}
            </h1>
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </header>

      <main className="w-full px-4 pb-32 pt-24 sm:px-6 md:pb-14 md:pl-32 md:pr-8">
        <div className={`mx-auto w-full ${maxWidthClassName} ${contentClassName}`}>
          {children}
        </div>
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
