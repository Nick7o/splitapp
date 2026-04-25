import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import SettleUp from '../components/SettleUp';
import AppLayout from '../components/AppLayout';
import api from '../api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  payerId: string;
  createdAt: string;
  myShare: number;
}

interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface GroupDetails {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
  myBalance: number;
  members: User[];
  expenses: Expense[];
  optimizedDebts: DebtTransfer[];
}

const GroupDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await api.get(`/groups/${id}`);
        setGroup(response.data);
      } catch (error) {
        console.error('Failed to fetch group details', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroupDetails();
    }

    // SignalR Connection
    let connection: signalR.HubConnection | null = null;

    const setupSignalR = async () => {
      if (!id) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5223/hubs/expense') // TODO: use env variable
        .withAutomaticReconnect()
        .build();

      connection.on('ExpenseAdded', (expenseId: string) => {
        console.log('New expense added:', expenseId);
        // Refresh group details when a new expense is added
        fetchGroupDetails();
      });

      try {
        await connection.start();
        await connection.invoke('JoinGroup', id);
        console.log('Connected to SignalR hub for group', id);
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
      }
    };

    setupSignalR();

    return () => {
      if (connection) {
        if (id) {
          connection.invoke('LeaveGroup', id).catch(console.error);
        }
        connection.stop();
      }
    };
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Group" backTo="/dashboard">
        <div className="py-20 text-center text-on-surface-variant">Loading...</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title="Group" backTo="/dashboard">
        <div className="py-20 text-center text-error">Group not found</div>
      </AppLayout>
    );
  }

  const getPayerName = (payerId: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (payerId === user.id) return 'me';
    const member = group.members.find(m => m.id === payerId);
    return member ? member.name : 'Unknown';
  };

  return (
    <AppLayout
      title={group.name}
      backTo="/dashboard"
      actions={(
        <>
          <button
            onClick={() => navigate(`/groups/${id}/activity`)}
            className="app-icon-button"
            title="Activity history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <button
            onClick={() => alert('Group settings are under construction')}
            className="app-icon-button"
            aria-label="Group settings"
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
                <p className="mb-2 font-label text-sm font-medium uppercase tracking-widest text-on-primary-container">My Balance</p>
                <h2 className="mb-1 font-headline text-4xl font-extrabold tracking-tight text-on-primary sm:text-5xl">
                  {group.myBalance > 0 ? '+' : ''}{group.myBalance.toFixed(2)} {group.currency}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-on-primary-container">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-label text-sm font-semibold tracking-wide">{group.members.length} Participants</span>
                  <button 
                    onClick={() => {
                      const inviteLink = `${window.location.origin}/groups/${group.id}/join`;
                      navigator.clipboard.writeText(inviteLink);
                      alert('Invite link copied to clipboard!');
                    }}
                    className="ml-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 sm:ml-4"
                  >
                    Copy invite link
                  </button>
                </div>
              </div>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:mt-0">
                <button 
                  onClick={() => navigate(`/groups/${id}/add-expense`)}
                  className="app-button-primary bg-secondary text-on-secondary hover:bg-tertiary"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Expense
                </button>
                <button 
                  onClick={() => setActiveTab('balances')}
                  className="app-button-secondary"
                >
                  <span className="material-symbols-outlined text-tertiary">payments</span>
                  Settle Up
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
            <span className={`font-headline text-lg font-bold sm:text-xl ${activeTab === 'expenses' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>Expenses</span>
            {activeTab === 'expenses' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('balances')}
            className="relative py-2 group"
          >
            <span className={`font-headline text-lg font-bold sm:text-xl ${activeTab === 'balances' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>Balances</span>
            {activeTab === 'balances' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' ? (
          <div className="space-y-10">
            <div>
              <h3 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6">All Expenses</h3>
              <div className="space-y-4">
                {group.expenses.length === 0 ? (
                  <p className="text-on-surface-variant">No expenses yet.</p>
                ) : (
                  group.expenses.map(expense => {
                    const payerName = getPayerName(expense.payerId);
                    const isMe = payerName === 'me';
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
                            <p className="font-label text-sm text-on-surface-variant">Paid by <span className={`font-semibold ${isMe ? 'text-secondary' : 'text-tertiary'}`}>{payerName}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-headline font-extrabold text-on-surface text-lg">{expense.totalAmount.toFixed(2)} {group.currency}</p>
                            <p className={`font-label text-xs font-medium uppercase tracking-wider ${isMe ? 'text-secondary' : 'text-error'}`}>
                              {isMe 
                                ? (expense.totalAmount - expense.myShare > 0 ? `You get ${(expense.totalAmount - expense.myShare).toFixed(2)}` : 'Settled')
                                : (expense.myShare > 0 ? `You owe ${expense.myShare.toFixed(2)}` : 'Settled')}
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
        ) : (
          <SettleUp groupId={id || ''} debts={group.optimizedDebts || []} members={group.members} currency={group.currency} />
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
