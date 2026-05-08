import React, { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import { DialogShell } from '../components/Dialog';
import { useCreateGroupModal } from '../context/CreateGroupModalContext';
import { useToast } from '../context/toast';
import { GROUP_AVATAR_BY_KEY } from '../data/groupAvatars';
import type { ApiGroup } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useCreateGroupModal();
  const createGroupTitleId = useId();
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get<ApiGroup[]>('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
      showToast(getApiErrorMessage(error, t), { variant: 'error' });
    } finally {
      setLoadingGroups(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchGroups();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || creatingGroup) return;

    setCreatingGroup(true);
    try {
      await api.post('/groups', {
        name: newGroupName.trim(),
        defaultCurrency: 'PLN'
      });
      closeModal();
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group', error);
      showToast(getApiErrorMessage(error, t, 'common.error'), { variant: 'error' });
    } finally {
      setCreatingGroup(false);
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
  const settledGroups = groups.length - groupsWithOpenBalances;

  return (
    <AppLayout
      title={t('app.name')}
    >
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch">
          <div className="app-card-strong overflow-hidden p-5 sm:p-7">
            <div className="flex h-full flex-col justify-between gap-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 font-label text-xs font-semibold uppercase tracking-normal text-on-surface-variant">{t('dashboard.totalBalance')}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleTotalBalances.length > 0 ? (
                      visibleTotalBalances.map(([currency, amount]) => (
                        <BalancePill key={currency} amount={amount} currency={currency} size="lg" />
                      ))
                    ) : (
                      <BalancePill label={t('common.settled')} size="lg" />
                    )}
                  </div>
                  <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-on-surface-variant">
                    {visibleTotalBalances.length > 1 ? t('dashboard.totalsSeparated') : t('dashboard.totalAcrossGroups')}
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={openModal}
                  className="app-button-primary w-full md:w-auto"
                >
                  <span className="material-symbols-outlined">group_add</span>
                  {t('dashboard.newGroup')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('dashboard.activeGroups')}</p>
                  <p className="mt-2 font-headline text-2xl font-bold text-on-surface">{groups.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('dashboard.openBalances')}</p>
                  <p className="mt-2 font-headline text-2xl font-bold text-primary-fixed">{groupsWithOpenBalances}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('dashboard.currencies')}</p>
                  <p className="mt-2 font-headline text-2xl font-bold text-on-surface">{currenciesInUse}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs font-bold uppercase tracking-normal text-secondary">{t('dashboard.readiness')}</p>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-on-surface-variant">
                  <span>{t('dashboard.settledGroups')}</span>
                  <span>{settledGroups}/{groups.length || 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-primary-fixed"
                    style={{ width: groups.length > 0 ? `${(settledGroups / groups.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
                {groupsWithOpenBalances > 0
                  ? t('dashboard.openGroupsHint', { count: groupsWithOpenBalances })
                  : t('dashboard.allGroupsSettled')}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-normal text-on-surface-variant">{t('dashboard.overview')}</p>
              <h2 className="app-section-title mt-1">{t('dashboard.activeGroups')}</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {loadingGroups ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="app-card flex animate-pulse items-center gap-4 p-4">
                    <div className="h-14 w-14 rounded-xl bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-white/10" />
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                    </div>
                    <div className="hidden h-8 w-24 rounded bg-white/10 sm:block" />
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">group_off</span>
                <h3 className="mt-4 font-headline text-2xl font-bold text-on-surface">{t('dashboard.noGroupsTitle')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-on-surface-variant">{t('dashboard.noGroupsBody')}</p>
                <button type="button" className="app-button-primary mt-5" onClick={openModal}>
                  <span className="material-symbols-outlined">group_add</span>
                  {t('dashboard.createFirstGroup')}
                </button>
              </div>
            ) : (
              groups.map(group => {
                const avatar = group.avatarKey ? GROUP_AVATAR_BY_KEY[group.avatarKey] : null;
                const visibleBalances = getVisibleGroupBalances(group);
                const isSettled = visibleBalances.length === 0;

                return (
                  <button
                    type="button"
                    key={group.id} 
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="group app-card grid w-full cursor-pointer gap-4 p-4 text-left transition-all hover:border-primary-fixed/30 hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 active:scale-[0.99] sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="app-avatar flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
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
                          {t('dashboard.members', { count: group.membersCount })} • {group.lastActive ? formatRelativeTime(group.lastActive, t('dashboard.noActivity')) : t('dashboard.noActivity')}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      {isSettled ? (
                        <BalancePill label={t('common.settled')} size="sm" />
                      ) : (
                        <div className="flex flex-wrap gap-1.5 lg:justify-end">
                          {visibleBalances.map((balance) => (
                            <BalancePill key={`${group.id}-${balance.currency}`} amount={balance.amount} currency={balance.currency} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-normal lg:justify-center ${
                      isSettled
                        ? 'border-outline-variant/30 bg-surface-container text-on-surface-variant'
                        : 'border-primary-fixed/25 bg-primary/12 text-primary-fixed'
                    }`}>
                      <span>{isSettled ? t('dashboard.statusSettled') : t('dashboard.statusOpen')}</span>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
      {isModalOpen ? (
        <DialogShell
          titleId={createGroupTitleId}
          onClose={creatingGroup ? () => undefined : closeModal}
          panelClassName="max-w-md p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
        >
          <h2 id={createGroupTitleId} className="mb-4 font-headline text-2xl font-bold text-on-surface">{t('dashboard.createGroup')}</h2>
          
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateGroup();
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('dashboard.groupName')}</label>
                <input 
                  type="text" 
                  className="app-input"
                  placeholder={t('dashboard.groupPlaceholder')}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button 
                type="button"
                onClick={closeModal}
                className="app-button-secondary"
                disabled={creatingGroup}
              >
                {t('common.cancel')}
              </button>
              <button 
                type="submit"
                disabled={!newGroupName.trim() || creatingGroup}
                className="app-button-primary"
              >
                {creatingGroup ? t('common.saving') : t('dashboard.create')}
              </button>
            </div>
          </form>
        </DialogShell>
      ) : null}

    </AppLayout>
  );
};

export default Dashboard;
