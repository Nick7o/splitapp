import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import SettleUp from '../components/SettleUp';
import BottomNav from '../components/BottomNav';
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
    return <div className="min-h-screen bg-background flex justify-center items-center text-on-surface">Loading...</div>;
  }

  if (!group) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-error">Group not found</div>;
  }

  const getPayerName = (payerId: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (payerId === user.id) return 'me';
    const member = group.members.find(m => m.id === payerId);
    return member ? member.name : 'Unknown';
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b border-white/20 dark:shadow-none">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-primary dark:text-primary-container hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200 p-2 rounded-full"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline font-extrabold text-primary dark:text-white tracking-tighter text-2xl">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/groups/${id}/activity`)}
              className="text-primary dark:text-primary-container hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200 p-2 rounded-full"
              title="Historia aktywności"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
            <button 
              onClick={() => alert('Ustawienia grupy w budowie')}
              className="text-primary dark:text-primary-container hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200 p-2 rounded-full"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 px-6 max-w-screen-xl mx-auto">
        {/* Hero Section / Group Summary */}
        <section className="mb-10 mt-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 backdrop-blur-md">
            {/* Abstract Texture Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
              <div>
                <p className="font-label text-sm font-medium text-on-primary-container/80 uppercase tracking-widest mb-2">My Balance</p>
                <h2 className="font-headline text-5xl font-extrabold tracking-tight mb-1 text-tertiary-container">
                  {group.myBalance > 0 ? '+' : ''}{group.myBalance.toFixed(2)} {group.currency}
                </h2>
                <div className="flex items-center gap-2 text-on-primary-container/90 mt-2">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-label text-sm font-semibold tracking-wide">{group.members.length} Participants</span>
                  <button 
                    onClick={() => {
                      const inviteLink = `${window.location.origin}/groups/${group.id}/join`;
                      navigator.clipboard.writeText(inviteLink);
                      alert('Link zaproszeniowy skopiowany do schowka!');
                    }}
                    className="ml-4 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                  >
                    Kopiuj link zaproszeniowy
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6 md:mt-0">
                <button 
                  onClick={() => navigate(`/groups/${id}/add-expense`)}
                  className="bg-secondary text-on-secondary px-6 py-4 rounded-xl font-headline font-bold text-base shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 border border-white/20 backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Expense
                </button>
                <button 
                  onClick={() => setActiveTab('balances')}
                  className="bg-surface-container-lowest text-primary px-6 py-4 rounded-xl font-headline font-bold text-base shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 border border-white/50 backdrop-blur-sm"
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
            <span className={`font-headline font-bold text-xl ${activeTab === 'expenses' ? 'text-primary' : 'text-on-surface-variant/50 hover:text-on-surface transition-colors'}`}>Expenses</span>
            {activeTab === 'expenses' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-tertiary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('balances')}
            className="relative py-2 group"
          >
            <span className={`font-headline font-bold text-xl ${activeTab === 'balances' ? 'text-primary' : 'text-on-surface-variant/50 hover:text-on-surface transition-colors'}`}>Balances</span>
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
                        className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl transition-all hover:bg-surface-bright active:scale-[0.99] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-outline-variant/20 backdrop-blur-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 ${isMe ? 'bg-secondary-container text-secondary' : 'bg-tertiary-fixed text-tertiary'} flex items-center justify-center rounded-xl shadow-inner`}>
                            <span className="material-symbols-outlined">receipt_long</span>
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-on-surface text-lg">{expense.title}</h4>
                            <p className="font-label text-sm text-on-surface-variant">Paid by <span className={`font-semibold ${isMe ? 'text-primary' : 'text-tertiary'}`}>{payerName}</span></p>
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
      </main>

      {/* BottomNavBar */}
      <BottomNav />

      {/* Floating Action Button for Adding Expense (Mobile) */}
      <button 
        onClick={() => navigate(`/groups/${id}/add-expense`)}
        className="md:hidden fixed bottom-28 right-6 w-14 h-14 bg-tertiary text-white rounded-2xl shadow-[0_8px_20px_rgb(217,119,6,0.3)] flex items-center justify-center hover:-translate-y-1 active:scale-90 transition-all z-40 border border-white/20 backdrop-blur-sm"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default GroupDetailsPage;
