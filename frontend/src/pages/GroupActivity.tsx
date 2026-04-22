import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import BottomNav from '../components/BottomNav';

interface ActivityLog {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
}

const GroupActivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await api.get(`/groups/${id}/activity`);
        setLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch activity', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivity();
    }
  }, [id]);

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
            <h1 className="font-headline font-extrabold text-primary dark:text-white tracking-tighter text-2xl">Historia</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto">
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant">Ładowanie...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">history</span>
            <p className="font-headline text-xl">Brak historii.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/20 bg-surface-container-highest text-secondary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="material-symbols-outlined text-sm">history</span>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-on-surface">{log.userName}</div>
                    <time className="font-label text-xs text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</time>
                  </div>
                  <div className="text-on-surface-variant">{log.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default GroupActivity;
