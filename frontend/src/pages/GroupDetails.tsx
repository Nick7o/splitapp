import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as signalR from '@microsoft/signalr';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import BalancesTab from '../components/BalancesTab';
import PaymentsTab from '../components/Payments/PaymentsTab';
import api, { API_ORIGIN } from '../api';
import { formatMoney } from '../data/currencies';
import { GROUP_AVATAR_BY_KEY } from '../data/groupAvatars';
import type { ApiGroupDetails } from '../types/api';
import { getStoredUser } from '../utils/storage';

const EXPENSE_PAGE_SIZE = 30;

const isExpectedSignalRStartAbort = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes('stopped during negotiation')
    || message.includes('AbortError')
    || message.includes('The connection was stopped');
};

const GroupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'payments'>('expenses');
  const [group, setGroup] = useState<ApiGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(EXPENSE_PAGE_SIZE);

  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get<ApiGroupDetails>(`/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      console.error('Failed to fetch group details', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

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

  return (
    <AppLayout
      title={(
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-base">
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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-container text-2xl shadow-inner">
                    {groupAvatar ? (
                      <span aria-hidden="true">{groupAvatar.emoji}</span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">group</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-headline text-2xl font-bold text-on-surface">{group.name}</p>
                    {group.description ? (
                      <p className="mt-1 max-w-xl text-sm font-medium leading-relaxed text-on-surface-variant">{group.description}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mb-2 font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{t('groupDetails.myBalance')}</p>
                {visibleBalanceEntries.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleBalanceEntries.map(([currency, amount]) => (
                      <div key={currency}>
                        <BalancePill amount={amount} currency={currency} size="lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <BalancePill label={t('common.settled')} size="lg" />
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-label text-sm font-semibold tracking-wide">{t('groupDetails.participants', { count: group.members.length })}</span>
                  <button 
                    onClick={() => {
                      const inviteLink = `${window.location.origin}/groups/${group.id}/join`;
                      navigator.clipboard.writeText(inviteLink);
                      alert(t('groupDetails.inviteCopied'));
                    }}
                    className="ml-0 rounded-lg border border-white/10 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:ml-3"
                  >
                    {t('groupDetails.copyInvite')}
                  </button>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
        {activeTab === 'expenses' ? (
          <div className="space-y-10">
            <div>
              <h3 className="mb-4 font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('groupDetails.allExpenses')}</h3>
              <div className="space-y-4">
                {group.expenses.length === 0 ? (
                  <p className="text-on-surface-variant">{t('groupDetails.noExpenses')}</p>
                ) : (
                  visibleExpenses.map(expense => {
                    const payerName = getPayerName(expense.payerId);
                    const isMe = payerName === t('common.me');
                    return (
                      <div 
                        key={expense.id} 
                        onClick={() => navigate(`/groups/${id}/edit-expense/${expense.id}`)}
                        className="app-card flex cursor-pointer flex-col gap-4 p-4 transition-all hover:-translate-y-0.5 hover:bg-surface-container-low active:scale-[0.99] sm:p-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner ${isMe ? 'bg-primary/14 text-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary'}`}>
                            <span className="material-symbols-outlined">receipt_long</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate font-headline text-lg font-bold text-on-surface">{expense.title}</h4>
                            <p className="font-label text-sm text-on-surface-variant">{t('groupDetails.paidBy')} <span className={`font-semibold ${isMe ? 'text-secondary' : 'text-tertiary'}`}>{payerName}</span></p>
                          </div>
                        </div>
                        <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
                          <div className="text-left md:text-right">
                            <p className="font-headline font-extrabold text-on-surface text-lg">{formatMoney(expense.totalAmount, expense.currency)}</p>
                            <p className={`font-label text-xs font-medium uppercase tracking-wider ${isMe ? 'text-primary-fixed' : 'text-error'}`}>
                              {isMe 
                                ? (expense.totalAmount - expense.myShare > 0 ? t('groupDetails.youGet', { amount: formatMoney(expense.totalAmount - expense.myShare, expense.currency) }) : t('common.settled'))
                                : (expense.myShare > 0 ? t('groupDetails.youOwe', { amount: formatMoney(expense.myShare, expense.currency) }) : t('common.settled'))}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant opacity-50">chevron_right</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
      {/* Floating Action Button for Adding Expense (Mobile) */}
      <button 
        onClick={() => navigate(`/groups/${id}/add-expense`)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-primary text-on-primary shadow-[0_10px_30px_rgba(15,118,110,0.28)] transition-all hover:-translate-y-1 active:scale-95 md:hidden"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </AppLayout>
  );
};

export default GroupDetailsPage;
