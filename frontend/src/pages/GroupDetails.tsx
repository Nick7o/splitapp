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

interface User {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
  bio?: string | null;
}

interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  payerId: string;
  createdAt: string;
  myShare: number;
}

interface RawExpense extends Omit<Expense, 'currency'> {
  currency?: string;
  Currency?: string;
}

interface RawGroupDetails extends Omit<GroupDetails, 'expenses' | 'myBalanceByCurrency' | 'balancesByCurrency' | 'optimizedDebtsByCurrency'> {
  avatarKey?: string | null;
  AvatarKey?: string | null;
  description?: string | null;
  Description?: string | null;
  expenses: RawExpense[];
  Expenses?: RawExpense[];
  myBalanceByCurrency?: Record<string, number>;
  MyBalanceByCurrency?: Record<string, number>;
  balancesByCurrency?: Record<string, Record<string, number>>;
  BalancesByCurrency?: Record<string, Record<string, number>>;
  optimizedDebtsByCurrency?: Record<string, DebtTransfer[]>;
  OptimizedDebtsByCurrency?: Record<string, DebtTransfer[]>;
}

interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface GroupDetails {
  id: string;
  name: string;
  avatarKey?: string | null;
  description?: string | null;
  currency?: string;
  ownerId: string;
  myBalance: number;
  myBalanceByCurrency?: Record<string, number>;
  balancesByCurrency?: Record<string, Record<string, number>>;
  members: User[];
  expenses: Expense[];
  optimizedDebts: DebtTransfer[];
  optimizedDebtsByCurrency?: Record<string, DebtTransfer[]>;
}

const normalizeGroupDetails = (raw: RawGroupDetails): GroupDetails => {
  const rawExpenses = raw.expenses ?? raw.Expenses ?? [];

  return {
    ...raw,
    avatarKey: raw.avatarKey ?? raw.AvatarKey ?? null,
    description: raw.description ?? raw.Description ?? null,
    myBalanceByCurrency: raw.myBalanceByCurrency ?? raw.MyBalanceByCurrency ?? {},
    balancesByCurrency: raw.balancesByCurrency ?? raw.BalancesByCurrency ?? {},
    optimizedDebtsByCurrency: raw.optimizedDebtsByCurrency ?? raw.OptimizedDebtsByCurrency ?? {},
    expenses: rawExpenses.map((expense) => ({
      ...expense,
      currency: expense.currency ?? expense.Currency ?? 'PLN'
    }))
  };
};

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
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [settlementsRefreshKey, setSettlementsRefreshKey] = useState(0);

  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(normalizeGroupDetails(response.data));
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

      connection.on('SettlementUpdated', () => {
        fetchGroupDetails();
        setSettlementsRefreshKey((key) => key + 1);
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

  const handleSettlementChanged = useCallback(async () => {
    await fetchGroupDetails();
    setSettlementsRefreshKey((key) => key + 1);
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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (payerId === user.id) return t('common.me');
    const member = group.members.find(m => m.id === payerId);
    return member ? member.name : t('common.unknown');
  };

  const balanceEntries = Object.entries(group.myBalanceByCurrency ?? {});
  const visibleBalanceEntries = balanceEntries.filter(([, amount]) => Math.abs(amount) > 0.0001);
  const groupAvatar = group.avatarKey ? GROUP_AVATAR_BY_KEY[group.avatarKey] : null;
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').id ?? '';
    } catch {
      return '';
    }
  })();

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
        {/* Hero Section / Group Summary */}
        <section className="mb-10 mt-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
            {/* Abstract Texture Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
              <div>
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-inner">
                    {groupAvatar ? (
                      <span aria-hidden="true">{groupAvatar.emoji}</span>
                    ) : (
                      <span className="material-symbols-outlined text-on-primary-container">group</span>
                    )}
                  </div>
                  <div>
                    <p className="font-headline text-2xl font-bold text-on-primary">{group.name}</p>
                    {group.description ? (
                      <p className="mt-1 max-w-xl text-sm font-medium text-on-primary-container">{group.description}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mb-2 font-label text-sm font-medium uppercase tracking-widest text-on-primary-container">{t('groupDetails.myBalance')}</p>
                {visibleBalanceEntries.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleBalanceEntries.map(([currency, amount]) => (
                      <div key={currency}>
                        <BalancePill amount={amount} currency={currency} size="lg" onDark />
                      </div>
                    ))}
                  </div>
                ) : (
                  <BalancePill label={t('common.settled')} size="lg" onDark />
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-on-primary-container">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-label text-sm font-semibold tracking-wide">{t('groupDetails.participants', { count: group.members.length })}</span>
                  <button 
                    onClick={() => {
                      const inviteLink = `${window.location.origin}/groups/${group.id}/join`;
                      navigator.clipboard.writeText(inviteLink);
                      alert(t('groupDetails.inviteCopied'));
                    }}
                    className="ml-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 sm:ml-4"
                  >
                    {t('groupDetails.copyInvite')}
                  </button>
                </div>
              </div>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:mt-0">
                <button 
                  onClick={() => navigate(`/groups/${id}/add-expense`)}
                  className="app-button-primary bg-secondary text-on-secondary hover:bg-tertiary"
                >
                  <span className="material-symbols-outlined">add</span>
                  {t('groupDetails.addExpense')}
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="app-button-secondary"
                >
                  <span className="material-symbols-outlined text-tertiary">payments</span>
                  {t('groupDetails.settleUp')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Tabs */}
        <div className="flex gap-8 mb-8 border-b border-outline-variant/30">
          <button
            onClick={() => setActiveTab('expenses')}
            className="relative py-2 group"
          >
            <span className={`font-headline text-lg font-bold sm:text-xl ${activeTab === 'expenses' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>{t('groupDetails.expenses')}</span>
            {activeTab === 'expenses' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className="relative py-2 group"
          >
            <span className={`font-headline text-lg font-bold sm:text-xl ${activeTab === 'balances' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>{t('groupDetails.balances')}</span>
            {activeTab === 'balances' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className="relative py-2 group"
          >
            <span className={`font-headline text-lg font-bold sm:text-xl ${activeTab === 'payments' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>{t('payments.tab')}</span>
            {activeTab === 'payments' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' ? (
          <div className="space-y-10">
            <div>
              <h3 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6">{t('groupDetails.allExpenses')}</h3>
              <div className="space-y-4">
                {group.expenses.length === 0 ? (
                  <p className="text-on-surface-variant">{t('groupDetails.noExpenses')}</p>
                ) : (
                  group.expenses.map(expense => {
                    const payerName = getPayerName(expense.payerId);
                    const isMe = payerName === t('common.me');
                    return (
                      <div 
                        key={expense.id} 
                        onClick={() => navigate(`/groups/${id}/edit-expense/${expense.id}`)}
                        className="app-card flex cursor-pointer items-center justify-between p-4 transition-all hover:bg-surface-container-low active:scale-[0.99] sm:p-5"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ${isMe ? 'bg-secondary-container text-secondary' : 'bg-tertiary-fixed text-on-secondary-container'}`}>
                            <span className="material-symbols-outlined">receipt_long</span>
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-on-surface text-lg">{expense.title}</h4>
                            <p className="font-label text-sm text-on-surface-variant">{t('groupDetails.paidBy')} <span className={`font-semibold ${isMe ? 'text-secondary' : 'text-tertiary'}`}>{payerName}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-headline font-extrabold text-on-surface text-lg">{formatMoney(expense.totalAmount, expense.currency)}</p>
                            <p className={`font-label text-xs font-medium uppercase tracking-wider ${isMe ? 'text-secondary' : 'text-error'}`}>
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
            </div>
          </div>
        ) : activeTab === 'balances' ? (
          <BalancesTab
            groupId={id || ''}
            members={group.members}
            balancesByCurrency={group.balancesByCurrency || {}}
            debtsByCurrency={group.optimizedDebtsByCurrency || {}}
            currentUserId={currentUserId}
            fallbackCurrency={group.currency || 'PLN'}
            onSettlementCreated={handleSettlementChanged}
          />
        ) : (
          <PaymentsTab
            groupId={id || ''}
            members={group.members}
            fallbackCurrency={group.currency || 'PLN'}
            refreshKey={settlementsRefreshKey}
            onChanged={handleSettlementChanged}
          />
        )}
      {/* Floating Action Button for Adding Expense (Mobile) */}
      <button 
        onClick={() => navigate(`/groups/${id}/add-expense`)}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-secondary text-on-secondary shadow-[0_8px_24px_rgba(245,158,11,0.28)] transition-all hover:-translate-y-1 active:scale-95 md:hidden"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </AppLayout>
  );
};

export default GroupDetailsPage;
