import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import { useCreateGroupModal } from '../context/CreateGroupModalContext';
import { GROUP_AVATAR_BY_KEY } from '../data/groupAvatars';
import type { ApiGroup } from '../types/api';
import { formatRelativeTime } from '../utils/date';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useCreateGroupModal();
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get<ApiGroup[]>('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchGroups();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchGroups]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, closeModal]);

  const handleCreateGroup = async () => {
    try {
      await api.post('/groups', {
        name: newGroupName,
        defaultCurrency: 'PLN'
      });
      closeModal();
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const getGroupBalanceEntries = (group: ApiGroup): Array<{ currency: string; amount: number }> => {
    if (group.myBalanceByCurrency && Object.keys(group.myBalanceByCurrency).length > 0) {
      return Object.entries(group.myBalanceByCurrency).map(([currency, amount]) => ({ currency, amount }));
    }

    return [];
  };

  const getVisibleGroupBalances = (group: ApiGroup) =>
    getGroupBalanceEntries(group).filter((entry) => Math.abs(entry.amount) > 0.0001);

  const totalBalances = groups.reduce<Record<string, number>>((acc, group) => {
    for (const balance of getGroupBalanceEntries(group)) {
      acc[balance.currency] = (acc[balance.currency] || 0) + balance.amount;
    }

    return acc;
  }, {});
  const visibleTotalBalances = Object.entries(totalBalances).filter(([, amount]) => Math.abs(amount) > 0.0001);
  const currenciesInUse = Object.keys(totalBalances).length;
  const groupsWithOpenBalances = groups.filter((group) => getVisibleGroupBalances(group).length > 0).length;

  return (
    <AppLayout
      title={t('app.name')}
      actions={(
        <button
          onClick={() => alert(t('common.searchUnderConstruction'))}
          className="app-icon-button"
          aria-label={t('common.searchUnderConstruction')}
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      )}
    >
        <section className="mb-6">
          <div className="app-card-strong overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('dashboard.totalBalance')}</p>
              <div className="flex flex-wrap items-center gap-2">
                {visibleTotalBalances.length > 0 ? (
                  visibleTotalBalances.map(([currency, amount]) => (
                    <div key={currency}>
                      <BalancePill amount={amount} currency={currency} size="lg" />
                    </div>
                  ))
                ) : (
                  <BalancePill label={t('common.settled')} size="lg" />
                )}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary-fixed/20 bg-primary/12 px-3 py-2">
                <span className="material-symbols-outlined text-sm text-primary-fixed">check_circle</span>
                <p className="font-label text-sm font-medium text-primary-fixed">
                  {visibleTotalBalances.length > 1 ? t('dashboard.totalsSeparated') : t('dashboard.allSettledUp')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={openModal}
                className="app-button-primary w-full md:w-auto"
              >
                <span className="material-symbols-outlined">add</span>
                {t('dashboard.newGroup')}
              </button>
            </div>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="mb-8 grid grid-cols-3 gap-3 md:mb-10 md:gap-4">
          <div className="app-card p-5 sm:p-6">
            <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:text-xs">{t('dashboard.activeGroups')}</p>
            <p className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">{groups.length}</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:text-xs">{t('dashboard.currencies')}</p>
            <p className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">{currenciesInUse}</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:text-xs">{t('dashboard.openBalances')}</p>
            <p className="font-headline text-2xl font-bold text-primary-fixed sm:text-3xl">{groupsWithOpenBalances}</p>
          </div>
        </section>

        {/* Active Groups Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-2xl font-bold tracking-wide text-on-surface sm:text-3xl">{t('dashboard.activeGroups')}</h2>
          </div>
          
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">group_off</span>
                <p>{t('dashboard.noGroups')}</p>
              </div>
            ) : (
              groups.map(group => {
                const avatar = group.avatarKey ? GROUP_AVATAR_BY_KEY[group.avatarKey] : null;

                return (
                  <div 
                    key={group.id} 
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="group app-card flex cursor-pointer flex-col gap-4 p-4 transition-all hover:-translate-y-0.5 hover:bg-surface-container-low active:scale-[0.99] sm:p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
                        {avatar ? (
                          <span className="text-2xl" aria-hidden="true">{avatar.emoji}</span>
                        ) : group.imageUrl ? (
                          <img alt={group.name} className="w-full h-full object-cover opacity-90" src={group.imageUrl} />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">group</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-headline text-lg font-bold text-on-surface">{group.name}</h3>
                        <p className="mt-0.5 truncate font-label text-sm text-on-surface-variant">
                          {t('dashboard.members', { count: group.membersCount })} • {t('dashboard.lastActive', { value: group.lastActive ? formatRelativeTime(group.lastActive, t('dashboard.noActivity')) : t('dashboard.noActivity') })}
                        </p>
                      </div>
                    </div>
                    <div className="w-full text-left md:w-auto md:text-right">
                      {getVisibleGroupBalances(group).length === 0 ? (
                        <BalancePill label={t('common.settled')} size="sm" />
                      ) : (
                        <div className="flex flex-wrap gap-1.5 md:justify-end">
                          {getVisibleGroupBalances(group).map((balance) => (
                            <div
                              key={`${group.id}-${balance.currency}`}
                            >
                              <BalancePill amount={balance.amount} currency={balance.currency} size="sm" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      {/* Create Group Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="app-card-strong w-full max-w-md p-6">
            <h2 className="font-headline text-2xl font-bold mb-4">{t('dashboard.createGroup')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('dashboard.groupName')}</label>
                <input 
                  type="text" 
                  className="app-input"
                  placeholder={t('dashboard.groupPlaceholder')}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button 
                onClick={closeModal}
                className="app-button-secondary"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName}
                className="app-button-primary"
              >
                {t('dashboard.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={openModal}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-primary text-on-primary shadow-[0_10px_30px_rgba(15,118,110,0.28)] transition-transform active:scale-95 md:hidden"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0", fontSize: '28px' }}>add</span>
      </button>

    </AppLayout>
  );
};

export default Dashboard;
