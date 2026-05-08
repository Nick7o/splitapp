import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as signalR from '@microsoft/signalr';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import BalancesTab from '../components/BalancesTab';
import { MemberAvatar, MemberNameButton } from '../components/MemberIdentity';
import MemberProfileDialog, { type MemberProfile } from '../components/MemberProfileDialog';
import PaymentsTab from '../components/Payments/PaymentsTab';
import { useToast } from '../context/toast';
import api, { API_ORIGIN } from '../api';
import { formatMoney } from '../data/currencies';
import { GROUP_AVATAR_BY_KEY } from '../data/groupAvatars';
import type { ApiGroupDetails } from '../types/api';
import { getMemberSettlements } from '../utils/memberSettlements';
import { formatDate } from '../utils/date';
import { getStoredUser } from '../utils/storage';

const EXPENSE_PAGE_SIZE = 30;

const isExpectedSignalRStartAbort = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes('stopped during negotiation')
    || message.includes('AbortError')
    || message.includes('The connection was stopped');
};

const getDayKey = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
};

const getDayLabel = (dayKey: string, t: (key: string) => string): string => {
  const date = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dayKey;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86_400_000);

  if (diffDays === 0) return t('activity.today');
  if (diffDays === 1) return t('activity.yesterday');

  return formatDate(date.toISOString(), { day: '2-digit', month: 'short', year: 'numeric' });
};

const GroupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'payments'>('expenses');
  const [group, setGroup] = useState<ApiGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(EXPENSE_PAGE_SIZE);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get<ApiGroupDetails>(`/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      console.error('Failed to fetch group details', error);
      showToast(t('common.error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, showToast, t]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  useEffect(() => {
    setVisibleExpenseCount(EXPENSE_PAGE_SIZE);
  }, [id]);

  useEffect(() => {
    let connection: signalR.HubConnection | null = null;
    let cancelled = false;

    const setupSignalR = async () => {
      if (!id) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_ORIGIN}/hubs/expense`)
        .withAutomaticReconnect()
        .build();

      connection.on('ExpenseAdded', () => {
        fetchGroupDetails();
      });

      connection.on('PaymentUpdated', () => {
        fetchGroupDetails();
        setPaymentsRefreshKey((key) => key + 1);
      });

      try {
        await connection.start();
        if (cancelled) {
          await connection.stop();
          return;
        }

        await connection.invoke('JoinGroup', id);
      } catch (err) {
        if (!cancelled && !isExpectedSignalRStartAbort(err)) {
          console.error('SignalR Connection Error: ', err);
        }
      }
    };

    setupSignalR();

    return () => {
      cancelled = true;
      if (connection) {
        if (id && connection.state === signalR.HubConnectionState.Connected) {
          connection.invoke('LeaveGroup', id).catch(console.error);
        }
        connection.stop().catch(console.error);
      }
    };
  }, [fetchGroupDetails, id]);

  const handlePaymentsChanged = useCallback(async () => {
    await fetchGroupDetails();
    setPaymentsRefreshKey((key) => key + 1);
  }, [fetchGroupDetails]);

  if (loading) {
    return (
      <AppLayout title={t('groupDetails.titleFallback')} backTo="/dashboard">
        <div className="py-20 text-center text-on-surface-variant">{t('common.loading')}</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title={t('groupDetails.titleFallback')} backTo="/dashboard">
        <div className="py-20 text-center text-error">{t('groupDetails.notFound')}</div>
      </AppLayout>
    );
  }

  const getPayerName = (payerId: string) => {
    const user = getStoredUser();
    if (payerId === user.id) return t('common.me');
    const member = group.members.find(m => m.id === payerId);
    return member ? member.name : t('common.unknown');
  };

  const handleCopyInvite = async () => {
    try {
      const inviteLink = `${window.location.origin}/groups/${group.id}/join`;
      await navigator.clipboard.writeText(inviteLink);
      showToast(t('groupDetails.inviteCopied'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to copy invite link', error);
      showToast(t('common.error'), { variant: 'error' });
    }
  };

  const balanceEntries = Object.entries(group.myBalanceByCurrency ?? {});
  const visibleBalanceEntries = balanceEntries.filter(([, amount]) => Math.abs(amount) > 0.0001);
  const groupAvatar = group.avatarKey ? GROUP_AVATAR_BY_KEY[group.avatarKey] : null;
  const currentUserId = getStoredUser().id ?? '';
  const tabItems: Array<{ id: 'expenses' | 'balances' | 'payments'; label: string; shortLabel: string; icon: string }> = [
    { id: 'expenses', label: t('groupDetails.expenses'), shortLabel: t('groupDetails.expensesShort'), icon: 'receipt_long' },
    { id: 'balances', label: t('groupDetails.balances'), shortLabel: t('groupDetails.balancesShort'), icon: 'account_balance_wallet' },
    { id: 'payments', label: t('payments.tab'), shortLabel: t('payments.tabShort'), icon: 'payments' },
  ];
  const visibleExpenses = group.expenses.slice(0, visibleExpenseCount);
  const hasMoreExpenses = visibleExpenseCount < group.expenses.length;
  const groupedVisibleExpenses = visibleExpenses.reduce<Record<string, typeof visibleExpenses>>((groups, expense) => {
    const key = getDayKey(expense.createdAt);
    groups[key] = [...(groups[key] ?? []), expense];
    return groups;
  }, {});
  const spendingByCurrency = group.expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.currency] = (totals[expense.currency] ?? 0) + expense.totalAmount;
    return totals;
  }, {});
  const openTransferCount = Object.values(group.optimizedDebtsByCurrency ?? {}).reduce((sum, debts) => sum + debts.length, 0);
  const memberPreview = group.members.slice(0, 5);

  return (
    <AppLayout
      title={(
        <span className="flex min-w-0 items-center gap-2">
          <span className="app-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-base">
            {groupAvatar ? (
              <span aria-hidden="true">{groupAvatar.emoji}</span>
            ) : (
              <span className="material-symbols-outlined text-base text-on-surface-variant">group</span>
            )}
          </span>
          <span className="truncate">{group.name}</span>
        </span>
      )}
      backTo="/dashboard"
      titleVariant="subtle"
      actions={(
        <>
          <button
            onClick={() => navigate(`/groups/${id}/activity`)}
            className="app-icon-button"
            title={t('groupDetails.activityHistory')}
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <button
            onClick={() => navigate(`/groups/${id}/settings`)}
            className="app-icon-button"
            aria-label={t('groupDetails.settings')}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </>
      )}
    >
        <section className="mb-6 mt-1">
          <div className="app-card-strong overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-5 flex items-center gap-3">
                  <div className="app-avatar flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-container text-2xl shadow-inner">
                    {groupAvatar ? (
                      <span aria-hidden="true">{groupAvatar.emoji}</span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">group</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="app-page-title truncate">{group.name}</p>
                    {group.description ? (
                      <p className="mt-1 max-w-xl text-sm font-medium leading-relaxed text-on-surface-variant">{group.description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('groupDetails.myBalance')}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {visibleBalanceEntries.length > 0 ? (
                        visibleBalanceEntries.map(([currency, amount]) => (
                          <BalancePill key={currency} amount={amount} currency={currency} size="sm" />
                        ))
                      ) : (
                        <BalancePill label={t('common.settled')} size="sm" />
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('groupDetails.totalSpending')}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(spendingByCurrency).length > 0 ? (
                        Object.entries(spendingByCurrency).map(([currency, amount]) => (
                          <span key={currency} className="rounded-lg bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface">{formatMoney(amount, currency)}</span>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-on-surface-variant">{formatMoney(0, group.defaultCurrency || 'PLN')}</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('groupDetails.openTransfers')}</p>
                    <p className={`app-value mt-3 text-3xl ${openTransferCount > 0 ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>{openTransferCount}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-label text-sm font-semibold tracking-normal">{t('groupDetails.participants', { count: group.members.length })}</span>
                  <button 
                    onClick={handleCopyInvite}
                    className="ml-0 rounded-lg border border-white/10 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:ml-3"
                  >
                    {t('groupDetails.copyInvite')}
                  </button>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto">
                <button 
                  onClick={() => navigate(`/groups/${id}/add-expense`)}
                  className="app-button-primary"
                >
                  <span className="material-symbols-outlined">add</span>
                  {t('groupDetails.addExpense')}
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="app-button-secondary"
                >
                  <span className="material-symbols-outlined text-secondary">payments</span>
                  {t('groupDetails.settleUp')}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
              {memberPreview.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container px-2.5 py-2 text-sm font-semibold text-on-surface transition hover:border-primary-fixed/40 hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                >
                  <MemberAvatar member={member} size="sm" className="h-7 w-7 rounded-lg text-xs" />
                  <span className="max-w-28 truncate">{member.id === currentUserId ? t('common.you') : member.name}</span>
                </button>
              ))}
              {group.members.length > memberPreview.length ? (
                <span className="rounded-xl border border-white/10 bg-surface-container px-3 py-2 text-sm font-bold text-on-surface-variant">
                  +{group.members.length - memberPreview.length}
                </span>
              ) : null}
            </div>
            </div>
          </div>
        </section>

        <div className="sticky top-[4.75rem] z-40 mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-surface/90 p-1.5 shadow-soft backdrop-blur-xl md:top-20">
          {tabItems.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:gap-2 ${
                  selected
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/15'
                    : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                <span className="truncate sm:hidden">{tab.shortLabel}</span>
                <span className="hidden truncate sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="motion-tab-panel">
          {activeTab === 'expenses' ? (
            <div className="space-y-10">
              <div>
                <h3 className="mb-4 font-label text-xs font-bold uppercase tracking-normal text-on-surface-variant">{t('groupDetails.allExpenses')}</h3>
                {group.expenses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant">receipt_long</span>
                    <h3 className="mt-4 font-headline text-2xl font-bold text-on-surface">{t('groupDetails.noExpensesTitle')}</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-medium text-on-surface-variant">{t('groupDetails.noExpensesBody')}</p>
                    <button type="button" className="app-button-primary mt-5" onClick={() => navigate(`/groups/${id}/add-expense`)}>
                      <span className="material-symbols-outlined">add</span>
                      {t('groupDetails.addExpense')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-7">
                    {Object.entries(groupedVisibleExpenses).map(([dayKey, expenses]) => (
                      <section key={dayKey} className="space-y-3">
                        <h4 className="font-label text-xs font-bold uppercase tracking-normal text-on-surface-variant">{getDayLabel(dayKey, t)}</h4>
                        <div className="space-y-3">
                          {expenses.map(expense => {
                      const payerName = getPayerName(expense.payerId);
                      const payer = group.members.find((member) => member.id === expense.payerId);
                      const isMe = payerName === t('common.me');
                      return (
                        <button
                          type="button"
                          key={expense.id}
                          onClick={() => navigate(`/groups/${id}/edit-expense/${expense.id}`)}
                          className="app-card grid w-full cursor-pointer gap-4 p-4 text-left transition-all hover:border-primary-fixed/30 hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 active:scale-[0.99] sm:p-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner ${isMe ? 'bg-primary/14 text-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary'}`}>
                              <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate font-headline text-lg font-bold text-on-surface">{expense.title}</h4>
                              <p className="font-label text-sm text-on-surface-variant">
                                {t('groupDetails.paidBy')}{' '}
                                <MemberNameButton
                                  member={payer}
                                  label={payerName}
                                  fallback={payerName}
                                  onOpen={setSelectedMember}
                                  className={isMe ? 'text-secondary' : 'text-tertiary'}
                                />
                              </p>
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
                            <div className="text-left md:text-right">
                              <p className="font-headline font-extrabold text-on-surface text-lg">{formatMoney(expense.totalAmount, expense.currency)}</p>
                              <p className={`font-label text-xs font-medium uppercase tracking-normal ${isMe ? 'text-primary-fixed' : 'text-error'}`}>
                                {isMe
                                  ? (expense.totalAmount - expense.myShare > 0 ? t('groupDetails.youGet', { amount: formatMoney(expense.totalAmount - expense.myShare, expense.currency) }) : t('common.settled'))
                                : (expense.myShare > 0 ? t('groupDetails.youOwe', { amount: formatMoney(expense.myShare, expense.currency) }) : t('common.settled'))}
                              </p>
                            </div>
                          </div>
                          <span className="hidden rounded-lg bg-surface-container px-2 py-2 text-on-surface-variant md:inline-flex">
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                          </span>
                        </button>
                      );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
                {hasMoreExpenses ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      className="app-button-secondary"
                      onClick={() => setVisibleExpenseCount((count) => count + EXPENSE_PAGE_SIZE)}
                    >
                      <span className="material-symbols-outlined">expand_more</span>
                      {t('common.loadMore')}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : activeTab === 'balances' ? (
            <BalancesTab
              groupId={id || ''}
              members={group.members}
              balancesByCurrency={group.balancesByCurrency || {}}
              debtsByCurrency={group.optimizedDebtsByCurrency || {}}
              currentUserId={currentUserId}
              fallbackCurrency={group.defaultCurrency || 'PLN'}
              onPaymentsChanged={handlePaymentsChanged}
            />
          ) : (
            <PaymentsTab
              groupId={id || ''}
              members={group.members}
              fallbackCurrency={group.defaultCurrency || 'PLN'}
              refreshKey={paymentsRefreshKey}
              onChanged={handlePaymentsChanged}
            />
          )}
        </div>
      {selectedMember ? (
        <MemberProfileDialog
          member={selectedMember}
          isCurrentUser={selectedMember.id === currentUserId}
          balancesByCurrency={Object.fromEntries(
            Object.entries(group.balancesByCurrency ?? {}).map(([currency, balances]) => [currency, balances[selectedMember.id] ?? 0])
          )}
          settlements={getMemberSettlements(selectedMember.id, group.optimizedDebtsByCurrency, group.members, t('common.unknown'))}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </AppLayout>
  );
};

export default GroupDetailsPage;
