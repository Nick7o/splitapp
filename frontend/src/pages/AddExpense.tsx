import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import CurrencyPicker from '../components/CurrencyPicker';
import { ConfirmationDialog } from '../components/Dialog';
import { MemberAvatar } from '../components/MemberIdentity';
import MemberProfileDialog, { type MemberProfile } from '../components/MemberProfileDialog';
import { useToast } from '../context/toast';
import type { ApiExpenseDetails, ApiGroupDetails, ApiUser } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { getMemberSettlements } from '../utils/memberSettlements';
import { getRecentCurrencies, getStoredUser, pushRecentCurrency } from '../utils/storage';

const AddExpense: React.FC = () => {
  const { id, expenseId } = useParams<{ id: string; expenseId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [group, setGroup] = useState<ApiGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(false);

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
      if (selectedMembers.size === 0) return 0;
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
    setFormError('');

    if (!group || !amount || !description || !payerId) {
      setFormError(t('addExpense.requiredFields'));
      return;
    }

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setFormError(t('addExpense.invalidAmount'));
      return;
    }

    const splits = group.members.map(m => ({
      userId: m.id,
      owedAmount: calculateOwedAmount(m.id)
    })).filter(s => s.owedAmount > 0);

    const splitsSum = splits.reduce((sum, s) => sum + s.owedAmount, 0);
    
    // Check if the sum matches total amount (with small tolerance for floating point)
    if (Math.abs(splitsSum - totalAmount) > 0.05) {
      setFormError(t('addExpense.splitMismatch', { splitTotal: splitsSum.toFixed(2), total: totalAmount.toFixed(2) }));
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
      const message = getApiErrorMessage(error, t, 'addExpense.saveFailed');
      setFormError(message);
      showToast(message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseId) return;

    setDeletingExpense(true);
    try {
      await api.delete(`/expenses/${expenseId}?groupId=${id}`);
      navigate(`/groups/${id}`);
    } catch (error) {
      console.error('Failed to delete expense', error);
      showToast(t('addExpense.deleteFailed'), { variant: 'error' });
      setDeleteConfirmOpen(false);
    } finally {
      setDeletingExpense(false);
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

  const parsedAmountForSummary = parseFloat(amount) || 0;
  const splitPreviewTotal = group.members.reduce((sum, member) => sum + calculateOwedAmount(member.id), 0);
  const splitDifference = parsedAmountForSummary - splitPreviewTotal;
  const splitIsBalanced = parsedAmountForSummary > 0 && Math.abs(splitDifference) <= 0.05;
  const selectedParticipantCount = group.members.filter((member) => {
    if (splitMethod === 'equally') {
      return selectedMembers.has(member.id);
    }

    return calculateOwedAmount(member.id) > 0;
  }).length;
  const canSubmit = Boolean(description.trim() && payerId && currency && splitIsBalanced && selectedParticipantCount > 0 && !submitting);

  return (
    <AppLayout
      title={expenseId ? t('addExpense.editTitle') : t('addExpense.newTitle')}
      titleVariant="hidden"
      backTo={`/groups/${id}`}
      maxWidthClassName="max-w-2xl"
    >
          <div className="mb-6 flex items-start justify-between gap-4 text-left">
            <div>
              <h1 className="app-page-title mb-2">
                {expenseId ? t('addExpense.editHeading') : t('addExpense.newHeading')}
              </h1>
              <p className="text-on-surface-variant font-body">
                {expenseId ? t('addExpense.editSubheading') : t('addExpense.newSubheading')}
              </p>
            </div>
            {expenseId && (
              <button 
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex flex-col items-center rounded-xl p-3 text-error transition-colors hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="text-[10px] font-bold uppercase tracking-normal mt-1">{t('addExpense.delete')}</span>
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
                  <label className="block text-[10px] font-bold uppercase tracking-normal text-on-surface-variant mb-4">{t('addExpense.amount', { currency })}</label>
                  <div className="relative inline-flex items-center">
                    <input
                      className="w-full border-none bg-transparent text-center font-label text-5xl font-extrabold tabular-nums text-primary-fixed placeholder:text-on-surface-variant/50 focus:ring-0"
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
                      const memberLabel = isMe ? t('common.you') : member.name;

                      return (
                        <div
                          key={member.id}
                          className={`flex min-w-0 items-center gap-1 rounded-xl p-1 font-semibold shadow-sm transition-all ${isSelected ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'border border-white/10 bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-current/40"
                            onClick={() => setPayerId(member.id)}
                            aria-pressed={isSelected}
                          >
                            <MemberAvatar member={member} size="sm" className={isSelected ? 'bg-on-primary/15 text-on-primary' : ''} />
                            <span className="truncate">{memberLabel}</span>
                            {isSelected ? (
                              <span className="material-symbols-outlined ml-auto text-sm" aria-hidden="true">check</span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMember(member)}
                            aria-label={t('memberProfile.open', { name: memberLabel })}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-current/40 ${
                              isSelected
                                ? 'bg-on-primary/15 text-on-primary'
                                : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">person_search</span>
                          </button>
                        </div>
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
              <span className="rounded-lg border border-white/10 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant">
                {t('addExpense.selectedCount', { count: selectedParticipantCount })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-surface-container-lowest p-1.5 shadow-soft">
              <button 
                type="button"
                onClick={() => setSplitMethod('equally')}
                aria-pressed={splitMethod === 'equally'}
                className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'equally' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">equalizer</span>
                <span className="text-xs font-bold uppercase tracking-normal">{t('addExpense.equal')}</span>
              </button>
              <button 
                type="button"
                onClick={() => setSplitMethod('percent')}
                aria-pressed={splitMethod === 'percent'}
                className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'percent' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">percent</span>
                <span className="text-xs font-bold uppercase tracking-normal">{t('addExpense.percent')}</span>
              </button>
              <button 
                type="button"
                onClick={() => setSplitMethod('exact')}
                aria-pressed={splitMethod === 'exact'}
                className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl p-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:p-4 ${splitMethod === 'exact' ? 'bg-primary text-on-primary shadow-soft ring-1 ring-primary-fixed/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-normal">{t('addExpense.exact')}</span>
              </button>
            </div>

            {/* Split Details List */}
            <div className="app-card space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <span className="text-xs font-bold uppercase tracking-normal text-on-surface-variant">{t('addExpense.participants')}</span>
                {splitMethod === 'equally' && (
                  <button type="button" onClick={selectAllMembers} className="rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-normal text-secondary transition-colors hover:bg-white/5 hover:text-tertiary-container">{t('addExpense.selectAll')}</button>
                )}
              </div>

              <div className="grid gap-2 rounded-xl border border-white/10 bg-surface-container-lowest p-2 text-center sm:grid-cols-3">
                <div className="rounded-lg bg-surface-container px-2 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('addExpense.expenseTotal')}</p>
                  <p className="mt-1 font-headline text-base font-bold text-on-surface">{parsedAmountForSummary.toFixed(2)} {currency}</p>
                </div>
                <div className="rounded-lg bg-surface-container px-2 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('addExpense.splitTotal')}</p>
                  <p className="mt-1 font-headline text-base font-bold text-on-surface">{splitPreviewTotal.toFixed(2)} {currency}</p>
                </div>
                <div className="rounded-lg bg-surface-container px-2 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('addExpense.remaining')}</p>
                  <p className={`mt-1 font-headline text-base font-bold ${Math.abs(splitDifference) <= 0.05 ? 'text-primary-fixed' : 'text-error'}`}>
                    {splitDifference.toFixed(2)} {currency}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {group.members.map(member => {
                  const isMe = member.id === currentUserId;
                  const isSelected = selectedMembers.has(member.id);
                  const owedAmount = calculateOwedAmount(member.id);
                  const memberLabel = isMe ? t('common.you') : member.name;

                  return (
                    <div
                      key={member.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors sm:p-4 ${
                        isSelected || splitMethod !== 'equally'
                          ? 'border-primary-fixed/25 bg-surface-container'
                          : 'border-white/10 bg-surface-container-lowest'
                      }`}
                    >
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          className="flex min-w-0 items-center gap-3 rounded-xl text-left transition hover:text-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                          onClick={() => setSelectedMember(member)}
                        >
                          <MemberAvatar member={member} size="md" className="bg-surface-container-highest text-on-surface-variant" />
                          <div className="min-w-0">
                            <p className="truncate font-headline font-bold text-on-surface">{memberLabel}</p>
                            {splitMethod === 'equally' ? (
                              <p className="text-xs font-medium text-primary-fixed">{owedAmount.toFixed(2)} {currency}</p>
                            ) : null}
                          </div>
                        </button>

                        {splitMethod !== 'equally' ? (
                          <div className="grid grid-cols-[minmax(6rem,1fr)_auto] items-center gap-2 sm:ml-auto sm:w-52">
                            <input
                              type="number"
                              min="0"
                              step={splitMethod === 'percent' ? '1' : '0.01'}
                              className="h-11 w-full rounded-lg border border-white/10 bg-surface-container-low px-3 text-right text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed/50"
                              placeholder={splitMethod === 'percent' ? '%' : '0.00'}
                              value={customSplits[member.id] || ''}
                              onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                            />
                            <span className="text-xs font-bold text-on-surface-variant">
                              {splitMethod === 'percent' ? '%' : currency}
                            </span>
                            {splitMethod === 'percent' ? (
                              <p className="col-span-2 text-right text-xs font-semibold text-primary-fixed">{owedAmount.toFixed(2)} {currency}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      
                      {splitMethod === 'equally' && (
                        <button 
                          type="button"
                          onClick={() => toggleMemberSelection(member.id)}
                          aria-label={t('addExpense.toggleParticipant', { name: memberLabel })}
                          aria-pressed={isSelected}
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${
                            isSelected
                              ? 'border-primary-fixed/40 bg-primary text-on-primary'
                              : 'border-white/20 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl font-bold">
                            {isSelected ? 'check' : 'add'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-30 rounded-2xl border border-white/10 bg-surface/92 p-3 shadow-[0_-18px_42px_rgba(2,6,23,0.28)] backdrop-blur-xl md:static md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
            {formError ? (
              <div className="mb-4 rounded-xl border border-error/40 bg-error/10 p-4 text-sm font-semibold text-error">
                {formError}
              </div>
            ) : null}
            <p className={`mb-3 text-center text-xs font-bold uppercase tracking-normal ${canSubmit ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
              {canSubmit ? t('addExpense.readyToSave') : t('addExpense.needsSplit')}
            </p>
            <button 
              onClick={handleSave}
              disabled={!canSubmit}
              className="app-button-primary h-14 w-full text-base"
            >
              {submitting ? t('common.saving') : t('addExpense.saveExpense')}
            </button>
          </div>
        </div>
        {selectedMember ? (
          <MemberProfileDialog
            member={selectedMember}
            isCurrentUser={selectedMember.id === currentUserId}
            balancesByCurrency={Object.fromEntries(
              Object.entries(group.balancesByCurrency ?? {}).map(([balanceCurrency, balances]) => [balanceCurrency, balances[selectedMember.id] ?? 0])
            )}
            settlements={getMemberSettlements(selectedMember.id, group.optimizedDebtsByCurrency, group.members, t('common.unknown'))}
            onClose={() => setSelectedMember(null)}
          />
        ) : null}
        <ConfirmationDialog
          open={deleteConfirmOpen}
          title={t('addExpense.deleteTitle')}
          message={t('addExpense.deleteBody')}
          confirmLabel={t('addExpense.delete')}
          cancelLabel={t('common.cancel')}
          tone="danger"
          busy={deletingExpense}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteExpense}
        />
    </AppLayout>
  );
};

export default AddExpense;
