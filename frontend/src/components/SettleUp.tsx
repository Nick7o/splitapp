import React, { useMemo } from 'react';
import api from '../api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface RawDebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface DebtTransfer extends RawDebtTransfer {
  fromName: string;
  toName: string;
  fromAvatar: string;
  toAvatar: string;
}

interface SettleUpProps {
  groupId: string;
  debts: RawDebtTransfer[];
  members: User[];
  currency: string;
}

const SettleUp: React.FC<SettleUpProps> = ({ groupId, debts, members, currency }) => {
  const transfers = useMemo(() => {
    return debts.map(debt => {
      const fromUser = members.find(m => m.id === debt.fromUserId);
      const toUser = members.find(m => m.id === debt.toUserId);
      return {
        ...debt,
        fromName: fromUser ? fromUser.name : 'Unknown',
        toName: toUser ? toUser.name : 'Unknown',
        fromAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fromUser?.name || 'U')}&background=random`,
        toAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(toUser?.name || 'U')}&background=random`,
      };
    });
  }, [debts, members]);

  const handleSettle = async (transfer: DebtTransfer) => {
    try {
      await api.post('/expenses', {
        groupId: groupId,
        payerId: transfer.fromUserId,
        title: 'Rozliczenie',
        totalAmount: transfer.amount,
        splits: [
          {
            userId: transfer.toUserId,
            owedAmount: transfer.amount
          }
        ]
      });
      alert('Rozliczenie zostało zapisane!');
      window.location.reload(); // Prosty sposób na odświeżenie danych grupy
    } catch (error) {
      console.error('Failed to settle', error);
      alert('Wystąpił błąd podczas zapisywania rozliczenia.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section: The Optimization Insight */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3 block">Smart Settlement</span>
            <h2 className="font-headline font-extrabold text-4xl lg:text-5xl text-on-surface tracking-tight leading-tight mb-4">
              Debt <span className="text-secondary italic">Simplified.</span>
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl font-medium">
              We've analyzed complex IOUs across the group and condensed them into just {transfers.length} direct transfers using graph-based pathfinding.
            </p>
          </div>
        </div>
      </section>

      {/* The Flow Visualization */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Panel: The Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-outline-variant/30">
            <h3 className="font-headline font-bold text-2xl mb-8 flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-secondary">auto_graph</span>
              Settlement Steps
            </h3>
            
            <div className="space-y-6">
              {transfers.length === 0 ? (
                <p className="text-on-surface-variant">Wszyscy są rozliczeni!</p>
              ) : (
                transfers.map((transfer, index) => (
                  <div key={index} className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-outline-variant/20 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
                    <div className="flex items-center gap-5 w-full">
                      <div className="relative">
                        <img className="h-16 w-16 rounded-2xl object-cover shadow-sm" alt={transfer.fromName} src={transfer.fromAvatar} />
                        <div className="absolute -right-2 -bottom-2 bg-secondary text-white h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md">{index + 1}</div>
                      </div>
                      <div className="flex-1">
                        <p className="font-headline font-bold text-xl text-on-surface leading-tight">{transfer.fromName} pays {transfer.toName}</p>
                        <p className="text-sm text-secondary font-bold mt-1">{transfer.amount.toFixed(2)} {currency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleSettle(transfer)}
                        className="flex-1 sm:flex-none px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary-container shadow-md shadow-primary/20 transition-all"
                      >
                        Pay Now
                      </button>
                      <button className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-outline-variant/40">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-secondary/5 border border-secondary/10">
                <span className="material-symbols-outlined text-secondary mt-1">info</span>
                <div>
                  <p className="text-sm font-bold text-primary mb-1">How this works</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Our "Path Simplification" algorithm eliminates circular debts. For example, if Ania owes Marcus and Marcus owes Celina, we simply ask Ania to pay Celina directly, saving one transaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Visual Summary / Statistics */}
        <div className="space-y-6">
          <div className="bg-primary rounded-3xl p-8 text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white rounded-full opacity-10 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="font-headline font-bold text-2xl mb-6">Efficiency Report</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-secondary/90 font-bold mb-1">Total Debt</p>
                  <p className="text-2xl font-headline font-extrabold tracking-tight">
                    {transfers.reduce((sum, t) => sum + t.amount, 0).toFixed(0)} {currency}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-secondary/90 font-bold mb-1">Optimized</p>
                  <p className="text-3xl font-headline font-extrabold tracking-tight">{transfers.length}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
                <div>
                  <p className="text-xs text-white/70">Algorithm Status</p>
                  <p className="text-lg font-bold text-secondary">Active</p>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-secondary">trending_up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettleUp;
