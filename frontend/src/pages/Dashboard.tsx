import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface Group {
  id: string;
  name: string;
  currency: string;
  myBalance: number;
  membersCount: number;
  lastActive: string;
  imageUrl: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('PLN');

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchGroups();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    try {
      await api.post('/groups', {
        name: newGroupName,
        currency: newGroupCurrency
      });
      setIsModalOpen(false);
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  return (
    <AppLayout
      title="SplitApp"
      actions={(
        <button
          onClick={() => alert('Search is under construction')}
          className="app-icon-button"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      )}
    >
        {/* Hero Balance Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-label text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-2">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-bold tracking-tight text-on-surface md:text-6xl">$0.00</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary-container border border-secondary/20 rounded-full">
                <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                <p className="font-label text-sm font-medium text-secondary">All settled up</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="app-button-primary"
              >
                <span className="material-symbols-outlined">add</span>
                New Group
              </button>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Active Groups</p>
            <p className="font-headline text-3xl font-bold text-on-surface">{groups.length}</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Monthly Split</p>
            <p className="font-headline text-3xl font-bold text-on-surface">$0</p>
          </div>
          <div className="app-card p-5 sm:p-6">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Savings Insight</p>
            <p className="font-headline text-3xl font-bold text-secondary">+$0</p>
          </div>
        </section>

        {/* Active Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-wide text-on-surface sm:text-3xl">Active Groups</h2>
          </div>
          
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">group_off</span>
                <p>You don't have any groups yet.</p>
              </div>
            ) : (
              groups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="group app-card flex cursor-pointer items-center justify-between p-4 transition-all hover:bg-surface-container-low active:scale-[0.99] sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center">
                      {group.imageUrl ? (
                        <img alt={group.name} className="w-full h-full object-cover opacity-90" src={group.imageUrl} />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant">group</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">{group.name}</h3>
                      <p className="font-label text-sm text-on-surface-variant mt-0.5">{group.membersCount} members • Last active {group.lastActive}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {group.myBalance < 0 ? (
                      <>
                        <p className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">You Owe</p>
                        <p className="font-headline font-bold text-xl text-error">${Math.abs(group.myBalance).toFixed(2)}</p>
                      </>
                    ) : group.myBalance > 0 ? (
                      <>
                        <p className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Owed to you</p>
                        <p className="font-headline font-bold text-xl text-secondary">${group.myBalance.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Settled</p>
                        <p className="font-headline text-xl font-bold text-on-surface-variant">$0.00</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="app-card-strong w-full max-w-md p-6">
            <h2 className="font-headline text-2xl font-bold mb-4">Create New Group</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Group Name</label>
                <input 
                  type="text" 
                  className="app-input"
                  placeholder="e.g. Ski Trip 2026"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Currency</label>
                <select 
                  className="app-input"
                  value={newGroupCurrency}
                  onChange={(e) => setNewGroupCurrency(e.target.value)}
                >
                  <option value="PLN">PLN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="app-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName}
                className="app-button-primary"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-primary text-on-primary shadow-[0_8px_32px_rgba(180,83,9,0.35)] transition-transform active:scale-95 md:right-8"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0", fontSize: '28px' }}>add</span>
      </button>

    </AppLayout>
  );
};

export default Dashboard;
