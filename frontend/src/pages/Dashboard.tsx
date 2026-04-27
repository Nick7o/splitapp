import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import { useCreateGroupModal } from '../context/CreateGroupModalContext';
import { GROUP_AVATAR_BY_KEY } from '../data/groupAvatars';

interface Group {
  id: string;
  name: string;
  avatarKey?: string | null;
  currency?: string;
  myBalance: number;
  myBalanceByCurrency?: Record<string, number>;
  membersCount: number;
  lastActive: string;
  imageUrl: string;
}

interface RawGroup extends Omit<Group, 'myBalanceByCurrency'> {
  avatarKey?: string | null;
  AvatarKey?: string | null;
  myBalanceByCurrency?: Record<string, number>;
  MyBalanceByCurrency?: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useCreateGroupModal();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      const normalizedGroups = (response.data as RawGroup[]).map((group) => ({
        ...group,
        avatarKey: group.avatarKey ?? group.AvatarKey ?? null,
        myBalanceByCurrency: group.myBalanceByCurrency ?? group.MyBalanceByCurrency ?? {}
      }));
      setGroups(normalizedGroups);
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
        currency: 'PLN'
      });
      closeModal();
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const getGroupBalanceEntries = (group: Group): Array<{ currency: string; amount: number }> => {
    if (group.myBalanceByCurrency && Object.keys(group.myBalanceByCurrency).length > 0) {
      return Object.entries(group.myBalanceByCurrency).map(([currency, amount]) => ({ currency, amount }));
    }

    return [];
  };

  const getVisibleGroupBalances = (group: Group) =>
    getGroupBalanceEntries(group).filter((entry) => Math.abs(entry.amount) > 0.0001);

  const totalBalances = groups.reduce<Record<string, number>>((acc, group) => {
    for (const balance of getGroupBalanceEntries(group)) {
      acc[balance.currency] = (acc[balance.currency] || 0) + balance.amount;
    }

    return acc;
  }, {});
  const visibleTotalBalances = Object.entries(totalBalances).filter(([, amount]) => Math.abs(amount) > 0.0001);

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
        {/* Hero Balance Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-label text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-2">{t('dashboard.totalBalance')}</p>
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
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary-container border border-secondary/20 rounded-full">
                <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                <p className="font-label text-sm font-medium text-secondary">
                  {visibleTotalBalances.length > 1 ? t('dashboard.totalsSeparated') : t('dashboard.allSettledUp')}
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button 
                onClick={openModal}
                className="app-button-primary"
              >
                <span className="material-symbols-outlined">add</span>
                {t('dashboard.newGroup')}
              </button>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">{t('dashboard.activeGroups')}</p>
            <p className="font-headline text-3xl font-bold text-on-surface">{groups.length}</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">{t('dashboard.monthlySplit')}</p>
            <p className="font-headline text-3xl font-bold text-on-surface">—</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">{t('dashboard.savingsInsight')}</p>
            <p className="font-headline text-3xl font-bold text-secondary">—</p>
          </div>
        </section>

        {/* Active Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
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
                    className="group app-card flex cursor-pointer items-center justify-between p-4 transition-all hover:bg-surface-container-low active:scale-[0.99] sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center">
                        {avatar ? (
                          <span className="text-2xl" aria-hidden="true">{avatar.emoji}</span>
                        ) : group.imageUrl ? (
                          <img alt={group.name} className="w-full h-full object-cover opacity-90" src={group.imageUrl} />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">group</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-lg text-on-surface">{group.name}</h3>
                        <p className="font-label text-sm text-on-surface-variant mt-0.5">
                          {t('dashboard.members', { count: group.membersCount })} • {t('dashboard.lastActive', { value: group.lastActive })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getVisibleGroupBalances(group).length === 0 ? (
                        <BalancePill label={t('common.settled')} size="sm" />
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1.5">
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
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-primary text-on-primary shadow-[0_8px_32px_rgba(180,83,9,0.35)] transition-transform active:scale-95 md:right-8"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0", fontSize: '28px' }}>add</span>
      </button>

    </AppLayout>
  );
};

export default Dashboard;
