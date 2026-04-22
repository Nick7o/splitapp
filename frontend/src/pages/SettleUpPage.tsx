import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import SettleUp from '../components/SettleUp';

interface User {
  id: string;
  name: string;
  email: string;
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
  members: User[];
  optimizedDebts: DebtTransfer[];
}

const SettleUpPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-on-surface">Loading...</div>;
  }

  if (!group) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-error">Group not found</div>;
  }

  return (
    <div className="bg-background font-body text-on-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b border-white/20 dark:shadow-none">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/groups/${id}`)}
              className="text-primary dark:text-primary-container hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200 p-2 rounded-full"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline font-extrabold text-primary dark:text-white tracking-tighter text-2xl">Rozliczenia</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto">
        <SettleUp groupId={id || ''} debts={group.optimizedDebts || []} members={group.members} currency={group.currency} />
      </main>
    </div>
  );
};

export default SettleUpPage;
