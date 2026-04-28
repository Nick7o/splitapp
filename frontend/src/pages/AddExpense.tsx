import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import CurrencyPicker from '../components/CurrencyPicker';
import type { ApiExpenseDetails, ApiGroupDetails, ApiUser } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { getRecentCurrencies, getStoredUser, pushRecentCurrency } from '../utils/storage';

const AddExpense: React.FC = () => {
  const { id, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [group, setGroup] = useState<ApiGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PLN');
  const [recentCurrencies, setRecentCurrencies] = useState<string[]>([]);
  
  const [splitMethod, setSplitMethod] = useState<'equally' | 'percent' | 'exact'>('equally');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({}); // Stores percentages or exact amounts

  const currentUser = useMemo(() => getStoredUser() as Partial<ApiUser>, []);
  const currentUserId = currentUser.id;

  useEffect(() => {
    const parsedRecentCurrencies = getRecentCurrencies();
    setRecentCurrencies(parsedRecentCurrencies);

    const fetchData = async () => {
      try {
        const groupRes = await api.get<ApiGroupDetails>(`/groups/${id}`);
        setGroup(groupRes.data);
        
        if (expenseId) {
          const expenseRes = await api.get<ApiExpenseDetails>(`/expenses/${expenseId}`);
          const exp = expenseRes.data;
          setAmount(exp.totalAmount.toString());
          setDescription(exp.title);
          setPayerId(exp.payerId);
          setCurrency(exp.currency || parsedRecentCurrencies[0] || groupRes.data.defaultCurrency || 'PLN');
          
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
          setCurrency(parsedRecentCurrencies[0] || groupRes.data.defaultCurrency || 'PLN');
          // By default, select all members for the split
          const allMemberIds = new Set<string>(groupRes.data.members.map((m: ApiUser) => m.id));
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
      alert(t('addExpense.requiredFields'));
      return;
    }

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert(t('addExpense.invalidAmount'));
      return;
    }

    const splits = group.members.map(m => ({
      userId: m.id,
      owedAmount: calculateOwedAmount(m.id)
    })).filter(s => s.owedAmount > 0);

    const splitsSum = splits.reduce((sum, s) => sum + s.owedAmount, 0);
    
    // Check if the sum matches total amount (with small tolerance for floating point)
    if (Math.abs(splitsSum - totalAmount) > 0.05) {
      alert(t('addExpense.splitMismatch', { splitTotal: splitsSum.toFixed(2), total: totalAmount.toFixed(2) }));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        groupId: group.id,
        payerId: payerId,
        title: description,
        totalAmount: totalAmount,
        currency,
        splits: splits,
        splitMethod
      };

      if (expenseId) {
        await api.put(`/expenses/${expenseId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      const updatedRecent = pushRecentCurrency(currency);
      setRecentCurrencies(updatedRecent);
      navigate(`/groups/${id}`);
    } catch (error: unknown) {
      console.error('Failed to save expense', error);
      alert(getApiErrorMessage(error, t, 'addExpense.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title={t('addExpense.expense')} backTo={`/groups/${id}`} maxWidthClassName="max-w-2xl">
        <div className="py-20 text-center text-on-surface-variant">{t('common.loading')}</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title={t('addExpense.expense')} backTo={`/groups/${id}`} maxWidthClassName="max-w-2xl">
        <div className="py-20 text-center text-error">{t('common.groupNotFound')}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={expenseId ? t('addExpense.editTitle') : t('addExpense.newTitle')}
      titleVariant="hidden"
      backTo={`/groups/${id}`}
      maxWidthClassName="max-w-2xl"
    >
          <div className="mb-6 flex items-start justify-between gap-4 text-left">
            <div>
              <h1 className="mb-2 font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
                {expenseId ? t('addExpense.editHeading') : t('addExpense.newHeading')}
              </h1>
              <p className="text-on-surface-variant font-body">
                {expenseId ? t('addExpense.editSubheading') : t('addExpense.newSubheading')}
              </p>
            </div>
            {expenseId && (
              <button 
                onClick={async () => {
                  if (window.confirm(t('addExpense.deleteConfirm'))) {
                    try {
                      await api.delete(`/expenses/${expenseId}?groupId=${id}`);
                      navigate(`/groups/${id}`);
                    } catch (error) {
                      console.error('Failed to delete expense', error);
                      alert(t('addExpense.deleteFailed'));
                    }
                  }
                }}
                className="flex flex-col items-center rounded-xl p-3 text-error transition-colors hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{t('addExpense.delete')}</span>
              </button>
            )}
          </div>

        <div className="space-y-8">
          {/* Step 1: Core Details */}
          <section className="space-y-5">
            <div className="app-card p-5 sm:p-6">
              <div className="space-y-7">
                
                {/* Amount Input */}
                <div className="text-center">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">{t('addExpense.amount', { currency })}</label>
                  <div className="relative inline-flex items-center">
                    <input
                      className="w-full border-none bg-transparent text-center font-headline text-5xl font-extrabold text-primary-fixed placeholder:text-on-surface-variant/50 focus:ring-0"
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
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">{t('addExpense.descriptionLabel')}</label>
                  <input 
                    className="app-input h-14 px-5 font-medium" 
                    placeholder={t('addExpense.descriptionPlaceholder')}
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <CurrencyPicker value={currency} onChange={setCurrency} label={t('addExpense.currency')} recent={recentCurrencies} />

                {/* Payer Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">{t('addExpense.whoPaid')}</label>
                  <div className="flex flex-wrap gap-3">
                    {group.members.map(member => {
                      const isSelected = payerId === member.id;
                      const isMe = member.id === currentUserId;
                      return (
                        <button 
                          key={member.id}
                          onClick={() => setPayerId(member.id)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 active:scale-95 ${isSelected ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'border border-white/10 bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          <span>{isMe ? t('common.you') : member.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Split Method */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">{t('addExpense.splitMethod')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-surface-container-lowest p-1.5 shadow-soft">
              <button 
                onClick={() => setSplitMethod('equally')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'equally' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">equalizer</span>
                <span className="text-xs font-bold uppercase tracking-tight">{t('addExpense.equal')}</span>
              </button>
              <button 
                onClick={() => setSplitMethod('percent')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'percent' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">percent</span>
                <span className="text-xs font-bold uppercase tracking-tight">{t('addExpense.percent')}</span>
              </button>
              <button 
                onClick={() => setSplitMethod('exact')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'exact' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-tight">{t('addExpense.exact')}</span>
              </button>
            </div>

            {/* Split Details List */}
            <div className="app-card space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('addExpense.participants')}</span>
                {splitMethod === 'equally' && (
                  <button onClick={selectAllMembers} className="text-xs font-bold uppercase tracking-widest text-secondary transition-colors hover:text-tertiary-container">{t('addExpense.selectAll')}</button>
                )}
              </div>
              <div className="space-y-3">
                {group.members.map(member => {
                  const isMe = member.id === currentUserId;
                  const isSelected = selectedMembers.has(member.id);
                  const owedAmount = calculateOwedAmount(member.id);

                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-container p-4 shadow-sm">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-headline font-bold text-on-surface">{isMe ? t('common.you') : member.name}</p>
                          {splitMethod === 'equally' ? (
                            <p className="text-xs font-medium text-primary-fixed">{owedAmount.toFixed(2)} {currency}</p>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input 
                                type="number" 
                                min="0"
                                step={splitMethod === 'percent' ? '1' : '0.01'}
                                className="w-24 rounded-lg border border-white/10 bg-surface-container-low px-3 py-1.5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed/50"
                                placeholder={splitMethod === 'percent' ? '%' : '0.00'}
                                value={customSplits[member.id] || ''}
                                onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                              />
                              <span className="text-xs font-bold text-on-surface-variant">
                                {splitMethod === 'percent' ? `% (${owedAmount.toFixed(2)} ${currency})` : currency}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {splitMethod === 'equally' && (
                        <button 
                          onClick={() => toggleMemberSelection(member.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${isSelected ? 'border-primary-fixed/40 bg-primary text-on-primary' : 'border-white/20 bg-surface-container-high text-transparent'}`}
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
              {submitting ? t('common.saving') : t('addExpense.saveExpense')}
            </button>
          </div>
        </div>
    </AppLayout>
  );
};

export default AddExpense;
