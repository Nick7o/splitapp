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
    `flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-secondary/50 active:scale-95 md:flex-none md:w-full md:px-2 md:py-3 ${
      active
        ? 'bg-secondary-container text-secondary shadow-inner ring-1 ring-secondary/25'
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface/95 shadow-[0_-8px_32px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:shadow-[8px_0_32px_rgba(0,0,0,0.24)]">
      <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 md:h-full md:max-w-none md:flex-col md:justify-center md:gap-3 md:px-3 md:py-6">
        <button 
          onClick={() => navigate('/dashboard')} 
          className={navButtonClass(isActive('/dashboard') && !isActive('/groups'))}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') && !isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">{t('nav.home')}</span>
        </button>
        
        <button 
          onClick={() => navigate('/groups')} 
          className={navButtonClass(isActive('/groups'))}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>group</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">{t('nav.groups')}</span>
        </button>
        
        <button 
          onClick={handleAddClick}
          aria-label={shouldAddExpense ? t('nav.addExpense') : t('nav.newGroup')}
          className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-on-surface-variant transition-all duration-150 hover:bg-white/5 hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 active:scale-95 md:w-full md:flex-none md:px-2 md:py-3"
        >
          <span className="material-symbols-outlined text-3xl text-tertiary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            {shouldAddExpense ? 'receipt_long' : 'group_add'}
          </span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1 text-tertiary">
            {shouldAddExpense ? t('nav.addExpense') : t('nav.newGroup')}
          </span>
        </button>
        
        <button 
          onClick={() => navigate('/activity')}
          className={navButtonClass(isActive('/activity'))}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/activity') ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">{t('nav.activity')}</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={navButtonClass(isActive('/profile'))}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">{t('nav.profile')}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
