import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  title: React.ReactNode;
  titleVariant?: 'default' | 'subtle' | 'hidden';
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
  titleVariant = 'default',
  actions,
  backTo,
  onBack,
  children,
  maxWidthClassName = 'max-w-screen-xl',
  contentClassName = '',
  showBottomNav = true,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canGoBack = Boolean(backTo || onBack);
  const hasVisibleTitle = titleVariant !== 'hidden';
  const hasHeader = hasVisibleTitle || canGoBack || Boolean(actions);

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
      {hasHeader ? (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-surface/78 shadow-[0_10px_30px_rgba(2,6,23,0.2)] backdrop-blur-xl md:left-24">
          <div className={`mx-auto flex h-[3.75rem] w-full ${maxWidthClassName} items-center justify-between gap-3 px-4 sm:px-6 md:h-16 md:px-8`}>
            <div className="flex min-w-0 items-center gap-3">
              {canGoBack && (
                <button
                  onClick={handleBack}
                  className="app-icon-button shrink-0"
                  aria-label={t('layout.goBack')}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              )}
              {hasVisibleTitle ? (
                <h1 className={titleVariant === 'subtle'
                  ? 'truncate font-label text-sm font-bold uppercase tracking-[0.14em] text-on-surface-variant'
                  : 'truncate font-headline text-xl font-bold tracking-wide text-on-surface sm:text-2xl'}
                >
                  {title}
                </h1>
              ) : null}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        </header>
      ) : null}

      <main className={`w-full px-4 pb-32 sm:px-6 md:pb-14 md:pl-32 md:pr-8 ${hasHeader ? 'pt-20 md:pt-24' : 'pt-6 md:pt-8'}`}>
        <div className={`mx-auto w-full ${maxWidthClassName} ${contentClassName}`}>
          {!hasVisibleTitle ? <h1 className="sr-only">{title}</h1> : null}
          {children}
        </div>
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
