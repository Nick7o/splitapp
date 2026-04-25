import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface User {
  id: string;
  name: string;
  email: string;
}

interface GroupDetails {
  id: string;
  name: string;
  currency: string;
  members: User[];
}

interface ExpenseSplit {
  userId: string;
  owedAmount: number;
}

interface ExpenseDetails {
  totalAmount: number;
  title: string;
  payerId: string;
  splits: ExpenseSplit[];
}

interface ApiError {
  response?: {
    data?: {
      Error?: string;
    };
  };
}

const AddExpense: React.FC = () => {
  const { id, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState<string>('');
  
  const [splitMethod, setSplitMethod] = useState<'equally' | 'percent' | 'exact'>('equally');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({}); // Stores percentages or exact amounts

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') as Partial<User>, []);
  const currentUserId = currentUser.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupRes = await api.get(`/groups/${id}`);
        setGroup(groupRes.data);
        
        if (expenseId) {
          const expenseRes = await api.get(`/expenses/${expenseId}`);
          const exp = expenseRes.data as ExpenseDetails;
          setAmount(exp.totalAmount.toString());
          setDescription(exp.title);
          setPayerId(exp.payerId);
          
          // Determine split method based on data
          // For simplicity, we can default to 'exact' when editing if it's not a perfect equal split
          const selected = new Set<string>();
          const custom: Record<string, string> = {};
          
          exp.splits.forEach((s) => {
            selected.add(s.userId);
            custom[s.userId] = s.owedAmount.toString();
          });
          
          setSelectedMembers(selected);
          setCustomSplits(custom);
          const allEqual = exp.splits.every((s) => Math.abs(s.owedAmount - exp.splits[0].owedAmount) < 0.01);
          if (allEqual && exp.splits.length === groupRes.data.members.length) {
            setSplitMethod('equally');
          } else {
            setSplitMethod('exact');
          }
          
        } else {
          setPayerId(currentUserId || '');
          // By default, select all members for the split
          const allMemberIds = new Set<string>(groupRes.data.members.map((m: User) => m.id));
          setSelectedMembers(allMemberIds);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, expenseId, currentUserId]);

  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const selectAllMembers = () => {
    if (!group) return;
    setSelectedMembers(new Set(group.members.map(m => m.id)));
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const calculateOwedAmount = (memberId: string): number => {
    const totalAmount = parseFloat(amount) || 0;
    if (totalAmount <= 0) return 0;

    if (splitMethod === 'equally') {
      if (!selectedMembers.has(memberId)) return 0;
      return totalAmount / selectedMembers.size;
    }

    if (splitMethod === 'percent') {
      const percentage = parseFloat(customSplits[memberId]) || 0;
      return (totalAmount * percentage) / 100;
    }

    if (splitMethod === 'exact') {
      return parseFloat(customSplits[memberId]) || 0;
    }

    return 0;
  };

  const handleSave = async () => {
    if (!group || !amount || !description || !payerId) {
      alert('Please fill in all required fields.');
      return;
    }

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const splits = group.members.map(m => ({
      userId: m.id,
      owedAmount: calculateOwedAmount(m.id)
    })).filter(s => s.owedAmount > 0);

    const splitsSum = splits.reduce((sum, s) => sum + s.owedAmount, 0);
    
    // Check if the sum matches total amount (with small tolerance for floating point)
    if (Math.abs(splitsSum - totalAmount) > 0.05) {
      alert(`Split total (${splitsSum.toFixed(2)}) does not match the full amount (${totalAmount.toFixed(2)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        groupId: group.id,
        payerId: payerId,
        title: description,
        totalAmount: totalAmount,
        splits: splits
      };

      if (expenseId) {
        await api.put(`/expenses/${expenseId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      navigate(`/groups/${id}`);
    } catch (error: unknown) {
      console.error('Failed to save expense', error);
      const apiError = error as ApiError;
      alert(apiError.response?.data?.Error || 'An error occurred while saving the expense.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Expense" backTo={`/groups/${id}`} maxWidthClassName="max-w-2xl">
        <div className="py-20 text-center text-on-surface-variant">Loading...</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title="Expense" backTo={`/groups/${id}`} maxWidthClassName="max-w-2xl">
        <div className="py-20 text-center text-error">Group not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={expenseId ? 'Edit expense' : 'New expense'}
      backTo={`/groups/${id}`}
      maxWidthClassName="max-w-2xl"
    >
          <div className="mb-8 flex items-start justify-between gap-4 text-left">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl">
                {expenseId ? 'Edit Expense' : 'New Expense'}
              </h1>
              <p className="text-on-surface-variant font-body">
                {expenseId ? 'Update expense details.' : 'Add a cost and split it between group members.'}
              </p>
            </div>
            {expenseId && (
              <button 
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this expense?')) {
                    try {
                      await api.delete(`/expenses/${expenseId}?groupId=${id}`);
                      navigate(`/groups/${id}`);
                    } catch (error) {
                      console.error('Failed to delete expense', error);
                      alert('Failed to delete expense.');
                    }
                  }
                }}
                className="flex flex-col items-center rounded-xl p-3 text-error transition-colors hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Delete</span>
              </button>
            )}
          </div>

        <div className="space-y-12">
          {/* Step 1: Core Details */}
          <section className="space-y-6">
            <div className="app-card p-5 sm:p-6">
              <div className="space-y-8">
                
                {/* Amount Input */}
                <div className="text-center">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">Amount ({group.currency})</label>
                  <div className="relative inline-flex items-center">
                    <input 
                      className="w-full border-none bg-transparent text-center font-headline text-5xl font-extrabold text-secondary placeholder:text-on-surface-variant/50 focus:ring-0" 
                      placeholder="0.00" 
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">What was this for?</label>
                  <input 
                    className="app-input h-14 px-5 font-medium" 
                    placeholder="e.g. Dinner at an Italian place" 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Payer Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Who paid?</label>
                  <div className="flex flex-wrap gap-3">
                    {group.members.map(member => {
                      const isSelected = payerId === member.id;
                      const isMe = member.id === currentUserId;
                      return (
                        <button 
                          key={member.id}
                          onClick={() => setPayerId(member.id)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-secondary/50 active:scale-95 ${isSelected ? 'bg-primary text-on-primary shadow-soft ring-1 ring-secondary/30' : 'border border-white/10 bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          <span>{isMe ? 'You' : member.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Split Method */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Split method</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setSplitMethod('equally')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${splitMethod === 'equally' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-secondary/30' : 'border border-white/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">equalizer</span>
                <span className="text-xs font-bold uppercase tracking-tight">Equal</span>
              </button>
              <button 
                onClick={() => setSplitMethod('percent')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${splitMethod === 'percent' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-secondary/30' : 'border border-white/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">percent</span>
                <span className="text-xs font-bold uppercase tracking-tight">Percent</span>
              </button>
              <button 
                onClick={() => setSplitMethod('exact')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${splitMethod === 'exact' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-secondary/30' : 'border border-white/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-tight">Exact</span>
              </button>
            </div>

            {/* Split Details List */}
            <div className="app-card space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Participants</span>
                {splitMethod === 'equally' && (
                  <button onClick={selectAllMembers} className="text-xs font-bold text-secondary uppercase tracking-widest hover:text-secondary-container transition-colors">Select all</button>
                )}
              </div>
              <div className="space-y-3">
                {group.members.map(member => {
                  const isMe = member.id === currentUserId;
                  const isSelected = selectedMembers.has(member.id);
                  const owedAmount = calculateOwedAmount(member.id);

                  return (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-container p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface font-headline">{isMe ? 'You' : member.name}</p>
                          {splitMethod === 'equally' ? (
                            <p className="text-xs text-secondary font-medium">{owedAmount.toFixed(2)} {group.currency}</p>
                          ) : (
                            <div className="flex items-center mt-2">
                              <input 
                                type="number" 
                                min="0"
                                step={splitMethod === 'percent' ? '1' : '0.01'}
                                className="w-24 rounded-lg border border-white/10 bg-surface-container-low px-3 py-1.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-secondary/50"
                                placeholder={splitMethod === 'percent' ? '%' : '0.00'}
                                value={customSplits[member.id] || ''}
                                onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                              />
                              <span className="text-xs font-bold text-on-surface-variant ml-3">
                                {splitMethod === 'percent' ? `% (${owedAmount.toFixed(2)} ${group.currency})` : group.currency}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {splitMethod === 'equally' && (
                        <button 
                          onClick={() => toggleMemberSelection(member.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${isSelected ? 'border-primary-container bg-primary text-on-primary' : 'border-white/20 bg-surface-container-high text-transparent'}`}
                        >
                          <span className="material-symbols-outlined text-sm font-bold">check</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={submitting}
              className="app-button-primary h-14 w-full text-base"
            >
              {submitting ? 'Saving...' : 'Save expense'}
            </button>
          </div>
        </div>
    </AppLayout>
  );
};

export default AddExpense;
