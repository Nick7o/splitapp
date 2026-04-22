import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

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

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupRes = await api.get(`/groups/${id}`);
        setGroup(groupRes.data);
        
        if (expenseId) {
          const expenseRes = await api.get(`/expenses/${expenseId}`);
          const exp = expenseRes.data;
          setAmount(exp.totalAmount.toString());
          setDescription(exp.title);
          setPayerId(exp.payerId);
          
          // Determine split method based on data
          // For simplicity, we can default to 'exact' when editing if it's not a perfect equal split
          const selected = new Set<string>();
          const custom: Record<string, string> = {};
          
          exp.splits.forEach((s: any) => {
            selected.add(s.userId);
            custom[s.userId] = s.owedAmount.toString();
          });
          
          setSelectedMembers(selected);
          setCustomSplits(custom);
          const allEqual = exp.splits.every((s: any) => Math.abs(s.owedAmount - exp.splits[0].owedAmount) < 0.01);
          if (allEqual && exp.splits.length === groupRes.data.members.length) {
            setSplitMethod('equally');
          } else {
            setSplitMethod('exact');
          }
          
        } else {
          setPayerId(currentUser.id);
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
  }, [id, expenseId]);

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
      alert('Wypełnij wszystkie wymagane pola.');
      return;
    }

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert('Podaj prawidłową kwotę.');
      return;
    }

    const splits = group.members.map(m => ({
      userId: m.id,
      owedAmount: calculateOwedAmount(m.id)
    })).filter(s => s.owedAmount > 0);

    const splitsSum = splits.reduce((sum, s) => sum + s.owedAmount, 0);
    
    // Check if the sum matches total amount (with small tolerance for floating point)
    if (Math.abs(splitsSum - totalAmount) > 0.05) {
      alert(`Suma podziału (${splitsSum.toFixed(2)}) nie zgadza się z całkowitą kwotą (${totalAmount.toFixed(2)}).`);
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
    } catch (error: any) {
      console.error('Failed to save expense', error);
      alert(error.response?.data?.Error || 'Wystąpił błąd podczas zapisywania wydatku.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex justify-center items-center text-on-surface">Ładowanie...</div>;
  if (!group) return <div className="min-h-screen bg-background flex justify-center items-center text-error">Nie znaleziono grupy.</div>;

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b border-white/20 dark:shadow-none">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/groups/${id}`)}
              className="text-primary dark:text-primary-container hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200 p-2 rounded-full"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-headline font-extrabold text-primary dark:text-white tracking-tighter text-2xl">SplitApp</span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto">
          <div className="mb-10 text-left flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-2">
                {expenseId ? 'Edytuj Wydatek' : 'Nowy Wydatek'}
              </h1>
              <p className="text-on-surface-variant font-body">
                {expenseId ? 'Zmień szczegóły wydatku.' : 'Dodaj koszt i podziel go między członków grupy.'}
              </p>
            </div>
            {expenseId && (
              <button 
                onClick={async () => {
                  if (window.confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
                    try {
                      await api.delete(`/expenses/${expenseId}?groupId=${id}`);
                      navigate(`/groups/${id}`);
                    } catch (error) {
                      console.error('Failed to delete expense', error);
                      alert('Nie udało się usunąć wydatku.');
                    }
                  }
                }}
                className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors flex flex-col items-center"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Usuń</span>
              </button>
            )}
          </div>

        <div className="space-y-12">
          {/* Step 1: Core Details */}
          <section className="space-y-6">
            <div className="bg-surface-container-lowest backdrop-blur-lg border border-outline-variant/30 rounded-xl p-8 shadow-soft">
              <div className="space-y-8">
                
                {/* Amount Input */}
                <div className="text-center">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">Kwota ({group.currency})</label>
                  <div className="relative inline-flex items-center">
                    <input 
                      className="w-full text-5xl font-headline font-extrabold text-primary bg-transparent border-none focus:ring-0 text-center placeholder:text-outline-variant" 
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
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Za co to było?</label>
                  <input 
                    className="w-full h-14 px-5 bg-surface-container-lowest backdrop-blur-md border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/40 text-on-surface placeholder:text-on-surface-variant/50 font-medium shadow-sm" 
                    placeholder="np. Obiad u Włocha" 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Payer Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Kto zapłacił?</label>
                  <div className="flex flex-wrap gap-3">
                    {group.members.map(member => {
                      const isSelected = payerId === member.id;
                      const isMe = member.id === currentUser.id;
                      return (
                        <button 
                          key={member.id}
                          onClick={() => setPayerId(member.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold shadow-sm active:scale-95 transition-all ${isSelected ? 'bg-primary text-on-primary shadow-soft border border-primary-container' : 'bg-surface-container-lowest backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-container-high'}`}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          <span>{isMe ? 'Ty' : member.name}</span>
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
              <h2 className="text-xl font-bold text-on-surface">Metoda podziału</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setSplitMethod('equally')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 shadow-sm transition-colors ${splitMethod === 'equally' ? 'bg-primary text-on-primary shadow-soft border border-primary-container' : 'bg-surface-container-lowest backdrop-blur-md border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined">equalizer</span>
                <span className="text-xs font-bold uppercase tracking-tight">Po równo</span>
              </button>
              <button 
                onClick={() => setSplitMethod('percent')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 shadow-sm transition-colors ${splitMethod === 'percent' ? 'bg-primary text-on-primary shadow-soft border border-primary-container' : 'bg-surface-container-lowest backdrop-blur-md border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined">percent</span>
                <span className="text-xs font-bold uppercase tracking-tight">Procentowo</span>
              </button>
              <button 
                onClick={() => setSplitMethod('exact')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 shadow-sm transition-colors ${splitMethod === 'exact' ? 'bg-primary text-on-primary shadow-soft border border-primary-container' : 'bg-surface-container-lowest backdrop-blur-md border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-tight">Dokładnie</span>
              </button>
            </div>

            {/* Split Details List */}
            <div className="bg-surface-container-lowest backdrop-blur-lg border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-soft">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Uczestnicy</span>
                {splitMethod === 'equally' && (
                  <button onClick={selectAllMembers} className="text-xs font-bold text-secondary uppercase tracking-widest hover:text-secondary-container transition-colors">Zaznacz wszystkich</button>
                )}
              </div>
              <div className="space-y-3">
                {group.members.map(member => {
                  const isMe = member.id === currentUser.id;
                  const isSelected = selectedMembers.has(member.id);
                  const owedAmount = calculateOwedAmount(member.id);

                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-surface-container-high backdrop-blur-sm border border-outline-variant/30 rounded-xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface font-headline">{isMe ? 'Ty' : member.name}</p>
                          {splitMethod === 'equally' ? (
                            <p className="text-xs text-secondary font-medium">{owedAmount.toFixed(2)} {group.currency}</p>
                          ) : (
                            <div className="flex items-center mt-2">
                              <input 
                                type="number" 
                                min="0"
                                step={splitMethod === 'percent' ? '1' : '0.01'}
                                className="w-24 text-sm px-3 py-1.5 border border-outline-variant/50 rounded-lg bg-surface-container-lowest text-on-surface font-bold focus:ring-2 focus:ring-primary outline-none"
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
                          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm border transition-colors ${isSelected ? 'bg-primary text-on-primary border-primary-container' : 'bg-surface-container border-outline-variant text-transparent'}`}
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
              className="w-full h-16 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-headline font-bold text-lg shadow-soft shadow-primary/30 active:scale-[0.98] transition-all border border-white/10 disabled:opacity-50"
            >
              {submitting ? 'Zapisywanie...' : 'Zapisz wydatek'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddExpense;
