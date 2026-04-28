import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateGroupModal } from '../context/CreateGroupModalContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const createGroupModal = useCreateGroupModal();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const groupMatch = location.pathname.match(/^\/groups\/([^/]+)(?:\/|$)/);
  const groupId = groupMatch?.[1];
  const isGroupJoinPage = /^\/groups\/[^/]+\/join\/?$/.test(location.pathname);
  const shouldAddExpense = Boolean(groupId && !isGroupJoinPage);

  const navButtonClass = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl px-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 active:scale-95 md:h-12 md:flex-none md:w-full md:px-2 ${
      active
        ? 'bg-primary/18 text-primary-fixed shadow-inner ring-1 ring-primary-fixed/25'
        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
    }`;

  const handleAddClick = () => {
    if (shouldAddExpense && groupId) {
      navigate(`/groups/${groupId}/add-expense`);
      return;
    }

    createGroupModal.open();

    const shouldNavigateToDashboard =
      location.pathname !== '/dashboard' &&
      location.pathname !== '/groups';

    if (shouldNavigateToDashboard) {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:inset-y-0 md:left-0 md:right-auto md:w-24 md:px-0 md:pb-0">
      <div className="mx-auto flex w-full max-w-sm items-center justify-around gap-1 rounded-2xl border border-white/10 bg-surface/88 p-2 shadow-[0_-10px_34px_rgba(2,6,23,0.32)] backdrop-blur-2xl md:h-full md:max-w-none md:flex-col md:justify-center md:gap-3 md:rounded-none md:border-y-0 md:border-l-0 md:border-r md:px-3 md:py-6 md:shadow-[10px_0_32px_rgba(2,6,23,0.22)]">
        <button 
          onClick={() => navigate('/dashboard')} 
          className={navButtonClass(isActive('/dashboard') && !isActive('/groups'))}
          aria-label={t('nav.home')}
          title={t('nav.home')}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') && !isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        </button>
        
        <button 
          onClick={() => navigate('/groups')} 
          className={navButtonClass(isActive('/groups'))}
          aria-label={t('nav.groups')}
          title={t('nav.groups')}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>group</span>
        </button>
        
        <button 
          onClick={handleAddClick}
          aria-label={shouldAddExpense ? t('nav.addExpense') : t('nav.newGroup')}
          title={shouldAddExpense ? t('nav.addExpense') : t('nav.newGroup')}
          className="flex h-11 flex-1 items-center justify-center rounded-xl px-2 text-on-surface-variant transition-all duration-150 hover:bg-white/5 hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 active:scale-95 md:h-12 md:w-full md:flex-none md:px-2"
        >
          <span className="material-symbols-outlined text-3xl text-secondary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            {shouldAddExpense ? 'receipt_long' : 'group_add'}
          </span>
        </button>
        
        <button 
          onClick={() => navigate('/activity')}
          className={navButtonClass(isActive('/activity'))}
          aria-label={t('nav.activity')}
          title={t('nav.activity')}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/activity') ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={navButtonClass(isActive('/profile'))}
          aria-label={t('nav.profile')}
          title={t('nav.profile')}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "'FILL' 0" }}>person</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
