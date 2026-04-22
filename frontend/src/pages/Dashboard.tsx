import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import BottomNav from '../components/BottomNav';

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

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

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
    <div className="text-on-surface antialiased pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => alert('Menu w budowie')}
              className="text-on-surface-variant hover:bg-white/5 p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline font-bold text-on-surface text-2xl tracking-wide">SplitApp</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Wyszukiwanie w budowie')}
              className="text-on-surface-variant hover:bg-white/5 p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto">
        {/* Hero Balance Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-label text-on-surface-variant font-semibold tracking-wider uppercase text-xs mb-2">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-bold text-5xl md:text-7xl text-on-surface tracking-tight">$0.00</span>
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
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-4 rounded-xl font-body font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20 border border-primary/50"
              >
                <span className="material-symbols-outlined">add</span>
                New Group
              </button>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="glass-panel p-6 rounded-2xl">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Active Groups</p>
            <p className="font-headline text-3xl font-bold text-on-surface">{groups.length}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Monthly Split</p>
            <p className="font-headline text-3xl font-bold text-on-surface">$0</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Savings Insight</p>
            <p className="font-headline text-3xl font-bold text-secondary">+$0</p>
          </div>
        </section>

        {/* Active Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-wide">Active Groups</h2>
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
                  className="group glass-panel p-5 rounded-2xl flex items-center justify-between transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer"
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
                        <p className="font-headline font-bold text-xl text-on-surface-variant opacity-50">$0.00</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="font-headline text-2xl font-bold mb-4">Create New Group</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Group Name</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Ski Trip 2026"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Currency</label>
                <select 
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
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
        className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full shadow-[0_8px_32px_rgba(217,119,6,0.3)] border border-primary/50 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0", fontSize: '28px' }}>add</span>
      </button>

      {/* BottomNavBar */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
